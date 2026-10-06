import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OpportunitiesView } from "@/features/opportunities/components/OpportunitiesView";
import { copy } from "@/features/opportunities/copy";
import { parseListParams } from "@/features/opportunities/components/listParams";
import { getFilterCounts, getOpportunity, getOpportunityCounts, listOpportunities, listOrganizationFilterOptions } from "@/features/opportunities/queries";
import type { Actor } from "@/features/opportunities/types";
import { getCurrentAdmin } from "../_data/session";
import {
  closeOpportunity,
  deleteOpportunity,
  duplicateOpportunity,
  reopenOpportunity,
  saveOpportunity,
} from "./_data/actions";

export const metadata: Metadata = { title: copy.page.title };

export default async function Page({ searchParams }: PageProps<"/admin/opportunities">) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login/admin");
  const actor: Actor = { role: "admin", name: admin.name };

  const params = await searchParams;
  const { tab, filters } = parseListParams(params);
  const [items, counts, filterCounts, organizations] = await Promise.all([
    listOpportunities(actor, { tab, ...filters }),
    getOpportunityCounts(actor, filters),
    getFilterCounts(actor, { tab, ...filters }),
    listOrganizationFilterOptions(),
  ]);
  // ?opportunity=<id> opens that listing's panel (shareable); one the actor can't see is ignored.
  const linkedId = typeof params.opportunity === "string" ? params.opportunity : undefined;
  const linked = linkedId ? ((await getOpportunity(actor, linkedId)) ?? undefined) : undefined;

  return (
    <OpportunitiesView
      scope="admin"
      basePath="/admin/opportunities"
      tab={tab}
      filters={filters}
      items={items}
      counts={counts}
      filterCounts={filterCounts}
      now={new Date().toISOString()}
      linked={linked}
      organizations={organizations}
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
