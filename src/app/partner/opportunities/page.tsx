import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OpportunitiesView } from "@/features/opportunities/components/OpportunitiesView";
import { copy } from "@/features/opportunities/copy";
import { parseListParams } from "@/features/opportunities/components/listParams";
import { getFilterCounts, getOpportunity, getOpportunityCounts, listOpportunities } from "@/features/opportunities/queries";
import type { Actor } from "@/features/opportunities/types";
import { getCurrentPartner } from "../_data/session";
import {
  closeOpportunity,
  deleteOpportunity,
  duplicateOpportunity,
  reopenOpportunity,
  saveOpportunity,
} from "./_data/actions";

export const metadata: Metadata = { title: copy.page.title };

export default async function Page({ searchParams }: PageProps<"/partner/opportunities">) {
  const partner = await getCurrentPartner();
  if (!partner) redirect("/login");
  const actor: Actor = { role: "partner", name: partner.name, organizationId: partner.organization.id };

  // Partners only ever see their own organization; an org param is ignored.
  const params = await searchParams;
  const { tab, filters } = parseListParams(params, { allowOrganization: false });
  const [items, counts, filterCounts] = await Promise.all([
    listOpportunities(actor, { tab, ...filters }),
    getOpportunityCounts(actor, filters),
    getFilterCounts(actor, { tab, ...filters }),
  ]);
  // ?opportunity=<id> opens that listing's panel (shareable); one the actor can't see is ignored.
  const linkedId = typeof params.opportunity === "string" ? params.opportunity : undefined;
  const linked = linkedId ? ((await getOpportunity(actor, linkedId)) ?? undefined) : undefined;

  return (
    <OpportunitiesView
      scope="partner"
      basePath="/partner/opportunities"
      tab={tab}
      filters={filters}
      items={items}
      counts={counts}
      filterCounts={filterCounts}
      now={new Date().toISOString()}
      linked={linked}
      actions={{
        save: saveOpportunity,
        close: closeOpportunity,
        reopen: reopenOpportunity,
        duplicate: duplicateOpportunity,
        remove: deleteOpportunity,
      }}
    />
  );
}
