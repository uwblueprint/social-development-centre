import { TOPIC_LABEL } from "@/features/opportunities/catalog";
import { daysUntil, keyDate } from "@/features/opportunities/format";
import type { AccessibilityFeature, Area, Opportunity, OpportunityKind, TopicId } from "@/features/opportunities/types";
import type { ExploreFilters, SortKey, WhenFilter } from "./types";

/*
 * Pure helpers shared by the server (queries.ts) and the client views. Recommendations and filters run
 * in the browser so choosing an interest or a filter answers instantly; the backend only has to supply
 * the open opportunities. `now` is the server's render time (ISO), which keeps "closes in 3 days" the
 * same on the server and in the browser.
 */

export const EMPTY_FILTERS: ExploreFilters = {
  q: "",
  kinds: [],
  topics: [],
  areas: [],
  when: "any",
  freeOnly: false,
  accessibility: [],
  sort: "best",
};

/** Whole days until a listing's key date, or undefined when it has none ("Ongoing", "Open until filled"). */
export function daysLeft(o: Opportunity, now: string): number | undefined {
  const ymd = keyDate(o);
  return ymd ? daysUntil(ymd, new Date(now)) : undefined;
}

export function matchedTopics(o: Opportunity, interests: TopicId[]): TopicId[] {
  return o.topics.filter((t) => interests.includes(t));
}

/** More shared topics rank higher; dates coming up soon break ties, so the top of the feed is also timely. */
export function score(o: Opportunity, interests: TopicId[], now: string): number {
  const days = daysLeft(o, now);
  const urgency = days === undefined ? 0 : days <= 3 ? 4 : days <= 7 ? 2 : days <= 14 ? 1 : 0;
  return matchedTopics(o, interests).length * 10 + urgency;
}

/** Soonest date first; listings without a date go last, newest first. */
function bySoonest(a: Opportunity, b: Opportunity) {
  const ka = keyDate(a);
  const kb = keyDate(b);
  if (ka && kb) return ka.localeCompare(kb) || byNewest(a, b);
  if (ka) return -1;
  if (kb) return 1;
  return byNewest(a, b);
}

function byNewest(a: Opportunity, b: Opportunity) {
  return (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt);
}

export interface ForYou {
  /** The single best match, shown large so the quickest path to a click is right at the top. */
  hero?: Opportunity;
  closingSoon: Opportunity[];
  rails: { topic: TopicId; label: string; items: Opportunity[] }[];
  /** True when at least one listing matches an interest. */
  hasMatches: boolean;
}

const RAIL_LIMIT = 10;
const CLOSING_SOON_DAYS = 7;

/**
 * The For you page: the best match, what's closing soon, then one row per interest. Each listing appears
 * once on the page (a listing with two of your topics sits in the first row that claims it).
 */
export function buildForYou(items: Opportunity[], interests: TopicId[], now: string): ForYou {
  const matches = items
    .filter((o) => matchedTopics(o, interests).length > 0)
    .sort((a, b) => score(b, interests, now) - score(a, interests, now) || bySoonest(a, b));
  const hero = matches[0];
  const used = new Set(hero ? [hero.id] : []);

  const closingSoon = items
    .filter((o) => {
      const days = daysLeft(o, now);
      return days !== undefined && days >= 0 && days <= CLOSING_SOON_DAYS && !used.has(o.id);
    })
    .sort((a, b) => score(b, interests, now) - score(a, interests, now) || bySoonest(a, b))
    .slice(0, RAIL_LIMIT)
    .sort(bySoonest);
  closingSoon.forEach((o) => used.add(o.id));

  const rails = interests.flatMap((topic) => {
    const rail = items.filter((o) => o.topics.includes(topic) && !used.has(o.id)).sort(bySoonest).slice(0, RAIL_LIMIT);
    rail.forEach((o) => used.add(o.id));
    return rail.length ? [{ topic, label: TOPIC_LABEL[topic], items: rail }] : [];
  });

  return { hero, closingSoon, rails, hasMatches: matches.length > 0 };
}

const windowDays: Record<Exclude<WhenFilter, "any">, number> = { week: 7, month: 30 };

function matchesFilters(o: Opportunity, f: ExploreFilters, now: string, skipKinds = false): boolean {
  if (!skipKinds && f.kinds.length && !f.kinds.includes(o.kind)) return false;
  if (f.topics.length && !o.topics.some((t) => f.topics.includes(t))) return false;
  const q = f.q.trim().toLowerCase();
  if (q) {
    const haystack = [o.title, o.summary, o.organization.name, ...o.topics.map((t) => TOPIC_LABEL[t])].join(" ").toLowerCase();
    if (!q.split(/\s+/).every((word) => haystack.includes(word))) return false;
  }
  if (f.when !== "any") {
    const days = daysLeft(o, now);
    if (days === undefined || days < 0 || days > windowDays[f.when]) return false;
  }
  // Petitions and other asks have no place, so a place filter never hides them.
  if (f.areas.length && (o.kind === "event" || o.kind === "volunteer" || o.kind === "job")) {
    const area = o.details.area;
    if (!area || !f.areas.includes(area)) return false;
  }
  if (f.freeOnly && o.kind === "event" && o.details.cost === "paid") return false;
  if (f.accessibility.length) {
    if (o.kind !== "event") return false;
    const offered = o.details.accessibility ?? [];
    if (!f.accessibility.every((a) => offered.includes(a))) return false;
  }
  return true;
}

export function applyFilters(items: Opportunity[], f: ExploreFilters, interests: TopicId[], now: string): Opportunity[] {
  const out = items.filter((o) => matchesFilters(o, f, now));
  if (f.sort === "newest") return out.sort(byNewest);
  if (f.sort === "soonest") return out.sort(bySoonest);
  return out.sort((a, b) => score(b, interests, now) - score(a, interests, now) || bySoonest(a, b));
}

/** How many listings each type would show with every other filter applied, for the type chips. */
export function kindCounts(items: Opportunity[], f: ExploreFilters, now: string): Partial<Record<OpportunityKind, number>> {
  const counts: Partial<Record<OpportunityKind, number>> = {};
  for (const o of items) if (matchesFilters(o, f, now, true)) counts[o.kind] = (counts[o.kind] ?? 0) + 1;
  return counts;
}

/** Filters behind the Filters button (the search box and type chips are always visible, so they don't count). */
export function sheetFilterCount(f: ExploreFilters): number {
  return f.topics.length + f.areas.length + f.accessibility.length + (f.when !== "any" ? 1 : 0) + (f.freeOnly ? 1 : 0);
}

export function hasAnyFilter(f: ExploreFilters): boolean {
  return sheetFilterCount(f) > 0 || f.kinds.length > 0 || f.q.trim() !== "";
}

type Params = Record<string, string | string[] | undefined>;

const list = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v : (v ?? "").split(",")).map((s) => s.trim()).filter(Boolean);

/** Reads the Explore URL. Unknown values are dropped, so a stale or hand-edited link still opens. */
export function parseFilters(params: Params, valid: { kinds: string[]; topics: string[]; areas: string[]; accessibility: string[] }): ExploreFilters {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const when = one(params.when);
  const sort = one(params.sort);
  return {
    q: one(params.q).slice(0, 80),
    kinds: list(params.kind).filter((k) => valid.kinds.includes(k)) as OpportunityKind[],
    topics: list(params.topic).filter((t) => valid.topics.includes(t)) as TopicId[],
    areas: list(params.area).filter((a) => valid.areas.includes(a)) as Area[],
    when: when === "week" || when === "month" ? when : "any",
    freeOnly: one(params.free) === "1",
    accessibility: list(params.access).filter((a) => valid.accessibility.includes(a)) as AccessibilityFeature[],
    sort: (sort === "soonest" || sort === "newest" ? sort : "best") as SortKey,
  };
}

/** The Explore URL's query string for a set of filters; defaults are left out. */
export function filtersToQuery(f: ExploreFilters): string {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.kinds.length) p.set("kind", f.kinds.join(","));
  if (f.topics.length) p.set("topic", f.topics.join(","));
  if (f.areas.length) p.set("area", f.areas.join(","));
  if (f.when !== "any") p.set("when", f.when);
  if (f.freeOnly) p.set("free", "1");
  if (f.accessibility.length) p.set("access", f.accessibility.join(","));
  if (f.sort !== "best") p.set("sort", f.sort);
  return p.toString();
}
