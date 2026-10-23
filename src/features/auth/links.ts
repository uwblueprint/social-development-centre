import "server-only";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Portal } from "./portals";

export async function emailSignInLink(email: string, portal: Portal, next?: string) {
  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const redirect = new URL("/auth/confirm", origin ?? undefined);
  redirect.searchParams.set("portal", portal);
  if (next) redirect.searchParams.set("next", next);
  return supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect.toString() } });
}
