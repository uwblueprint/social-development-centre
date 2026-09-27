"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAuthApiError, isAuthRetryableFetchError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Why a sign-in link request ended. The form maps each outcome to copy from docs/ux/portal.md
 * ("Shared sign-in"); provider messages are logged, never shown.
 */
export type SignInResult =
  | { status: "idle" | "sent"; email: string }
  | { status: "invalid-email" | "temporary" | "not-permitted"; email: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The address has no access: sign-ups are off for it, or no such user. Waiting won't help. */
const NOT_PERMITTED_CODES = new Set([
  "signup_disabled",
  "otp_disabled",
  "user_not_found",
  "email_address_not_authorized",
  "user_banned",
]);

/** Rate limits and timeouts clear on their own. */
const TEMPORARY_CODES = new Set([
  "over_email_send_rate_limit",
  "over_request_rate_limit",
  "request_timeout",
  "hook_timeout",
  "hook_timeout_after_retry",
]);

function classify(error: unknown): "temporary" | "not-permitted" | "invalid-email" {
  if (isAuthRetryableFetchError(error)) return "temporary"; // network or gateway failure
  if (isAuthApiError(error)) {
    const code = error.code ?? "";
    if (code === "email_address_invalid") return "invalid-email";
    if (TEMPORARY_CODES.has(code) || error.status === 429) return "temporary";
    if (NOT_PERMITTED_CODES.has(code) || /signups? not allowed|user not found/i.test(error.message)) {
      return "not-permitted";
    }
  }
  // Unknown cause: don't promise that retrying will help; the not-permitted copy gives a contact path.
  return "not-permitted";
}

export async function signIn(_prev: SignInResult, formData: FormData): Promise<SignInResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!EMAIL_PATTERN.test(email)) return { status: "invalid-email", email };

  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });

  if (error) {
    // Supabase's messages are technical ("Signups not allowed for otp"): log the detail, show plain copy.
    console.error("signInWithOtp failed:", error.code ?? error.name, error.message);
    return { status: classify(error), email };
  }
  return { status: "sent", email };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
