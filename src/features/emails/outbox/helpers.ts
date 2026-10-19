import { ADMINS, NOT_SENT_LABEL, TIME_ZONE } from "../model";
import type { EmailContent, EmailsApi, Member, Moment, OneOffEmail, Send } from "../model";

/* Outbox helpers: grouping, day labels and names. Local on purpose so this flow doesn't depend on the shared lib. */

const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });
const labelFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, weekday: "short", month: "short", day: "numeric" });

/** yyyy-mm-dd in the centre's time zone. */
export function dayKey(d: Date | string): string {
  return dayFmt.format(typeof d === "string" ? new Date(d) : d);
}

function dayNumber(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** Whole calendar days from `from` to `to` (positive when `to` is later). DST-safe because it counts calendar days. */
export function dayDiff(from: string, to: string): number {
  return dayNumber(to) - dayNumber(from);
}

export function dayLabel(key: string, now: Date): string {
  const diff = dayDiff(dayKey(now), key);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return labelFmt.format(new Date(`${key}T12:00:00Z`));
}

/** "Tue, Nov 3" */
export function shortDay(key: string): string {
  return labelFmt.format(new Date(`${key}T12:00:00Z`));
}

export function isDue(send: Send, now: Date): boolean {
  return new Date(send.sendAt).getTime() <= now.getTime();
}

export function daysPastDue(send: Send, now: Date): number {
  return Math.max(0, dayDiff(dayKey(send.sendAt), dayKey(now)));
}

export function pastDueText(days: number): string {
  if (days <= 0) return "Due today";
  return days === 1 ? "1 day past due" : `${days} days past due`;
}

/** When an approved send will go. Morning only, never a clock time. */
export function approveWhen(send: Send, now: Date): { ahead: boolean; key: string; label: string } {
  const key = dayKey(send.sendAt);
  const ahead = dayDiff(dayKey(now), key) > 0;
  if (ahead) return { ahead, key, label: `${dayLabel(key, now) === "Tomorrow" ? "tomorrow morning" : `the morning of ${shortDay(key)}`}` };
  return { ahead, key, label: "tomorrow morning" };
}

export function approveButtonLabel(send: Send, now: Date): string {
  const w = approveWhen(send, now);
  return w.ahead ? `Approve for ${shortDay(w.key)}` : "Approve for tomorrow morning";
}

export function fullName(m: Member | undefined): string {
  if (!m) return "Unknown member";
  const n = `${m.firstName} ${m.lastName}`.trim();
  return n || m.email;
}

export function sourceId(s: Send): string {
  return s.source.kind === "automatic" ? s.source.automaticId : s.source.oneOffId;
}

export function batchKeyOf(s: Send): string {
  return `${sourceId(s)}|${dayKey(s.sendAt)}`;
}

export interface SourceInfo {
  name: string;
  content: EmailContent;
  moment: Moment | undefined;
  oneOff: boolean;
}

export function sourceInfo(api: EmailsApi, s: Send): SourceInfo {
  if (s.source.kind === "automatic") {
    const id = s.source.automaticId;
    const a = api.state.automatic.find((x) => x.id === id);
    return {
      name: a?.name || "Untitled email",
      content: a?.content ?? { subject: "", bodyHtml: "" },
      moment: a?.moment ?? undefined,
      oneOff: false,
    };
  }
  const id = s.source.oneOffId;
  const o: OneOffEmail | undefined = api.state.oneOffs.find((x) => x.id === id);
  return { name: o?.content.subject || "One-off email", content: o?.content ?? { subject: "", bodyHtml: "" }, moment: undefined, oneOff: true };
}

export function contentOf(api: EmailsApi, s: Send): EmailContent {
  return s.editedContent ?? sourceInfo(api, s).content;
}

export function undoLeft(s: Send, now: Date): number {
  if (!s.undo) return 0;
  return Math.max(0, Math.ceil((new Date(s.undo.until).getTime() - now.getTime()) / 1000));
}

export function lockedByOther(s: Send, _now?: Date): string | null {
  void _now;
  if (!s.lock || s.lock.by === ADMINS.me) return null;
  return s.lock.by;
}

export interface Batch {
  key: string;
  name: string;
  oneOff: boolean;
  day: string;
  sends: Send[];
  review: Send[];
  couldnt: Send[];
  edited: number;
  maxPastDue: number;
}

export function buildBatches(api: EmailsApi, sends: Send[], now: Date): Batch[] {
  const map = new Map<string, Batch>();
  for (const s of sends) {
    const key = batchKeyOf(s);
    let b = map.get(key);
    if (!b) {
      b = { key, name: sourceInfo(api, s).name, oneOff: s.source.kind === "one-off", day: dayKey(s.sendAt), sends: [], review: [], couldnt: [], edited: 0, maxPastDue: 0 };
      map.set(key, b);
    }
    b.sends.push(s);
    if (s.status === "waiting-review") b.review.push(s);
    if (s.couldntSend) b.couldnt.push(s);
    if (s.editedContent) b.edited += 1;
    b.maxPastDue = Math.max(b.maxPastDue, daysPastDue(s, now));
  }
  return [...map.values()];
}

export interface Group {
  id: string;
  title: string;
  batches: Batch[];
  waiting?: boolean;
}

export function buildGroups(api: EmailsApi, now: Date): Group[] {
  const waitingIds = new Set(api.waitingForYou.map((s) => s.id));
  const waiting = buildBatches(api, api.waitingForYou, now).sort(
    (a, b) => b.maxPastDue - a.maxPastDue || a.name.localeCompare(b.name),
  );
  for (const b of waiting) b.key = `w|${b.key}`;
  const rest = api.outbox.filter((s) => !waitingIds.has(s.id));
  const byDay = new Map<string, Send[]>();
  for (const s of rest) {
    const k = dayKey(s.sendAt);
    byDay.set(k, [...(byDay.get(k) ?? []), s]);
  }
  const groups: Group[] = [];
  if (waiting.length) groups.push({ id: "waiting", title: "Waiting for you", batches: waiting, waiting: true });
  for (const k of [...byDay.keys()].sort()) {
    groups.push({
      id: k,
      title: dayLabel(k, now),
      batches: buildBatches(api, byDay.get(k)!, now).sort((a, b) => a.name.localeCompare(b.name)),
    });
  }
  return groups;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** "Amira Haddad, Dev Patel and 4 others" */
export function namesList(api: EmailsApi, sends: Send[], max = 3): string {
  const names = sends.map((s) => fullName(api.member(s.memberId)));
  if (names.length <= max) {
    if (names.length <= 1) return names[0] ?? "";
    return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  }
  return `${names.slice(0, max).join(", ")} and ${plural(names.length - max, "other")}`;
}

export function notSentText(s: Send): string {
  if (s.notSentReason === "removed-by-admin") return "Not sent: removed by admin";
  return s.notSentReason ? `Not sent: ${NOT_SENT_LABEL[s.notSentReason].toLowerCase()}` : "Not sent";
}

/** Plain-language "when" for a send. Mornings only, never a clock time. */
export function whenText(s: Send, now: Date): string {
  const key = dayKey(s.sendAt);
  const diff = dayDiff(dayKey(now), key);
  const morning = diff === 0 ? "this morning" : diff === 1 ? "tomorrow morning" : `the morning of ${shortDay(key)}`;
  if (s.couldntSend) return "We couldn't send this. It is waiting for you.";
  if (s.status === "waiting-review") {
    if (isDue(s, now)) return `Waiting for your review. ${pastDueText(daysPastDue(s, now))}.`;
    return `Waiting for your review. It would send ${morning} once approved.`;
  }
  if (s.status === "scheduled") {
    if (isDue(s, now) && diff <= 0) return s.chosen === "morning" ? "Sends tomorrow morning" : "Sends within a minute";
    return `Sends ${morning}`;
  }
  return "";
}

/** The day label inside a sentence: "today" but "Fri, Oct 23". */
export function dayLabelInline(key: string, now: Date): string {
  const label = dayLabel(key, now);
  return /^(Today|Tomorrow|Yesterday)$/.test(label) ? label.toLowerCase() : label;
}

/** "Volunteer, Board": a member's tags as one plain line (the recipient view shows them once). */
export function tagsLine(m: Member | undefined): string {
  return m ? m.tags.join(", ") : "";
}

export type StatusKind = "review" | "couldnt" | "scheduled";

/** The one status a batch row shows. Plain Scheduled shows nothing; colour only for past due and Couldn’t send. */
export function batchStatus(b: Batch, waiting: boolean): { kind: StatusKind; text: string; tone: "outline" | "warning" | "danger" } {
  if (b.couldnt.length) return { kind: "couldnt", tone: "danger", text: waiting && b.couldnt.length === b.sends.length ? "Couldn’t send" : `${b.couldnt.length} couldn’t send` };
  if (b.review.length) {
    if (waiting && b.maxPastDue > 0) return { kind: "review", tone: "warning", text: pastDueText(b.maxPastDue) };
    return { kind: "review", tone: "outline", text: `${b.review.length} to review` };
  }
  return { kind: "scheduled", tone: "outline", text: "Scheduled" };
}

/** The one status a recipient row or sheet header shows. */
export function sendStatus(s: Send, now: Date): { kind: StatusKind; text: string } {
  if (s.couldntSend) return { kind: "couldnt", text: "Couldn’t send" };
  if (s.status === "waiting-review") {
    return { kind: "review", text: isDue(s, now) ? pastDueText(daysPastDue(s, now)) : "Needs review" };
  }
  return { kind: "scheduled", text: "Scheduled" };
}
