import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { portals } from "@/features/auth/portals";
import { requireMember } from "@/features/auth/session";
import { getMyTierId, listOfferedTiers } from "@/features/tiers/queries";
import { TierPicker } from "@/features/tiers/TierPicker";

export const metadata: Metadata = { title: "Choose your tier" };

// A member picks a tier once. Anyone who already has one is sent home, so this page is never shown again.
export default async function TiersPage() {
  await requireMember();
  if ((await getMyTierId()) !== null) redirect(portals.member.homePath);
  return <TierPicker tiers={await listOfferedTiers()} />;
}
