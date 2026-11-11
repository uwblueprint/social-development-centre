import type { Metadata } from "next";
import { requireAdmin } from "@/features/auth/session";
import { AutomaticEmailsList } from "@/features/automatic-emails/components/AutomaticEmails";
import { listAutomaticEmails, listTagOptions } from "@/features/automatic-emails/queries";

export const metadata: Metadata = { title: "Automatic emails" };

export default async function AutomaticEmailsRoute() {
  await requireAdmin();
  const [emails, tags] = await Promise.all([listAutomaticEmails(), listTagOptions()]);
  return <AutomaticEmailsList emails={emails} tags={tags} />;
}
