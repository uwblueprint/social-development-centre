import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireMember } from "@/features/auth/session";
import { WelcomeForm } from "@/features/welcome/WelcomeForm";

export const metadata: Metadata = { title: "Welcome to SDC" };

export default async function WelcomePage() {
  const member = await requireMember();
  if (member.hasAnsweredWelcome) redirect("/");
  return <WelcomeForm fullName={member.fullName ?? ""} />;
}
