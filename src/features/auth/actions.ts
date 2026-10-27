"use server";

import { redirect } from "next/navigation";
import { normalizeEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { emailSignInLink } from "./links";
import { isPortal, portals, type Portal } from "./portals";

export type SignInResult = "sent" | "invalid-email" | "not-allowed" | "failed";

export async function sendSignInLink(portal: Portal, input: string): Promise<SignInResult> {
  const email = normalizeEmail(input);
  if (!email) return "invalid-email";
  if (!isPortal(portal)) return "failed";

  const supabase = await createClient();
  const { data: allowed, error } = await supabase.rpc("can_sign_in", { p_email: email, p_portal: portal });
  if (error) {
    console.error("can_sign_in failed:", error.message);
    return "failed";
  }
  if (!allowed) return "not-allowed";

  const { error: sendError } = await emailSignInLink(email, portal);
  if (sendError) {
    console.error("Sign-in email failed:", sendError.code ?? sendError.message);
    return "failed";
  }
  return "sent";
}

export async function signOut(portal: Portal) {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect(portals[isPortal(portal) ? portal : "member"].signInPath);
}
