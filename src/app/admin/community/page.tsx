import type { Metadata } from "next";
import { requireAdmin } from "@/features/auth/session";
import { PayingMembersPage } from "@/features/members/PayingMembersPage";
import { listPayingMembers } from "@/features/members/queries";

export const metadata: Metadata = { title: "Paying members" };

// Paying members only, until the full Community page (general and paying members) lands.
export default async function CommunityRoute() {
  await requireAdmin();
  const members = await listPayingMembers();
  return <PayingMembersPage members={members} />;
}
