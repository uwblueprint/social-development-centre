import { parseISODate } from "./DatePicker";

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

function buildDate(year: number, month: number, day: number) {
  const date = new Date(year, month, day);
  const valid = date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
  return valid ? date : undefined;
}

/** Month index (0-11) from a full or 3+ letter name ("nov", "sept", "November"), or -1. */
export function monthFromName(name: string) {
  const n = name.toLowerCase().replace(/\.$/, "");
  if (n.length < 3) return -1;
  return MONTHS.findIndex((m) => m.startsWith(n) || (n === "sept" && m === "september"));
}

/**
 * Reads typed dates: ISO, month/day[/year] (day first only when the month would be over 12), "Nov 10, 2026",
 * "10 Nov 2026", "2nd of November". A missing year is `defaultYear` (this year).
 * With `monthOnlyIsFirst` (default), a bare month ("Nov", "Nov 2026") means the 1st of that month.
 */
export function parseTypedDate(
  text: string,
  defaultYear: number = new Date().getFullYear(),
  monthOnlyIsFirst = true,
): Date | undefined {
  const t = text.trim().replace(/\s+/g, " ");
  if (!t) return undefined;
  const iso = parseISODate(t);
  if (iso) return iso;
  const yearOf = (s: string | undefined) => (s ? Number(s) : defaultYear);
  if (monthOnlyIsFirst) {
    const mo = /^([A-Za-z]+)\.?(?:,? ?(\d{4}))?$/.exec(t);
    if (mo) {
      const month = monthFromName(mo[1]);
      const year = yearOf(mo[2]);
      return month < 0 || year === undefined ? undefined : buildDate(year, month, 1);
    }
  }
  let m = /^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{4}))?$/.exec(t);
  if (m) {
    const year = yearOf(m[3]);
    if (year === undefined) return undefined;
    let month = Number(m[1]);
    let day = Number(m[2]);
    if (month > 12 && day <= 12) [month, day] = [day, month];
    return buildDate(year, month - 1, day);
  }
  m = /^([A-Za-z]+)\.? (\d{1,2})(?:st|nd|rd|th)?(?:,? ?(\d{4}))?$/.exec(t);
  if (m) {
    const month = monthFromName(m[1]);
    const year = yearOf(m[3]);
    return month < 0 || year === undefined ? undefined : buildDate(year, month, Number(m[2]));
  }
  m = /^(\d{1,2})(?:st|nd|rd|th)?(?: of)? ([A-Za-z]+)\.?(?:,? ?(\d{4}))?$/.exec(t);
  if (m) {
    const month = monthFromName(m[2]);
    const year = yearOf(m[3]);
    return month < 0 || year === undefined ? undefined : buildDate(year, month, Number(m[1]));
  }
  return undefined;
}
