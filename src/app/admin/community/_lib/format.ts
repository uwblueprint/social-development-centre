/** Presentation-only helpers for the Community UI. Not part of the backend contract. */

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/** Short relative time for table cells, e.g. "Today", "3d ago", "5mo ago". */
export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < DAY) return "Today";
  if (diff < 2 * DAY) return "Yesterday";
  if (diff < WEEK) return `${Math.floor(diff / DAY)}d ago`;
  if (diff < MONTH) return `${Math.floor(diff / WEEK)}w ago`;
  if (diff < YEAR) return `${Math.floor(diff / MONTH)}mo ago`;
  return `${Math.floor(diff / YEAR)}y ago`;
}

/** Initials for an avatar fallback: up to two letters from a name, or the email's first letter. */
export function initialsFor(name: string | undefined, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 1).toUpperCase();
}
