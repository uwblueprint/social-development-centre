import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OpportunitiesView } from "@/features/opportunities/components/OpportunitiesView";
import { copy } from "@/features/opportunities/copy";
import { parseListParams } from "@/features/opportunities/components/listParams";
import { getOpportunityCounts, listOpportunities, listPublisherOptions } from "@/features/opportunities/queries";
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
  if (!admin) redirect("/login");
  const actor: Actor = { role: "admin", name: admin.name };

  const { tab, filters } = parseListParams(await searchParams);
  const [items, counts, organizations] = await Promise.all([
    listOpportunities(actor, { tab, ...filters }),
    getOpportunityCounts(actor, filters),
    listPublisherOptions(),
  ]);

  return (
    <OpportunitiesView
      scope="admin"
      basePath="/admin/opportunities"
      tab={tab}
      filters={filters}
      items={items}
      counts={counts}
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
