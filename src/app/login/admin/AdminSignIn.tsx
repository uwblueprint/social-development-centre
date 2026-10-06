"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, TriangleAlert } from "lucide-react";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { DisabledArea } from "@/components/ui/DisabledReason";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { previewAdminSignIn } from "@/features/auth/adminPreview";
import {
  AuthActions,
  AuthColumn,
  AuthForm,
  AuthHeading,
  Footnote,
  Goodbye,
  IconWell,
  SdcLogo,
} from "@/features/auth/AuthLayout";
import { adminCopy as copy, sharedCopy } from "@/features/auth/copy";
import { useSecondsLeft } from "@/features/auth/hooks";
import type { AdminSignInAction, AdminSignInResult } from "@/features/auth/types";

/* Admin screen 6: why sign-in is paused, above the form. Warning tokens, paired with an icon and a title. */
const PausedAlert = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-4);
  border: 1px solid var(--color-warning-border);
  border-radius: var(--radius-lg);
  background: var(--color-warning-subtle);

  & > svg {
    flex-shrink: 0;
    color: var(--color-warning);
  }
`;

const AlertCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
  font-size: var(--text-sm);
`;

const AlertTitle = styled.p`
  margin: 0;
  font-weight: var(--weight-medium);
  line-height: var(--leading-ui);
  color: var(--color-text);
`;

const AlertText = styled.p`
  margin: 0;
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;

export type AdminView = "form" | "session-ended";

/**
 * Admin sign-in (Figma "Auth — Admins", screens 1, 4, 5 and 6): the shared SDC admin account's email and
 * password. Wrong passwords count down to a 15-minute pause; sessions end every 30 days.
 */
export function AdminSignIn({
  initialView,
  initialResult,
  goodbye,
  action,
}: {
  initialView: AdminView;
  /** Dev only (?state=…): a result to start from, so each designed screen can be opened directly. */
  initialResult?: AdminSignInResult;
  goodbye?: string | null;
  /** The backend's sign-in action. Until it exists, a dev-only stand-in is used (see adminPreview.ts). */
  action?: AdminSignInAction;
}) {
  const router = useRouter();
  const [view, setView] = useState(initialView);
  const [result, dispatch] = useActionState<AdminSignInResult, FormData>(async (prev, formData) => {
    const outcome = await (action ?? previewAdminSignIn)(prev, formData);
    if (outcome.status === "signed-in") router.push("/admin");
    return outcome;
  }, initialResult ?? { status: "idle" });

  const pausedUntil = result.status === "paused" ? Date.parse(result.until) : null;
  const secondsLeft = useSecondsLeft(pausedUntil);
  const paused = result.status === "paused" && secondsLeft > 0;
  const email = "email" in result ? result.email : undefined;

  if (view === "session-ended") {
    return (
      <AuthColumn>
        <IconWell icon={Clock} tone="neutral" />
        <AuthHeading title={copy.sessionEnded.title} description={copy.sessionEnded.description} />
        <AuthActions>
          <Button type="button" $size="lg" onClick={() => setView("form")}>
            {copy.sessionEnded.action}
          </Button>
        </AuthActions>
      </AuthColumn>
    );
  }

  return (
    <AuthColumn>
      {goodbye && result.status === "idle" && <Goodbye role="status">{goodbye}</Goodbye>}
      <SdcLogo />
      <AuthHeading badge={copy.badge} title={copy.title} description={copy.description} />
      <AuthForm action={dispatch} noValidate>
        {paused && (
          <PausedAlert role="alert">
            <Icon icon={TriangleAlert} size={20} />
            <AlertCopy>
              <AlertTitle>{copy.paused.title}</AlertTitle>
              <AlertText>{copy.paused.description}</AlertText>
            </AlertCopy>
          </PausedAlert>
        )}
        {paused ? (
          <Field id="email" label={copy.emailLabel} disabled disabledReason={copy.paused.fieldReason}>
            {(props) => <Input {...props} type="email" name="email" defaultValue={email} />}
          </Field>
        ) : (
          <Field
            id="email"
            label={copy.emailLabel}
            error={result.status === "invalid" && result.fieldErrors.email ? sharedCopy.invalidEmail : undefined}
          >
            {(props) => (
              <Input
                {...props}
                // Keep the email after a wrong password (Figma annotation on admin screen 5).
                key={`email-${email ?? ""}`}
                type="email"
                name="email"
                autoComplete="username"
                placeholder="name@example.org"
                defaultValue={email}
              />
            )}
          </Field>
        )}
        {!paused && (
          <Field
            id="password"
            label={copy.passwordLabel}
            error={
              result.status === "wrong-password"
                ? copy.incorrectPassword(result.attemptsLeft)
                : result.status === "invalid" && result.fieldErrors.password
                  ? copy.passwordRequired
                  : undefined
            }
          >
            {(props) => (
              <Input
                {...props}
                // A fresh, empty password field after every attempt.
                key={`password-${result.status}-${"attemptsLeft" in result ? result.attemptsLeft : ""}`}
                type="password"
                name="password"
                autoComplete="current-password"
                autoFocus={result.status === "wrong-password"}
              />
            )}
          </Field>
        )}
        {paused ? (
          <DisabledArea reason={copy.paused.fieldReason} block>
            <Button type="button" $size="lg" disabled>
              {copy.paused.tryAgainIn(secondsLeft)}
            </Button>
          </DisabledArea>
        ) : (
          <SubmitButton $size="lg">{copy.submit}</SubmitButton>
        )}
      </AuthForm>
      <Footnote>{copy.footnote}</Footnote>
    </AuthColumn>
  );
}
