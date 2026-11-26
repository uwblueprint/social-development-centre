import type { Metadata } from "next";
import { requireAdmin } from "@/features/auth/session";
import { listSignupLinks } from "@/features/signup-links/queries";
import { SignupLinksPage } from "@/features/signup-links/SignupLinksPage";

export const metadata: Metadata = { title: "Signup links" };

export default async function SignupLinksRoute() {
  await requireAdmin();
  const links = await listSignupLinks();
  return <SignupLinksPage links={links} />;
}
