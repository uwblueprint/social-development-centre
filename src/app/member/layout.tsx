import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MemberShell } from "@/features/feed/components/MemberShell";
import { getCurrentMember } from "./_data/session";

export const metadata: Metadata = {
  title: { template: "%s · Nexus", default: "Nexus" },
};

export default async function MemberLayout({ children }: LayoutProps<"/member">) {
  const member = await getCurrentMember();
  if (!member) redirect("/login");

  return (
    <MemberShell member={member} now={new Date().toISOString()}>
      {children}
    </MemberShell>
  );
}
