import type { AdminSignInResult } from "./types";

/*
 * Dev only: a stand-in for the admin password check so every designed state can be clicked through
 * before the backend exists (docs/backend/auth.md). It runs in the browser and forgets everything on
 * reload. Throws in production, so admin sign-in fails closed until the real action is wired in.
 */

/** The password that signs in while previewing. */
export const PREVIEW_ADMIN_PASSWORD = "preview";
const MAX_ATTEMPTS = 5;
const PAUSE_MS = 15 * 60_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let failures = 0;
let pausedUntil = 0;

export async function previewAdminSignIn(_prev: AdminSignInResult, formData: FormData): Promise<AdminSignInResult> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Admin password sign-in is not implemented: see docs/backend/auth.md.");
  }
  await new Promise((resolve) => setTimeout(resolve, 600));

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (Date.now() < pausedUntil) return { status: "paused", email, until: new Date(pausedUntil).toISOString() };
  if (!EMAIL_PATTERN.test(email) || !password) {
    return { status: "invalid", email, fieldErrors: { email: !EMAIL_PATTERN.test(email) || undefined, password: !password || undefined } };
  }
  if (password === PREVIEW_ADMIN_PASSWORD) {
    failures = 0;
    return { status: "signed-in" };
  }
  failures += 1;
  if (failures >= MAX_ATTEMPTS) {
    failures = 0;
    pausedUntil = Date.now() + PAUSE_MS;
    return { status: "paused", email, until: new Date(pausedUntil).toISOString() };
  }
  return { status: "wrong-password", email, attemptsLeft: MAX_ATTEMPTS - failures };
}
