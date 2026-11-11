import type { Metadata } from "next";
import { requireAdmin } from "@/features/auth/session";
import { AutomaticEmailScreen, blankEmail } from "@/features/automatic-emails/components/AutomaticEmails";
import { getFallbacks, listTagOptions } from "@/features/automatic-emails/queries";

export const metadata: Metadata = { title: "New automatic email" };

/** A blank email. Nothing is saved until the admin changes something, so leaving it untouched leaves no empty draft. */
export default async function NewAutomaticEmailRoute() {
  await requireAdmin();
  const [tags, fallbacks] = await Promise.all([listTagOptions(), getFallbacks()]);
  return <AutomaticEmailScreen email={blankEmail()} tags={tags} recipients={[]} fallbacks={fallbacks} />;
}
