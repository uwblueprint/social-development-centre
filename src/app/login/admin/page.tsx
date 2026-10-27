import type { Metadata } from "next";
import { SignIn } from "@/features/auth/SignIn";

export const metadata: Metadata = { title: "Admin sign in" };

export default async function AdminSignInPage({ searchParams }: PageProps<"/login/admin">) {
  const { error } = await searchParams;
  return <SignIn portal="admin" linkError={typeof error === "string" ? error : undefined} />;
}
