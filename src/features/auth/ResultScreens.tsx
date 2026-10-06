"use client";

import { Clock, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionNote, AuthActions, AuthColumn, AuthHeading, Footnote, IconWell } from "./AuthLayout";
import { sharedCopy } from "./copy";
import { useSecondsLeft } from "./hooks";
import { RESEND_COOLDOWN_MS } from "./constants";

/** Resends to the same address (and keeps the return path, for members) without asking again. */
function resendTo(resend: (formData: FormData) => void, email: string, next?: string) {
  return () => {
    const formData = new FormData();
    formData.set("email", email);
    if (next) formData.set("next", next);
    resend(formData);
  };
}

/**
 * "Check your email" (member screens 2 and 7, partner screen 3). After any send, Resend waits 60 seconds
 * with a live countdown; the note under it says why.
 */
export function CheckEmailScreen({
  title,
  description,
  footnote,
  email,
  next,
  sentAt,
  resend,
  secondaryLabel,
  onSecondary,
}: {
  title: string;
  description: string;
  footnote: string;
  email: string;
  next?: string;
  /** When the last link went out (epoch ms); null if unknown. */
  sentAt: number | null;
  resend: (formData: FormData) => void;
  secondaryLabel: string;
  onSecondary: () => void;
}) {
  const secondsLeft = useSecondsLeft(sentAt ? sentAt + RESEND_COOLDOWN_MS : null);
  const coolingDown = secondsLeft > 0;

  return (
    <AuthColumn>
      <IconWell icon={MailCheck} />
      <AuthHeading title={title} description={description} />
      <AuthActions>
        <form action={resendTo(resend, email, next)}>
          {coolingDown ? (
            <Button type="button" $variant="outline" $size="lg" disabled aria-describedby="resend-note">
              {sharedCopy.resendIn(secondsLeft)}
            </Button>
          ) : (
            <SubmitButton $variant="outline" $size="lg">
              {sharedCopy.resend}
            </SubmitButton>
          )}
        </form>
        {coolingDown && <ActionNote id="resend-note">{sharedCopy.resendCooldown}</ActionNote>}
        <Button type="button" $variant="ghost" $size="lg" onClick={onSecondary}>
          {secondaryLabel}
        </Button>
      </AuthActions>
      <Footnote>{footnote}</Footnote>
    </AuthColumn>
  );
}

/**
 * "This link has expired" (member screen 4; partners reuse it). Sign-in links land here when they're
 * expired, already used or refused. With a remembered email it resends in one click; otherwise
 * "Send a new link" goes back to the form.
 */
export function LinkExpiredScreen({
  email,
  next,
  resend,
  onDifferentEmail,
}: {
  email: string | null;
  next?: string;
  resend: (formData: FormData) => void;
  onDifferentEmail: () => void;
}) {
  const copy = sharedCopy.expired;
  return (
    <AuthColumn>
      <IconWell icon={Clock} tone="neutral" />
      <AuthHeading title={copy.title} description={email ? copy.description(email) : copy.descriptionNoEmail} />
      <AuthActions>
        {email ? (
          <form action={resendTo(resend, email, next)}>
            <SubmitButton $size="lg">
              {copy.sendNew}
            </SubmitButton>
          </form>
        ) : (
          <Button type="button" $size="lg" onClick={onDifferentEmail}>
            {copy.sendNew}
          </Button>
        )}
        <Button type="button" $variant="ghost" $size="lg" onClick={onDifferentEmail}>
          {copy.differentEmail}
        </Button>
      </AuthActions>
    </AuthColumn>
  );
}
