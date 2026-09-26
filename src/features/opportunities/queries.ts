import { orgs, statusOf } from "@/app/admin/partners/_data/store";
import { SDC_ORG } from "./catalog";
import { effectiveStatus, keyDate } from "./format";
import { opportunities } from "./store";
import type { Actor, Opportunity, OpportunityCounts, OpportunityFilters, OpportunityTab, OrganizationRef } from "./types";

/*
 * Backend: implement these against the real data store, keeping names and return shapes.
 * Scope every read by the actor: partners only ever see their own organization.
 * Automatic expiry (format.ts effectiveStatus) should become a scheduled job or a query-time rule.
 */

const TAB_OF = { draft: "drafts", live: "live", closed: "closed" } as const;

function withEffectiveStatus(o: Opportunity): Opportunity {
  const { status, closedReason } = effectiveStatus(o);
  return { ...o, status, closedReason };
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

/** Live: soonest date first, undated last. Drafts and closed: most recently updated first. */
function sortFor(tab: OpportunityTab) {
  return (a: Opportunity, b: Opportunity) => {
    if (tab === "live") {
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
  const counts: OpportunityCounts = { live: 0, drafts: 0, closed: 0 };
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

/** Live (not ended) opportunities for one organization; used by Partners. */
export function countLiveOpportunities(organizationId: string): number {
  return opportunities().filter((o) => o.organization.id === organizationId && effectiveStatus(o).status === "live").length;
}
