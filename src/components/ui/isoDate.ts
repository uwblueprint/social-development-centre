/*
 * ISO ("YYYY-MM-DD") <-> Date helpers. Local time throughout, so the value round-trips exactly through the
 * text field, the calendar and form submission without timezone drift.
 */

/** Years shown per page of the year grid. */
export const YEARS_PER_PAGE = 12;

const ISO_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseISODate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const match = ISO_PATTERN.exec(value.trim());
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  const valid =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return valid ? date : undefined;
}

export function formatISODate(date: Date): string {
  const y = String(date.getFullYear()).padStart(4, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/*
 * Month/year range helpers, shared by the day grid's own navigation and the custom month/year picker views
 * below. A month or year only counts as "out of range" when it falls *entirely* outside min/max — if
 * min/max lands mid-month (or mid-year), that month/year still has selectable days, so navigation to it
 * stays enabled.
 */

export function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function monthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function clampDate(date: Date, min?: Date, max?: Date): Date {
  if (min && date < min) return min;
  if (max && date > max) return max;
  return date;
}

export function isMonthOutOfRange(year: number, month: number, min?: Date, max?: Date): boolean {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  if (min && end < monthStart(min)) return true;
  if (max && start > monthEnd(max)) return true;
  return false;
}

export function isYearOutOfRange(year: number, min?: Date, max?: Date): boolean {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  if (min && end < monthStart(min)) return true;
  if (max && start > monthEnd(max)) return true;
  return false;
}

export function isYearsPageOutOfRange(pageStart: number, min?: Date, max?: Date): boolean {
  const start = new Date(pageStart, 0, 1);
  const end = new Date(pageStart + YEARS_PER_PAGE - 1, 11, 31);
  if (min && end < monthStart(min)) return true;
  if (max && start > monthEnd(max)) return true;
  return false;
}
