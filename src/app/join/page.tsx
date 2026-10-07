import type { Metadata } from "next";
import { SurveyFlow } from "@/features/survey/components/SurveyFlow";
import { surveyCopy } from "@/features/survey/copy";

export const metadata: Metadata = { title: `${surveyCopy.title} · SDC` };

const clean = (value: string | string[] | undefined, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

/**
 * Ride for Refuge membership survey. Public, no sign-in. The invitation email can prefill the contact
 * step with ?name= and ?email= (Mailchimp merge tags); both stay visible and editable.
 */
export default async function JoinPage({ searchParams }: PageProps<"/join">) {
  const { name, email } = await searchParams;
  return <SurveyFlow initialName={clean(name, 120)} initialEmail={clean(email, 254)} />;
}
