import type { Metadata } from "next";
import { AccountSettings } from "@/features/account/AccountSettings";
import { getAccount } from "@/features/account/queries";
import { getEmailFooter } from "@/features/email-footer/queries";

export const metadata: Metadata = { title: "Settings" };

// Your name, the email footer and deleting your account. Reply-to and alerts join this page when their
// backend lands (see docs/backend/settings.md).
export default async function SettingsRoute() {
  const [account, footer] = await Promise.all([getAccount(), getEmailFooter()]);
  return <AccountSettings account={account} footer={footer} />;
}
