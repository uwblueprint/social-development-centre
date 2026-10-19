import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { feedCopy } from "@/features/feed/copy";
import { ForYouView } from "@/features/feed/components/ForYouView";
import { listOpenOpportunities } from "@/features/feed/queries";
import { getCurrentMember } from "../_data/session";

export const metadata: Metadata = { title: feedCopy.forYou.title };

export default async function Page() {
  if (!(await getCurrentMember())) redirect("/login");
  return <ForYouView items={await listOpenOpportunities()} />;
}
