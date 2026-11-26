"use client";

/*
 * Emails prototype: the in-memory store. One provider holds everything; `useEmails()` returns the EmailsApi
 * from model.ts. Frontend-only: nothing leaves the browser. Pure rules live in engine.ts.
 */
import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type MutableRefObject, type ReactNode } from "react";
import {
  ADMINS,
  LAB_FLAGS,
  UNDO_MS,
  type ActionResult,
  type AutomaticEmail,
  type Audience,
  type EmailContent,
  type EmailsApi,
  type EmailsState,
  type LabFlag,
  type LabFlags,
  type Member,
  type OneOffEmail,
  type PublishPreview,
  type Send,
  type UnpublishPreview,
} from "./model";
import {
  batchKey,
  decorateLocks,
  isPending,
  isUndoActive,
  matchesConditions,
  monthKey,
  nextMorningWindow,
  otherLockedIds,
  outboxOf,
  planPublish,
  recheck,
  renderContent,
  resolveAudienceFor,
  sendsFromPlan,
  tickState,
  waitingForYouOf,
} from "./engine";
import { buildSeed, type Scenario } from "./seed";

const EmailsContext = createContext<EmailsApi | null>(null);

const SAVE_ERROR = "We couldn't save that. Check your connection and try again.";
const OFFLINE_ERROR = "You're offline. Reconnect to the internet and try again.";
const SLOW_MS = 2500;

const emptyLab = (): LabFlags => Object.fromEntries(LAB_FLAGS.map((f) => [f, false])) as LabFlags;

let counter = 0;
const genId = (prefix: string) => `${prefix}-n${(counter += 1)}`;

const ok: ActionResult = { ok: true };
const fail = (error: string): ActionResult => ({ ok: false, error });
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function useEmails(): EmailsApi {
  const api = useContext(EmailsContext);
  if (!api) throw new Error("useEmails() was called outside <EmailsProvider>. Wrap the page or layout in <EmailsProvider>.");
  return api;
}

export function useReviewCount(): number {
  return useEmails().reviewCount;
}

/** Honours the lab's slow load (2.5s on each mount) and load error (until retry after the flag is off). */
function usePageLoad(): { status: "loading" | "ready" | "error"; retry(): void } {
  const { lab } = useEmails();
  const [slowDone, setSlowDone] = useState(() => !lab.slowLoad);
  const [failed, setFailed] = useState(lab.loadError);
  if (lab.loadError && !failed) setFailed(true);
  useEffect(() => {
    if (slowDone) return;
    const t = setTimeout(() => setSlowDone(true), SLOW_MS);
    return () => clearTimeout(t);
  }, [slowDone]);
  const retry = () => {
    if (!lab.loadError) setFailed(false);
  };
  return { status: !slowDone ? "loading" : failed ? "error" : "ready", retry };
}

/* ---------- Views (lab effects on what the UI sees) ---------- */

const LONG_FIRST = "-Alexandria-Montgomery";
const LONG_LAST = "-Fitzgerald-Wellington-Thornbury";
const LONG_NAME = " (a long-running series for community supporters who joined through several programs)";

function lengthenContent(c: EmailContent): EmailContent {
  return { ...c, subject: c.subject ? c.subject + " and a much longer subject line to test wrapping" : c.subject };
}

function deriveView(real: EmailsState, lab: LabFlags, now: Date): EmailsState {
  const limit = real.settings.monthlyLimit;
  let members: Member[] = real.members;
  if (lab.overMonthlyLimit || lab.longText) {
    members = real.members.map((m, i) => {
      let next = m;
      if (lab.overMonthlyLimit && i % 3 === 0) next = { ...next, sentThisMonth: Math.max(next.sentThisMonth, limit) };
      if (lab.longText) next = { ...next, firstName: next.firstName ? next.firstName + LONG_FIRST : "", lastName: next.lastName ? next.lastName + LONG_LAST : "" };
      return next;
    });
  }
  const sends = decorateLocks(real.sends, now, lab);
  let state: EmailsState = { ...real, members, sends };
  if (lab.longText) {
    state = {
      ...state,
      automatic: state.automatic.map((a) => ({ ...a, name: a.name + LONG_NAME, content: lengthenContent(a.content) })),
      oneOffs: state.oneOffs.map((o) => ({ ...o, content: lengthenContent(o.content) })),
      sends: state.sends.map((s) => ({
        ...s,
        ...(s.editedContent ? { editedContent: lengthenContent(s.editedContent) } : {}),
        ...(s.sentSubject ? { sentSubject: s.sentSubject + " and a much longer subject line to test wrapping" } : {}),
      })),
    };
  }
  if (lab.empty) state = { ...state, sends: [], automatic: [], oneOffs: [] };
  return state;
}

/* ---------- Actions (mutations; read refs, never render state) ---------- */

interface Ctx {
  dataRef: MutableRefObject<EmailsState>;
  setData(s: EmailsState): void;
  labRef: MutableRefObject<LabFlags>;
  setLabState(l: LabFlags): void;
  offsetRef: MutableRefObject<number>;
  setNow(d: Date): void;
  lastTickRef: MutableRefObject<Date>;
  snapshots: MutableRefObject<Record<string, Send>>;
  scenarioRef: MutableRefObject<Scenario>;
}

type Actions = Omit<
  EmailsApi,
  | "state" | "now" | "lab" | "usePageLoad" | "member" | "reviewCount" | "waitingForYou" | "outbox" | "sendsFor"
  | "scheduledFor" | "renderFor" | "matches" | "resolveAudience" | "overLimitFor" | "batchEditedCount"
> & { tick(): void };

function createActions(ctx: Ctx): Actions {
  const now = () => new Date(Date.now() + ctx.offsetRef.current);
  const get = () => ctx.dataRef.current;
  const commit = (fn: (s: EmailsState) => EmailsState) => {
    const next = fn(ctx.dataRef.current);
    if (next === ctx.dataRef.current) return;
    ctx.dataRef.current = next;
    ctx.setData(next);
  };
  const patchSends = (fn: (s: Send) => Send) => commit((s) => ({ ...s, sends: s.sends.map(fn) }));

  /** Every Promise-returning mutation goes through here: slow save, offline, save error. */
  const run = async (fn: () => ActionResult): Promise<ActionResult> => {
    if (ctx.labRef.current.slowSave) await sleep(SLOW_MS);
    if (ctx.labRef.current.offline) return fail(OFFLINE_ERROR);
    if (ctx.labRef.current.saveError) return fail(SAVE_ERROR);
    return fn();
  };

  const lockedByOther = (ids: string[]): string | undefined => {
    const locked = otherLockedIds(get().sends, now(), ctx.labRef.current);
    return ids.some((id) => locked.has(id)) ? ADMINS.other : undefined;
  };
  const stripUndo = (s: Send): Send => {
    const { undo: _u, ...rest } = s;
    void _u;
    return rest;
  };
  const stripLock = (s: Send): Send => {
    const { lock: _l, ...rest } = s;
    void _l;
    return rest;
  };

  const tick = () => {
    const n = now();
    ctx.setNow(n);
    const last = ctx.lastTickRef.current;
    ctx.lastTickRef.current = n;
    commit((s) => tickState(s, n, last, ctx.labRef.current, genId));
  };

  /** Approve / Send now / Don't send share one shape: snapshot, change, open the undo window. */
  const choose = (ids: string[], mode: "approve" | "send-now" | "dont-send", opts?: { now?: boolean }): ActionResult => {
    const by = lockedByOther(ids);
    if (by) return fail(`${by} is editing one of these emails. Try again when they are done.`);
    const n = now();
    const until = new Date(n.getTime() + UNDO_MS).toISOString();
    const idSet = new Set(ids);
    commit((s) => ({
      ...s,
      sends: s.sends.map((send) => {
        if (!idSet.has(send.id) || !isPending(send)) return send;
        ctx.snapshots.current[send.id] = send;
        if (mode === "dont-send") {
          return { ...stripLock(send), status: "not-sent", notSentReason: "removed-by-admin", couldntSend: undefined, undo: { until, action: "dont-send" } };
        }
        const reason = recheck(send, s);
        if (reason) return { ...stripUndo(stripLock(send)), status: "not-sent", notSentReason: reason };
        const sendNow = mode === "send-now" || opts?.now;
        const ahead = new Date(send.sendAt).getTime() > n.getTime();
        const next: Send = { ...send, status: "scheduled", approved: true, couldntSend: undefined, undo: { until, action: mode } };
        if (sendNow) return { ...next, chosen: "now", sendAt: n.toISOString(), undo: { until, action: "send-now" } };
        if (ahead) return next;
        return { ...next, chosen: "morning", sendAt: nextMorningWindow(n, send.memberId).toISOString() };
      }),
    }));
    return ok;
  };

  const batchOf = (target: Send, sends: Send[]) =>
    target.source.kind === "one-off" ? [target] : sends.filter((s) => isPending(s) && batchKey(s) === batchKey(target));

  const setScenario = (scenario: Scenario) => {
    ctx.scenarioRef.current = scenario;
    const seed = buildSeed(now(), scenario);
    ctx.snapshots.current = {};
    ctx.dataRef.current = seed;
    ctx.setData(seed);
  };

  return {
    tick,
    setLab(flag: LabFlag, on: boolean) {
      const next = { ...ctx.labRef.current, [flag]: on };
      ctx.labRef.current = next;
      ctx.setLabState(next);
    },
    resetLab() {
      const next = emptyLab();
      ctx.labRef.current = next;
      ctx.setLabState(next);
    },
    advanceClock(ms: number) {
      ctx.offsetRef.current += ms;
      tick();
    },
    resetData(scenario) {
      setScenario(scenario ?? "default");
    },
    mutate(updater) {
      commit(updater);
    },

    /* automatic emails */
    createAutomatic() {
      const email: AutomaticEmail = {
        id: genId("a"),
        name: "Untitled email",
        moment: null,
        delay: null,
        conditions: { match: "all", rules: [] },
        content: { subject: "", bodyHtml: "" },
        sendMode: null,
        state: "draft",
        everPublished: false,
        updatedAt: now().toISOString(),
      };
      commit((s) => ({ ...s, automatic: [...s.automatic, email] }));
      return email;
    },
    updateAutomatic(id, patch) {
      return run(() => {
        commit((s) => ({ ...s, automatic: s.automatic.map((a) => (a.id === id ? { ...a, ...patch, id, updatedAt: now().toISOString() } : a)) }));
        return ok;
      });
    },
    previewPublish(id): PublishPreview {
      const s = get();
      const email = s.automatic.find((a) => a.id === id);
      const empty: PublishPreview = { everPublished: false, scheduled: 0, comeBackForReview: 0, missed: 0, overLimit: 0 };
      if (!email) return empty;
      const plan = planPublish(s, email, now());
      const memberIds = [...new Set(plan.map((p) => p.memberId))];
      return {
        everPublished: email.everPublished,
        scheduled: plan.filter((p) => p.kind === "normal").length,
        comeBackForReview: plan.filter((p) => p.kind === "comeBack").length,
        missed: plan.filter((p) => p.kind === "missed").length,
        overLimit: overLimit(s, memberIds, now()).length,
      };
    },
    publish(id) {
      return run(() => {
        const s = get();
        const email = s.automatic.find((a) => a.id === id);
        if (!email) return fail("We couldn't find that email.");
        if (email.state === "trash") return fail("Restore this email from the trash before you publish it.");
        if (email.state === "published") return ok;
        if (!email.moment || !email.delay || !email.sendMode) return fail("Choose when it sends and whether to review each send before you publish.");
        if (!email.content.subject.trim()) return fail("Add a subject before you publish.");
        const published: AutomaticEmail = { ...email, state: "published", everPublished: true, stoppedLiveAt: undefined, updatedAt: now().toISOString() };
        const plan = planPublish(s, published, now());
        const fresh = sendsFromPlan(published, plan, genId);
        commit((cur) => ({ ...cur, automatic: cur.automatic.map((a) => (a.id === id ? published : a)), sends: [...cur.sends, ...fresh] }));
        return ok;
      });
    },
    previewUnpublish(id): UnpublishPreview {
      const s = get();
      const locked = otherLockedIds(s.sends, now(), ctx.labRef.current);
      const mine = s.sends.filter((x) => x.source.kind === "automatic" && x.source.automaticId === id && isPending(x));
      const decorated = decorateLocks(mine, now(), ctx.labRef.current);
      return {
        edited: mine.filter((x) => x.editedContent),
        approved: mine.filter((x) => x.approved).length,
        waitingForReview: mine.filter((x) => x.status === "waiting-review").length,
        openByOther: decorated.filter((x) => locked.has(x.id) && x.lock).map((x) => ({ send: x, by: x.lock?.by ?? ADMINS.other })),
      };
    },
    unpublish(id) {
      return run(() => {
        const n = now().toISOString();
        commit((s) => ({
          ...s,
          automatic: s.automatic.map((a) => (a.id === id && a.state === "published" ? { ...a, state: "draft", stoppedLiveAt: n, updatedAt: n } : a)),
          sends: s.sends.map((x) => {
            if (!(x.source.kind === "automatic" && x.source.automaticId === id && isPending(x))) return x;
            const { editedContent: _e, ...rest } = stripUndo(stripLock(x));
            void _e;
            return { ...rest, status: "not-sent", notSentReason: "unpublished", couldntSend: undefined };
          }),
        }));
        return ok;
      });
    },
    trash(id) {
      return run(() => {
        const n = now().toISOString();
        commit((s) => ({
          ...s,
          automatic: s.automatic.map((a) => (a.id === id ? { ...a, state: "trash", stoppedLiveAt: undefined, updatedAt: n } : a)),
          sends: s.sends.map((x) => {
            if (!(x.source.kind === "automatic" && x.source.automaticId === id && isPending(x))) return x;
            const { editedContent: _e, ...rest } = stripUndo(stripLock(x));
            void _e;
            return { ...rest, status: "not-sent", notSentReason: "unpublished", couldntSend: undefined };
          }),
        }));
        return ok;
      });
    },
    restore(id) {
      return run(() => {
        commit((s) => ({ ...s, automatic: s.automatic.map((a) => (a.id === id && a.state === "trash" ? { ...a, state: "draft", stoppedLiveAt: undefined } : a)) }));
        return ok;
      });
    },
    duplicate(id) {
      const src = get().automatic.find((a) => a.id === id);
      const copy: AutomaticEmail = {
        ...(src as AutomaticEmail),
        id: genId("a"),
        name: `${src?.name ?? "Untitled email"} (copy)`,
        state: "draft",
        stoppedLiveAt: undefined,
        everPublished: false,
        updatedAt: now().toISOString(),
      };
      commit((s) => ({ ...s, automatic: [...s.automatic, copy] }));
      return copy;
    },
    sendTest() {
      return run(() => (ctx.labRef.current.providerDown ? fail("We couldn't send the test email. Our email provider isn't responding. Try again in a few minutes.") : ok));
    },
    setFallback(key, value) {
      return run(() => {
        commit((s) => ({ ...s, fallbacks: { ...s.fallbacks, [key]: value } }));
        return ok;
      });
    },

    /* outbox */
    approve(ids, opts) {
      return run(() => choose(ids, "approve", opts));
    },
    sendNow(ids) {
      return run(() => choose(ids, "send-now"));
    },
    dontSend(ids) {
      return run(() => choose(ids, "dont-send"));
    },
    undo(ids) {
      return run(() => {
        const n = now();
        let restored = 0;
        const idSet = new Set(ids);
        patchSends((s) => {
          const snap = ctx.snapshots.current[s.id];
          if (!idSet.has(s.id) || !snap || !isUndoActive(s, n) || s.undo?.action === "one-off") return s;
          restored += 1;
          delete ctx.snapshots.current[s.id];
          return snap;
        });
        return restored > 0 ? ok : fail("It's too late to undo that. The one-minute window has passed.");
      });
    },
    retry(sendId) {
      return run(() => {
        if (ctx.labRef.current.providerDown) return fail("We still can't reach our email provider. Try again in a few minutes.");
        patchSends((s) => (s.id === sendId ? { ...s, couldntSend: undefined } : s));
        return ok;
      });
    },
    resetToOriginal(sendId) {
      return run(() => {
        patchSends((s) => {
          if (s.id !== sendId) return s;
          const { editedContent: _e, ...rest } = s;
          void _e;
          return rest;
        });
        return ok;
      });
    },
    openForEdit(sendId) {
      if (lockedByOther([sendId])) return { ok: false, by: ADMINS.other };
      patchSends((s) => (s.id === sendId ? { ...s, lock: { by: ADMINS.me } } : s));
      return { ok: true };
    },
    updateSend(sendId, content, opts) {
      return run(() => {
        const target = get().sends.find((s) => s.id === sendId);
        if (!target) return fail("We couldn't find that email.");
        const ids = new Set<string>([sendId]);
        if (opts?.scope === "batch") {
          const locked = otherLockedIds(get().sends, now(), ctx.labRef.current);
          for (const s of batchOf(target, get().sends)) {
            if (locked.has(s.id) || s.lock?.by === ADMINS.other) continue;
            if (s.editedContent && !opts.overwriteEdited) continue;
            ids.add(s.id);
          }
        }
        patchSends((s) => {
          if (!ids.has(s.id)) return s;
          const edited: Send = { ...s, editedContent: content };
          if (!s.approved) return edited;
          // PRD flag: editing an approved send puts it back in review (default).
          const { chosen: _c, ...rest } = stripUndo(edited);
          void _c;
          return { ...rest, status: "waiting-review", approved: false };
        });
        return ok;
      });
    },
    closeEdit(sendId) {
      patchSends((s) => (s.id === sendId && s.lock?.by === ADMINS.me ? stripLock(s) : s));
    },

    /* one-offs */
    createOneOff(prefillMemberId) {
      const o: OneOffEmail = {
        id: genId("o"),
        content: { subject: "", bodyHtml: "" },
        audience: prefillMemberId ? { kind: "hand", memberIds: [prefillMemberId] } : { kind: "all" },
        removedIds: [],
        status: "draft",
        updatedAt: now().toISOString(),
      };
      commit((s) => ({ ...s, oneOffs: [...s.oneOffs, o] }));
      return o;
    },
    updateOneOff(id, patch) {
      return run(() => {
        const o = get().oneOffs.find((x) => x.id === id);
        if (!o) return fail("We couldn't find that email.");
        if (o.status !== "draft") return fail("This email has already been sent, so it can't be changed.");
        commit((s) => ({ ...s, oneOffs: s.oneOffs.map((x) => (x.id === id ? { ...x, ...patch, id, status: "draft", updatedAt: now().toISOString() } : x)) }));
        return ok;
      });
    },
    deleteOneOff(id) {
      return run(() => {
        if (get().oneOffs.find((x) => x.id === id)?.status !== "draft") return fail("Only drafts can be deleted.");
        commit((s) => ({ ...s, oneOffs: s.oneOffs.filter((x) => x.id !== id) }));
        return ok;
      });
    },
    duplicateOneOff(id) {
      const src = get().oneOffs.find((x) => x.id === id);
      const copy: OneOffEmail = {
        id: genId("o"),
        content: src ? { ...src.content } : { subject: "", bodyHtml: "" },
        audience: src?.audience ?? { kind: "all" },
        removedIds: [],
        status: "draft",
        updatedAt: now().toISOString(),
      };
      commit((s) => ({ ...s, oneOffs: [...s.oneOffs, copy] }));
      return copy;
    },
    sendOneOff(id) {
      return run(() => {
        const s = get();
        const o = s.oneOffs.find((x) => x.id === id);
        if (!o || o.status !== "draft") return fail("This email can't be sent. It may already be on its way.");
        if (!o.content.subject.trim()) return fail("Add a subject before you send.");
        const { recipients, excluded } = resolveAudienceFor(s.members, o.audience, o.removedIds);
        if (recipients.length === 0) return fail("There is no one to send this to. Choose an audience with at least one active member.");
        const n = now();
        const at = n.toISOString();
        const until = new Date(n.getTime() + UNDO_MS).toISOString();
        const source = { kind: "one-off" as const, oneOffId: id };
        const reasons = { unsubscribed: "unsubscribed", bounced: "bounced", "reported-spam": "reported-spam" } as const;
        const fresh: Send[] = [
          ...recipients.map((m): Send => ({ id: genId("s"), memberId: m.id, source, occurrence: "one-off", status: "scheduled", sendAt: at, undo: { until, action: "one-off" } })),
          ...excluded.flatMap((e): Send[] =>
            e.member.status === "active"
              ? []
              : [{ id: genId("s"), memberId: e.member.id, source, occurrence: "one-off", status: "not-sent", notSentReason: reasons[e.member.status], sendAt: at }],
          ),
        ];
        commit((cur) => ({
          ...cur,
          sends: [...cur.sends, ...fresh],
          oneOffs: cur.oneOffs.map((x) =>
            x.id === id ? { ...x, status: "sending", recipientIds: recipients.map((m) => m.id), excludedIds: excluded.map((e) => e.member.id), updatedAt: at } : x,
          ),
        }));
        return ok;
      });
    },
    undoOneOff(id) {
      return run(() => {
        const s = get();
        const n = now();
        const mine = s.sends.filter((x) => x.source.kind === "one-off" && x.source.oneOffId === id);
        if (!mine.some((x) => x.status === "scheduled" && isUndoActive(x, n))) return fail("It's too late to undo that. This email is already on its way.");
        commit((cur) => ({
          ...cur,
          sends: cur.sends.filter((x) => !(x.source.kind === "one-off" && x.source.oneOffId === id)),
          oneOffs: cur.oneOffs.map((x) => {
            if (x.id !== id) return x;
            const { recipientIds: _r, excludedIds: _x, sentAt: _s, ...rest } = x;
            void _r;
            void _x;
            void _s;
            return { ...rest, status: "draft" };
          }),
        }));
        return ok;
      });
    },
  };
}

function overLimit(state: EmailsState, memberIds: string[], now: Date): Member[] {
  const month = monthKey(now);
  const limit = state.settings.monthlyLimit;
  const ids = new Set(memberIds);
  return state.members.filter((m) => {
    if (!ids.has(m.id)) return false;
    const pending = state.sends.filter((s) => s.memberId === m.id && isPending(s) && monthKey(s.sendAt) === month).length;
    return m.sentThisMonth + pending + 1 > limit;
  });
}

/* ---------- Provider ---------- */

const noopSubscribe = () => () => {};

export function EmailsProvider({ children, scenario = "default" }: { children: ReactNode; scenario?: Scenario }) {
  // The store is seeded from the clock, so children render only after hydration to avoid server/client mismatches.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [data, setData] = useState<EmailsState>(() => buildSeed(new Date(), scenario));
  const [lab, setLabState] = useState<LabFlags>(emptyLab);
  const [now, setNow] = useState<Date>(() => new Date());
  const [actions] = useState(() =>
    createActions({
      dataRef: { current: data },
      setData,
      labRef: { current: lab },
      setLabState,
      offsetRef: { current: 0 },
      setNow,
      lastTickRef: { current: now },
      snapshots: { current: {} },
      scenarioRef: { current: scenario },
    }),
  );

  useEffect(() => {
    const t = setInterval(actions.tick, 1000);
    return () => clearInterval(t);
  }, [actions]);

  const api = useMemo<EmailsApi>(() => {
    const view = deriveView(data, lab, now);
    const waitingForYou = waitingForYouOf(view.sends, now);
    const outbox = outboxOf(view.sends, now);
    const { tick: _tick, ...rest } = actions;
    void _tick;
    return {
      ...rest,
      state: view,
      now,
      lab,
      usePageLoad,
      member: (id) => view.members.find((m) => m.id === id),
      reviewCount: outbox.filter((s) => s.status === "waiting-review").length,
      waitingForYou,
      outbox: [...new Map([...outbox, ...waitingForYou].map((s) => [s.id, s])).values()].sort((a, b) => a.sendAt.localeCompare(b.sendAt)),
      sendsFor: (automaticId) => view.sends.filter((s) => s.source.kind === "automatic" && s.source.automaticId === automaticId),
      scheduledFor: (email) => {
        const ids = new Set(planPublish(view, email, now).filter((p) => p.kind === "normal").map((p) => p.memberId));
        return view.members.filter((m) => ids.has(m.id));
      },
      renderFor: (content, member) => renderContent(content, member, view.members, view.fallbacks),
      matches: (conditions, member) => matchesConditions(conditions, member),
      resolveAudience: (audience: Audience, removedIds?: string[]) => resolveAudienceFor(view.members, audience, removedIds),
      overLimitFor: (ids) => overLimit(view, ids, now),
      batchEditedCount: (sendId) => {
        const t = view.sends.find((s) => s.id === sendId);
        if (!t) return 0;
        return view.sends.filter((s) => s.id !== sendId && isPending(s) && s.editedContent && batchKey(s) === batchKey(t)).length;
      },
    };
  }, [data, lab, now, actions]);

  if (!hydrated) return null;
  return <EmailsContext.Provider value={api}>{children}</EmailsContext.Provider>;
}
