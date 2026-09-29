/**
 * Date formatting for the UI. The server sends ISO strings; these turn them into text.
 *
 * Hydration-safe: every function uses a fixed locale and SDC's time zone, never the machine's, and the
 * relative helpers take `now` instead of reading the clock. The server passes the same `now` (an ISO
 * string from the request) to the client, so both render identical text.
 */

/** SDC is in Kitchener-Waterloo; calendar days ("Yesterday") are counted there. */
export const SDC_TIME_ZONE = "America/Toronto";
const LOCALE = "en-US";

const dateFormat = new Intl.DateTimeFormat(LOCALE, { timeZone: SDC_TIME_ZONE, month: "short", day: "numeric", year: "numeric" });
const shortFormat = new Intl.DateTimeFormat(LOCALE, { timeZone: SDC_TIME_ZONE, month: "short", day: "numeric" });
const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, { timeZone: SDC_TIME_ZONE, dateStyle: "medium", timeStyle: "short" });
const dayKeyFormat = new Intl.DateTimeFormat("en-CA", { timeZone: SDC_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

/** "Apr 11, 2026". */
export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}

/** Full date and time, e.g. for the tooltip on a relative time: "Sep 12, 2026, 3:04 PM". */
export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso));
}

/** Short date for dense lists: "Sep 12", or "Sep 12, 2025" outside `now`'s year. */
export function formatShortDate(iso: string, now: string): string {
  const sameYear = dayKey(iso).slice(0, 4) === dayKey(now).slice(0, 4);
  return (sameYear ? shortFormat : dateFormat).format(new Date(iso));
}

/** YYYY-MM-DD in SDC's time zone; also what CSV exports use. */
export function dayKey(iso: string): string {
  return dayKeyFormat.format(new Date(iso));
}

/** Whole calendar days from `iso` to `now`, in SDC's time zone. */
function daysBetween(iso: string, now: string): number {
  const utc = (key: string) => Date.UTC(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, Number(key.slice(8, 10)));
  return Math.round((utc(dayKey(now)) - utc(dayKey(iso))) / 86_400_000);
}

/** Short relative time for table cells: "Today", "Yesterday", "3d ago", "1w ago", "5mo ago", "2y ago". */
export function formatRelative(iso: string, now: string): string {
  const days = daysBetween(iso, now);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
