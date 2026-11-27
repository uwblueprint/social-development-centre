import type { Metadata } from "next";
import { MemberReferrals } from "./MemberReferrals";

export const metadata: Metadata = { title: "Maya Patel · Members" };

/** One member's profile in the Member Directory, showing the admin side of Referrals. */
export default function MemberReferralsDesign() {
  return <MemberReferrals />;
}
