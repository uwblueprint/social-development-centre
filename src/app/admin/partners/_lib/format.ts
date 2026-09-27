import { formatDate as formatSdcDate, formatDateTime, formatRelative, formatShortDate } from "@/lib/date";

/** Presentation-only helpers for the Partners UI. Not part of the backend contract. */

/** "Sep 12, 2026", in SDC's time zone (hydration-safe). */
export const formatDate = (iso: string) => formatSdcDate(iso);

/** "Oct 2", or "Oct 2, 2027" outside `now`'s year: for one-line table cells (hydration-safe). */
export const formatShortDateCell = (iso: string, now: string) => formatShortDate(iso, now);

export function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

/** First 2 names joined, then "+N" for the rest, e.g. "Amara Okafor, Luis Romero +1". Empty when there are none. */
export function summarizeNames(names: string[]): string {
  if (names.length === 0) return "";
  const shown = names.slice(0, 2).join(", ");
  const rest = names.length - 2;
  return rest > 0 ? `${shown} +${rest}` : shown;
}

/** Relative time for a table cell or label (hydration-safe; `now` comes from the server): "Today", "3d ago". */
export const formatRelativeCell = (iso: string, now: string) => formatRelative(iso, now);

/** The same, mid-sentence: "today", "yesterday", "3d ago". */
export function formatRelativeInSentence(iso: string, now: string): string {
  const text = formatRelative(iso, now);
  return text === "Today" || text === "Yesterday" ? text.toLowerCase() : text;
}

/** Full date and time for a relative time's tooltip: "Sep 12, 2026, 3:04 PM". */
export const formatDateTimeTitle = (iso: string) => formatDateTime(iso);
