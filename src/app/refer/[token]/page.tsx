import type { Metadata } from "next";
import { openLink } from "@/features/links/open";
import { Refer } from "@/features/links/Refer";
import { parseLinkToken } from "@/features/links/urls";

export const metadata: Metadata = { title: "Join SDC" };

/** A member's referral link. No sign-in: the token says who referred and from which email. */
export default async function ReferPage({ params }: PageProps<"/refer/[token]">) {
  const token = parseLinkToken((await params).token);
  const link = token ? await openLink(token, "referral") : null;
  return <Refer token={token ?? ""} referrerName={link ? link.firstName : undefined} />;
}
