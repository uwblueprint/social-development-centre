import type { Metadata } from "next";
import { PageLoading } from "@/components/patterns/PageLoading";
import { demoSignupLinks } from "@/features/signup-links/data";
import { SignupLinksPage } from "@/features/signup-links/SignupLinksPage";

export const metadata: Metadata = { title: "Signup links" };

/** Preview the other states with ?state=empty or ?state=loading. */
export default async function SignupLinksDesign({ searchParams }: PageProps<"/design/signup-links">) {
  const { state } = await searchParams;
  if (state === "loading") return <PageLoading title="Signup links" />;
  return <SignupLinksPage initialLinks={state === "empty" ? [] : demoSignupLinks} />;
}
