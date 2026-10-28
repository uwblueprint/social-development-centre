import type { Metadata } from "next";
/* The letter's typefaces, loaded here so the rest of the app keeps Switzer. */
import "@fontsource/coming-soon/400.css";
import "@fontsource-variable/nunito/wght.css";
import { IntakeForm } from "@/features/intake/components/IntakeForm";
import { intakeCopy } from "@/features/intake/copy";
import { openLink } from "@/features/links/open";
import { parseLinkToken } from "@/features/links/urls";

export const metadata: Metadata = { title: `${intakeCopy.title} · SDC` };

/**
 * The Ride for Refuge intake form, open to anyone with the link. There is no sign-in: the person's
 * name and email are the form's first step, and every answer is stored in one
 * `intake_submissions` row. See docs/decisions/intake-form.md.
 *
 * A personal link (`?t=<token>`, one per email) also says who is filling it in: opening it is logged,
 * and the submission is attributed to that person. An unknown token just gets the open form.
 */
export default async function IntakeFormPage({ searchParams }: PageProps<"/intake-form">) {
  const token = parseLinkToken((await searchParams).t);
  return <IntakeForm linkToken={token && (await openLink(token, "intake")) ? token : undefined} />;
}
