import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireMember } from "@/features/auth/session";
import { SurveyFlow } from "@/features/welcome/components/SurveyFlow";
import { surveyCopy } from "@/features/welcome/copy";

export const metadata: Metadata = { title: `${surveyCopy.title} · SDC` };

/**
 * The welcome survey, answered once after a member's first sign-in. `/` sends people here while
 * `hasAnsweredWelcome` is false, so this page only has to turn them away once it is true.
 *
 * The email comes from the session and is shown as read-only context: a forwarded link cannot file
 * answers under someone else.
 */
export default async function WelcomePage() {
  const member = await requireMember();
  if (member.hasAnsweredWelcome) redirect("/");

  return <SurveyFlow email={member.email} initialName={member.fullName ?? ""} />;
}
