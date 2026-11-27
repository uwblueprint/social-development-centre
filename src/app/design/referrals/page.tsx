import type { Metadata } from "next";
import { copy } from "./copy";
import { ReferDesign } from "./ReferDesign";

export const metadata: Metadata = { title: copy.pageTitle };

/**
 * The member's Refer a friend page on demo data, on the split layout. `?link=unknown` previews a link
 * whose token is bad or missing. The photo is a banner above the form; `?layout=split` puts it beside the
 * form instead. It defaults to the Figma design; `?panel=hex` and `?panel=overlay` show the two earlier
 * versions. See data.ts for emails that trigger each result.
 * Related screens: /design/referrals/footer (the email footer) and /design/members (the admin side).
 */
export default async function ReferralsDesign({ searchParams }: {
  searchParams: Promise<{ link?: string; panel?: string; layout?: string }>;
}) {
  const { link, panel, layout } = await searchParams;
  return (
    <ReferDesign
      unknownLink={link === "unknown"}
      panel={panel === "overlay" || panel === "hex" ? panel : "figma"}
      layout={layout === "split" ? "split" : "banner"}
    />
  );
}
