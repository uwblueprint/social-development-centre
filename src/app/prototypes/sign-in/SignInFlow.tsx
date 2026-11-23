"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { styled } from "next-yak";
import { CircleAlert, CircleCheck, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DisabledArea } from "@/components/ui/DisabledReason";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { BSF_SUPPORT_EMAIL } from "@/lib/contact";
import { demo, inboxesFor, isEmail, suggestEmail } from "./demo";
import { EmailPreview } from "./EmailPreview";
import { StateBar } from "./StateBar";
import {
  Actions,
  Column,
  Form,
  FormMessage,
  Heading,
  Screen,
  StatusLine,
  Followup,
  InlineAction,
  QuietRow,
} from "./parts";
import type { StateId } from "./states";

interface Flow {
  state: StateId;
  /** The address the person typed, or the one this device remembers. */
  email: string;
  sentAt: number;
}

const EMPTY_EMAIL = "We’ll need your email to send the link";
const BAD_EMAIL =
  "That doesn’t look like an email. Try something like name@waterlooregion.org";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Demo data each screen starts with when opened directly from the state list. */
function startingFlow(state: StateId): Flow {
  const now = Date.now();
  const email =
    state === "sign-in-typo"
      ? "priya.patel@waterlooregoin.org"
      : state === "sign-in-invalid"
        ? "priya.patel@gmail"
        : state === "check-email-work" ||
            state === "welcome-back" ||
            state === "session-ended" ||
            state.startsWith("link")
          ? demo.admin.email
          : state === "sign-in" ||
              state === "signed-out" ||
              state === "sign-in-empty"
            ? ""
            : demo.other.email;
  return {
    state,
    email,
    sentAt:
      state === "check-email-work" ? now - demo.resendAfterMs : now - 18_000,
  };
}

export function SignInFlow({ initial }: { initial: StateId }) {
  const [flow, setFlow] = useState<Flow>(() => startingFlow(initial));
  const router = useRouter();

  // A new screen replaces the old one, so move focus to its heading for screen readers.
  const moved = useRef(false);
  useEffect(() => {
    if (!moved.current) return;
    document.querySelector<HTMLElement>("main h1")?.focus();
  }, [flow.state]);

  function go(state: StateId, patch: Partial<Flow> = {}) {
    moved.current = true;
    setFlow((current) => ({ ...current, ...patch, state }));
    router.replace(`?state=${state}`, { scroll: false });
  }
  const restart = () => go("sign-in", { email: "" });
  /** Where a signed-in admin lands. The admin home page doesn't exist yet; Admins is the stand-in. */
  const goHome = () => router.push("/admin/admins");
  /** From the screen switcher: open a screen fresh, with its own demo data. */
  const jump = (state: StateId) => {
    moved.current = true;
    setFlow(startingFlow(state));
    router.replace(`?state=${state}`, { scroll: false });
  };

  const { state, email } = flow;

  const screen = (() => {
    switch (state) {
      case "sign-in":
      case "welcome-back":
      case "session-ended":
      case "signed-out":
      case "sign-in-empty":
      case "sign-in-invalid":
      case "sign-in-typo":
      case "sign-in-rate-limited":
      case "sign-in-offline":
        return (
          <SignInForm
            key={state}
            state={state}
            email={email}
            onSent={(sentTo) =>
              go("check-email", { email: sentTo, sentAt: Date.now() })
            }
            onForget={restart}
          />
        );

      case "check-email":
      case "check-email-work":
      case "check-email-resent":
        return (
          <CheckEmail
            key={state === "check-email-resent" ? "resent" : "sent"}
            email={email}
            sentAt={flow.sentAt}
            resent={state === "check-email-resent"}
            onResend={() => go("check-email-resent", { sentAt: Date.now() })}
            onDifferentEmail={restart}
          />
        );

      case "signed-in-elsewhere":
        return (
          <Screen>
            <Column>
              <Heading emoji="🎉" title="You’re in!">
                You opened the link in another tab. Carry on there, or right
                here
              </Heading>
              <Actions>
                <Button type="button" $size="lg" onClick={goHome}>
                  Take me to SDC
                </Button>
              </Actions>
            </Column>
          </Screen>
        );

      case "email-sign-in":
        return (
          <EmailPreview
            to={demo.admin.email}
            subject="Your SDC sign-in link 🔑"
            title="🔑 Here’s your link"
            body={[
              `One click and you’re in. The link works once and expires in ${demo.linkLifetime}.`,
            ]}
            action="Sign in to SDC"
            onAction={goHome}
            footer="Didn’t ask for this? No worries, ignore this email. No one can sign in without your inbox."
          />
        );

      case "link-expired":
        return (
          <LinkExpired
            email={email}
            onResend={() => go("check-email", { sentAt: Date.now() })}
            onDifferentEmail={restart}
          />
        );

      case "link-broken":
        return (
          <Screen>
            <Column>
              <Heading emoji="🔗" title="Hmm, this link is broken">
                Part of it went missing on the way. Click the button in the
                email instead of copying the link, or grab a new one
              </Heading>
              <Actions>
                <Button type="button" $size="lg" onClick={restart}>
                  Get a new link
                </Button>
              </Actions>
            </Column>
          </Screen>
        );

      case "access-removed":
        return (
          <Screen>
            <Column>
              <Heading emoji="🚪" title="You’re no longer an admin">
                Someone removed your access, so this link can’t sign you in.
                Need it back? Ask an SDC admin to add you again
              </Heading>
              <Actions>
                <Button type="button" $size="lg" onClick={restart}>
                  Back to sign in
                </Button>
              </Actions>
            </Column>
          </Screen>
        );

      case "error":
        return (
          <Screen>
            <Column>
              <Heading emoji="🛠️" title="Well, that wasn’t supposed to happen">
                We couldn’t sign you in. Give it a minute and try again. Still
                stuck? Email {BSF_SUPPORT_EMAIL}
              </Heading>
              <Actions>
                <Button type="button" $size="lg" onClick={restart}>
                  Try again
                </Button>
              </Actions>
            </Column>
          </Screen>
        );
    }
  })();

  return (
    <>
      {screen}
      <StateBar current={state} onPick={jump} />
    </>
  );
}

function SignInForm({
  state,
  email,
  onSent,
  onForget,
}: {
  state: StateId;
  email: string;
  onSent: (email: string) => void;
  /** "Not you?": forget the remembered email on this device and start blank. */
  onForget: () => void;
}) {
  const initialError =
    state === "sign-in-empty"
      ? EMPTY_EMAIL
      : state === "sign-in-invalid"
        ? BAD_EMAIL
        : undefined;
  const [value, setValue] = useState(email);
  const [error, setError] = useState(initialError);
  const [formMessage, setFormMessage] = useState<
    "rate-limited" | "offline" | undefined
  >(
    state === "sign-in-rate-limited"
      ? "rate-limited"
      : state === "sign-in-offline"
        ? "offline"
        : undefined,
  );
  const suggestion = suggestEmail(value);

  /** Why they're here, when it isn't a plain first visit. One line above the field. */
  const note =
    state === "welcome-back"
      ? "👋 Welcome back. Your link is one click away"
      : state === "session-ended"
        ? "🔒 It’s been a week! To keep everyone’s details safe, admins sign in again every 7 days"
        : state === "signed-out"
          ? "👋 You’re signed out. See you soon"
          : undefined;

  // Ready to type the moment the page opens, with the cursor after any remembered email.
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    const end = input.value.length;
    try {
      input.setSelectionRange(end, end);
    } catch {
      // type="email" inputs don't support selection ranges in every browser.
    }
  }, []);

  async function submit() {
    const typed = value.trim();
    setFormMessage(undefined);
    if (!typed) return setError(EMPTY_EMAIL);
    if (!isEmail(typed)) return setError(BAD_EMAIL);
    setError(undefined);
    await wait(700);
    // Demo only: addresses with these words show the matching error.
    if (typed.includes("busy")) return setFormMessage("rate-limited");
    if (typed.includes("offline")) return setFormMessage("offline");
    onSent(typed);
  }

  return (
    <Screen>
      <Column>
        <VisuallyHiddenHeading tabIndex={-1}>
          Sign in to SDC
        </VisuallyHiddenHeading>
        {note && <Note>{note}</Note>}
        <BigForm action={submit} noValidate>
          <Field
            label="Email"
            error={error}
            hint={
              suggestion && !error ? (
                <>
                  Did you mean{" "}
                  <InlineAction>
                    <Button
                      id="email-suggestion"
                      type="button"
                      $variant="ghost"
                      $size="sm"
                      onClick={() => {
                        setValue(suggestion);
                        inputRef.current?.focus();
                      }}
                    >
                      {suggestion}
                    </Button>
                  </InlineAction>
                </>
              ) : undefined
            }
          >
            {(props) => (
              <Input
                {...props}
                ref={inputRef}
                type="email"
                name="email"
                autoComplete="email"
                placeholder="name@waterlooregion.org"
                value={value}
                onChange={(event) => {
                  setValue(event.target.value);
                  if (error) setError(undefined);
                }}
              />
            )}
          </Field>
          <SubmitButton $size="lg">Send me a link</SubmitButton>
          {formMessage && (
            <FormMessage role="alert">
              <Icon
                icon={formMessage === "offline" ? WifiOff : CircleAlert}
                size={20}
              />
              {formMessage === "offline"
                ? "Looks like you’re offline. Check your connection, then try again"
                : "Whoa, that’s a lot of links. Take 5 minutes, then try again"}
            </FormMessage>
          )}
        </BigForm>
        {state === "welcome-back" && (
          <QuietRow>
            <Button type="button" $variant="ghost" onClick={onForget}>
              Not you? Use a different email
            </Button>
          </QuietRow>
        )}
      </Column>
    </Screen>
  );
}

function CheckEmail({
  email,
  sentAt,
  resent,
  onResend,
  onDifferentEmail,
}: {
  email: string;
  sentAt: number;
  resent: boolean;
  onResend: () => void;
  onDifferentEmail: () => void;
}) {
  const secondsLeft = useSecondsUntil(sentAt + demo.resendAfterMs);
  const inboxes = inboxesFor(email);

  async function resend() {
    await wait(600);
    onResend();
  }

  return (
    <Screen>
      <Column>
        <Heading emoji="📬" title="Check your inbox">
          We sent a sign-in link to <strong>{email}</strong>
        </Heading>
        {resent && (
          <StatusLine role="status">
            <Icon icon={CircleCheck} size={20} />
            Sent another one. Use the newest email
          </StatusLine>
        )}
        <Followup>
          <InboxActions>
            {inboxes.map((inbox) => (
              <Button
                key={inbox.label}
                type="button"
                $size="lg"
                $variant="secondary"
                data-wide=""
                onClick={() => window.open(inbox.href, "_blank", "noopener")}
              >
                {inbox.logo && (
                  <Image src={inbox.logo} alt="" width={20} height={15} />
                )}
                {inbox.label}
              </Button>
            ))}
            <form action={resend} style={{ display: "contents" }}>
              {secondsLeft > 0 ? (
                <DisabledArea
                  reason="You can send another link once a minute has passed."
                  block
                >
                  <Button
                    type="button"
                    $variant="secondary"
                    $size="lg"
                    disabled
                  >
                    Resend in {formatCountdown(secondsLeft)}
                  </Button>
                </DisabledArea>
              ) : (
                <SubmitButton $variant="secondary" $size="lg">
                  Resend email
                </SubmitButton>
              )}
            </form>
            <Button
              type="button"
              $variant="secondary"
              $size="lg"
              onClick={onDifferentEmail}
            >
              Use a different email
            </Button>
          </InboxActions>
        </Followup>
      </Column>
    </Screen>
  );
}

function LinkExpired({
  email,
  onResend,
  onDifferentEmail,
}: {
  email: string;
  onResend: () => void;
  onDifferentEmail: () => void;
}) {
  async function submit() {
    await wait(700);
    onResend();
  }
  return (
    <Screen>
      <Column>
        <Heading emoji="⏳" title="This link has expired">
          Links only work once and only for {demo.linkLifetime}. Want a fresh
          one sent to <strong>{email}</strong>?
        </Heading>
        <Actions>
          <form action={submit} style={{ display: "contents" }}>
            <SubmitButton $size="lg">Send a fresh link</SubmitButton>
          </form>
          <Button
            type="button"
            $variant="outline"
            $size="lg"
            onClick={onDifferentEmail}
          >
            Use a different email
          </Button>
        </Actions>
      </Column>
    </Screen>
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

/**
 * The sign-in form is the whole screen, and the email you type is its biggest thing. "Email" is a
 * small label above it, and the button is the kit's large button, the same as on every other
 * screen. Still the kit's Input.
 */
const BigForm = styled(Form)`
  gap: var(--space-5);

  /* A small label: what you type is the big thing on the page. */
  label {
    margin-bottom: 0;
    font-size: var(--text-md);
    font-weight: var(--weight-medium);
    line-height: var(--leading-ui);
    color: var(--color-brand-heading);
  }

  /* Just an underline. Focus and errors thicken it and change its colour. */
  input {
    height: auto;
    padding: var(--space-2) 0;
    border: 0;
    border-bottom: 1px solid var(--color-border-strong);
    border-radius: 0;
    background: transparent;
    font-size: var(--text-xl);
    letter-spacing: var(--tracking-tight);
    line-height: var(--leading-heading);

    /* On a phone, a long address like priya.patel@waterlooregion.org still fits on the line. */
    @media (max-width: 480px) {
      font-size: var(--text-lg);
    }
  }
  input:focus,
  input:focus-visible {
    border-bottom-color: var(--color-focus);
    box-shadow:
      0 1px 0 0 var(--color-focus),
      var(--focus-ring-text);
  }
  input[aria-invalid="true"],
  input[aria-invalid="true"]:focus,
  input[aria-invalid="true"]:focus-visible {
    border-bottom-color: var(--color-danger);
    box-shadow:
      0 1px 0 0 var(--color-danger),
      var(--focus-ring-text-invalid);
  }

  /* The hint or error under the line sits as close to it as the label sits above the text. */
  & span:has(> input) + div {
    margin-top: var(--space-1);
    font-size: var(--text-sm);
  }
  & span:has(> input) + div > span {
    font-size: inherit;
  }
`;

/** Names the page for screen readers; visually the page is just the field. */
const VisuallyHiddenHeading = styled.h1`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
`;

const Note = styled.p`
  margin: 0;
  font-size: var(--text-lg);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;

/** One inbox button fills the row; two (work or school address) split it. */

/**
 * Open Gmail across the top, Resend and "Use a different email" side by side under it, all gray
 * and the same height, with the same gap across and down. They stack on a phone. While the
 * countdown runs, the disabled Resend keeps readable text.
 */
const InboxActions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);

  & > [data-wide] {
    grid-column: 1 / -1;
  }

  /* The kit's large button, 4px taller top and bottom. */
  & button {
    height: calc(var(--control-height) + var(--space-3));
  }

  & button:disabled {
    opacity: 1;
    color: var(--color-text-muted);
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;
