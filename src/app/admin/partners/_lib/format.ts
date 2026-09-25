/** Presentation-only helpers for the Partners UI. Not part of the backend contract. */

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

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

/** First 2 names joined, then "+N" for the rest, e.g. "Amara Okafor, Luis Romero +1". */
export function summarizeNames(names: string[]): string {
  if (names.length === 0) return "No contacts";
  const shown = names.slice(0, 2).join(", ");
  const rest = names.length - 2;
  return rest > 0 ? `${shown} +${rest}` : shown;
}
