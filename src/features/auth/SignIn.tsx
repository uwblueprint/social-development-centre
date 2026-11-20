"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
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
import { BSF_SUPPORT_EMAIL, SDC_CONTACT_EMAIL, SDC_MEMBERSHIP_URL, SDC_NEWSLETTER_URL } from "@/lib/contact";
import { normalizeEmail } from "@/lib/email";
import { isSignedIn, sendSignInLink, type SignInResult } from "./actions";
import { LinkButton } from "./AuthScreen";
import { inboxesFor, suggestEmail } from "./emailHints";
import { portals, safeAdminPath, type Portal } from "./portals";
import {
  Actions,
  Column,
  Followup,
  Form,
  FormMessage,
  Heading,
  InlineAction,
  QuietRow,
  Screen,
  StatusLine,
} from "./SignInParts";

const RESEND_AFTER_MS = 60_000;
const LINK_LIFETIME = "1 hour";
/** How often Check your inbox asks whether the link was opened in another tab. */
const SIGNED_IN_POLL_MS = 5_000;

const EMPTY_EMAIL = "We’ll need your email to send the link";
const BAD_EMAIL = "That doesn’t look like an email. Try something like name@waterlooregion.org";

type FormNotice = "rate-limited" | "offline";

type View =
  | { name: "form"; notice?: FormNotice }
  | {
      name: "sent";
      email: string;
      sentAt: number;
      notice?: "resent" | FormNotice;
    }
  | { name: "signed-in" }
  | { name: "not-member" }
  | { name: "expired" }
  | { name: "broken" }
  | { name: "no-access" }
  | { name: "failed" };

function viewForLinkError(linkError: string | undefined): View {
  switch (linkError) {
    case undefined:
      return { name: "form" };
    case "expired":
    case "broken":
    case "no-access":
      return { name: linkError };
    default:
      return { name: "failed" };
  }
}

/**
 * Sign-in by emailed link: enter your email, check your inbox, click the link. `linkError` and
 * `reason` come from the address: /auth/confirm sends link problems back as `?error=`, and
 * `?reason=` says why they're here (signed out, or their 7-day admin session ran out).
 */
export function SignIn({
  portal,
  linkError,
  reason,
  next,
}: {
  portal: Portal;
  linkError?: string;
  reason?: string;
  next?: string;
}) {
  const [view, setView] = useState<View>(() => viewForLinkError(linkError));
  const remembered = useRememberedEmail(portal);
  const router = useRouter();
  const home = (portal === "admin" && safeAdminPath(next)) || portals[portal].homePath;

  // A new screen replaces the old one, so move focus to its heading for screen readers.
  const focusHeading = useRef(false);
  useEffect(() => {
    if (!focusHeading.current) return;
    focusHeading.current = false;
    document.querySelector<HTMLElement>("main h1")?.focus();
  }, [view]);
  function show(nextView: View) {
    focusHeading.current = nextView.name !== view.name;
    setView(nextView);
  }
  const startOver = () => show({ name: "form" });

  /** Sends a link and moves to the not-member or failed screen when that's the answer. */
  async function send(email: string): Promise<SignInResult | "offline"> {
    if (!navigator.onLine) return "offline";
    const result = await sendSignInLink(portal, email, next).catch(() =>
      navigator.onLine ? ("failed" as const) : ("offline" as const),
    );
    if (result === "sent") rememberEmail(portal, email);
    else if (result === "not-allowed") show({ name: "not-member" });
    else if (result === "failed") show({ name: "failed" });
    return result;
  }

  if (view.name === "form") {
    return (
      <SignInForm
        // A fresh form when the remembered email arrives from storage after the first render.
        key={remembered ?? ""}
        remembered={reason === "signed-out" ? null : remembered}
        reason={reason}
        notice={view.notice}
        onSubmit={async (email) => {
          const result = await send(email);
          if (result === "sent") show({ name: "sent", email, sentAt: Date.now() });
          else if (result === "offline" || result === "rate-limited") setView({ name: "form", notice: result });
          return result;
        }}
        onForget={() => forgetEmail(portal)}
      />
    );
  }

  if (view.name === "sent") {
    return (
      <CheckEmail
        portal={portal}
        email={view.email}
        sentAt={view.sentAt}
        notice={view.notice}
        onResend={async () => {
          const result = await send(view.email);
          if (result === "sent") setView({ ...view, sentAt: Date.now(), notice: "resent" });
          else if (result === "offline" || result === "rate-limited") setView({ ...view, notice: result });
        }}
        onDifferentEmail={() => {
          forgetEmail(portal);
          startOver();
        }}
        onSignedIn={() => show({ name: "signed-in" })}
      />
    );
  }

  if (view.name === "signed-in") {
    return (
      <Screen>
        <Column>
          <Heading emoji="🎉" title="You’re in!">
            You opened the link in another tab. Carry on there, or right here
          </Heading>
          <Actions>
            <Button type="button" $size="lg" onClick={() => router.push(home)}>
              Take me to SDC
            </Button>
          </Actions>
        </Column>
      </Screen>
    );
  }

  if (view.name === "not-member") return <NotOnMemberList onTryAgain={startOver} />;

  if (view.name === "expired") {
    return (
      <LinkExpired
        email={remembered}
        onResend={async (email) => {
          const result = await send(email);
          if (result === "sent") show({ name: "sent", email, sentAt: Date.now() });
          else if (result === "offline" || result === "rate-limited") show({ name: "form", notice: result });
        }}
        onDifferentEmail={() => {
          forgetEmail(portal);
          startOver();
        }}
      />
    );
  }

  if (view.name === "broken") {
    return (
      <Screen>
        <Column>
          <Heading emoji="🔗" title="Hmm, this link is broken">
            Part of it went missing on the way. Click the button in the email instead of copying the link, or grab a new
            one
          </Heading>
          <Actions>
            <Button type="button" $size="lg" onClick={startOver}>
              Get a new link
            </Button>
          </Actions>
        </Column>
      </Screen>
    );
  }

  if (view.name === "no-access") {
    return (
      <Screen>
        <Column>
          <Heading emoji="🚪" title="You’re no longer an admin">
            Someone removed your access, so this link can’t sign you in. Need it back? Ask an SDC admin to add you again
          </Heading>
          <Actions>
            <Button type="button" $size="lg" onClick={startOver}>
              Back to sign in
            </Button>
          </Actions>
        </Column>
      </Screen>
    );
  }

  return (
    <Screen>
      <Column>
        <Heading emoji="🛠️" title="Well, that wasn’t supposed to happen">
          We couldn’t sign you in. Give it a minute and try again. Still stuck? Email {BSF_SUPPORT_EMAIL}
        </Heading>
        <Actions>
          <Button type="button" $size="lg" onClick={startOver}>
            Try again
          </Button>
        </Actions>
      </Column>
    </Screen>
  );
}

function SignInForm({
  remembered,
  reason,
  notice,
  onSubmit,
  onForget,
}: {
  remembered: string | null;
  reason?: string;
  notice?: FormNotice;
  onSubmit: (email: string) => Promise<unknown>;
  /** "Not you?": forget the remembered email on this device. */
  onForget: () => void;
}) {
  const [value, setValue] = useState(remembered ?? "");
  const [error, setError] = useState<string>();
  const suggestion = suggestEmail(value);

  /** Why they're here, when it isn't a plain first visit. One line above the field. */
  const note =
    reason === "expired"
      ? "🔒 It’s been a week! To keep everyone’s details safe, admins sign in again every 7 days"
      : reason === "signed-out"
        ? "👋 You’re signed out. See you soon"
        : remembered
          ? "👋 Welcome back. Your link is one click away"
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
    if (!typed) return setError(EMPTY_EMAIL);
    const email = normalizeEmail(typed);
    if (!email) return setError(BAD_EMAIL);
    setError(undefined);
    const result = await onSubmit(email);
    if (result === "invalid-email") setError(BAD_EMAIL);
  }

  return (
    <Screen>
      <Column>
        <VisuallyHiddenHeading tabIndex={-1}>Sign in to SDC</VisuallyHiddenHeading>
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
          {notice && <Notice notice={notice} />}
        </BigForm>
        {remembered && reason !== "expired" && (
          <QuietRow>
            <Button
              type="button"
              $variant="ghost"
              onClick={() => {
                onForget();
                setValue("");
                inputRef.current?.focus();
              }}
            >
              Not you? Use a different email
            </Button>
          </QuietRow>
        )}
      </Column>
    </Screen>
  );
}

function Notice({ notice }: { notice: FormNotice }) {
  return (
    <FormMessage role="alert">
      <Icon icon={notice === "offline" ? WifiOff : CircleAlert} size={20} />
      {notice === "offline"
        ? "Looks like you’re offline. Check your connection, then try again"
        : "Whoa, that’s a lot of links. Take 5 minutes, then try again"}
    </FormMessage>
  );
}

function CheckEmail({
  portal,
  email,
  sentAt,
  notice,
  onResend,
  onDifferentEmail,
  onSignedIn,
}: {
  portal: Portal;
  email: string;
  sentAt: number;
  notice?: "resent" | FormNotice;
  onResend: () => Promise<void>;
  onDifferentEmail: () => void;
  onSignedIn: () => void;
}) {
  const secondsLeft = useSecondsUntil(sentAt + RESEND_AFTER_MS);
  const inboxes = inboxesFor(email);
  useSignedInElsewhere(portal, sentAt, onSignedIn);

  return (
    <Screen>
      <Column>
        <Heading emoji="📬" title="Check your inbox">
          We sent a sign-in link to <strong>{email}</strong>
        </Heading>
        {notice === "resent" ? (
          <StatusLine role="status">
            <Icon icon={CircleCheck} size={20} />
            Sent another one. Use the newest email
          </StatusLine>
        ) : (
          notice && <Notice notice={notice} />
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
                {inbox.logo && <Image src={inbox.logo} alt="" width={20} height={15} />}
                {inbox.label}
              </Button>
            ))}
            <form action={onResend} style={{ display: "contents" }}>
              {secondsLeft > 0 ? (
                <DisabledArea reason="You can send another link once a minute has passed." block>
                  <Button type="button" $variant="secondary" $size="lg" disabled>
                    Resend in {formatCountdown(secondsLeft)}
                  </Button>
                </DisabledArea>
              ) : (
                <SubmitButton $variant="secondary" $size="lg">
                  Resend email
                </SubmitButton>
              )}
            </form>
            <Button type="button" $variant="secondary" $size="lg" onClick={onDifferentEmail}>
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
  /** The email this device last asked for a link with; the link itself doesn't say who it was for. */
  email: string | null;
  onResend: (email: string) => Promise<void>;
  onDifferentEmail: () => void;
}) {
  return (
    <Screen>
      <Column>
        <Heading emoji="⏳" title="This link has expired">
          Links only work once and only for {LINK_LIFETIME}.
          {email ? (
            <>
              {" "}
              Want a fresh one sent to <strong>{email}</strong>?
            </>
          ) : (
            " Enter your email and we’ll send a fresh one"
          )}
        </Heading>
        <Actions>
          {email ? (
            <>
              <form action={() => onResend(email)} style={{ display: "contents" }}>
                <SubmitButton $size="lg">Send a fresh link</SubmitButton>
              </form>
              <Button type="button" $variant="outline" $size="lg" onClick={onDifferentEmail}>
                Use a different email
              </Button>
            </>
          ) : (
            <Button type="button" $size="lg" onClick={onDifferentEmail}>
              Get a new link
            </Button>
          )}
        </Actions>
      </Column>
    </Screen>
  );
}

function NotOnMemberList({ onTryAgain }: { onTryAgain: () => void }) {
  return (
    <Screen>
      <Column>
        <Heading emoji="🙋" title="This email isn’t on our member list">
          You can become a member, or join our free newsletter to hear about opportunities in Waterloo Region
        </Heading>
        <Actions>
          <LinkButton href={SDC_MEMBERSHIP_URL}>Become a member</LinkButton>
          <LinkButton href={SDC_NEWSLETTER_URL} $variant="outline">
            Join the free newsletter
          </LinkButton>
          <Button type="button" $variant="outline" $size="lg" onClick={onTryAgain}>
            Try a different email
          </Button>
        </Actions>
        <Note>Already a member? Contact us at {SDC_CONTACT_EMAIL} and we’ll update your email</Note>
      </Column>
    </Screen>
  );
}

/**
 * While Check your inbox is open, ask the server every few seconds whether this browser is now signed
 * in, for when the link was opened in another tab. Stops when the link would have expired.
 */
function useSignedInElsewhere(portal: Portal, sentAt: number, onSignedIn: () => void) {
  const callback = useRef(onSignedIn);
  useEffect(() => {
    callback.current = onSignedIn;
  });
  useEffect(() => {
    let stopped = false;
    const timer = setInterval(async () => {
      if (Date.now() - sentAt > 60 * 60_000) return clearInterval(timer);
      if (document.hidden || !navigator.onLine) return;
      const signedIn = await isSignedIn(portal).catch(() => false);
      if (signedIn && !stopped) {
        clearInterval(timer);
        callback.current();
      }
    }, SIGNED_IN_POLL_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [portal, sentAt]);
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

// The email this device last sent a link to: for "Welcome back" and the expired-link screen, since the
// link itself doesn't say who it was for. Only on this device, and forgotten by "Not you?".
const emailKey = (portal: Portal) => `sdc-sign-in-email:${portal}`;
const storageListeners = new Set<() => void>();
function subscribeToStorage(listener: () => void) {
  storageListeners.add(listener);
  return () => {
    storageListeners.delete(listener);
  };
}

function rememberEmail(portal: Portal, email: string) {
  try {
    localStorage.setItem(emailKey(portal), email);
  } catch {
    // Storage is blocked (e.g. private browsing): the screens fall back to an empty field.
  }
  storageListeners.forEach((listener) => listener());
}

function forgetEmail(portal: Portal) {
  try {
    localStorage.removeItem(emailKey(portal));
  } catch {
    // Nothing stored, nothing to forget.
  }
  storageListeners.forEach((listener) => listener());
}

function useRememberedEmail(portal: Portal) {
  return useSyncExternalStore(
    subscribeToStorage,
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
    box-shadow: 0 1px 0 0 var(--color-focus);
  }
  input[aria-invalid="true"],
  input[aria-invalid="true"]:focus,
  input[aria-invalid="true"]:focus-visible {
    border-bottom-color: var(--color-danger);
    box-shadow: 0 1px 0 0 var(--color-danger);
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
