import { orgs, statusOf } from "@/app/admin/partners/_data/store";
import { labRead } from "@/dev/state-lab/state"; // STATE LAB (disposable)
import { SDC_ORG } from "./catalog";
import { effectiveStatus, keyDate } from "./format";
import { opportunities } from "./store";
import type {
  Actor,
  Opportunity,
  OpportunityCounts,
  OpportunityFilterCounts,
  OpportunityFilters,
  OpportunitySort,
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
  const kinds = filters.kinds ?? [];
  const orgIds = actor.role === "admin" ? (filters.organizationIds ?? []) : [];
  return (o: Opportunity) =>
    (kinds.length === 0 || kinds.includes(o.kind)) &&
    (orgIds.length === 0 || orgIds.includes(o.organization.id)) &&
    (!q || o.title.toLowerCase().includes(q) || o.organization.name.toLowerCase().includes(q));
}

function scoped(actor: Actor, filters: Omit<OpportunityFilters, "tab">) {
  return opportunities().filter(visibleTo(actor)).map(withEffectiveStatus).filter(matches(filters, actor));
}

/**
 * Default order: published by soonest date first; drafts and closed by most recently updated first.
 * A chosen sort (a column header) replaces it. Undated listings go last either way; ties fall back to
 * most recently updated. Sent to and Clicks put listings that haven't been emailed last either way.
 */
function sortFor(tab: OpportunityTab, sort?: OpportunitySort) {
  const chosen: OpportunitySort = sort ?? (tab === "published" ? { key: "date", direction: "asc" } : { key: "updated", direction: "desc" });
  const sign = chosen.direction === "asc" ? 1 : -1;
  return (a: Opportunity, b: Opportunity) => {
    let order = 0;
    if (chosen.key === "title") order = sign * a.title.localeCompare(b.title);
    else if (chosen.key === "organization") order = sign * a.organization.name.localeCompare(b.organization.name);
    else if (chosen.key === "updated") order = sign * a.updatedAt.localeCompare(b.updatedAt);
    else if (chosen.key === "sentTo" || chosen.key === "clicks") {
      const ka = a.performance?.[chosen.key];
      const kb = b.performance?.[chosen.key];
      if (ka === undefined || kb === undefined) order = ka !== undefined ? -1 : kb !== undefined ? 1 : 0;
      else order = sign * (ka - kb);
    }
    else {
      const ka = keyDate(a);
      const kb = keyDate(b);
      if (!ka || !kb) order = ka ? -1 : kb ? 1 : 0;
      else order = sign * ka.localeCompare(kb);
    }
    return order || b.updatedAt.localeCompare(a.updatedAt);
  };
}

export async function listOpportunities(actor: Actor, filters: OpportunityFilters): Promise<Opportunity[]> {
  await labRead(); // STATE LAB (disposable)
  return scoped(actor, filters)
    .filter((o) => TAB_OF[o.status] === filters.tab)
    .sort(sortFor(filters.tab, filters.sort));
}

/**
 * Counts for the column filters in one tab: per type (with the search and organization filter applied)
 * and per organization (with the search and type filter applied), so each filter shows what choosing
 * a value would add.
 */
export async function getFilterCounts(actor: Actor, filters: OpportunityFilters): Promise<OpportunityFilterCounts> {
  const inTab = (f: Omit<OpportunityFilters, "tab">) => scoped(actor, f).filter((o) => TAB_OF[o.status] === filters.tab);
  const counts: OpportunityFilterCounts = { kinds: {}, organizations: {} };
  for (const o of inTab({ ...filters, kinds: [] })) counts.kinds[o.kind] = (counts.kinds[o.kind] ?? 0) + 1;
  if (actor.role === "admin") {
    for (const o of inTab({ ...filters, organizationIds: [] })) {
      counts.organizations[o.organization.id] = (counts.organizations[o.organization.id] ?? 0) + 1;
    }
  }
  return counts;
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

/**
 * Read-only, for Partners health (src/app/admin/partners/_data/health.ts): every opportunity an organization
 * has ever published, with when it was published and its effective status now (a removed partner's are closed).
 * Drafts that were never published are left out.
 */
export function listPublishedHistory(organizationId: string): { id: string; publishedAt: string; status: Opportunity["status"] }[] {
  const removedAt = orgs().find((o) => o.id === organizationId)?.removedAt;
  return opportunities()
    .filter((o) => o.organization.id === organizationId && o.publishedAt)
    .map((o) => ({ id: o.id, publishedAt: o.publishedAt as string, status: effectiveStatus(o, new Date(), removedAt).status }));
}
