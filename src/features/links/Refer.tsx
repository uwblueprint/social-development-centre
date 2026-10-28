"use client";

import { useEffect, useRef, useState } from "react";
import { CircleAlert, MailCheck } from "lucide-react";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { AuthColumn, AuthForm, AuthHeading, AuthScreen, FormError, IconWell, SdcLogo } from "@/features/auth/AuthScreen";
import { referFriend } from "./actions";
import { UnknownLink } from "./Unsubscribe";

type View =
  | { name: "form"; error?: "invalid-email" | "failed"; values?: { name: string; email: string } }
  | { name: "sent" }
  | { name: "unknown-link" };

/**
 * The page a member's referral link opens: the friend leaves their own name and email, and the referral
 * is credited to the member the link was sent to.
 *
 * PLACEHOLDER: follows the PRD (the friend fills this in). In the client demo the member typed in their
 * friend's details instead, and the name ("Invite a friend" vs "Tell a friend about us") and what the
 * page says about membership are still open. Rework once those are decided.
 */
export function Refer({ token, referrerName }: { token: string; referrerName: string | null | undefined }) {
  const [view, setView] = useState<View>(referrerName === undefined ? { name: "unknown-link" } : { name: "form" });

  const focusHeading = useRef(false);
  useEffect(() => {
    if (!focusHeading.current) return;
    focusHeading.current = false;
    document.querySelector<HTMLElement>("main h1")?.focus();
  }, [view.name]);

  async function submit(formData: FormData) {
    const values = { name: String(formData.get("name") ?? ""), email: String(formData.get("email") ?? "") };
    const result = await referFriend(token, values.name, values.email).catch(() => "failed" as const);
    const next: View =
      result === "recorded"
        ? { name: "sent" }
        : result === "unknown-link"
          ? { name: "unknown-link" }
          : { name: "form", error: result, values };
    focusHeading.current = next.name !== view.name;
    setView(next);
  }

  return (
    <AuthScreen>
      {view.name === "unknown-link" ? (
        <UnknownLink />
      ) : view.name === "sent" ? (
        <AuthColumn>
          <IconWell icon={MailCheck} tone="brand" />
          <AuthHeading title="Thanks, we’ve got your details" description="Someone from SDC will be in touch about becoming a member." />
        </AuthColumn>
      ) : (
        <AuthColumn>
          <SdcLogo />
          <AuthHeading
            title={referrerName ? `${referrerName} invited you to SDC` : "You’re invited to SDC"}
            description="Leave your name and email, and someone from SDC will be in touch about becoming a member."
          />
          <AuthForm action={submit} noValidate>
            <Field label="Name">
              {(props) => (
                <Input
                  {...props}
                  key={`name-${view.values?.name}`}
                  name="name"
                  autoComplete="name"
                  maxLength={120}
                  defaultValue={view.values?.name}
                />
              )}
            </Field>
            <Field label="Email address" required error={view.error === "invalid-email" ? "Enter a valid email address." : undefined}>
              {(props) => (
                <Input
                  {...props}
                  key={`email-${view.values?.email}-${view.error}`}
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="name@example.org"
                  defaultValue={view.values?.email}
                  autoFocus={view.error === "invalid-email"}
                />
              )}
            </Field>
            {view.error === "failed" && (
              <FormError role="alert">
                <Icon icon={CircleAlert} size={16} />
                Something went wrong. Try again.
              </FormError>
            )}
            <SubmitButton $size="lg">Send my details</SubmitButton>
          </AuthForm>
        </AuthColumn>
      )}
    </AuthScreen>
  );
}
