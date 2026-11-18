import type { Metadata } from "next";
import { copy } from "@/features/referrals/copy";
import { DemoReferPage } from "./DemoReferPage";

export const metadata: Metadata = { title: copy.pageTitle };

/** The real referral page on demo data. `?link=unknown` previews a link whose token is bad or missing. */
export default async function ReferralsDesign({ searchParams }: { searchParams: Promise<{ link?: string }> }) {
  const { link } = await searchParams;
  return <DemoReferPage unknownLink={link === "unknown"} />;
}
