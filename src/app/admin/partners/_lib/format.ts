import { formatDate as formatSdcDate, formatDateTime, formatRelative, formatShortDate } from "@/lib/date";

/** Presentation-only helpers for the Partners UI. Not part of the backend contract. */

/** "Sep 12, 2026", in SDC's time zone (hydration-safe). */
export const formatDate = (iso: string) => formatSdcDate(iso);

/** "Oct 2", or "Oct 2, 2027" outside `now`'s year: for one-line table cells (hydration-safe). */
export const formatShortDateCell = (iso: string, now: string) => formatShortDate(iso, now);

/** Relative time for a table cell or label (hydration-safe; `now` comes from the server): "Today", "3d ago". */
export const formatRelativeCell = (iso: string, now: string) => formatRelative(iso, now);


/** Full date and time for a relative time's tooltip: "Sep 12, 2026, 3:04 PM". */
export const formatDateTimeTitle = (iso: string) => formatDateTime(iso);
