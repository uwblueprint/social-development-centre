"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email"));
  const origin = (await headers()).get("origin");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });

  // Supabase's messages are technical ("Signups not allowed for otp"), so show plain copy and log the detail.
  if (error) {
    console.error("signInWithOtp failed:", error.message);
    redirect("/login?error=1");
  }
  redirect("/login?sent=1");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
