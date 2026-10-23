"use server";

import { redirect } from "next/navigation";
import { normalizeEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { emailSignInLink } from "./links";
import { isPortal, portals, safeAdminPath, type Portal } from "./portals";

export type SignInResult = "sent" | "invalid-email" | "not-allowed" | "failed";

/**
 * `next` is where an admin was going when they were asked to sign in. The admin page answers the same
 * way whether or not the email has access, so it doesn't reveal who the admins are.
 */
export async function sendSignInLink(portal: Portal, input: string, next?: string): Promise<SignInResult> {
  const email = normalizeEmail(input);
  if (!email) return "invalid-email";
  if (!isPortal(portal)) return "failed";

  const supabase = await createClient();
  const { data: allowed, error } = await supabase.rpc("can_sign_in", { p_email: email, p_portal: portal });
  if (error) {
    console.error("can_sign_in failed:", error.message);
    return "failed";
  }
  if (!allowed) return portal === "admin" ? "sent" : "not-allowed";

  const { error: sendError } = await emailSignInLink(email, portal, portal === "admin" ? safeAdminPath(next) : undefined);
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
