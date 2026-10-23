import type { Metadata } from "next";
import { SignIn } from "@/features/auth/SignIn";

export const metadata: Metadata = { title: "Sign in to SDC" };

export default async function MemberSignInPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  return <SignIn portal="member" linkError={typeof error === "string" ? error : undefined} />;
}
