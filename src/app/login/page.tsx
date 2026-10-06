import type { Metadata } from "next";
import { AuthMain } from "@/features/auth/AuthLayout";
import { memberCopy, sharedCopy } from "@/features/auth/copy";
import { RESEND_COOLDOWN_MS, safeReturnPath } from "@/features/auth/constants";
import { MemberSignIn, type MemberView } from "./MemberSignIn";

export const metadata: Metadata = { title: `${memberCopy.pageTitle} · Social Development Centre` };

type LoginSearchParams = { error?: string; signedOut?: string; name?: string; next?: string; state?: string };

/** Dev only: open any designed screen directly (the state lab links here). Ignored in production. */
const PREVIEW_VIEWS: Record<string, MemberView> = {
  sent: "sent",
  cooldown: "sent",
  expired: "expired",
  "not-member": "not-member",
};

function previewFor(state: string | undefined) {
  if (process.env.NODE_ENV === "production" || !state || !(state in PREVIEW_VIEWS)) return undefined;
  // "cooldown" was sent 12 seconds ago (Figma shows "Resend in 0:48"); "sent" is past the cooldown.
  const sentAt = state === "cooldown" ? Date.now() - 12_000 : Date.now() - RESEND_COOLDOWN_MS;
  return { view: PREVIEW_VIEWS[state], email: "jordan@example.org", sentAt };
}

/**
 * Paying members sign in here; partners and admins have their own pages (/login/partner, /login/admin).
 * `error` comes from a sign-in link that failed (expired, used or refused; /auth/confirm logs the detail).
 * `signedOut` (with an optional first `name`) comes from the sign-out action. `next` is the shared
 * opportunity to return to (member screen 11).
 */
export default async function LoginPage({ searchParams }: { searchParams: Promise<LoginSearchParams> }) {
  const { error, signedOut, name, next, state } = await searchParams;
  const preview = previewFor(state);
  const goodbye = signedOut ? sharedCopy.signedOut(name?.trim().slice(0, 40) || undefined) : null;

  return (
    <AuthMain>
      <MemberSignIn
        // Remount when the previewed screen changes, so the state lab can hop between screens.
        key={state ?? "live"}
        initialView={preview?.view ?? (error ? "expired" : "form")}
        next={safeReturnPath(next)}
        goodbye={goodbye}
        preview={preview && { email: preview.email, sentAt: preview.sentAt }}
      />
    </AuthMain>
  );
}
