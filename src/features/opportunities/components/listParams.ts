import { KINDS } from "../catalog";
import type { OpportunityFilters, OpportunityKind, OpportunitySortKey, OpportunityTab } from "../types";

type RawParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

/** "event,job" → ["event", "job"]; the column filters write several values comma-separated. */
const list = (v: string | string[] | undefined) =>
  (first(v) ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

const SORT_KEYS: OpportunitySortKey[] = ["title", "organization", "date", "updated"];

/** The tab's default order, used when the URL has no `sort`. */
export function defaultSort(tab: OpportunityTab) {
  return tab === "published" ? ({ key: "date", direction: "asc" } as const) : ({ key: "updated", direction: "desc" } as const);
}

/**
 * Reads the list's URL params (?tab, q, kind, org, sort, dir) into a tab and filters; unknown values
 * fall back to defaults. `kind` and `org` hold comma-separated values.
 */
export function parseListParams(
  params: RawParams,
  { allowOrganization = true }: { allowOrganization?: boolean } = {},
): { tab: OpportunityTab; filters: Omit<OpportunityFilters, "tab"> } {
  const rawTab = first(params.tab);
  const tab: OpportunityTab = rawTab === "drafts" || rawTab === "closed" ? rawTab : "published";
  const kinds = list(params.kind).filter((k): k is OpportunityKind => KINDS.includes(k as OpportunityKind));
  const organizationIds = allowOrganization ? list(params.org) : [];
  const rawSort = first(params.sort) as OpportunitySortKey | undefined;
  const sortKey = rawSort && SORT_KEYS.includes(rawSort) && (allowOrganization || rawSort !== "organization") ? rawSort : undefined;
  const sort = sortKey ? { key: sortKey, direction: first(params.dir) === "desc" ? ("desc" as const) : ("asc" as const) } : undefined;
  return { tab, filters: { q: first(params.q), kinds, organizationIds, sort } };
}
