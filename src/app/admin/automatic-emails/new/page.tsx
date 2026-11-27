import type { Metadata } from "next";
import { requireAdmin } from "@/features/auth/session";
import { AutomaticEmailScreen } from "@/features/automatic-emails/components/AutomaticEmails";
import { blankEmail } from "@/features/automatic-emails/model";
import { getFallbacks, listTagOptions } from "@/features/automatic-emails/queries";
import { getEmailFooter } from "@/features/email-footer/queries";

export const metadata: Metadata = { title: "New automatic email" };

/** A blank email. Nothing is saved until the admin changes something, so leaving it untouched leaves no empty draft. */
export default async function NewAutomaticEmailRoute() {
  await requireAdmin();
  const [tags, fallbacks, footer] = await Promise.all([listTagOptions(), getFallbacks(), getEmailFooter()]);
  return <AutomaticEmailScreen email={blankEmail()} tags={tags} recipients={[]} fallbacks={fallbacks} footer={footer} />;
}
