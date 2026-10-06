import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PartnerShell } from "./_components/PartnerShell";
import { getCurrentPartner } from "./_data/session";

export const metadata: Metadata = {
  title: { template: "%s · Nexus", default: "Nexus" },
};

export default async function PartnerLayout({ children }: LayoutProps<"/partner">) {
  const user = await getCurrentPartner();
  if (!user) redirect("/login/partner");

  return <PartnerShell user={user}>{children}</PartnerShell>;
}
