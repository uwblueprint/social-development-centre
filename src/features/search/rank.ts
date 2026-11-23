/*
 * Ranking for the search palette. Small on purpose: a few hundred people and a few dozen pages,
 * settings and emails fit in the browser, so matching is plain string work.
 *
 * Best first: the whole name, a whole word, the start of the name, the start of a later word, anywhere in a
 * word (3+ letters). A query of
 * several words matches when each starts a word in the name, in any order ("jo sm" finds "Joan Smith").
 * Accents and case are ignored, so "zoe" finds "Zoë".
 */

export interface Searchable {
  label: string;
  /** Other words that should find this, e.g. "notifications" for Email alerts. Never shown. */
  keywords?: readonly string[];
  /** Searched too, ranked a little lower than the label (e.g. an email address). */
  detail?: string;
}

export type Range = readonly [number, number];

export interface Ranked<T> {
  item: T;
  /** Where the query matched the label, for bolding. Null when only a keyword or the detail matched. */
  range: Range | null;
}

/**
 * Lower-case with accents off, one UTF-16 unit in for one out, so a range found in the result lines up
 * with the original text for bolding. Anything that wouldn't map to one unit stays as it is.
 */
export function normalize(text: string): string {
  let out = "";
  for (const unit of text.split("")) {
    const plain = unit.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
    out += plain.length === 1 ? plain : unit;
  }
  return out;
}

const SEPARATOR = /[\s.@_\-+/(),']/;

/** Word starts: the beginning, and after a space or punctuation (so "smith" starts a word in "j.smith@"). */
function wordStarts(text: string): number[] {
  const starts = [0];
  for (let i = 1; i < text.length; i++) {
    if (SEPARATOR.test(text[i - 1]) && !SEPARATOR.test(text[i])) starts.push(i);
  }
  return starts;
}

// A whole word ("jo" in "Jo Anderson") ranks above the start of a longer one ("jo" in "Joan").
const SCORE = { exact: 100, word: 90, prefix: 80, laterWord: 70, wordPrefix: 60, allWords: 50, substring: 30 } as const;
const endsWord = (text: string, end: number) => end === text.length || SEPARATOR.test(text[end]);

/** How well `query` (already normalized and trimmed) matches `text`, and where. 0 means no match. */
export function scoreText(text: string, query: string): { score: number; range: Range | null } {
  const t = normalize(text);
  if (!query) return { score: 0, range: null };
  if (t === query) return { score: SCORE.exact, range: [0, t.length] };
  if (t.startsWith(query))
    return { score: endsWord(t, query.length) ? SCORE.word : SCORE.prefix, range: [0, query.length] };

  const starts = wordStarts(t);
  const word = starts.find((i) => t.startsWith(query, i));
  if (word !== undefined) {
    const end = word + query.length;
    return { score: endsWord(t, end) ? SCORE.laterWord : SCORE.wordPrefix, range: [word, end] };
  }

  const parts = query.split(" ").filter(Boolean);
  if (parts.length > 1) {
    const firstAt = starts.find((i) => t.startsWith(parts[0], i));
    const all = parts.every((p) => starts.some((i) => t.startsWith(p, i)));
    if (all && firstAt !== undefined) return { score: SCORE.allWords, range: [firstAt, firstAt + parts[0].length] };
  }

  // Anywhere in a word only for queries of 3 or more letters: "an" inside every other name is noise.
  if (query.length >= 3) {
    const at = t.indexOf(query);
    if (at >= 0) return { score: SCORE.substring, range: [at, at + query.length] };
  }
  return { score: 0, range: null };
}

/** The best matches for `query`, best first, at most `limit`. An empty query matches nothing. */
export function rank<T extends Searchable>(items: readonly T[], query: string, limit = 5): Ranked<T>[] {
  const q = normalize(query).trim().replace(/\s+/g, " ");
  if (!q) return [];

  const scored: { item: T; range: Range | null; score: number }[] = [];
  for (const item of items) {
    const label = scoreText(item.label, q);
    // Keywords and details rank just below the same kind of match on the label.
    const keyword = Math.max(0, ...(item.keywords ?? []).map((k) => scoreText(k, q).score)) - 5;
    const detail = item.detail ? scoreText(item.detail, q).score - 10 : 0;
    const score = Math.max(label.score, keyword, detail);
    // Bold the label wherever it matched, even when a keyword ranked it higher.
    if (score > 0) scored.push({ item, score, range: label.range });
  }

  return scored
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.item.label.length - b.item.label.length ||
        a.item.label.localeCompare(b.item.label, "en", { sensitivity: "base" }),
    )
    .slice(0, limit)
    .map(({ item, range }) => ({ item, range }));
}
