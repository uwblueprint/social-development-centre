/** Presentation-only helpers for the Community UI. Not part of the backend contract. */

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
