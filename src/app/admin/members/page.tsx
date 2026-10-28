import type { Metadata } from "next";
import { requireAdmin } from "@/features/auth/session";
import { localDay } from "@/features/members/directory/dates";
import { MemberDirectory } from "@/features/members/directory/MemberDirectory";
import { listMembers, listTags } from "@/features/members/queries";

export const metadata: Metadata = { title: "Members" };

export default async function MembersRoute() {
  await requireAdmin();
  const [members, tags] = await Promise.all([listMembers(), listTags()]);
  // "Today" in Waterloo Region, from the server, so the server and browser agree on dates near midnight.
  return <MemberDirectory members={members} tags={tags} today={localDay(new Date())} />;
}
