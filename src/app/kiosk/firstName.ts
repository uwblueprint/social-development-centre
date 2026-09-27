/** Leading titles skipped when greeting someone, compared lowercase with any trailing period removed. */
const HONORIFICS = new Set(["mr", "mrs", "ms", "mx", "miss", "dr", "prof", "rev", "sir", "madam", "fr", "sr"]);

/**
 * The name to greet someone by on the kiosk confirmation ("You're in, {firstName}!").
 * Trims; reads "Last, First" as First; skips leading honorifics (case-insensitive, with or without a
 * period); takes the first remaining word. Capitalizes its first letter only when the whole input was
 * lowercase, so "de la Cruz" style names typed with care are left alone. Falls back to the full input.
 * Examples: docs/decisions/kiosk.md, "Greeting by first name".
 */
export function firstName(input: string): string {
  const full = input.trim();
  if (!full) return full;

  const comma = full.indexOf(",");
  const afterComma = comma >= 0 ? full.slice(comma + 1).trim() : "";
  const given = afterComma || (comma >= 0 ? full.slice(0, comma).trim() : full);

  const words = given.split(/\s+/).filter(Boolean);
  const first = words.find((word) => !HONORIFICS.has(word.toLowerCase().replace(/\.$/, "")));
  if (!first) return full;

  const allLowercase = full === full.toLowerCase() && full !== full.toUpperCase();
  return allLowercase ? first.charAt(0).toUpperCase() + first.slice(1) : first;
}
