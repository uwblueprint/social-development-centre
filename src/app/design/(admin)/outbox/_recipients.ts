import { dayDate, isEdited, isPastDue, isUpcoming, plural, type FailReason, type Member, type Send, type TemplateKey } from "./_data";
import type { OutboxData } from "./_outboxData";
import type { PanelMode } from "./_types";

/** Tags that mark a member who needs a closer look: they stand out in rows and sort first within a day. */
const IMPORTANT_TAGS = ["Board", "$1,000+"];
const isImportantTag = (tag: string) => IMPORTANT_TAGS.includes(tag);
const isImportant = (s: Send, members: Member[]) => members[s.member].tags.some(isImportantTag);

/**
 * The sends a tab shows, narrowed by the template filter and the search text, soonest first.
 * Within a day, members tagged Board or $1,000+ come first (For review and All), then by name.
 */
export function listSends(sends: Send[], mode: PanelMode, templates: Set<TemplateKey>, query: string, data: OutboxData): Send[] {
  const { members, templates: names } = data;
  const q = query.trim().toLowerCase();
  return sends
    .filter((s) => (mode === "review" ? s.status === "review" : mode === "failed" ? s.status === "couldnt" : isUpcoming(s)))
    .filter((s) => templates.size === 0 || templates.has(s.template))
    .filter((s) => {
      if (!q) return true;
      const m = members[s.member];
      return `${m.name} ${m.email} ${m.tags.join(" ")} ${names[s.template].name}`.toLowerCase().includes(q);
    })
    .sort(
      (a, b) =>
        a.day - b.day ||
        (mode === "failed" ? 0 : Number(isImportant(b, members)) - Number(isImportant(a, members))) ||
        members[a.member].name.localeCompare(members[b.member].name),
    );
}

/** One group per day in order, or a single group (day 0) when the tab isn't grouped by day. */
export function groupByDay(list: Send[], byDay: boolean): { day: number; list: Send[] }[] {
  const groups = new Map<number, Send[]>();
  for (const s of list) {
    const key = byDay ? s.day : 0;
    const rows = groups.get(key) ?? [];
    rows.push(s);
    groups.set(key, rows);
  }
  return [...groups].map(([day, rows]) => ({ day, list: rows }));
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "Mon, Nov 23", or "Nov 2" without the weekday. */
export function shortDate(day: number, weekday = true) {
  const d = dayDate(day);
  return `${weekday ? `${WEEKDAYS[d.getDay()]}, ` : ""}${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** The day filter's only day before today stands for every earlier day (the calendar's "Earlier" cell). */
export const inDays = (s: Send, days: Set<number>) => days.size === 0 || days.has(s.day) || (s.day < 0 && [...days].some((d) => d < 0));

/** The days a calendar box picked, for the filter chip: "Nov 10–13, Nov 17–20", with "Earlier" first when it's in. */
export function daysLabel(days: Set<number>): string {
  const sorted = [...days].filter((d) => d >= 0).sort((a, b) => a - b);
  const runs: [number, number][] = [];
  for (const d of sorted) {
    const last = runs[runs.length - 1];
    if (last && d === last[1] + 1) last[1] = d;
    else runs.push([d, d]);
  }
  // The month is said once, until it changes: "Nov 10–12, 17–19, 30–Dec 2".
  let month = "";
  const parts = runs.map(([a, b]) => {
    const [am, ad] = shortDate(a, false).split(" ");
    const [bm, bd] = shortDate(b, false).split(" ");
    const start = am === month ? ad : `${am} ${ad}`;
    month = bm;
    if (a === b) return start;
    return am === bm ? `${start}–${bd}` : `${start}–${bm} ${bd}`;
  });
  return [...([...days].some((d) => d < 0) ? ["Earlier"] : []), ...parts].join(", ");
}

/** What a row says on its first line, right-aligned: the deadline, or the day a send failed. */
export function rowWhen(s: Send): { text: string; tone?: "warning" } {
  if (s.status === "couldnt") return { text: shortDate(s.day, false) };
  if (isPastDue(s)) return { text: `${plural(-s.day, "day", "days")} late`, tone: "warning" };
  if (s.day === 0) return { text: "Today" };
  if (s.day === 1) return { text: "Tomorrow" };
  return { text: shortDate(s.day) };
}

const FAIL_TEXT: Record<FailReason, string> = {
  bounce: "Address bounced · check it, then resend",
  admin: "Not approved in time · review, then approve",
  platform: "Our error · we'll retry tomorrow",
};
export const failText = (s: Send) => FAIL_TEXT[s.fail ?? "platform"];

/** "Personalized" and "One-off" when they apply. Member tags stay out of rows; they show in the email view. */
export function rowMeta(s: Send): string[] {
  const meta: string[] = [];
  if (isEdited(s)) meta.push("Personalized");
  if (s.status === "pending") meta.push("One-off");
  return meta;
}
