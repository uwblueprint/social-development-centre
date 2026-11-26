"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { keyframes, styled } from "next-yak";
import { useToast } from "@/components/ui/Toast";
import { SkipLinks } from "@/components/patterns/SkipLinks";
import { automaticEmailHref, draftOf, fmtDay, isLive, SEND_TIME, templateFor, type Send, type TemplateKey } from "../_data";
import type { BulkKind, OpenEmail, PanelMode } from "../_types";
import { OutboxLockProvider } from "../_lock";
import { shortDate as rowDate, listSends } from "../_recipients";
import { OutboxDataProvider, type OutboxData } from "../_outboxData";
import { docsEqual, docToPlainText } from "../_emailDoc";
import { useHeldChanges, type OutboxChange, type OutboxCommitResult } from "../commit";
import type { OutboxInitial } from "../queries";
import { BulkDialog } from "./BulkDialog";
import { EmailView } from "./EmailView";
import { OfflineBanner } from "./OfflineBanner";
import { OutboxCalendar } from "./OutboxCalendar";
import { RecipientsPanel } from "./RecipientsPanel";

/*
 * The Outbox on a calendar: the left panel lists who an email is going to (For review, All, and
 * Couldn't send when something failed); the right side is the month calendar, which an email
 * replaces when you open one. Ported from the design in #64 (src/app/design/(admin)/outbox); the data is
 * the Automatic Emails engine's (queries.ts), and changes are held for their Undo, then saved (commit.ts).
 */

const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, var(--list-pane-width)) minmax(0, 1fr);
  align-items: start;
  min-height: 100vh;

  @media (max-width: 899px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Main = styled.div`
  min-width: 0;
  padding: var(--space-4) var(--space-6) var(--space-8);

  /* Side by side, the calendar fills the page height; stacked, it stays its natural height. */
  @media (min-width: 900px) {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
`;

/* The email view arrives with a short fade and a 4px nudge, so moving to the next email reads as a change, not a jump. */
const arrive = keyframes`
  from {
    opacity: 0;
    transform: translateY(4px);
  }
`;

const Arrive = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  animation: ${arrive} var(--duration) var(--ease-out);
`;

const noneSelected = () => new Set<string>();

/** How long an approved row shows its new state before it collapses out of For review. */
const CONFIRM_HOLD = 600;
/** The collapse (--duration-slow), plus a beat. */
const COLLAPSE_FOR = 270;
/** A second approve inside this window is ignored, so a double press never approves two emails or skips one. */
const APPROVE_GUARD = CONFIRM_HOLD;

const whenText = (day: number) => (day === 0 ? "today" : day === 1 ? "tomorrow" : fmtDay(day));

type Approved = { send: Send; phase: "confirmed" | "leaving"; text: string };

const itemOf = (s: Send) => ({ occurrence_id: s.occurrenceId, person_id: s.personId });

/** The browser's own idea of being online. Changes need the server, so they wait while it's down. */
function useOnline() {
  const [online, setOnline] = React.useState(true);
  React.useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

function OutboxScreen({ initial }: { initial: OutboxInitial }) {
  const { toast } = useToast();
  const router = useRouter();
  const offline = !useOnline();

  const [sends, setSends] = React.useState<Send[]>(initial.sends);
  // A refresh (after another admin got there first) brings the server's Outbox back.
  const [prevInitial, setPrevInitial] = React.useState(initial);
  if (prevInitial !== initial) {
    setPrevInitial(initial);
    setSends(initial.sends);
  }
  const data: OutboxData = React.useMemo(() => ({ members: initial.members, templates: initial.templates }), [initial]);
  const afterSend = initial.afterSend;
  const today = React.useMemo(() => {
    const [y, m, d] = initial.today.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [initial.today]);

  const [templates, setTemplates] = React.useState<Set<TemplateKey>>(new Set());
  const [query, setQuery] = React.useState("");
  const [chosenMode, setMode] = React.useState<PanelMode>("review");
  const [selected, setSelected] = React.useState<Set<string>>(noneSelected);
  const [closedDays, setClosedDays] = React.useState<Set<number>>(new Set());
  const [pickedDay, setPickedDay] = React.useState<number | null>(null);
  // Days picked with a box on the calendar: the list shows only those (empty: every day).
  const [dayFilter, setDayFilter] = React.useState<Set<number>>(() => new Set());
  const [hoverDay, setHoverDay] = React.useState<number | null>(null);
  const [openState, setOpen] = React.useState<OpenEmail | null>(null);
  const [bulk, setBulk] = React.useState<{ kind: BulkKind; ids: string[] } | null>(null);
  // Emails opened so far: offline, only these can be opened again (their content is already here).
  const [loaded, setLoaded] = React.useState<Set<string>>(new Set());
  // Approving: rows still showing in For review while they confirm and collapse, calendar entries that are changing colour, undone rows coming back.
  const [approved, setApproved] = React.useState<ReadonlyMap<string, Approved>>(new Map());
  const [settling, setSettling] = React.useState<ReadonlySet<string>>(new Set());
  const [entering, setEntering] = React.useState<ReadonlySet<string>>(new Set());

  const timers = React.useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  React.useEffect(() => {
    const all = timers.current;
    return () => all.forEach((id) => window.clearTimeout(id));
  }, []);
  // True while the last approve is still animating.
  const approving = React.useRef(false);

  // Saved: if some had already left the Outbox (another admin, the daily run), say so and show the Outbox as it is now.
  const onSaved = React.useCallback(
    (results: OutboxCommitResult[]) => {
      const gone = results.reduce((n, r) => n + r.gone, 0);
      if (gone === 0) return;
      toast({ title: gone === 1 ? "That email had already changed. The Outbox is up to date now." : `${gone} emails had already changed. The Outbox is up to date now.` });
      router.refresh();
    },
    [router, toast],
  );
  const onFailed = React.useCallback(
    (retry: () => void) => {
      toast({ title: "Couldn't save your last change", actionLabel: "Try again", onAction: retry });
    },
    [toast],
  );
  const { hold } = useHeldChanges(onSaved, onFailed);

  const open = openState;
  const openSend = open ? (sends.find((s) => s.id === open.id) ?? null) : null;

  const listLive = React.useMemo(() => sends.filter(isLive), [sends]);
  // Once nothing has failed, the Couldn't send tab goes away; fall back to For review.
  const mode: PanelMode = chosenMode === "failed" && !listLive.some((s) => s.status === "couldnt") ? "review" : chosenMode;

  // What was selected belongs to the old list: it clears at once on a switch.
  const [prevMode, setPrevMode] = React.useState(mode);
  if (prevMode !== mode) {
    setPrevMode(mode);
    setSelected(noneSelected());
  }

  const showTab = (tab: PanelMode) => setMode(tab);

  const patchById = (changes: Map<string, Send>) => setSends((list) => list.map((s) => changes.get(s.id) ?? s));
  const patchSend = (id: string, patch: Partial<Send>) => {
    const s = sends.find((x) => x.id === id);
    if (s) patchById(new Map([[id, { ...s, ...patch }]]));
  };

  const closeBulk = () => setBulk(null);

  /** Puts emails back as they were. */
  const restore = (prev: Send[]) => patchById(new Map(prev.map((s) => [s.id, s])));

  /** Undo: cancels the held change, or says it's too late once it was saved. */
  const undoing = (undo: () => boolean, then: () => void) => () => {
    if (!undo()) {
      toast({ title: "Couldn't undo because the change was already saved" });
      return;
    }
    then();
  };

  const dropApproved = (ids: string[]) =>
    setApproved((m) => {
      const next = new Map(m);
      ids.forEach((id) => next.delete(id));
      return next;
    });

  const undoApprove = (prev: Send[]) => {
    const ids = prev.map((s) => s.id);
    restore(prev);
    dropApproved(ids);
    setEntering(new Set(ids));
    later(() => setEntering(new Set()), COLLAPSE_FOR + 100);
    if (prev.length === 1) {
      // The email comes back to For review and opens again, wherever the view had moved on to.
      setMode("review");
      setSelected(noneSelected());
      setOpen({ id: prev[0].id, editing: false, ...draftOf(prev[0], data.members[prev[0].member], data.templates) });
      setLoaded((l) => new Set(l).add(prev[0].id));
    }
  };

  /** The row and calendar animation after approving, the next email, and the undo toast. Undo works after the view moved on. */
  const approve = (ids: string[], nextId: string | null = null, doneNote?: string) => {
    // Ignored while the last approve is still animating: no double approve, no skipped email.
    if (approving.current) return;
    const targets = sends.filter((s) => ids.includes(s.id));
    if (targets.length === 0) return;
    const held = hold({ kind: "approve", items: targets.map(itemOf) });
    closeBulk();
    approving.current = true;
    later(() => {
      approving.current = false;
    }, APPROVE_GUARD);
    // An approved email goes out on its day; one past its day goes out with the next run.
    const sendDay = (s: Send) => Math.max(s.day, afterSend ? 1 : 0);
    patchById(new Map(targets.map((s) => [s.id, { ...s, status: "scheduled" as const, day: sendDay(s) }])));
    setSelected(noneSelected());
    // Rows keep their place in For review, showing the new state, then collapse; the calendar entries change colour in place.
    setApproved((m) => {
      const next = new Map(m);
      for (const s of targets) next.set(s.id, { send: s, phase: "confirmed", text: `Scheduled · ${rowDate(sendDay(s))}` });
      return next;
    });
    setSettling(new Set(targets.map((s) => `${sendDay(s)}:${s.template}`)));
    later(() => setSettling(new Set()), CONFIRM_HOLD + COLLAPSE_FOR);
    later(
      () => setApproved((m) => new Map([...m].map(([id, a]): [string, Approved] => [id, ids.includes(id) ? { ...a, phase: "leaving" } : a]))),
      CONFIRM_HOLD,
    );
    later(() => dropApproved(ids), CONFIRM_HOLD + COLLAPSE_FOR);
    // "Approve" keeps the email view open on the next email that needs review; otherwise back to the calendar.
    if (nextId) openEmail(nextId);
    else setOpen(null);
    const day = sendDay(targets[0]);
    toast({
      title: targets.length === 1 ? `Approved. Scheduled for ${whenText(day)} at ${SEND_TIME}.` : `Approved ${targets.length} emails.`,
      description: doneNote,
      actionLabel: "Undo",
      onAction: undoing(held.undo, () => undoApprove(targets)),
    });
  };

  /** Delete: takes these members out of these sends, with an undo toast. */
  const remove = (ids: string[]) => {
    const targets = sends.filter((s) => ids.includes(s.id));
    if (targets.length === 0) return;
    const held = hold({ kind: "remove", items: targets.map(itemOf) });
    closeBulk();
    patchById(new Map(targets.map((s) => [s.id, { ...s, status: "removed" as const }])));
    setSelected(noneSelected());
    setOpen(null);
    toast({
      title: targets.length === 1 ? "Email deleted." : `${targets.length} emails deleted.`,
      actionLabel: "Undo",
      onAction: undoing(held.undo, () => restore(targets)),
    });
  };

  /*
   * Resend is for a bounced address. Gmail SMTP never reports bounces (docs/backend/automatic-emails.md),
   * so no send is ever "bounced" and the Resend buttons never show; there's nothing to call yet.
   */
  const resend = () => {};

  const confirmBulk = (kind: BulkKind, ids: string[]) => {
    if (kind === "approve") approve(ids);
    else remove(ids);
  };

  /**
   * Leaving an email mid-edit (another email, Previous / Next, Back to calendar) doesn't ask first: the edits are
   * dropped and a toast says so, with Undo to go straight back to that email with the edits as they were.
   */
  const leaveEdits = () => {
    if (!open?.editing || !openSend) return;
    const saved = draftOf(openSend, data.members[openSend.member], data.templates);
    if (docsEqual(open.draftSubject, saved.draftSubject) && docsEqual(open.draftBody, saved.draftBody)) return;
    const before = open;
    toast({ title: "Discarded your changes.", actionLabel: "Undo", onAction: () => setOpen(before) });
  };

  const closeEmail = () => {
    leaveEdits();
    setOpen(null);
  };

  const openEmail = (id: string) => {
    const send = sends.find((s) => s.id === id);
    // Offline, only emails that were opened before are loaded.
    if (!send || (offline && !loaded.has(id))) return;
    if (open?.id !== id) leaveEdits();
    setOpen({ id, editing: false, ...draftOf(send, data.members[send.member], data.templates) });
    setLoaded((l) => new Set(l).add(id));
  };

  /*
   * The open email lives in the address (?email=<id>), so the browser's Back and Forward buttons work: opening an
   * email adds a history entry, closing it goes back one, and switching emails in place (next, approve and next)
   * only rewrites the entry. A page loaded with ?email= opens that email.
   */
  const emailInUrl = () => new URL(window.location.href).searchParams.get("email");
  const writeUrl = (id: string | null, how: "push" | "replace") => {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("email", id);
    else url.searchParams.delete("email");
    window.history[how === "push" ? "pushState" : "replaceState"](window.history.state, "", url);
  };
  const pushedEntry = React.useRef(false);
  const startId = React.useRef<string | null>(null);
  // The handlers read the page as it is now, not as it was when they were attached.
  const syncRef = React.useRef({ open: openEmail, close: () => setOpen(null), openId: null as string | null });
  React.useEffect(() => {
    syncRef.current = { open: openEmail, close: () => { leaveEdits(); setOpen(null); }, openId: open?.id ?? null };
  });
  // First thing on mount: open what the address asked for.
  React.useEffect(() => {
    const id = emailInUrl();
    if (!id) return;
    if (sends.some((s) => s.id === id)) {
      startId.current = id;
      syncRef.current.open(id);
    } else writeUrl(null, "replace");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- runs once, on mount
  React.useEffect(() => {
    const onPop = () => {
      const id = emailInUrl();
      pushedEntry.current = id !== null;
      if (id === null) {
        if (syncRef.current.openId) syncRef.current.close();
      } else if (id !== syncRef.current.openId) syncRef.current.open(id);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const openId = open?.id ?? null;
  React.useEffect(() => {
    if (startId.current) {
      // Still waiting for the email in the address to open.
      if (!openId) return;
      startId.current = null;
    }
    if (emailInUrl() === openId) return;
    if (openId === null) {
      if (pushedEntry.current) window.history.back();
      else writeUrl(null, "replace");
      pushedEntry.current = false;
    } else if (emailInUrl()) {
      writeUrl(openId, "replace");
    } else {
      writeUrl(openId, "push");
      pushedEntry.current = true;
    }
  }, [openId]);

  // The open email's place in the list as it shows now: same tab, template filter, search and order as the panel.
  const visible = React.useMemo(() => listSends(listLive, mode, templates, query, data), [listLive, mode, templates, query, data]);
  const at = openSend ? visible.findIndex((s) => s.id === openSend.id) : -1;
  const prevSend = at > 0 ? visible[at - 1] : null;
  const nextSend = at >= 0 ? (visible[at + 1] ?? null) : null;
  // "1 of 1" says nothing: with a single email the position and its arrows go away.
  const position = at >= 0 && visible.length > 1 ? { index: at + 1, count: visible.length } : null;
  // "Approve" goes to the next email in this order, wrapping round, that is still waiting for review.
  // Previous and Next only move through the list and don't act, so they ignore this.
  const nextToDo = React.useMemo(() => {
    if (!openSend || openSend.status !== "review") return null;
    for (let i = 0; i < visible.length; i++) {
      const s = visible[(at + 1 + i + visible.length) % visible.length];
      if (s.id !== openSend.id && s.status === "review") return s;
    }
    return null;
  }, [visible, at, openSend]);
  // Nothing else, in any tab or filter, is waiting for review: only then is it "everything".
  const othersToDo = openSend ? listLive.some((s) => s.id !== openSend.id && s.status === "review") : false;
  // Offline, only emails opened before can be opened.
  const canOpen = (s: Send | null) => !!s && (!offline || loaded.has(s.id));

  /**
   * Saves the edits. A field that matches the template again follows the template (null), not a copy of it.
   * The subject is saved as plain text and the message as an Email Editor document, with this member's
   * details already in them (the editor has no personalized text here).
   */
  const saveEdits = () => {
    if (!open || !openSend) return;
    const before = openSend;
    const template = templateFor(data.templates[openSend.template], data.members[openSend.member]);
    const subject = docsEqual(open.draftSubject, template.subject) ? null : open.draftSubject;
    const body = docsEqual(open.draftBody, template.body) ? null : open.draftBody;
    const held = hold({
      kind: "edit",
      ...itemOf(openSend),
      subject: subject ? docToPlainText(subject) : null,
      body,
    } satisfies OutboxChange);
    patchSend(open.id, { subject, body });
    setOpen({ ...open, editing: false });
    toast({ title: "Saved.", actionLabel: "Undo", onAction: undoing(held.undo, () => restore([before])) });
  };

  const changeOpen = (next: OpenEmail) => setOpen(next);

  /** Drops this email's edits so it follows its template again. */
  const resetEmail = () => {
    if (!openSend) return;
    const before = openSend;
    const held = hold({ kind: "edit", ...itemOf(openSend), subject: null, body: null });
    patchSend(openSend.id, { subject: null, body: null });
    toast({ title: "Reset to the original template.", actionLabel: "Undo", onAction: undoing(held.undo, () => restore([before])) });
  };

  /** Drops the edits typed so far, back to the template the email has. */
  const resetDraft = () => {
    if (!open || !openSend) return;
    const before = open;
    const template = templateFor(data.templates[openSend.template], data.members[openSend.member]);
    setOpen({ ...open, draftSubject: template.subject, draftBody: template.body });
    toast({ title: "Reset to the original template.", actionLabel: "Undo", onAction: () => setOpen(before) });
  };

  /** A calendar entry: clicking filters the list to its template, and clicking it again lifts the filter. */
  const filterTemplate = (key: TemplateKey, tab: PanelMode) => {
    if (templates.has(key)) {
      setTemplates(new Set());
      return;
    }
    setTemplates(new Set([key]));
    showTab(tab);
    setPickedDay(null);
  };

  const openAutomaticEmail = (key: TemplateKey) => window.open(automaticEmailHref(key), "_blank", "noopener,noreferrer");

  /** A box over the calendar: All, showing only those days (opened if they were folded). */
  const pickDays = (days: number[]) => {
    setDayFilter(new Set(days));
    setPickedDay(null);
    setClosedDays((closed) => {
      const next = new Set(closed);
      days.forEach((d) => next.delete(d));
      return next;
    });
    showTab("all");
  };

  const pickDay = (day: number, tab: PanelMode) => {
    setDayFilter(new Set());
    setPickedDay(day);
    // Picking a day opens it in All, even if it was collapsed.
    setClosedDays((days) => {
      const next = new Set(days);
      next.delete(day);
      return next;
    });
    showTab(tab);
  };

  const lock = React.useMemo(() => ({ offline, sessionExpired: false, reconnecting: false, busy: null }), [offline]);

  return (
    <OutboxDataProvider value={data}>
      <OutboxLockProvider value={lock}>
        <SkipLinks
          links={[
            { targetId: "outbox-title", label: "Skip to main content" },
            ...(open && openSend ? [] : [{ targetId: "outbox-calendar-title", label: "Skip to calendar" }]),
          ]}
        />
        <OfflineBanner offline={offline} reconnecting={false} />
        <Layout>
          <RecipientsPanel
            sends={listLive}
            mode={mode}
            onMode={(tab) => {
              showTab(tab);
              setPickedDay(null);
            }}
            selected={selected}
            onSelected={setSelected}
            openId={open?.id ?? null}
            onOpen={openEmail}
            offline={offline}
            loaded={loaded}
            pickedDay={pickedDay}
            closedDays={closedDays}
            onClosedDays={setClosedDays}
            onHoverDay={setHoverDay}
            onBulk={(kind, ids) => setBulk({ kind, ids })}
            onResend={resend}
            templates={templates}
            onTemplates={setTemplates}
            days={dayFilter}
            onDays={setDayFilter}
            query={query}
            onQuery={setQuery}
            searching={false}
            approved={approved}
            entering={entering}
          />
          {/* An open email is text to read: no selection box can start anywhere on its side, margins included. */}
          <Main data-no-marquee={open && openSend ? "" : undefined}>
            <Arrive key={open && openSend ? open.id : "calendar"}>
              {open && openSend ? (
                <EmailView
                  send={openSend}
                  open={open}
                  onChange={changeOpen}
                  onBack={closeEmail}
                  onSave={saveEdits}
                  position={position}
                  hasPrev={!!prevSend}
                  hasNext={!!nextSend}
                  canOpenPrev={canOpen(prevSend)}
                  canOpenNext={canOpen(nextSend)}
                  onPrev={() => prevSend && openEmail(prevSend.id)}
                  onNext={() => nextSend && openEmail(nextSend.id)}
                  sends={sends}
                  onApprove={() => approve([openSend.id], nextToDo?.id ?? null, !othersToDo && mode === "review" ? "That's everything to review." : undefined)}
                  onResend={resend}
                  onDelete={() => setBulk({ kind: "delete", ids: [openSend.id] })}
                  onReset={resetEmail}
                  onResetDraft={resetDraft}
                  errors={null}
                  sentNote={null}
                />
              ) : (
                <OutboxCalendar
                  sends={sends}
                  pickedDay={pickedDay}
                  hoverDay={hoverDay}
                  afterSend={afterSend}
                  today={today}
                  activeTemplates={templates}
                  onPickDay={pickDay}
                  filterDays={dayFilter}
                  onPickDays={pickDays}
                  onFilterTemplate={filterTemplate}
                  onOpenTemplate={openAutomaticEmail}
                  settling={settling}
                />
              )}
            </Arrive>
          </Main>

          <BulkDialog bulk={bulk} sends={sends} onConfirm={confirmBulk} onClose={closeBulk} />
        </Layout>
      </OutboxLockProvider>
    </OutboxDataProvider>
  );
}

/** The admin shell provides the toasts. */
export function OutboxPage({ initial }: { initial: OutboxInitial }) {
  return <OutboxScreen initial={initial} />;
}
