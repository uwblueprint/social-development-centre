import { KINDS } from "../catalog";
import type { OpportunityFilters, OpportunityKind, OpportunityTab } from "../types";

type RawParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

/** Reads the list's URL params (?tab, q, kind, org) into a tab and filters; unknown values fall back to defaults. */
export function parseListParams(
  params: RawParams,
  { allowOrganization = true }: { allowOrganization?: boolean } = {},
): { tab: OpportunityTab; filters: Omit<OpportunityFilters, "tab"> } {
  const rawTab = first(params.tab);
  const tab: OpportunityTab = rawTab === "drafts" || rawTab === "closed" ? rawTab : "live";
  const rawKind = first(params.kind);
  const kind = KINDS.includes(rawKind as OpportunityKind) ? (rawKind as OpportunityKind) : undefined;
  const org = allowOrganization ? first(params.org) : undefined;
  return { tab, filters: { q: first(params.q), kind, organizationId: org } };
}
