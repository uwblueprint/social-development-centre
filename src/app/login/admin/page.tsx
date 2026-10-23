import type { Metadata } from "next";
import { SignIn } from "@/features/auth/SignIn";

export const metadata: Metadata = { title: "Admin sign in" };

export default async function AdminSignInPage({ searchParams }: PageProps<"/login/admin">) {
  const { error, next } = await searchParams;
  return (
    <SignIn
      portal="admin"
      linkError={typeof error === "string" ? error : undefined}
      next={typeof next === "string" ? next : undefined}
    />
  );
}
