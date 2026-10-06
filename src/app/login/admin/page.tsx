import type { Metadata } from "next";
import { AuthMain } from "@/features/auth/AuthLayout";
import { adminCopy, sharedCopy } from "@/features/auth/copy";
import type { AdminSignInResult } from "@/features/auth/types";
import { AdminSignIn } from "./AdminSignIn";

export const metadata: Metadata = { title: `${adminCopy.pageTitle} · Nexus` };

type AdminLoginSearchParams = { reason?: string; signedOut?: string; name?: string; state?: string };

/** Dev only: open any designed screen directly (the state lab links here). Ignored in production. */
function previewFor(state: string | undefined): AdminSignInResult | undefined {
  if (process.env.NODE_ENV === "production") return undefined;
  const email = "admin@sdc.example";
  if (state === "wrong-password") return { status: "wrong-password", email, attemptsLeft: 2 };
  // Figma shows "Try again in 14:32".
  if (state === "paused") return { status: "paused", email, until: new Date(Date.now() + 872_000).toISOString() };
  return undefined;
}

/**
 * SDC admins sign in here with the shared admin account. The admin portal sends anyone who isn't a
 * signed-in admin here; `reason=session-ended` when their 30-day session ran out (admin screen 4).
 */
export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<AdminLoginSearchParams> }) {
  const { reason, signedOut, name, state } = await searchParams;
  const goodbye = signedOut ? sharedCopy.signedOut(name?.trim().slice(0, 40) || undefined) : null;
  const sessionEnded = reason === "session-ended" || (process.env.NODE_ENV !== "production" && state === "session-ended");

  return (
    <AuthMain>
      <AdminSignIn
        key={state ?? reason ?? "live"}
        initialView={sessionEnded ? "session-ended" : "form"}
        initialResult={previewFor(state)}
        goodbye={goodbye}
      />
    </AuthMain>
  );
}
