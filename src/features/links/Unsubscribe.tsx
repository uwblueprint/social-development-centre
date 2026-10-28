"use client";

import { useEffect, useRef, useState } from "react";
import { CircleAlert, MailCheck, MailX } from "lucide-react";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Select } from "@/components/ui/Select";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { SDC_CONTACT_EMAIL } from "@/lib/contact";
import {
  AuthActions,
  AuthColumn,
  AuthForm,
  AuthHeading,
  AuthScreen,
  Footnote,
  FormError,
  IconWell,
  SdcLogo,
} from "@/features/auth/AuthScreen";
import { giveUnsubscribeReason, resubscribe, unsubscribe } from "./actions";
import { unsubscribeReasons } from "./reasons";

type View =
  | { name: "confirm"; failed?: boolean }
  | { name: "unsubscribed"; reasonSaved?: boolean; failed?: boolean }
  | { name: "resubscribed" }
  | { name: "unknown-link" };

/**
 * The page an email's unsubscribe link opens. Opening it never unsubscribes (email scanners open
 * links); the member clicks Unsubscribe. They can say why, and undo it, from the same page.
 * `firstName` is undefined when the token isn't a real link (null when it is, but there's no name).
 */
export function Unsubscribe({ token, firstName }: { token: string; firstName: string | null | undefined }) {
  const [view, setView] = useState<View>(firstName === undefined ? { name: "unknown-link" } : { name: "confirm" });

  // A new screen replaces the old one, so move focus to its heading for screen readers.
  const focusHeading = useRef(false);
  useEffect(() => {
    if (!focusHeading.current) return;
    focusHeading.current = false;
    document.querySelector<HTMLElement>("main h1")?.focus();
  }, [view.name]);
  function show(next: View) {
    focusHeading.current = next.name !== view.name;
    setView(next);
  }

  async function change(action: typeof unsubscribe, done: View) {
    const result = await action(token).catch(() => "failed" as const);
    if (result === "unknown-link") show({ name: "unknown-link" });
    else if (result === "failed") show(view.name === "unsubscribed" ? { ...view, failed: true } : { name: "confirm", failed: true });
    else show(done);
  }

  return (
    <AuthScreen>
      {view.name === "unknown-link" ? (
        <UnknownLink />
      ) : view.name === "confirm" ? (
        <AuthColumn>
          <SdcLogo />
          <AuthHeading
            title="Unsubscribe from SDC emails?"
            description={`${firstName ? `Hi ${firstName}, you’ll` : "You’ll"} stop getting emails from SDC. You’ll still be a member.`}
          />
          <AuthForm action={() => change(unsubscribe, { name: "unsubscribed" })}>
            {view.failed && <SomethingWentWrong />}
            <SubmitButton $size="lg">Unsubscribe</SubmitButton>
          </AuthForm>
        </AuthColumn>
      ) : view.name === "unsubscribed" ? (
        <AuthColumn>
          <IconWell icon={MailX} tone="neutral" />
          <AuthHeading title="You’re unsubscribed" description="You won’t get any more emails from SDC." />
          <AuthActions>
            {view.reasonSaved ? (
              <Footnote role="status">Thanks for telling us.</Footnote>
            ) : (
              <ReasonForm token={token} onSaved={() => setView({ ...view, reasonSaved: true })} />
            )}
            <form action={() => change(resubscribe, { name: "resubscribed" })}>
              {view.failed && <SomethingWentWrong />}
              <SubmitButton $variant="outline" $size="lg">
                Resubscribe
              </SubmitButton>
            </form>
          </AuthActions>
        </AuthColumn>
      ) : (
        <AuthColumn>
          <IconWell icon={MailCheck} tone="brand" />
          <AuthHeading title="You’re subscribed again" description="You’ll get emails from SDC again." />
        </AuthColumn>
      )}
    </AuthScreen>
  );
}

function ReasonForm({ token, onSaved }: { token: string; onSaved: () => void }) {
  const [error, setError] = useState<string>();
  async function submit(formData: FormData) {
    const result = await giveUnsubscribeReason(token, formData.get("reason")).catch(() => "failed" as const);
    if (result === "saved") onSaved();
    else setError(result === "invalid-reason" ? "Choose a reason from the list." : "We couldn’t save that. Try again.");
  }
  return (
    <AuthForm action={submit} noValidate>
      <Field label="Why did you unsubscribe? (optional)" error={error}>
        {(props) => <Select {...props} name="reason" options={unsubscribeReasons} placeholder="Choose a reason" />}
      </Field>
      <SubmitButton $size="lg">Send reason</SubmitButton>
    </AuthForm>
  );
}

function SomethingWentWrong() {
  return (
    <FormError role="alert">
      <Icon icon={CircleAlert} size={16} />
      Something went wrong. Try again.
    </FormError>
  );
}

/** For a link that's mistyped, cut off, or from an email that no longer exists. */
export function UnknownLink() {
  return (
    <AuthColumn>
      <IconWell icon={CircleAlert} tone="warning" />
      <AuthHeading
        title="This link doesn’t work"
        description={`It may have been cut off or mistyped. Try the link in the email again, or contact ${SDC_CONTACT_EMAIL}.`}
      />
    </AuthColumn>
  );
}
