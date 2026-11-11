import type { Metadata } from "next";
import { AccountSettings } from "@/features/account/AccountSettings";
import { getAccount } from "@/features/account/queries";

export const metadata: Metadata = { title: "Settings" };

// Your name and deleting your account. Email sending and alerts join this page when their backend lands
// (see docs/backend/settings.md).
export default async function SettingsRoute() {
  const account = await getAccount();
  return <AccountSettings account={account} />;
}
