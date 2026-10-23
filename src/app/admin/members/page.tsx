import type { Metadata } from "next";
import { requireAdmin } from "@/features/auth/session";
import { MembersPage } from "@/features/members/MembersPage";
import { listMembers } from "@/features/members/queries";

export const metadata: Metadata = { title: "Members" };

// A plain list until the Member Directory (tags, unsubscribes, email history) lands.
export default async function CommunityRoute() {
  await requireAdmin();
  const members = await listMembers();
  return <MembersPage members={members} />;
}
