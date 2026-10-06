"use client";

import { useActionState, useState } from "react";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { SDC_MEMBERSHIP_URL, SDC_NEWSLETTER_URL } from "@/lib/contact";
import {
  AuthActions,
  AuthColumn,
  AuthForm,
  AuthHeading,
  ContactEmail,
  Footnote,
  FormMessage,
  Goodbye,
  IconWell,
  LinkButton,
  SdcLogo,
} from "@/features/auth/AuthLayout";
import { memberCopy as copy, sharedCopy } from "@/features/auth/copy";
import { rememberEmail, useRememberedEmail } from "@/features/auth/hooks";
import { CheckEmailScreen, LinkExpiredScreen } from "@/features/auth/ResultScreens";
import { signIn, type SignInResult } from "./actions";

export type MemberView = "form" | "sent" | "expired" | "not-member";

type Result = SignInResult & { at: number };

/** Which screen a sign-in result leads to. */
function viewFor(result: Result | null, initial: MemberView): MemberView {
  if (!result) return initial;
  if (result.status === "sent") return "sent";
  // The backend refuses links for addresses that aren't paying members (docs/backend/auth.md).
  if (result.status === "not-permitted") return "not-member";
  return "form";
}

/**
 * Paying-member sign-in (Figma "Auth — Paying members", screens 1–7 and 11): email → "Check your
 * email" with a resend cooldown, or "not on our paying member list". Expired links land on screen 4.
 */
export function MemberSignIn({
  initialView,
  next,
  goodbye,
  preview,
}: {
  initialView: MemberView;
  /** Member screen 11: the shared opportunity to return to after signing in. */
  next?: string;
  goodbye?: string | null;
  /** Dev only (?state=…): sample data so each designed screen can be opened directly. */
  preview?: { email: string; sentAt: number | null };
}) {
  const [result, dispatch] = useActionState<Result | null, FormData>(async (prev, formData) => {
    if (next) formData.set("next", next);
    const outcome = await signIn(prev ?? { status: "idle", email: "" }, formData);
    if (outcome.status === "sent") rememberEmail("member", outcome.email);
    return { ...outcome, at: Date.now() };
  }, null);
  // "Back to sign-in" and friends return to the form until the next result arrives.
  const [formFor, setFormFor] = useState<Result | null | undefined>(undefined);
  const toForm = () => setFormFor(result);
  const view = formFor === result ? "form" : viewFor(result, initialView);
  const rememberedEmail = useRememberedEmail("member");

  if (view === "sent") {
    return (
      <CheckEmailScreen
        title={copy.sent.title}
        description={copy.sent.description(result?.email ?? preview?.email ?? "")}
        footnote={copy.sent.footnote}
        email={result?.email ?? preview?.email ?? ""}
        next={next}
        sentAt={result?.at ?? preview?.sentAt ?? null}
        resend={dispatch}
        secondaryLabel={sharedCopy.backToSignIn}
        onSecondary={toForm}
      />
    );
  }

  if (view === "expired") {
    return (
      <LinkExpiredScreen
        email={rememberedEmail ?? preview?.email ?? null}
        next={next}
        resend={dispatch}
        onDifferentEmail={toForm}
      />
    );
  }

  if (view === "not-member") {
    return (
      <AuthColumn $width="lg">
        <IconWell icon={CircleAlert} tone="warning" />
        <AuthHeading title={copy.notMember.title} description={copy.notMember.description} />
        <AuthActions>
          <LinkButton href={SDC_MEMBERSHIP_URL}>{copy.notMember.becomeMember}</LinkButton>
          <LinkButton href={SDC_NEWSLETTER_URL} $variant="outline">
            {copy.notMember.joinNewsletter}
          </LinkButton>
          <Button type="button" $variant="ghost" $size="lg" onClick={toForm}>
            {copy.notMember.differentEmail}
          </Button>
        </AuthActions>
        <Footnote>
          {copy.notMember.footnoteBefore}
          <ContactEmail />
          {copy.notMember.footnoteAfter}
        </Footnote>
      </AuthColumn>
    );
  }

  return (
    <AuthColumn>
      {goodbye && !result && <Goodbye role="status">{goodbye}</Goodbye>}
      <SdcLogo />
      <AuthHeading
        title={copy.title}
        description={
          <>
            {copy.description}
            {next && (
              <>
                {" "}
                {copy.returnNote}
              </>
            )}
          </>
        }
      />
      <AuthForm action={dispatch} noValidate>
        <Field
          id="email"
          label={copy.emailLabel}
          error={result?.status === "invalid-email" ? sharedCopy.invalidEmail : undefined}
        >
          {(props) => (
            <Input
              {...props}
              // Remount after each result so the field shows what was sent, even after an error.
              key={result?.at ?? "initial"}
              type="email"
              name="email"
              autoComplete="email"
              placeholder="name@example.org"
              defaultValue={result?.email}
              autoFocus={result?.status === "invalid-email"}
            />
          )}
        </Field>
        <SubmitButton $size="lg">{copy.submit}</SubmitButton>
        {result?.status === "temporary" && (
          <FormMessage role="alert">
            <Icon icon={CircleAlert} size={16} />
            <span>{sharedCopy.temporary}</span>
          </FormMessage>
        )}
      </AuthForm>
      <Footnote>{copy.footnote}</Footnote>
    </AuthColumn>
  );
}
