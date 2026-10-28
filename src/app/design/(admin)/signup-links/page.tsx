import type { Metadata } from "next";
import { PageLoading } from "@/components/patterns/PageLoading";
import { demoSignupLinks } from "./data";
import { SignupLinksPage } from "./SignupLinksPage";

export const metadata: Metadata = { title: "Signup links" };

/** Preview the other states with ?state=empty or ?state=loading. */
export default async function SignupLinksDesign({ searchParams }: PageProps<"/design/signup-links">) {
  const { state, modal } = await searchParams;
  if (state === "loading") return <PageLoading title="Signup links" />;
  return <SignupLinksPage initialLinks={state === "empty" ? [] : demoSignupLinks} modal={typeof modal === "string" ? modal : undefined} />;
}
