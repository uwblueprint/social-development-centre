import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { partnerCopy as copy } from "../_copy";
import { OrganizationView } from "./_components/OrganizationView";
import { getMyOrganization } from "./_data/queries";

export const metadata: Metadata = { title: copy.organization.title };

export default async function Page() {
  const org = await getMyOrganization();
  if (!org) redirect("/login");
  return <OrganizationView org={org} />;
}
