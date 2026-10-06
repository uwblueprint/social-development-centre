"use client";

import { useActionState, useState } from "react";
import { CircleAlert } from "lucide-react";
import { styled } from "next-yak";
import { DisabledArea } from "@/components/ui/DisabledReason";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { SDC_CONTACT_EMAIL } from "@/lib/contact";
import {
  AuthColumn,
  AuthForm,
  AuthHeading,
  ContactEmail,
  Footnote,
  FormMessage,
  Goodbye,
  LinkButton,
  SdcLogo,
} from "@/features/auth/AuthLayout";
import { partnerCopy as copy, sharedCopy } from "@/features/auth/copy";
import { rememberEmail, useRememberedEmail } from "@/features/auth/hooks";
import { CheckEmailScreen, LinkExpiredScreen } from "@/features/auth/ResultScreens";
import { signIn, type SignInResult } from "../actions";

export type PartnerView = "form" | "sent" | "expired";

type Result = SignInResult & { at: number };

/* Partner screen 5: tips for finding the invited address, under the form. */
const HelpPanel = styled.section`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;

const HelpTitle = styled.h2`
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  line-height: var(--leading-ui);
  color: var(--color-text);
`;

const Tips = styled.ul`
  margin: 0;
  padding-left: var(--space-4);
`;

const HelpText = styled.p`
  margin: 0;
`;

/**
 * CivicHub partner sign-in (Figma "Auth — CivicHub partners", screens 2, 3 and 5). Partners only get
 * access by invitation, so an unknown email stays on the form with help finding the invited address.
 */
export function PartnerSignIn({
  initialView,
  goodbye,
  preview,
}: {
  initialView: PartnerView;
  goodbye?: string | null;
  /** Dev only (?state=…): sample data so each designed screen can be opened directly. */
  preview?: { email: string; sentAt: number | null; notFound?: boolean };
}) {
  const [result, dispatch] = useActionState<Result | null, FormData>(
    async (prev, formData) => {
      const outcome = await signIn(prev ?? { status: "idle", email: "" }, formData);
      if (outcome.status === "sent") rememberEmail("partner", outcome.email);
      return { ...outcome, at: Date.now() };
    },
    preview?.notFound ? { status: "not-permitted", email: preview.email, at: 0 } : null,
  );
  const [formFor, setFormFor] = useState<Result | null | undefined>(undefined);
  const toForm = () => setFormFor(result);
  const view: PartnerView =
    formFor === result ? "form" : !result ? initialView : result.status === "sent" ? "sent" : "form";
  const rememberedEmail = useRememberedEmail("partner");

  // After "Email not found", the button waits until the address changes (Figma screen 5).
  const [draft, setDraft] = useState<{ for: Result | null; value: string } | null>(null);
  const notFound = result?.status === "not-permitted";
  const currentValue = draft?.for === result ? draft.value : (result?.email ?? "");
  const waitingForEdit = notFound && currentValue.trim() === result?.email;

  if (view === "sent") {
    const email = result?.email ?? preview?.email ?? "";
    return (
      <CheckEmailScreen
        title={copy.sent.title}
        description={copy.sent.description(email)}
        footnote={copy.sent.footnote}
        email={email}
        sentAt={result?.at ?? preview?.sentAt ?? null}
        resend={dispatch}
        secondaryLabel={copy.sent.differentEmail}
        onSecondary={toForm}
      />
    );
  }

  if (view === "expired") {
    return (
      <LinkExpiredScreen email={rememberedEmail ?? preview?.email ?? null} resend={dispatch} onDifferentEmail={toForm} />
    );
  }

  return (
    <AuthColumn $width="xl">
      {goodbye && !result && <Goodbye role="status">{goodbye}</Goodbye>}
      <SdcLogo />
      <AuthHeading title={copy.title} description={copy.description} />
      <AuthForm action={dispatch} noValidate>
        <Field
          id="email"
          label={copy.emailLabel}
          error={
            result?.status === "invalid-email" ? sharedCopy.invalidEmail : notFound ? copy.notFound : undefined
          }
        >
          {(props) => (
            <Input
              {...props}
              key={result?.at ?? "initial"}
              type="email"
              name="email"
              autoComplete="email"
              placeholder="name@organization.org"
              defaultValue={result?.email}
              autoFocus={result?.status === "invalid-email" || notFound}
              onChange={(event) => setDraft({ for: result, value: event.target.value })}
            />
          )}
        </Field>
        {waitingForEdit ? (
          <DisabledArea reason={copy.editToRetry} block>
            <SubmitButton $size="lg" disabled>
              {copy.submit}
            </SubmitButton>
          </DisabledArea>
        ) : (
          <SubmitButton $size="lg">{copy.submit}</SubmitButton>
        )}
        {result?.status === "temporary" && (
          <FormMessage role="alert">
            <Icon icon={CircleAlert} size={16} />
            <span>{sharedCopy.temporary}</span>
          </FormMessage>
        )}
      </AuthForm>
      {notFound ? (
        <HelpPanel aria-labelledby="partner-help-title">
          <HelpTitle id="partner-help-title">{copy.help.title}</HelpTitle>
          <Tips>
            {copy.help.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </Tips>
          <HelpText>
            {copy.help.contactBefore}
            <ContactEmail />
            {copy.help.contactAfter}
          </HelpText>
          <LinkButton href={`mailto:${SDC_CONTACT_EMAIL}`} $variant="outline" $size="md">
            {copy.help.contact}
          </LinkButton>
        </HelpPanel>
      ) : (
        <Footnote>
          {copy.footnoteBefore}
          <ContactEmail />
          {copy.footnoteAfter}
        </Footnote>
      )}
    </AuthColumn>
  );
}
