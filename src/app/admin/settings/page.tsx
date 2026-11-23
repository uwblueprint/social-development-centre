import type { Metadata } from "next";
import { AccountSettings } from "@/features/account/AccountSettings";
import { getAccount } from "@/features/account/queries";
import { listTiers } from "@/features/tiers/queries";

export const metadata: Metadata = { title: "Settings" };

// Your name, membership tiers and deleting your account. Email sending and alerts join this page when
// their backend lands (see docs/backend/settings.md).
export default async function SettingsRoute() {
  const [account, tiers] = await Promise.all([getAccount(), listTiers()]);
  return <AccountSettings account={account} tiers={tiers} />;
}
