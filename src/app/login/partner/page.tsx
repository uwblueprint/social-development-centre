import type { Metadata } from "next";
import { AuthMain } from "@/features/auth/AuthLayout";
import { partnerCopy, sharedCopy } from "@/features/auth/copy";
import { RESEND_COOLDOWN_MS } from "@/features/auth/constants";
import { PartnerSignIn, type PartnerView } from "./PartnerSignIn";

export const metadata: Metadata = { title: `${partnerCopy.pageTitle} · Nexus` };

type PartnerLoginSearchParams = { error?: string; signedOut?: string; name?: string; state?: string };

/** Dev only: open any designed screen directly (the state lab links here). Ignored in production. */
function previewFor(state: string | undefined) {
  if (process.env.NODE_ENV === "production") return undefined;
  const email = "events@reepgreen.ca";
  if (state === "sent") return { view: "sent" as PartnerView, email, sentAt: Date.now() - RESEND_COOLDOWN_MS };
  if (state === "cooldown") return { view: "sent" as PartnerView, email, sentAt: Date.now() - 12_000 };
  if (state === "not-found") return { view: "form" as PartnerView, email: "events@reepgren.ca", sentAt: null, notFound: true };
  if (state === "expired") return { view: "expired" as PartnerView, email, sentAt: null };
  return undefined;
}

/**
 * CivicHub partners sign in here with the email SDC invited them with. The partner portal sends anyone
 * who isn't signed in here (src/app/partner/layout.tsx).
 */
export default async function PartnerLoginPage({ searchParams }: { searchParams: Promise<PartnerLoginSearchParams> }) {
  const { error, signedOut, name, state } = await searchParams;
  const preview = previewFor(state);
  const goodbye = signedOut ? sharedCopy.signedOut(name?.trim().slice(0, 40) || undefined) : null;

  return (
    <AuthMain>
      <PartnerSignIn
        key={state ?? "live"}
        initialView={preview?.view ?? (error ? "expired" : "form")}
        goodbye={goodbye}
        preview={preview}
      />
    </AuthMain>
  );
}
