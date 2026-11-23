import type { Metadata } from "next";
import "@fontsource/coming-soon/400.css";
import "@fontsource-variable/nunito/wght.css";
import { IntakeForm } from "@/features/intake/components/IntakeForm";
import { intakeForms } from "@/features/intake/copy";
import { parseUuid } from "@/features/referrals/types";

export const metadata: Metadata = { title: `${intakeForms["sdc-members"].title} · SDC` };

/** `?r=<referral id>` is a friend's referral link (docs/backend/referrals.md). */
export default async function SdcMembersIntakePage({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const referralId = parseUuid((await searchParams).r);
  return <IntakeForm source="sdc-members" referralId={referralId} />;
}
