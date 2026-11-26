import type { Metadata } from "next";
import { FromMember } from "@/features/emails/oneoff/FromMember";

export const metadata: Metadata = { title: "Email this member" };

export default function Page() {
  return <FromMember />;
}
