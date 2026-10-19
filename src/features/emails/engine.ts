/*
 * Emails prototype: pure engine helpers. No React, no globals, no clock: every function takes `now`.
 * store.tsx wires these to React state; a real backend would reimplement them server-side
 * (see docs/backend/emails-engine.md).
 */
import {
  ADMINS,
  EXCLUSION_REASON,
  OUTBOX_DAYS,
  TIME_ZONE,
  VARIABLES,
  type AutomaticEmail,
  type Audience,
  type AudienceResult,
  type Conditions,
  type Delay,
  type EmailContent,
  type EmailsState,
  type Fallbacks,
  type LabFlags,
  type Member,
  type NotSentReason,
  type OneOffEmail,
  type Send,
  type VarKey,
} from "./model";

/* ---------- Toronto time ---------- */

const PARTS = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export interface TorontoParts {
  y: number;
  m: number;
  d: number;
  h: number;
  min: number;
}

export function torontoParts(date: Date): TorontoParts {
  const out: Record<string, number> = {};
  for (const p of PARTS.formatToParts(date)) if (p.type !== "literal") out[p.type] = Number(p.value);
  return { y: out.year, m: out.month, d: out.day, h: out.hour % 24, min: out.minute };
}

/** Calendar day in Toronto, "yyyy-mm-dd". */
export function dayKey(date: Date | string): string {
  const p = torontoParts(typeof date === "string" ? new Date(date) : date);
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

/** The instant at which the Toronto wall clock reads `day` `h:min` (DST-safe). */
export function zonedToDate(day: string, h: number, min: number): Date {
  const [y, m, d] = day.split("-").map(Number);
  const target = Date.UTC(y, m - 1, d, h, min);
  let guess = target;
  for (let i = 0; i < 3; i += 1) {
    const p = torontoParts(new Date(guess));
    guess += target - Date.UTC(p.y, p.m - 1, p.d, p.h, p.min);
  }
  return new Date(guess);
}

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Whole calendar days from `a` to `b` (both "yyyy-mm-dd"). */
export function dayDiff(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

export function monthKey(date: Date | string): string {
  return dayKey(date).slice(0, 7);
}

/* ---------- Send windows ---------- */

const WINDOW_START = 10 * 60 + 30; // 10:30
const WINDOW_END = 11 * 60 + 30; // 11:30

export function hashString(s: string): number {
  let h = 7;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** A stable minute inside the 10:30-11:30 window for this member on `day`. */
export function windowAt(day: string, seed: string): Date {
  const total = WINDOW_START + (hashString(seed) % 60);
  return zonedToDate(day, Math.floor(total / 60), total % 60);
}

export function computeSendAt(momentAt: Date, delay: Delay, seed: string): Date {
  if (delay.kind === "immediately") return momentAt;
  const day = dayKey(momentAt);
  if (delay.kind === "days-after") return windowAt(addDays(day, delay.days), seed);
  const w = windowAt(day, seed);
  if (w.getTime() > momentAt.getTime()) return w;
  const end = zonedToDate(day, Math.floor(WINDOW_END / 60), WINDOW_END % 60);
  if (momentAt.getTime() < end.getTime() - 60_000) return new Date(momentAt.getTime() + 60_000);
  return windowAt(addDays(day, 1), seed);
}

/** The next morning window after `now` (today's if it is still ahead, otherwise tomorrow's). */
export function nextMorningWindow(now: Date, seed: string): Date {
  const today = dayKey(now);
  const w = windowAt(today, seed);
  return w.getTime() > now.getTime() ? w : windowAt(addDays(today, 1), seed);
}

/* ---------- Conditions ---------- */

export function matchesConditions(c: Conditions, m: Member): boolean {
  for (const r of c.rules) if (r.type === "except-tag" && m.tags.includes(r.tag)) return false; // except always wins
  const rules = c.rules.filter((r) => r.type !== "except-tag");
  if (rules.length === 0) return true;
  const joined = dayKey(m.joinedAt);
  const test = (r: (typeof rules)[number]): boolean => {
    switch (r.type) {
      case "has-tag":
        return m.tags.includes(r.tag);
      case "joined-before":
        return joined < r.date;
      case "joined-after":
        return joined > r.date;
      case "joined-in":
        return joined.slice(0, 7) === r.month;
      default:
        return true;
    }
  };
  return c.match === "all" ? rules.every(test) : rules.some(test);
}

/* ---------- Moments to occurrences ---------- */

export interface Occurrence {
  /** The member who receives the email. */
  memberId: string;
  occurrence: string;
  momentAt: Date;
}

export function momentOccurrences(email: AutomaticEmail, members: Member[]): Occurrence[] {
  const m = email.moment;
  if (!m) return [];
  const byId = new Map(members.map((x) => [x.id, x]));
  const at = (x: Member) => new Date(x.joinedAt);
  switch (m.type) {
    case "join-any":
      return members.map((x) => ({ memberId: x.id, occurrence: "join", momentAt: at(x) }));
    case "join-no-referral":
      return members.filter((x) => !x.referredBy).map((x) => ({ memberId: x.id, occurrence: "join", momentAt: at(x) }));
    case "join-referral":
      return members.filter((x) => x.referredBy).map((x) => ({ memberId: x.id, occurrence: "join", momentAt: at(x) }));
    case "refers-someone":
    case "referral-joins":
      // Recipient is the referrer; the moment is when the referred person joined (prototype has no separate "refers" event).
      return members
        .filter((x) => x.referredBy && byId.has(x.referredBy))
        .map((x) => ({ memberId: x.referredBy as string, occurrence: `referral:${x.id}`, momentAt: at(x) }));
    case "tag-added": {
      const tag = m.tag;
      if (!tag) return [];
      // The member model has no tag timestamps, so the prototype uses the join date as the tag-added moment.
      return members.filter((x) => x.tags.includes(tag)).map((x) => ({ memberId: x.id, occurrence: `tag:${tag}`, momentAt: at(x) }));
    }
    default:
      return [];
  }
}

/* ---------- Plans (publish, preview, scheduledFor) ---------- */

export type PlanKind = "normal" | "comeBack" | "missed";

export interface PlanItem {
  memberId: string;
  occurrence: string;
  sendAt: Date;
  kind: PlanKind;
  missedDueAt?: string;
}

const keyOf = (memberId: string, occurrence: string) => `${memberId}|${occurrence}`;

function emailSends(state: EmailsState, automaticId: string): Send[] {
  return state.sends.filter((s) => s.source.kind === "automatic" && s.source.automaticId === automaticId);
}

/**
 * What publishing `email` now would create. Idempotent: occurrences that already have a send (pending, sent
 * or not-sent for any reason except "unpublished") are skipped. No retroactive sends: a moment that already
 * happened only sends when its send day is tomorrow or later, or when it is a come-back / catch-up.
 */
export function planPublish(state: EmailsState, email: AutomaticEmail, now: Date): PlanItem[] {
  if (!email.moment || !email.delay) return [];
  const members = new Map(state.members.map((m) => [m.id, m]));
  const taken = new Set<string>();
  const prior = new Map<string, Send>();
  for (const s of emailSends(state, email.id)) {
    const k = keyOf(s.memberId, s.occurrence);
    if (s.status === "not-sent" && s.notSentReason === "unpublished") prior.set(k, s);
    else taken.add(k);
  }
  const stopped = email.stoppedLiveAt ? new Date(email.stoppedLiveAt) : undefined;
  const today = dayKey(now);
  const out: PlanItem[] = [];
  const seen = new Set<string>();
  for (const occ of momentOccurrences(email, state.members)) {
    const k = keyOf(occ.memberId, occ.occurrence);
    if (taken.has(k) || seen.has(k)) continue;
    const member = members.get(occ.memberId);
    if (!member || member.status !== "active" || !matchesConditions(email.conditions, member)) continue;
    if (occ.momentAt.getTime() > now.getTime()) continue;
    seen.add(k);
    const old = prior.get(k);
    const sendAt = computeSendAt(occ.momentAt, email.delay, member.id);
    const comesBack = !!old && (email.sendMode === "review" || !!old.approved);
    if (sendAt.getTime() <= now.getTime()) {
      if (stopped && sendAt.getTime() > stopped.getTime()) {
        out.push({ memberId: member.id, occurrence: occ.occurrence, sendAt, kind: "missed", missedDueAt: sendAt.toISOString() });
      } else if (old) {
        out.push({ memberId: member.id, occurrence: occ.occurrence, sendAt: new Date(old.sendAt), kind: "comeBack" });
      }
    } else if (old) {
      out.push({ memberId: member.id, occurrence: occ.occurrence, sendAt, kind: comesBack ? "comeBack" : "normal" });
    } else if (dayDiff(today, dayKey(sendAt)) >= 1) {
      out.push({ memberId: member.id, occurrence: occ.occurrence, sendAt, kind: "normal" });
    }
  }
  return out;
}

export function sendsFromPlan(email: AutomaticEmail, plan: PlanItem[], genId: (prefix: string) => string): Send[] {
  return plan.map((p) => ({
    id: genId("s"),
    memberId: p.memberId,
    source: { kind: "automatic" as const, automaticId: email.id },
    occurrence: p.occurrence,
    status: p.kind !== "normal" || email.sendMode === "review" ? ("waiting-review" as const) : ("scheduled" as const),
    sendAt: p.sendAt.toISOString(),
    ...(p.missedDueAt ? { missedDueAt: p.missedDueAt } : {}),
  }));
}

/* ---------- Rendering ---------- */

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const JOIN_DATE = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, year: "numeric", month: "long", day: "numeric" });
const KEYS = new Set<string>(VARIABLES.map((v) => v.key));

function valueFor(key: VarKey, member: Member, members: Member[]): string {
  const [who, field] = key.split(".") as ["member" | "referrer" | "referred", string];
  const person =
    who === "member"
      ? member
      : who === "referrer"
        ? members.find((m) => m.id === member.referredBy)
        : members.find((m) => m.referredBy === member.id);
  if (!person) return "";
  switch (field) {
    case "firstName":
      return person.firstName.trim();
    case "lastName":
      return person.lastName.trim();
    case "fullName":
      return `${person.firstName} ${person.lastName}`.trim();
    case "email":
      return person.email;
    case "joinDate":
      return JOIN_DATE.format(new Date(person.joinedAt));
    default:
      return "";
  }
}

/** Subject comes back as plain text (React escapes it). Body is HTML with member data escaped. */
export function renderContent(
  content: EmailContent,
  member: Member,
  members: Member[],
  fallbacks: Fallbacks,
): { subject: string; bodyHtml: string } {
  const fill = (text: string, escape: boolean) =>
    text.replace(/\{\{\s*([A-Za-z]+\.[A-Za-z]+)\s*\}\}/g, (whole, raw: string) => {
      if (!KEYS.has(raw)) return whole;
      const key = raw as VarKey;
      const v = valueFor(key, member, members) || fallbacks[key] || "";
      return escape ? escapeHtml(v) : v;
    });
  return { subject: fill(content.subject, false), bodyHtml: fill(content.bodyHtml, true) };
}

/* ---------- One-off audiences ---------- */

export function resolveAudienceFor(members: Member[], audience: Audience, removedIds: string[] = []): AudienceResult {
  let base: Member[];
  if (audience.kind === "all") base = members;
  else if (audience.kind === "conditions") base = members.filter((m) => matchesConditions(audience.conditions, m));
  else {
    const byId = new Map(members.map((m) => [m.id, m]));
    base = audience.memberIds.map((id) => byId.get(id)).filter((m): m is Member => !!m);
  }
  const removed = new Set(removedIds);
  const recipients: Member[] = [];
  const excluded: AudienceResult["excluded"] = [];
  for (const m of base) {
    if (m.status !== "active") excluded.push({ member: m, reason: EXCLUSION_REASON[m.status] });
    else if (!removed.has(m.id)) recipients.push(m);
  }
  return { recipients, excluded };
}

/* ---------- Locks and undo ---------- */

export const isUndoActive = (s: Send, now: Date) => !!s.undo && new Date(s.undo.until).getTime() > now.getTime();
export const isPending = (s: Send) => s.status === "scheduled" || s.status === "waiting-review";

export function batchKey(s: Send): string {
  const src = s.source.kind === "automatic" ? `a:${s.source.automaticId}` : `o:${s.source.oneOffId}`;
  return `${src}|${dayKey(s.sendAt)}`;
}

/** Ids of sends that show as open by the other admin (lab): the next two upcoming batches. */
export function otherLockedIds(sends: Send[], now: Date, lab: LabFlags): Set<string> {
  const ids = new Set<string>();
  if (!lab.otherAdminEditing) return ids;
  const upcoming = sends
    .filter((s) => s.source.kind === "automatic" && isPending(s) && new Date(s.sendAt).getTime() > now.getTime())
    .sort((a, b) => a.sendAt.localeCompare(b.sendAt));
  const batches: string[] = [];
  for (const s of upcoming) {
    const k = batchKey(s);
    if (!batches.includes(k)) batches.push(k);
    if (batches.length > 2) break;
    if (!s.lock) ids.add(s.id);
  }
  return ids;
}

export function decorateLocks(sends: Send[], now: Date, lab: LabFlags): Send[] {
  const ids = otherLockedIds(sends, now, lab);
  if (ids.size === 0) return sends;
  return sends.map((s) => (ids.has(s.id) ? { ...s, lock: { by: ADMINS.other } } : s));
}

/* ---------- Checks at approval and at send ---------- */

const STATUS_REASON = { unsubscribed: "unsubscribed", bounced: "bounced", "reported-spam": "reported-spam" } as const;

/** Re-checks conditions and subscription. Returns why it must not go, or null. */
export function recheck(send: Send, state: EmailsState): NotSentReason | null {
  const member = state.members.find((m) => m.id === send.memberId);
  if (!member) return "no-longer-matched";
  if (member.status !== "active") return STATUS_REASON[member.status];
  if (send.source.kind === "automatic") {
    const id = send.source.automaticId;
    const email = state.automatic.find((e) => e.id === id);
    if (!email || email.state !== "published") return "unpublished";
    if (!matchesConditions(email.conditions, member)) return "no-longer-matched";
  }
  return null;
}

export function contentOf(send: Send, state: EmailsState): EmailContent | undefined {
  if (send.editedContent) return send.editedContent;
  if (send.source.kind === "automatic") {
    const id = send.source.automaticId;
    return state.automatic.find((e) => e.id === id)?.content;
  }
  const id = send.source.oneOffId;
  return state.oneOffs.find((o) => o.id === id)?.content;
}

/* ---------- Derived lists ---------- */

export function waitingForYouOf(sends: Send[], now: Date): Send[] {
  return sends
    .filter((s) => (s.status === "waiting-review" || (s.status === "scheduled" && (s.couldntSend || s.lock))) && new Date(s.sendAt).getTime() <= now.getTime())
    .sort((a, b) => a.sendAt.localeCompare(b.sendAt));
}

export function outboxOf(sends: Send[], now: Date): Send[] {
  const horizon = now.getTime() + OUTBOX_DAYS * 86_400_000;
  return sends
    .filter((s) => s.source.kind === "automatic" && isPending(s) && new Date(s.sendAt).getTime() <= horizon)
    .sort((a, b) => a.sendAt.localeCompare(b.sendAt));
}

/* ---------- The worker tick ---------- */

type OneOffSendFn = (oneOff: OneOffEmail) => OneOffEmail;

/**
 * One worker pass: expire locks and undo windows, create sends for moments that just happened on published
 * emails, send what is due (re-checking conditions and subscription), and close finished one-offs.
 * Returns the same object when nothing changed.
 */
export function tickState(
  state: EmailsState,
  now: Date,
  last: Date,
  lab: LabFlags,
  genId: (prefix: string) => string,
): EmailsState {
  const nowMs = now.getTime();
  let changed = false;
  let sends = state.sends;

  // 1. Undo windows expire. Edit pauses never time out.
  const cleaned = sends.map((s) => {
    let next = s;
    if (next.undo && new Date(next.undo.until).getTime() <= nowMs && next.undo.action !== "one-off") {
      const { undo: _undo, ...rest } = next;
      void _undo;
      next = rest;
    }
    return next;
  });
  if (cleaned.some((s, i) => s !== sends[i])) {
    sends = cleaned;
    changed = true;
  }

  // 2. New occurrences on published emails (moment happened since the last tick).
  const working: EmailsState = { ...state, sends };
  const created: Send[] = [];
  for (const email of state.automatic) {
    if (email.state !== "published" || !email.delay) continue;
    const have = new Set(emailSends(working, email.id).map((s) => keyOf(s.memberId, s.occurrence)));
    for (const occ of momentOccurrences(email, state.members)) {
      const t = occ.momentAt.getTime();
      if (t <= last.getTime() || t > nowMs) continue;
      const k = keyOf(occ.memberId, occ.occurrence);
      const member = state.members.find((m) => m.id === occ.memberId);
      if (have.has(k) || !member || member.status !== "active" || !matchesConditions(email.conditions, member)) continue;
      have.add(k);
      created.push(
        ...sendsFromPlan(
          email,
          [{ memberId: member.id, occurrence: occ.occurrence, sendAt: computeSendAt(occ.momentAt, email.delay, member.id), kind: "normal" }],
          genId,
        ),
      );
    }
  }
  if (created.length) {
    sends = [...sends, ...created];
    changed = true;
  }

  // 3. The worker sends what is due.
  const locked = otherLockedIds(sends, now, lab);
  const live: EmailsState = { ...state, sends };
  const processed = sends.map((s) => {
    if (s.status !== "scheduled" || s.couldntSend) return s;
    if (new Date(s.sendAt).getTime() > nowMs || isUndoActive(s, now) || s.lock || locked.has(s.id)) return s;
    const reason = recheck(s, live);
    if (reason) {
      const { undo: _u, ...rest } = s;
      void _u;
      return { ...rest, status: "not-sent" as const, notSentReason: reason };
    }
    if (lab.providerDown) return { ...s, couldntSend: true };
    const member = state.members.find((m) => m.id === s.memberId);
    const content = contentOf(s, live);
    if (!member || !content) return s;
    const out = renderContent(content, member, state.members, state.fallbacks);
    const { undo: _u, ...rest } = s;
    void _u;
    return { ...rest, status: "sent" as const, sentAt: now.toISOString(), sentSubject: out.subject, sentBodyHtml: out.bodyHtml };
  });
  if (processed.some((s, i) => s !== sends[i])) {
    sends = processed;
    changed = true;
  }

  // 4. One-offs finish when every one of their sends has gone out or been stopped.
  const finish: OneOffSendFn = (o) => ({ ...o, status: "sent", sentAt: now.toISOString() });
  let oneOffs = state.oneOffs;
  if (oneOffs.some((o) => o.status === "sending")) {
    const next = oneOffs.map((o) => {
      if (o.status !== "sending") return o;
      const mine = sends.filter((s) => s.source.kind === "one-off" && s.source.oneOffId === o.id);
      return mine.length > 0 && mine.every((s) => !isPending(s)) ? finish(o) : o;
    });
    if (next.some((o, i) => o !== oneOffs[i])) {
      oneOffs = next;
      changed = true;
    }
  }

  return changed ? { ...state, sends, oneOffs } : state;
}
