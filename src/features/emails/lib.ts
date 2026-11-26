/* Emails prototype: shared formatting helpers for the UI. Pure; all take `now` explicitly. */
import { TIME_ZONE, type Audience, type Conditions, type EmailsState, type Send, type Settings } from "./model";
import { dayDiff, dayKey, torontoParts } from "./engine";

const DATE = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, month: "short", day: "numeric", year: "numeric" });
const TIME = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, hour: "numeric", minute: "2-digit" });

export function formatDate(iso: string): string {
  return DATE.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return TIME.format(new Date(iso)).replace("AM", "a.m.").replace("PM", "p.m.");
}

/** "Today", "Tomorrow", "Yesterday", "in 12 days", "5 days ago". */
export function formatSendDay(iso: string, now: Date): string {
  const n = dayDiff(dayKey(now), dayKey(iso));
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n === -1) return "Yesterday";
  return n > 1 ? `in ${n} days` : `${-n} days ago`;
}

/** Whole calendar days a send is overdue (0 when not yet due or due today). */
export function daysPastDue(send: Send, now: Date): number {
  return Math.max(0, -dayDiff(dayKey(now), dayKey(send.sendAt)));
}

/** "4 days past due", "1 day past due" or "Due today". */
export function formatPastDue(send: Send, now: Date): string {
  const n = daysPastDue(send, now);
  return n === 0 ? "Due today" : `${n} ${n === 1 ? "day" : "days"} past due`;
}

/** True when the send time sits inside the 10:30 to 11:30 window, which the UI calls "morning". */
export function isMorningSend(iso: string): boolean {
  const p = torontoParts(new Date(iso));
  const t = p.h * 60 + p.min;
  return t >= 10 * 60 + 30 && t <= 11 * 60 + 30;
}

/** "Tomorrow morning", "This morning", "in 12 days (morning)" or "Today at 3:40 p.m.". */
export function formatSendWhen(iso: string, now: Date): string {
  const day = formatSendDay(iso, now);
  if (isMorningSend(iso)) {
    if (day === "Today") return "This morning";
    return day === "Tomorrow" || day === "Yesterday" ? `${day} morning` : `${day}, morning`;
  }
  return `${day} at ${formatTime(iso)}`;
}

export function describeConditions(c: Conditions): string {
  if (c.rules.length === 0) return "Everyone";
  const parts = c.rules.map((r) => {
    switch (r.type) {
      case "has-tag":
        return `has the tag ${r.tag}`;
      case "except-tag":
        return `does not have the tag ${r.tag}`;
      case "joined-before":
        return `joined before ${r.date}`;
      case "joined-after":
        return `joined after ${r.date}`;
      default:
        return `joined in ${r.month}`;
    }
  });
  const hasExcept = c.rules.some((r) => r.type === "except-tag");
  const joiner = c.match === "all" || hasExcept ? " and " : " or ";
  return `Members who ${parts.join(joiner)}`;
}

export function describeAudience(audience: Audience, state: EmailsState): string {
  if (audience.kind === "all") return "All members";
  if (audience.kind === "conditions") return describeConditions(audience.conditions);
  const names = audience.memberIds
    .map((id) => state.members.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => !!m)
    .map((m) => `${m.firstName} ${m.lastName}`.trim() || m.email);
  if (names.length === 0) return "No one chosen yet";
  if (names.length === 1) return names[0];
  return `${names.length} members chosen by hand`;
}

/** The footer as HTML: `{{unsubscribe}}text{{/unsubscribe}}` becomes a link. */
export function renderFooter(settings: Settings): string {
  return settings.footer.replace(/\{\{unsubscribe\}\}(.*?)\{\{\/unsubscribe\}\}/g, '<a href="#">$1</a>');
}
