/*
 * The last few results opened from the palette, in this browser only (logins can be shared, so nothing
 * per account). Storage can be missing or full (private windows, blocked site data): then there are
 * simply no recents.
 */

export type ResultKind = "page" | "setting" | "person" | "email";

export interface RecentResult {
  kind: ResultKind;
  /** The page's href, the setting's key, or the person's or email's id. */
  id: string;
  /** Shown while the people and emails lists load; replaced by the live name once they have. */
  label: string;
}

const KEY = "potluck:search-recent";
const MAX = 5;

export function readRecent(): RecentResult[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isRecent).slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function saveRecent(result: RecentResult) {
  const next = [result, ...readRecent().filter((r) => !(r.kind === result.kind && r.id === result.id))].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Not saved; the palette works the same without recents.
  }
}

function isRecent(value: unknown): value is RecentResult {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  return (
    ["page", "setting", "person", "email"].includes(r.kind as string) &&
    typeof r.id === "string" &&
    typeof r.label === "string"
  );
}
