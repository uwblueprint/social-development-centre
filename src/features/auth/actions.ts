"use server";

import { redirect } from "next/navigation";
import { normalizeEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { createSecretClient } from "@/lib/supabase/secret";
import { finishSignIn } from "./finish";
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

  // With the secret key once it's set; until then the public key, which can_sign_in allows until
  // supabase/migrations/20261023000200_can_sign_in_server_only.sql is applied.
  const db = createSecretClient() ?? (await createClient());
  const { data: allowed, error } = await db.rpc("can_sign_in", { p_email: email, p_portal: portal });
  if (error) {
    console.error("can_sign_in failed:", error.message);
    return "failed";
  }
  if (!allowed) return portal === "admin" ? "sent" : "not-allowed";

  const { error: sendError } = await emailSignInLink(email, portal, portal === "admin" ? safeAdminPath(next) : undefined);
  if (sendError) {
    console.error("Sign-in email failed:", sendError.code ?? sendError.message);
    // On the admin page a failure would differ from the answer an unknown email gets, so it would
    // reveal that this email is an admin. Answer the same; the error is in the logs.
    return portal === "admin" ? "sent" : "failed";
  }
  return "sent";
}

export type CodeResult = "invalid-code" | "wrong-code" | "failed";

/**
 * The 6-digit code from the sign-in email, for when the link opens on another device or an email
 * scanner used it up. Signs them in and redirects, or says why it didn't work.
 */
export async function signInWithCode(portal: Portal, input: string, code: string, next?: string): Promise<CodeResult> {
  const email = normalizeEmail(input);
  const token = code.replace(/\s/g, "");
  if (!email || !isPortal(portal) || !/^\d{6,10}$/.test(token)) return "invalid-code";

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) {
    // Supabase answers the same for a wrong code and an expired one.
    console.error("Sign-in code failed:", error.code ?? error.message);
    return error.code === "otp_expired" ? "wrong-code" : "failed";
  }
  const destination = await finishSignIn(supabase, portal, next);
  if (!destination) return "failed";
  redirect(destination);
}

export async function signOut(portal: Portal) {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect(portals[isPortal(portal) ? portal : "member"].signInPath);
}
