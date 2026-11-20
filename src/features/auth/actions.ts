"use server";

import { redirect } from "next/navigation";
import { normalizeEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { createSecretClient } from "@/lib/supabase/secret";
import { emailSignInLink } from "./links";
import { isPortal, portals, safeAdminPath, type Portal } from "./portals";

export type SignInResult = "sent" | "invalid-email" | "not-allowed" | "rate-limited" | "failed";

/**
 * `next` is where an admin was going when they were asked to sign in. The admin page answers "sent"
 * whether or not the email has access, so it doesn't reveal who the admins are.
 */
export async function sendSignInLink(portal: Portal, input: string, next?: string): Promise<SignInResult> {
  const email = normalizeEmail(input);
  if (!email) return "invalid-email";
  if (!isPortal(portal)) return "failed";

  // With the secret key once it's set; until then the public key, which can_sign_in allows until
  // supabase/migrations/20261023000200_can_sign_in_server_only.sql is applied.
  const db = createSecretClient() ?? (await createClient());
  const { data: allowed, error } = await db.rpc("can_sign_in", {
    p_email: email,
    p_portal: portal,
  });
  if (error) {
    console.error("can_sign_in failed:", error.message);
    return "failed";
  }
  if (!allowed) return portal === "admin" ? "sent" : "not-allowed";

  const { error: sendError } = await emailSignInLink(
    email,
    portal,
    portal === "admin" ? safeAdminPath(next) : undefined,
  );
  if (sendError) {
    console.error("Sign-in email failed:", sendError.code ?? sendError.message);
    // On the admin page any answer other than "sent" would differ from the one an unknown email gets,
    // and so reveal that this email is an admin. Answer the same; the error is in the logs.
    if (portal === "admin") return "sent";
    return isRateLimit(sendError) ? "rate-limited" : "failed";
  }
  return "sent";
}

function isRateLimit(error: { code?: string; status?: number }) {
  return (
    error.status === 429 || error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit"
  );
}

/**
 * Whether this browser now has a session for the portal. Check your inbox asks every few seconds, so
 * when the link is opened in another tab, the first tab can say "You're in!" instead of waiting.
 * Sessions live in cookies, which every tab shares.
 */
export async function isSignedIn(portal: Portal): Promise<boolean> {
  if (!isPortal(portal)) return false;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data) return false;
  if (portal === "member") return true;
  const { data: isAdmin } = await supabase.rpc("is_admin");
  return isAdmin === true;
}

export async function signOut(portal: Portal) {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect(`${portals[isPortal(portal) ? portal : "member"].signInPath}?reason=signed-out`);
}
