import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { partnerCopy as copy } from "../_copy";
import { getCurrentPartner } from "../_data/session";
import { OrganizationView } from "./_components/OrganizationView";
import { getMyOrganization } from "./_data/queries";

export const metadata: Metadata = { title: copy.organization.title };

export default async function Page() {
  const [partner, org] = await Promise.all([getCurrentPartner(), getMyOrganization()]);
  if (!partner || !org) redirect("/login/partner");
  return <OrganizationView org={org} currentContactId={partner.contactId} />;
}
