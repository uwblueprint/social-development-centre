"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CircleAlert, Clock, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DisabledArea } from "@/components/ui/DisabledReason";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { SDC_CONTACT_EMAIL, SDC_MEMBERSHIP_URL, SDC_NEWSLETTER_URL } from "@/lib/contact";
import { sendSignInLink } from "./actions";
import {
  AuthActions,
  AuthColumn,
  AuthForm,
  AuthHeading,
  AuthScreen,
  Footnote,
  IconWell,
  LinkButton,
  SdcLogo,
} from "./AuthScreen";
import type { Portal } from "./portals";

const RESEND_AFTER_MS = 60_000;
const LINK_LIFETIME = "1 hour";

const headings = {
  member: {
    title: "Sign in to SDC",
    description:
      "Paying members can view the members-only opportunities feed. Enter the email you use with SDC and we’ll send you a sign-in link.",
  },
  admin: { title: "Admin sign in", description: undefined },
};

type View =
  | { name: "form"; email: string; error?: string }
  | { name: "sent"; email: string; sentAt: number }
  | { name: "not-member" }
  | { name: "expired" }
  | { name: "failed" };

/** `linkError` comes from /auth/confirm when an emailed link didn't work. */
export function SignIn({ portal, linkError }: { portal: Portal; linkError?: string }) {
  const [view, setView] = useState<View>(
    linkError === "expired" ? { name: "expired" } : linkError ? { name: "failed" } : { name: "form", email: "" },
  );

  // A new screen replaces the old one, so move focus to its heading for screen readers.
  const focusHeading = useRef(false);
  useEffect(() => {
    if (!focusHeading.current) return;
    focusHeading.current = false;
    document.querySelector<HTMLElement>("main h1")?.focus();
  }, [view]);
  function show(next: View) {
    focusHeading.current = next.name !== view.name;
    setView(next);
  }
  const showForm = () => show({ name: "form", email: "" });

  async function send(email: string) {
    const result = await sendSignInLink(portal, email).catch(() => "failed" as const);
    if (result === "sent") {
      rememberEmail(portal, email);
      show({ name: "sent", email, sentAt: Date.now() });
    } else if (result === "invalid-email") {
      show({ name: "form", email, error: "Invalid email address" });
    } else if (result === "not-allowed" && portal === "member") {
      show({ name: "not-member" });
    } else if (result === "not-allowed") {
      show({ name: "form", email, error: "This email isn’t on the SDC admin list" });
    } else {
      show({ name: "failed" });
    }
  }
  const submit = (formData: FormData) => send(String(formData.get("email") ?? ""));

  return (
    <AuthScreen>
      {view.name === "sent" ? (
        <CheckEmail email={view.email} sentAt={view.sentAt} onSubmit={submit} />
      ) : view.name === "not-member" ? (
        <NotOnMemberList onTryAgain={showForm} />
      ) : view.name === "expired" ? (
        <LinkExpired portal={portal} onSend={send} onUseDifferentEmail={showForm} />
      ) : view.name === "failed" ? (
        <SomethingWentWrong onTryAgain={showForm} />
      ) : (
        <AuthColumn>
          <SdcLogo />
          <AuthHeading {...headings[portal]} />
          <AuthForm action={submit} noValidate>
            <Field label="Email address" error={view.error}>
              {(props) => (
                <Input
                  {...props}
                  key={view.email + view.error}
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="name@example.org"
                  defaultValue={view.email}
                  autoFocus={Boolean(view.error)}
                />
              )}
            </Field>
            <SubmitButton $size="lg">Email me a sign-in link</SubmitButton>
          </AuthForm>
          <Footnote>No password needed. The link expires in {LINK_LIFETIME}.</Footnote>
        </AuthColumn>
      )}
    </AuthScreen>
  );
}

function CheckEmail({ email, sentAt, onSubmit }: { email: string; sentAt: number; onSubmit: (formData: FormData) => void }) {
  const secondsLeft = useSecondsUntil(sentAt + RESEND_AFTER_MS);

  return (
    <AuthColumn>
      <IconWell icon={MailCheck} tone="brand" />
      <AuthHeading title="Check your email" description={`We sent a sign-in link to ${email}.\nThe link expires in ${LINK_LIFETIME}.`} />
      <AuthForm action={onSubmit} noValidate>
        <Field label="Email address">
          {(props) => <Input {...props} type="email" name="email" autoComplete="email" defaultValue={email} />}
        </Field>
        {secondsLeft > 0 ? (
          <DisabledArea reason="You can send another link once a minute has passed." block>
            <Button type="button" $variant="outline" $size="lg" disabled>
              Resend in {formatCountdown(secondsLeft)}
            </Button>
          </DisabledArea>
        ) : (
          <SubmitButton $variant="outline" $size="lg">
            Resend link
          </SubmitButton>
        )}
      </AuthForm>
    </AuthColumn>
  );
}

function NotOnMemberList({ onTryAgain }: { onTryAgain: () => void }) {
  return (
    <AuthColumn $wide>
      <IconWell icon={CircleAlert} tone="warning" />
      <AuthHeading
        title="This email isn’t on our paying member list"
        description="You can become a member, or join our free newsletter to hear about opportunities in Waterloo Region."
      />
      <AuthActions>
        <LinkButton href={SDC_MEMBERSHIP_URL}>Become a paying member</LinkButton>
        <LinkButton href={SDC_NEWSLETTER_URL} $variant="outline">
          Join the free newsletter
        </LinkButton>
        <Button type="button" $variant="ghost" $size="lg" onClick={onTryAgain}>
          Try a different email
        </Button>
      </AuthActions>
      <Footnote>{`Already a member?\nContact us at ${SDC_CONTACT_EMAIL} and we’ll update your email.`}</Footnote>
    </AuthColumn>
  );
}

function LinkExpired({
  portal,
  onSend,
  onUseDifferentEmail,
}: {
  portal: Portal;
  onSend: (email: string) => Promise<void>;
  onUseDifferentEmail: () => void;
}) {
  const email = useRememberedEmail(portal);

  return (
    <AuthColumn>
      <IconWell icon={Clock} tone="neutral" />
      <AuthHeading
        title="This link has expired"
        description={`Sign-in links work once and expire after ${LINK_LIFETIME}.${email ? ` We can send a new one to ${email}.` : ""}`}
      />
      <AuthActions>
        {email ? (
          <>
            <form action={() => onSend(email)}>
              <SubmitButton $size="lg">Send a new link</SubmitButton>
            </form>
            <Button type="button" $variant="ghost" $size="lg" onClick={onUseDifferentEmail}>
              Use a different email
            </Button>
          </>
        ) : (
          <Button type="button" $size="lg" onClick={onUseDifferentEmail}>
            Send a new link
          </Button>
        )}
      </AuthActions>
    </AuthColumn>
  );
}

function SomethingWentWrong({ onTryAgain }: { onTryAgain: () => void }) {
  return (
    <AuthColumn>
      <IconWell icon={Clock} tone="neutral" />
      <AuthHeading
        title="Something went wrong."
        description={`Please try again. If this keeps happening, contact ${SDC_CONTACT_EMAIL}`}
      />
      <AuthActions>
        <Button type="button" $size="lg" onClick={onTryAgain}>
          Sign in again
        </Button>
      </AuthActions>
    </AuthColumn>
  );
}

function useSecondsUntil(time: number) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return Math.max(0, Math.ceil((time - now) / 1000));
}

function formatCountdown(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

// The expired-link screen offers to resend, but the link itself doesn't say who it was for.
const emailKey = (portal: Portal) => `sdc-sign-in-email:${portal}`;
const noSubscription = () => () => {};

function rememberEmail(portal: Portal, email: string) {
  try {
    localStorage.setItem(emailKey(portal), email);
  } catch {
    // Storage is blocked (e.g. private browsing): the expired screen falls back to the form.
  }
}

function useRememberedEmail(portal: Portal) {
  return useSyncExternalStore(
    noSubscription,
    () => {
      try {
        return localStorage.getItem(emailKey(portal));
      } catch {
        return null;
      }
    },
    () => null,
  );
}
