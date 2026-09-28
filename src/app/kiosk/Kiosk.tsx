"use client";

import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { styled } from "next-yak";
import { CircleAlert, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { fieldError } from "@/lib/forms";
import { signUpAtBooth, type KioskState } from "./actions";
import { kioskCopy as copy } from "./copy";
import { firstName } from "./firstName";

/** Seconds the confirmation stays up before the kiosk resets for the next person. */
const RESET_SECONDS = 20;

/*
 * Kiosk sizing: the kit's largest control is 44px with 16px text, so this page scales kit
 * components up to 48px targets and 19px text (--text-lg) for people standing at a tablet.
 * The page may scroll (dvh, never locked), so the on-screen keyboard can't trap a field under it.
 * On phones the content starts at the top so both fields show without scrolling; tablets center it.
 * After a sign-up the whole screen tints to --color-success-subtle (with an icon and text, not color alone).
 */
const Main = styled.main`
  display: grid;
  align-items: start;
  justify-items: center;
  min-height: 100dvh;
  padding: var(--space-5) var(--space-4) var(--space-7);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: var(--text-lg);
  line-height: var(--leading-body);
  transition: background-color var(--duration-slow) var(--ease);

  &[data-state="success"] {
    background: var(--color-success-subtle);
  }

  @media (min-width: 600px) and (min-height: 600px) {
    align-items: center;
    padding: var(--space-6);
  }
`;

const Panel = styled.div`
  display: grid;
  gap: var(--space-5);
  width: 100%;
  max-width: 36rem;

  @media (orientation: landscape) and (min-width: 900px) {
    grid-template-columns: 1fr 1fr;
    align-items: center;
    gap: var(--space-8);
    max-width: 64rem;
  }
`;

/* Deliberately quieter than the form: a short heading and one muted paragraph. */
const Intro = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

const IntroHeading = styled.h1`
  margin: 0;
  font-size: var(--text-lg);
  line-height: var(--leading-heading);
  font-weight: var(--weight-medium);
`;

const IntroBody = styled.p`
  margin: 0;
  font-size: var(--text-md);
  color: var(--color-text-muted);
`;

const Heading = styled.h2`
  margin: 0;
  font-size: var(--text-xl);
  line-height: var(--leading-heading);
  font-weight: var(--weight-regular);
  overflow-wrap: anywhere;

  &:focus {
    outline: none;
  }
`;

const Body = styled.p`
  margin: 0;
  overflow-wrap: anywhere;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  scroll-margin: var(--space-5);

  label,
  span {
    font-size: var(--text-lg);
  }

  input {
    height: var(--space-7);
    font-size: var(--text-lg);
  }

  /* Center the kit's invalid icon in the taller input. */
  span[aria-hidden="true"] {
    height: var(--space-7);
  }
`;

const BigSubmit = styled(SubmitButton)`
  width: 100%;
  height: var(--space-7);
  font-size: var(--text-lg);
`;

const BigButton = styled(Button)`
  width: 100%;
  height: var(--space-7);
  font-size: var(--text-lg);
`;

const Alert = styled.p`
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  margin: 0;

  svg {
    flex-shrink: 0;
    margin-top: var(--space-1);
    color: var(--color-danger);
  }
`;

const Done = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const DoneIcon = styled.span`
  display: inline-flex;
  color: var(--color-success);
`;

const Countdown = styled.p`
  margin: 0;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
`;

/** Centers a focused field in view, again once the on-screen keyboard has opened and resized the viewport. */
function useKeepFocusedFieldInView() {
  useEffect(() => {
    let timer: number | undefined;
    const center = () => {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement) el.scrollIntoView({ block: "center" });
    };
    const onFocusIn = (event: FocusEvent) => {
      if (!(event.target instanceof HTMLInputElement)) return;
      center();
      window.clearTimeout(timer);
      timer = window.setTimeout(center, 300); // after the keyboard's slide-in
    };
    document.addEventListener("focusin", onFocusIn);
    window.visualViewport?.addEventListener("resize", center);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("focusin", onFocusIn);
      window.visualViewport?.removeEventListener("resize", center);
    };
  }, []);
}

export function Kiosk({ location }: { location: string | null }) {
  // Each round is a fresh form: remounting clears the last person's details from the page.
  const [round, setRound] = useState(0);
  const next = useCallback(() => setRound((r) => r + 1), []);
  useKeepFocusedFieldInView();
  return <Round key={round} location={location} focusName={round > 0} onNext={next} />;
}

function Round({ location, focusName, onNext }: { location: string | null; focusName: boolean; onNext: () => void }) {
  const submit = useMemo(() => signUpAtBooth.bind(null, location), [location]);
  const [state, action] = useActionState<KioskState, FormData>(submit, { status: "idle" });
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusName) nameRef.current?.focus();
  }, [focusName]);

  useEffect(() => {
    if (state.status !== "error") return;
    if (state.fieldErrors?.name) nameRef.current?.focus();
    else if (state.fieldErrors?.email) emailRef.current?.focus();
  }, [state]);

  const done = state.status === "success" ? state.data : undefined;

  // Success keeps the two columns: the intro stays, and the confirmation takes the form's place.
  return (
    <Main data-state={done ? "success" : undefined}>
      <Panel>
        <Intro>
          <IntroHeading>{copy.heading}</IntroHeading>
          <IntroBody>{copy.intro}</IntroBody>
        </Intro>
        {done ? (
          <Confirmation name={done.name} email={done.email} onNext={onNext} />
        ) : (
          /* autoComplete off: this is a shared tablet, so it must never suggest the last person's details. */
          <Form action={action} noValidate autoComplete="off">
            <Field label={copy.nameLabel} required error={fieldError(state, "name")}>
              {(props) => (
                <Input
                  {...props}
                  ref={nameRef}
                  name="name"
                  autoComplete="off"
                  autoCapitalize="words"
                  defaultValue={state.data?.name}
                />
              )}
            </Field>
            <Field label={copy.emailLabel} required error={fieldError(state, "email")}>
              {(props) => (
                <Input
                  {...props}
                  ref={emailRef}
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  defaultValue={state.data?.email}
                />
              )}
            </Field>
            {state.status === "error" && state.message && (
              <Alert role="alert">
                <Icon icon={CircleAlert} size={20} />
                <span>{state.message}</span>
              </Alert>
            )}
            <BigSubmit $size="lg">{copy.submit}</BigSubmit>
          </Form>
        )}
      </Panel>
    </Main>
  );
}

function Confirmation({ name, email, onNext }: { name: string; email: string; onNext: () => void }) {
  const [left, setLeft] = useState(RESET_SECONDS);
  const [paused, setPaused] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => headingRef.current?.focus(), []);

  // Any touch or keypress pauses the reset (WCAG 2.2.1), so nobody loses the screen mid-read.
  useEffect(() => {
    if (paused) return;
    const pause = () => setPaused(true);
    document.addEventListener("pointerdown", pause);
    document.addEventListener("keydown", pause);
    const tick = window.setInterval(() => setLeft((s) => s - 1), 1000);
    return () => {
      document.removeEventListener("pointerdown", pause);
      document.removeEventListener("keydown", pause);
      window.clearInterval(tick);
    };
  }, [paused]);

  useEffect(() => {
    if (left <= 0) onNext();
  }, [left, onNext]);

  return (
    <Done>
      <DoneIcon>
        <Icon icon={CircleCheck} size={48} />
      </DoneIcon>
      <Heading ref={headingRef} tabIndex={-1}>
        {copy.done(firstName(name))}
      </Heading>
      <Body>{copy.doneBody(email)}</Body>
      <BigButton $size="lg" type="button" onClick={onNext}>
        {copy.next}
      </BigButton>
      <Countdown>{paused ? copy.paused : copy.countdown(Math.max(left, 0))}</Countdown>
    </Done>
  );
}
