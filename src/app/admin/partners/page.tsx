import type { Metadata } from "next";
import { listOrganizationOptions, listPartnerPeople, listPartners } from "./_data/queries";
import { PartnersView } from "./_components/PartnersView";
import type { PartnerStatusFilter } from "./_data/types";

export const metadata: Metadata = { title: "Partners" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const view = params.view === "people" ? "people" : "organizations";
  const status: PartnerStatusFilter = params.status === "removed" ? "removed" : "active";
  const q = params.q?.trim() ?? "";

  // Both statuses load so an open panel survives its row moving (e.g. after Remove access).
  const [organizations, removedOrganizations, people, removedPeople, organizationOptions] = await Promise.all([
    listPartners("active", q),
    listPartners("removed", q),
    listPartnerPeople("active", q),
    listPartnerPeople("removed", q),
    listOrganizationOptions(),
  ]);

  return (
    <PartnersView
      view={view}
      status={status}
      q={q}
      organizations={organizations}
      removedOrganizations={removedOrganizations}
      people={people}
      removedPeople={removedPeople}
      organizationOptions={organizationOptions}
    />
  );
}
