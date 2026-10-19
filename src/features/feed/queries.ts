import { orgs } from "@/app/admin/partners/_data/store";
import { labRead } from "@/dev/state-lab/state"; // STATE LAB (disposable)
import { effectiveStatus } from "@/features/opportunities/format";
import { opportunities } from "@/features/opportunities/store";
import type { Opportunity } from "@/features/opportunities/types";
import type { Availability, KnownOpportunity } from "./types";

/*
 * Backend: implement these against the real data store, keeping names and return shapes.
 * The feed only ever shows effective-published listings, which already leaves out drafts, ended and
 * closed listings and every listing of a removed partner (src/features/opportunities/format.ts).
 * Nothing here is scoped to the member beyond being signed in: every paying member sees every opportunity.
 */

const DAY = 86_400_000;
/** Days a removed partner's listing stays viewable to people who already opened it. docs/backend/opportunities.md#removed-partners. */
const REMOVED_GRACE_DAYS = 30;

function withOrganizationName(o: Opportunity): Opportunity {
  const org = orgs().find((x) => x.id === o.organization.id);
  return org ? { ...o, organization: { id: org.id, name: org.name } } : o;
}

/** Every opportunity a member can act on right now, in no particular order: the views sort and filter in the browser. */
export async function listOpenOpportunities(): Promise<Opportunity[]> {
  await labRead(); // STATE LAB (disposable)
  const now = new Date();
  return opportunities()
    .filter((o) => {
      const removedAt = orgs().find((x) => x.id === o.organization.id)?.removedAt;
      return effectiveStatus(o, now, removedAt).status === "published";
    })
    .map(withOrganizationName);
}

function availabilityOf(o: Opportunity, now: Date): Availability {
  const removedAt = orgs().find((x) => x.id === o.organization.id)?.removedAt;
  const { status, closedReason } = effectiveStatus(o, now, removedAt);
  if (status === "published") return "open";
  if (closedReason === "ended") return "ended";
  if (closedReason === "partner_removed" && removedAt && now.getTime() - new Date(removedAt).getTime() > REMOVED_GRACE_DAYS * DAY) {
    return "unavailable";
  }
  return "closed";
}

/**
 * Every listing that has been published, open or not, so Your opportunities can still show something
 * a member opened that has since ended or closed. The browser picks out the ones the member opened.
 * Backend: replace with a query over the member's opened ids.
 */
export async function listKnownOpportunities(): Promise<KnownOpportunity[]> {
  await labRead(); // STATE LAB (disposable)
  const now = new Date();
  return opportunities()
    .filter((o) => o.status !== "draft")
    .map((o) => ({ opportunity: withOrganizationName(o), availability: availabilityOf(o, now) }));
}
