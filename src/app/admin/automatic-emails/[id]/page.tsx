import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/features/auth/session";
import { AutomaticEmailScreen } from "@/features/automatic-emails/components/AutomaticEmails";
import { displayName } from "@/features/automatic-emails/model";
import { getAutomaticEmail, getFallbacks, listTagOptions } from "@/features/automatic-emails/queries";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: PageProps<"/admin/automatic-emails/[id]">): Promise<Metadata> {
  const { id } = await params;
  const page = UUID.test(id) ? await getAutomaticEmail(id) : null;
  return { title: page ? displayName(page.email) : "Automatic emails" };
}

export default async function AutomaticEmailRoute({ params }: PageProps<"/admin/automatic-emails/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const [page, tags, fallbacks] = await Promise.all([getAutomaticEmail(id), listTagOptions(), getFallbacks()]);
  if (!page) notFound();
  return <AutomaticEmailScreen email={page.email} tags={tags} recipients={page.recipients} fallbacks={fallbacks} />;
}
