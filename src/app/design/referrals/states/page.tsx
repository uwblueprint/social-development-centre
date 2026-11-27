import type { Metadata } from "next";
import { ReferStates } from "../ReferDesign";

export const metadata: Metadata = { title: "Referral form states" };

/** Every state and edge case of the referral form, each as a live card. See /design/referrals for the page. */
export default function ReferralStatesDesign() {
  return <ReferStates />;
}
