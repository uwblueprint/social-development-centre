import "server-only";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Portal } from "./portals";

export async function emailSignInLink(email: string, portal: Portal) {
  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  return supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/confirm?portal=${portal}` },
  });
}
