import type { Metadata } from "next";
import { listOrganizationOptions, listPartnerPeople, listPartners, listPendingInvitations } from "./_data/queries";
import { PartnersView, type PartnersTab } from "./_components/PartnersView";

export const metadata: Metadata = { title: "Partners" };

function normalizeTab(value: string | undefined): PartnersTab {
  return value === "people" || value === "invitations" || value === "removed" ? value : "organizations";
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const params = await searchParams;
  const tab = normalizeTab(params.tab);
  const q = params.q?.trim() ?? "";

  const [organizations, removedOrganizations, people, invitations, organizationOptions] = await Promise.all([
    listPartners("current", q),
    listPartners("removed", q),
    listPartnerPeople(q),
    listPendingInvitations(q),
    listOrganizationOptions(),
  ]);

  return (
    <PartnersView
      tab={tab}
      q={q}
      organizations={organizations}
      removedOrganizations={removedOrganizations}
      people={people}
      invitations={invitations}
      organizationOptions={organizationOptions}
    />
  );
}
