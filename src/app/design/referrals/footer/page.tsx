import type { Metadata } from "next";
import { FooterDesign } from "./FooterDesign";

export const metadata: Metadata = { title: "Email footer: Invite a friend" };

/** The Refer a friend line in every member email's footer, with copy options for the PM. */
export default function ReferralFooterDesign() {
  return <FooterDesign />;
}
