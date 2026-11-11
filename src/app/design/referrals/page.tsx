import type { Metadata } from "next";
import { copy } from "./copy";
import { ReferralsPage } from "./ReferralsPage";

export const metadata: Metadata = { title: copy.pageTitle };

/** `?link=unknown` previews a link whose token is bad or missing. */
export default async function ReferralsDesign({ searchParams }: { searchParams: Promise<{ link?: string }> }) {
  const { link } = await searchParams;
  return <ReferralsPage unknownLink={link === "unknown"} />;
}
