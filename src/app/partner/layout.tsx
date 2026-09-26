import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PartnerShell } from "./_components/PartnerShell";
import { getCurrentPartner } from "./_data/session";

export const metadata: Metadata = {
  title: { template: "%s · SDC Partner", default: "SDC Partner" },
};

export default async function PartnerLayout({ children }: LayoutProps<"/partner">) {
  const user = await getCurrentPartner();
  if (!user) redirect("/login");

  return <PartnerShell user={user}>{children}</PartnerShell>;
}
