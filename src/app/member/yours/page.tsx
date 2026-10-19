import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { YoursView } from "@/features/feed/components/YoursView";
import { feedCopy } from "@/features/feed/copy";
import { listKnownOpportunities } from "@/features/feed/queries";
import { getCurrentMember } from "../_data/session";

export const metadata: Metadata = { title: feedCopy.yours.title };

export default async function Page() {
  if (!(await getCurrentMember())) redirect("/login");
  return <YoursView known={await listKnownOpportunities()} />;
}
