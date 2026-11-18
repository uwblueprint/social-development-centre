"use client";

import * as React from "react";
import { keyframes, styled } from "next-yak";
import { AppToastProvider, useToast } from "@/components/ui/Toast";
import {
  SAVING_FOR,
  SEARCH_FOR,
  SLOW_SEARCH_FOR,
  useLabDeferred,
  useLabLoad,
  useStateLab,
} from "../../../_state-lab/useStateLab";
import {
  automaticEmailHref,
  draftOf,
  templateFor,
  fmtDay,
  isLive,
  seedSends,
  SEND_TIME,
  SUNDAY_TODAY,
  TODAY,
  type Send,
  type TemplateKey,
} from "../_data";
import type { BulkKind, OpenEmail, PanelMode } from "../_types";
import { OutboxLockProvider, type Busy } from "../_lock";
import { manySends } from "../_manyItems";
import { shortDate as rowDate, listSends } from "../_recipients";
import { outboxData } from "../_longText";
import { OutboxDataProvider } from "../_outboxData";
import { BulkDialog } from "./BulkDialog";
import { EmailView } from "./EmailView";
import { docsEqual, isEmptyDoc } from "../_emailDoc";
import { OfflineBanner } from "./OfflineBanner";
import { OutboxAccessState } from "./OutboxAccessState";
import { OutboxCalendar } from "./OutboxCalendar";
import { ConflictDialog, SessionExpiredDialog, type Conflict } from "./OutboxDialogs";
import { OutboxStatePanel } from "./OutboxStatePanel";
import { RecipientsPanel } from "./RecipientsPanel";
import { SkipLinks } from "@/components/patterns/SkipLinks";
import { StaleStrip } from "./StatusStrip";

/*
 * The Outbox on a calendar: the left panel lists who an email is going to (For review, All, and
 * Couldn't send when something failed); the right side is the month calendar, which an email
 * replaces when you open one. Demo data only; the backend contract is in docs/backend/outbox.md.
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

/** How long a tab switch takes to load in the demo. */
const SLOW_TAB_SWITCH_FOR = 3000;
const TAB_NAMES: Record<PanelMode, string> = { review: "For review", all: "All", failed: "Couldn't send" };

const noneSelected = () => new Set<string>();

/** How long an approved row shows its new state before it collapses out of For review. */
const CONFIRM_HOLD = 600;
/** The collapse (--duration-slow), plus a beat. */
const COLLAPSE_FOR = 270;
/** A second approve inside this window is ignored, so a double press never approves two emails or skips one. */
const APPROVE_GUARD = CONFIRM_HOLD;

const whenText = (day: number) => (day === 0 ? "today" : day === 1 ? "tomorrow" : fmtDay(day));

type Approved = { send: Send; phase: "confirmed" | "leaving"; text: string };

function OutboxScreen() {
  const { toast } = useToast();
  const lab = useStateLab({
    data: [
      { id: "after-send", label: `Today, after the ${SEND_TIME} send`, description: "Today's emails have gone out; the calendar counts them as sent." },
      { id: "today-sunday", label: "Today is a Sunday", description: "The calendar starts on today's own week." },
      { id: "calendar-failed", label: "Calendar failed", description: "The calendar can't load; the list works." },
      { id: "slow-tab-switch", label: "Slow tab switch", description: "Switching tabs takes a few seconds to load." },
    ],
    // SDC has only admins: there is no viewer role and no action one admin can't do.
    notApplicable: ["readOnly", "actionDenied"],
  });
  const load = useLabLoad(lab);

  // The seed emails, and the extra ones State lab "Many items" adds (kept apart so switching it off loses nothing).
  const [coreSends, setCore] = React.useState<Send[]>(seedSends);
  const [extraSends, setExtra] = React.useState<Send[]>(manySends);
  const [templates, setTemplates] = React.useState<Set<TemplateKey>>(new Set());
  // The text submitted from the search field. The list follows it after a short search, and keeps the previous results meanwhile.
  const [submittedQuery, setSubmittedQuery] = React.useState("");
  const search = useLabDeferred(submittedQuery, lab.slowLoading ? SLOW_SEARCH_FOR : SEARCH_FOR);
  const query = search.value;
  const [chosenMode, setMode] = React.useState<PanelMode>("review");
  const [selected, setSelected] = React.useState<Set<string>>(noneSelected);
  const [closedDays, setClosedDays] = React.useState<Set<number>>(new Set());
  const [pickedDay, setPickedDay] = React.useState<number | null>(null);
  // Days picked with a box on the calendar: the list shows only those (empty: every day).
  const [dayFilter, setDayFilter] = React.useState<Set<number>>(() => new Set());
  const [hoverDay, setHoverDay] = React.useState<number | null>(null);
  const [openState, setOpen] = React.useState<OpenEmail | null>(null);
  const [bulk, setBulk] = React.useState<{ kind: BulkKind; ids: string[] } | null>(null);
  const [bulkError, setBulkError] = React.useState<string | null>(null);
  // Demo stand-in for "its content is cached": an email counts as loaded once it has been opened.
  const [loaded, setLoaded] = React.useState<Set<string>>(new Set());
  // The email that went out at the send time while the connection was down, so it says so on coming back.
  const [sentWhileOffline, setSentWhileOffline] = React.useState<string | null>(null);
  // An action in flight (State lab Saving), a conflict dialog, the server's field errors, and signing back in.
  const [busy, setBusy] = React.useState<Busy | null>(null);
  const [conflict, setConflict] = React.useState<Conflict>(null);
  const [fieldErrors, setFieldErrors] = React.useState<{ subject?: string; body?: string } | null>(null);
  const [signedIn, setSignedIn] = React.useState(false);
  const [refreshed, setRefreshed] = React.useState(false);
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
  // Delayed work reads the lab as it is when it finishes, not when it started.
  const labRef = React.useRef(lab);
  React.useEffect(() => {
    labRef.current = lab;
  });
  // True while the last approve is still animating.
  const approving = React.useRef(false);

  const expired = lab.sessionExpired && !signedIn;
  // Switching Session expired or Stale data off starts them over (state reset while rendering, not in an effect).
  const [prevFlags, setPrevFlags] = React.useState({ session: lab.sessionExpired, stale: lab.staleData });
  if (prevFlags.session !== lab.sessionExpired || prevFlags.stale !== lab.staleData) {
    setPrevFlags({ session: lab.sessionExpired, stale: lab.staleData });
    if (!lab.sessionExpired) setSignedIn(false);
    if (!lab.staleData) setRefreshed(false);
  }

  // State lab: Empty is no emails at all; Loading and Couldn't load have nothing to show yet either.
  const pageNoData = lab.empty || load.loading || lab.loadFailed;
  const listFailed = lab.loadFailed || lab.sectionFailed;
  const showList = !load.loading && !listFailed;
  const calendarStatus = load.loading ? "loading" : lab.loadFailed || lab.is("calendar-failed") ? "failed" : "ready";

  const every = React.useMemo(() => {
    const all = lab.manyItems ? [...coreSends, ...extraSends] : coreSends;
    // Single item: exactly one email (a $1,000+ thank-you to review).
    return lab.singleItem ? all.filter((s) => s.id === "big-5:2") : all;
  }, [coreSends, extraSends, lab.manyItems, lab.singleItem]);
  const sends = React.useMemo(() => (pageNoData ? [] : every), [pageNoData, every]);

  // State lab: Long text, Many items and Partial data change the members and automatic emails the screen shows.
  const data = outboxData({ longText: lab.longText, manyItems: lab.manyItems, partialData: lab.partialData });

  const open = pageNoData ? null : openState;
  const openSend = open ? (sends.find((s) => s.id === open.id) ?? null) : null;

  const afterSend = lab.is("after-send");
  // Lays the calendar out as if today were Sunday, Nov 1: every send keeps its day relative to today.
  const calendarToday = lab.is("today-sunday") ? SUNDAY_TODAY : TODAY;
  const wasOffline = React.useRef(false);
  const wasReconnecting = React.useRef(false);
  const afterSendAtDrop = React.useRef(false);

  // Coming back online: say so, and if the send time passed meanwhile, say what happened to the open email.
  React.useEffect(() => {
    if (lab.offline && !wasOffline.current) afterSendAtDrop.current = afterSend;
    if (!lab.offline && wasOffline.current) {
      toast({ title: "Back online." });
      const wentOut = openSend && openSend.day === 0 && (openSend.status === "scheduled" || openSend.status === "pending");
      setSentWhileOffline(!afterSendAtDrop.current && afterSend && wentOut ? openSend.id : null);
    }
    wasOffline.current = lab.offline;
  }, [lab.offline, afterSend, openSend, toast]);

  // Caught up after reconnecting.
  React.useEffect(() => {
    if (wasReconnecting.current && !lab.reconnecting) toast({ title: "You're up to date." });
    wasReconnecting.current = lab.reconnecting;
  }, [lab.reconnecting, toast]);

  // State lab One section empty: the list has nothing while the calendar still has its days.
  const listLive = React.useMemo(() => (lab.sectionEmpty ? [] : sends.filter(isLive)), [lab.sectionEmpty, sends]);
  // Once nothing has failed, the Couldn't send tab goes away; fall back to For review.
  const mode: PanelMode = chosenMode === "failed" && !listLive.some((s) => s.status === "couldnt") ? "review" : chosenMode;

  // Switching tabs is instant: every email is already here and a tab is a filter. Only the State lab's
  // "Slow tab switch" simulates a slow server: the new tab shows its loading underline and skeleton rows until the delay ends.
  const tabSwitch = useLabDeferred(mode, SLOW_TAB_SWITCH_FOR);
  const loadingTab = lab.is("slow-tab-switch") && tabSwitch.pending ? TAB_NAMES[mode] : null;

  // What was selected belongs to the old list: it clears at once on a switch.
  const [prevMode, setPrevMode] = React.useState(mode);
  if (prevMode !== mode) {
    setPrevMode(mode);
    setSelected(noneSelected());
  }

  const showTab = (tab: PanelMode) => setMode(tab);

  /** Changes emails by id, wherever they live (the seed or the extra ones). */
  const patchById = (changes: Map<string, Send>) => {
    const apply = (list: Send[]) => list.map((s) => changes.get(s.id) ?? s);
    setCore(apply);
    setExtra(apply);
  };
  const patchSend = (id: string, patch: Partial<Send>) => {
    const s = every.find((x) => x.id === id);
    if (s) patchById(new Map([[id, { ...s, ...patch }]]));
  };

  /**
   * Runs a change the server would make: rate limits first, then (State lab Saving) a few seconds in flight,
   * then it either fails, hits a conflict, or applies.
   */
  const attempt = (o: { kind: Busy["kind"]; label: string; apply: () => void; fail: () => void; conflict?: () => void }) => {
    if (busy) return;
    if (labRef.current.rateLimited) {
      toast({ title: "Too many changes at once.", description: "Try again in 30 seconds." });
      return;
    }
    const settle = () => {
      const l = labRef.current;
      if (l.saveFailed) o.fail();
      else if (l.conflict && o.conflict) o.conflict();
      else o.apply();
    };
    if (labRef.current.saving) {
      setBusy({ kind: o.kind, label: o.label });
      later(() => {
        setBusy(null);
        settle();
      }, SAVING_FOR);
    } else settle();
  };

  const failed = (what: string, retry: () => void, fromBulk: boolean, n: number) => {
    const target = n === 1 ? "the email" : `${n} emails`;
    if (fromBulk) setBulkError(`Couldn't ${what} ${target}. Nothing was changed.`);
    else toast({ title: `Couldn't ${what} ${target}.`, description: "Nothing was changed.", actionLabel: "Try again", onAction: retry });
  };

  const closeBulk = () => {
    setBulk(null);
    setBulkError(null);
  };

  /** Puts emails back as they were. */
  const restore = (prev: Send[]) => patchById(new Map(prev.map((s) => [s.id, s])));

  /** Undo for a change with no animation. */
  const undoPlain = (prev: Send[]) => {
    if (labRef.current.undoExpired) {
      toast({ title: "Can't undo this anymore.", description: "The time to undo is up." });
      return;
    }
    restore(prev);
  };

  const dropApproved = (ids: string[]) =>
    setApproved((m) => {
      const next = new Map(m);
      ids.forEach((id) => next.delete(id));
      return next;
    });

  const undoApprove = (prev: Send[]) => {
    if (labRef.current.undoExpired) {
      toast({ title: "Can't undo this anymore.", description: "The time to undo is up." });
      return;
    }
    const ids = prev.map((s) => s.id);
    restore(prev);
    dropApproved(ids);
    setEntering(new Set(ids));
    later(() => setEntering(new Set()), COLLAPSE_FOR + 100);
    if (prev.length === 1) {
      // The email comes back to For review and opens again, wherever the view had moved on to.
      setMode("review");
      setSelected(noneSelected());
      setOpen({ id: prev[0].id, editing: false, ...draftOf(prev[0], data.members[prev[0].member]) });
      setLoaded((l) => new Set(l).add(prev[0].id));
    }
  };

  /** The row and calendar animation after approving, the next email, and the undo toast. Undo works after the view moved on. */
  const commitApprove = (targets: Send[], nextId: string | null, doneNote?: string) => {
    closeBulk();
    approving.current = true;
    later(() => {
      approving.current = false;
    }, APPROVE_GUARD);
    const ids = targets.map((s) => s.id);
    const changed = new Map(targets.map((s) => [s.id, { ...s, status: "scheduled" as const, day: Math.max(s.day, 1) }]));
    patchById(changed);
    setSelected(noneSelected());
    // Rows keep their place in For review, showing the new state, then collapse; the calendar entries change colour in place.
    setApproved((m) => {
      const next = new Map(m);
      for (const s of targets) next.set(s.id, { send: s, phase: "confirmed", text: `Scheduled · ${rowDate(Math.max(s.day, 1))}` });
      return next;
    });
    setSettling(new Set(targets.map((s) => `${Math.max(s.day, 1)}:${s.template}`)));
    later(() => setSettling(new Set()), CONFIRM_HOLD + COLLAPSE_FOR);
    later(
      () => setApproved((m) => new Map([...m].map(([id, a]): [string, Approved] => [id, ids.includes(id) ? { ...a, phase: "leaving" } : a]))),
      CONFIRM_HOLD,
    );
    later(() => dropApproved(ids), CONFIRM_HOLD + COLLAPSE_FOR);
    // "Approve" keeps the email view open on the next email that needs review; otherwise back to the calendar.
    if (nextId) openEmail(nextId);
    else setOpen(null);
    const day = Math.max(targets[0].day, 1);
    toast({
      title: targets.length === 1 ? `Approved. Scheduled for ${whenText(day)} at ${SEND_TIME}.` : `Approved ${targets.length} emails.`,
      description: doneNote,
      actionLabel: "Undo",
      onAction: () => undoApprove(targets),
    });
  };

  const approve = (ids: string[], nextId: string | null = null, doneNote?: string) => {
    // Ignored while the last approve is still animating: no double approve, no skipped email.
    if (approving.current) return;
    const targets = sends.filter((s) => ids.includes(s.id));
    if (targets.length === 0) return;
    const fromBulk = bulk !== null;
    const retry = () => approve(ids, nextId, doneNote);
    attempt({
      kind: "approve",
      label: "Approving…",
      apply: () => commitApprove(targets, nextId, doneNote),
      fail: () => failed("approve", retry, fromBulk, targets.length),
      conflict:
        targets.length === 1
          ? () => {
              // Someone else approved it: it is scheduled either way, so show that, and say so.
              closeBulk();
              const day = Math.max(targets[0].day, 1);
              patchById(new Map([[targets[0].id, { ...targets[0], status: "scheduled" as const, day }]]));
              setOpen(null);
              setConflict({ kind: "approve", dayText: whenText(day) });
            }
          : undefined,
    });
  };

  /** Delete and resend: one change with an undo toast. */
  const change = (kind: "delete" | "resend", ids: string[], patch: (s: Send) => Partial<Send>, title: string) => {
    const targets = sends.filter((s) => ids.includes(s.id));
    const fromBulk = bulk !== null;
    attempt({
      kind,
      label: kind === "delete" ? "Deleting…" : "Resending…",
      apply: () => {
        closeBulk();
        patchById(new Map(targets.map((s) => [s.id, { ...s, ...patch(s) }])));
        setSelected(noneSelected());
        setOpen(null);
        toast({ title, actionLabel: "Undo", onAction: () => undoPlain(targets) });
      },
      fail: () => failed(kind === "delete" ? "delete" : "resend", () => change(kind, ids, patch, title), fromBulk, targets.length),
    });
  };

  const remove = (ids: string[]) => change("delete", ids, () => ({ status: "removed" }), ids.length === 1 ? "Email deleted." : `${ids.length} emails deleted.`);
  // Resend goes out with the next daily run, never straight away. Each failure needs its own fix, so there is no "and next".
  const resend = (ids: string[]) =>
    change(
      "resend",
      ids,
      () => ({ status: "scheduled", day: 1 }),
      ids.length === 1 ? `Will resend tomorrow at ${SEND_TIME}.` : `Will resend ${ids.length} emails tomorrow at ${SEND_TIME}.`,
    );

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
    const saved = draftOf(openSend, data.members[openSend.member]);
    if (docsEqual(open.draftSubject, saved.draftSubject) && docsEqual(open.draftBody, saved.draftBody)) return;
    const before = open;
    toast({
      title: "Discarded your changes.",
      actionLabel: "Undo",
      onAction: () => {
        setOpen(before);
        setFieldErrors(null);
      },
    });
  };

  const closeEmail = () => {
    leaveEdits();
    setOpen(null);
  };

  const openEmail = (id: string) => {
    const send = every.find((s) => s.id === id);
    // Offline, only emails that were opened before are loaded.
    if (!send || (lab.offline && !loaded.has(id))) return;
    if (open?.id !== id) leaveEdits();
    setOpen({ id, editing: false, ...draftOf(send, data.members[send.member]) });
    setLoaded((l) => new Set(l).add(id));
    setSentWhileOffline(null);
    setFieldErrors(null);
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
  const started = React.useRef(false);
  // The handlers read the page as it is now, not as it was when they were attached.
  const syncRef = React.useRef({ open: openEmail, close: () => setOpen(null), openId: null as string | null });
  React.useEffect(() => {
    syncRef.current = { open: openEmail, close: () => { leaveEdits(); setOpen(null); }, openId: open?.id ?? null };
  });
  // First thing on mount: what the address asked for, before anything below can rewrite it.
  React.useEffect(() => {
    startId.current = emailInUrl();
  }, []);
  React.useEffect(() => {
    if (started.current || pageNoData) return;
    started.current = true;
    const id = startId.current;
    if (!id) return;
    if (every.some((s) => s.id === id)) syncRef.current.open(id);
    else {
      startId.current = null;
      writeUrl(null, "replace");
    }
  }, [pageNoData]); // eslint-disable-line react-hooks/exhaustive-deps -- runs once, when there is data to open from
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
  const canOpen = (s: Send | null) => !!s && (!lab.offline || loaded.has(s.id));

  /** The edits are saved: the email follows its template again if it matches it. */
  const commitSave = () => {
    if (!open || !openSend) return;
    const before = openSend;
    const template = templateFor(data.templates[openSend.template], data.members[openSend.member]);
    // Each field that matches its template again follows the template, not a copy of it.
    patchSend(open.id, {
      subject: docsEqual(open.draftSubject, template.subject) ? null : open.draftSubject,
      body: docsEqual(open.draftBody, template.body) ? null : open.draftBody,
    });
    setOpen({ ...open, editing: false });
    setFieldErrors(null);
    toast({ title: "Saved.", actionLabel: "Undo", onAction: () => undoPlain([before]) });
  };

  const saveEdits = () => {
    if (!open || !openSend) return;
    // State lab Validation error: the server rejects the subject (and an empty message) and says where.
    if (lab.validationError) {
      setFieldErrors({
        subject: isEmptyDoc(open.draftSubject) ? "Add a subject." : "Shorten the subject to 60 characters or fewer.",
        ...(isEmptyDoc(open.draftBody) ? { body: "Add a message." } : {}),
      });
      return;
    }
    attempt({
      kind: "save",
      label: "Saving…",
      apply: commitSave,
      fail: () => toast({ title: "Couldn't save your edits.", description: "They're still here.", actionLabel: "Try again", onAction: saveEdits }),
      conflict: () => setConflict({ kind: "edit" }),
    });
  };

  const changeOpen = (next: OpenEmail) => {
    // Typing again clears what the server said was wrong.
    if (open && (next.draftSubject !== open.draftSubject || next.draftBody !== open.draftBody)) setFieldErrors(null);
    setOpen(next);
  };

  /** Drops this email's edits so it follows its template again. */
  const resetEmail = () => {
    if (!openSend) return;
    const before = openSend;
    patchSend(openSend.id, { subject: null, body: null });
    toast({ title: "Reset to the original template.", actionLabel: "Undo", onAction: () => undoPlain([before]) });
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

  const lock = React.useMemo(
    () => ({ offline: lab.offline, sessionExpired: expired, reconnecting: lab.reconnecting, busy }),
    [lab.offline, expired, lab.reconnecting, busy],
  );

  if (lab.notFound) return <OutboxAccessState kind="not-found" />;
  if (lab.noPermission) return <OutboxAccessState kind="no-permission" />;

  return (
    <OutboxDataProvider value={data}>
      <OutboxLockProvider value={lock}>
        <SkipLinks
          links={[
            { targetId: "outbox-title", label: "Skip to main content" },
            ...(open && openSend ? [] : [{ targetId: "outbox-calendar-title", label: "Skip to calendar" }]),
          ]}
        />
        <OfflineBanner offline={lab.offline} reconnecting={lab.reconnecting} />
        {lab.staleData && !refreshed && (
          <StaleStrip
            updated="yesterday at 10:30 AM"
            onRefresh={() => {
              setRefreshed(true);
              toast({ title: "Refreshed." });
            }}
          />
        )}
        <Layout>
          {!showList ? (
            <OutboxStatePanel
              state={load.loading ? "loading" : "failed"}
              listOnly={!lab.loadFailed && lab.sectionFailed}
              takingLonger={load.takingLonger}
              // The lab can't switch itself off, so in the demo retrying fails again.
              onRetry={() => toast({ title: "Still can't load the Outbox." })}
            />
          ) : (
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
              offline={lab.offline}
              loaded={loaded}
              pickedDay={pickedDay}
              closedDays={closedDays}
              onClosedDays={setClosedDays}
              onHoverDay={setHoverDay}
              onBulk={(kind, ids) => {
                setBulkError(null);
                setBulk({ kind, ids });
              }}
              onResend={resend}
              templates={templates}
              onTemplates={setTemplates}
              days={dayFilter}
              onDays={setDayFilter}
              query={query}
              onQuery={setSubmittedQuery}
              searching={search.pending}
              approved={approved}
              entering={entering}
              loadingTab={loadingTab}
            />
          )}
          {/* An open email is text to read: no selection box can start anywhere on its side, margins included. */}
          <Main aria-busy={load.loading} data-no-marquee={open && openSend ? "" : undefined}>
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
                  onResend={() => resend([openSend.id])}
                  onDelete={() => {
                    setBulkError(null);
                    setBulk({ kind: "delete", ids: [openSend.id] });
                  }}
                  onReset={resetEmail}
                  onResetDraft={resetDraft}
                  errors={fieldErrors}
                  sentNote={sentWhileOffline === openSend.id ? `Sent at ${SEND_TIME} while you were offline.` : null}
                />
              ) : (
                <OutboxCalendar
                  sends={sends}
                  pickedDay={pickedDay}
                  hoverDay={hoverDay}
                  afterSend={afterSend}
                  today={calendarToday}
                  activeTemplates={templates}
                  onPickDay={pickDay}
                  filterDays={dayFilter}
                  onPickDays={pickDays}
                  onFilterTemplate={filterTemplate}
                  onOpenTemplate={openAutomaticEmail}
                  settling={settling}
                  status={calendarStatus}
                  takingLonger={load.takingLonger}
                  onRetry={() => toast({ title: "Still can't load the calendar." })}
                />
              )}
            </Arrive>
          </Main>

          <BulkDialog bulk={bulk} sends={sends} error={bulkError} onConfirm={confirmBulk} onClose={closeBulk} />
          <SessionExpiredDialog
            open={expired}
            onSignIn={() => {
              setSignedIn(true);
              toast({ title: "Signed in." });
            }}
          />
          <ConflictDialog
            conflict={conflict}
            onKeepMine={() => {
              setConflict(null);
              commitSave();
            }}
            onUseTheirs={() => {
              if (open && openSend) setOpen({ ...open, editing: false, ...draftOf(openSend, data.members[openSend.member]) });
              setConflict(null);
            }}
            onClose={() => setConflict(null)}
          />
        </Layout>
      </OutboxLockProvider>
    </OutboxDataProvider>
  );
}

export function OutboxPage() {
  return (
    <AppToastProvider>
      <OutboxScreen />
    </AppToastProvider>
  );
}
