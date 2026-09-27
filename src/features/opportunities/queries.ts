import { orgs, statusOf } from "@/app/admin/partners/_data/store";
import { SDC_ORG } from "./catalog";
import { effectiveStatus, keyDate } from "./format";
import { opportunities } from "./store";
import type {
  Actor,
  Opportunity,
  OpportunityCounts,
  OpportunityFilters,
  OpportunityTab,
  OrganizationFilterOption,
  OrganizationRef,
} from "./types";

/*
 * Backend: implement these against the real data store, keeping names and return shapes.
 * Scope every read by the actor: partners only ever see their own organization.
 * Automatic expiry (format.ts effectiveStatus) should become a scheduled job or a query-time rule.
 */

const TAB_OF = { draft: "drafts", published: "published", closed: "closed" } as const;

/** Adds automatic expiry, partner removal (format.ts effectiveStatus) and the organization's current name (organizations can be renamed). */
function withEffectiveStatus(o: Opportunity): Opportunity {
  const org = orgs().find((x) => x.id === o.organization.id);
  const { status, closedReason } = effectiveStatus(o, new Date(), org?.removedAt);
  return { ...o, status, closedReason, organization: org ? { id: org.id, name: org.name } : o.organization };
}

function visibleTo(actor: Actor) {
  return (o: Opportunity) => actor.role === "admin" || o.organization.id === actor.organizationId;
}

function matches(filters: Omit<OpportunityFilters, "tab">, actor: Actor) {
  const q = filters.q?.trim().toLowerCase();
  return (o: Opportunity) =>
    (!filters.kind || o.kind === filters.kind) &&
    (actor.role !== "admin" || !filters.organizationId || o.organization.id === filters.organizationId) &&
    (!q || o.title.toLowerCase().includes(q) || o.organization.name.toLowerCase().includes(q));
}

function scoped(actor: Actor, filters: Omit<OpportunityFilters, "tab">) {
  return opportunities().filter(visibleTo(actor)).map(withEffectiveStatus).filter(matches(filters, actor));
}

/** Published: soonest date first, undated last. Drafts and closed: most recently updated first. */
function sortFor(tab: OpportunityTab) {
  return (a: Opportunity, b: Opportunity) => {
    if (tab === "published") {
      const ka = keyDate(a) ?? "9999";
      const kb = keyDate(b) ?? "9999";
      if (ka !== kb) return ka < kb ? -1 : 1;
    }
    return b.updatedAt.localeCompare(a.updatedAt);
  };
}

export async function listOpportunities(actor: Actor, filters: OpportunityFilters): Promise<Opportunity[]> {
  return scoped(actor, filters)
    .filter((o) => TAB_OF[o.status] === filters.tab)
    .sort(sortFor(filters.tab));
}

/** Counts per tab for the same filters (search, type, organization). */
export async function getOpportunityCounts(actor: Actor, filters: Omit<OpportunityFilters, "tab">): Promise<OpportunityCounts> {
  const counts: OpportunityCounts = { published: 0, drafts: 0, closed: 0 };
  for (const o of scoped(actor, filters)) counts[TAB_OF[o.status]]++;
  return counts;
}

export async function getOpportunity(actor: Actor, id: string): Promise<Opportunity | null> {
  const o = opportunities().find((x) => x.id === id);
  return o && visibleTo(actor)(o) ? withEffectiveStatus(o) : null;
}

/** Organizations an admin can post as or filter by: SDC first, then current partners A–Z. */
export async function listPublisherOptions(): Promise<OrganizationRef[]> {
  const partners = orgs()
    .filter((o) => statusOf(o) !== "removed")
    .map((o) => ({ id: o.id, name: o.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return [SDC_ORG, ...partners];
}

/**
 * The admin list's Organization filter: SDC, current partners A–Z, then removed partners that still have
 * opportunities (A–Z), so admins can find a removed partner's listings.
 */
export async function listOrganizationFilterOptions(): Promise<OrganizationFilterOption[]> {
  const withListings = new Set(opportunities().map((o) => o.organization.id));
  const removed = orgs()
    .filter((o) => statusOf(o) === "removed" && withListings.has(o.id))
    .map((o) => ({ id: o.id, name: o.name, removed: true }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return [...(await listPublisherOptions()), ...removed];
}

/** Published (not ended or closed) opportunities for one organization; used by Partners. A removed partner has none. */
export function countPublishedOpportunities(organizationId: string): number {
  const removedAt = orgs().find((o) => o.id === organizationId)?.removedAt;
  return opportunities().filter(
    (o) => o.organization.id === organizationId && effectiveStatus(o, new Date(), removedAt).status === "published",
  ).length;
}

/** @deprecated Renamed to countPublishedOpportunities; kept until Partners switches over. */
export const countLiveOpportunities = countPublishedOpportunities;
