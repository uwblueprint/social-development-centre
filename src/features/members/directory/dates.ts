/*
 * Dates for the Member Directory. Membership dates are calendar days (YYYY-MM-DD) in Waterloo Region;
 * timestamps from the database are turned into one with `localDay`. "Today" comes from the server
 * (see the members page), so the server and the browser render the same thing.
 */

const ZONE = "America/Toronto";

/** The calendar day (YYYY-MM-DD) a timestamp falls on in Waterloo Region. */
export function localDay(timestamp: string | Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONE }).format(new Date(timestamp));
}

const toDate = (day: string) => new Date(`${day}T00:00:00Z`);
const toDay = (d: Date) => d.toISOString().slice(0, 10);

/** Same day of the month, `months` later (or the month's last day when it's shorter). */
export function addMonths(day: string, months: number): string {
  const d = toDate(day);
  const date = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(date, last));
  return toDay(d);
}

export function addDays(day: string, days: number): string {
  const d = toDate(day);
  d.setUTCDate(d.getUTCDate() + days);
  return toDay(d);
}

/** Days from `a` to `b`. */
export const diffDays = (a: string, b: string) => Math.round((toDate(b).getTime() - toDate(a).getTime()) / 86_400_000);

/** "Oct 24, 2026". Exact dates only, never "today" or "yesterday" (client, 23 Oct). */
export function formatDay(day: string, withYear = true): string {
  return toDate(day).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: withYear ? "numeric" : undefined,
    timeZone: "UTC",
  });
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** The end date only needs a word when it's close (30 days) or past. */
export function endNotice(endsAt: string, today: string): { text: string; tone: "warning" | "danger" } | null {
  const n = diffDays(today, endsAt);
  if (n < 0) return { text: `Ended ${plural(-n, "day")} ago`, tone: "danger" };
  if (n === 0) return { text: "Ends today", tone: "warning" };
  if (n <= 30) return { text: `Ends in ${plural(n, "day")}`, tone: "warning" };
  return null;
}

/** The current membership year: a renewal starts a new year, with its own 3, 6 and 9-month check-ins. */
export function membershipYear(joinedDay: string, endsAt: string) {
  const yearBefore = addMonths(endsAt, -12);
  const start = yearBefore > joinedDay ? yearBefore : joinedDay;
  return { start, renewed: start !== joinedDay };
}
