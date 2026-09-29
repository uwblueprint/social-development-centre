"use client";

import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
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
/*
 * Poster layout: someone walking past has about two seconds, so one huge line on a solid block does the
 * selling, and the form sits beside it (landscape) or under it (portrait) with nothing else competing.
 */
const Main = styled.main`
  display: grid;
  grid-template-rows: auto 1fr;
  align-content: start;
  min-height: 100dvh;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: var(--text-lg);
  line-height: var(--leading-body);
  transition: background-color var(--duration-slow) var(--ease);

  /* Wide: two full-height columns. */
  @media (min-width: 900px) {
    grid-template-rows: 1fr;
    grid-template-columns: 1fr 1fr;
    align-content: stretch;
  }
`;

/*
 * Narrow screens (owner): no poster. A plain heading and a short, quieter line sit in the form's
 * column, then a clear gap, then the fields, so the whole ask fits on a phone.
 * 900px and wider: the poster block on the left, the form on the right.
 */
const Intro = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
  max-width: 32rem;
  justify-self: center;
  padding: var(--space-7) var(--space-5) 0;

  @media (min-width: 900px) {
    justify-content: center;
    gap: var(--space-4);
    max-width: none;
    padding: var(--space-8);
    background: var(--color-primary);
    color: var(--color-on-primary);
  }
`;

const IntroHeading = styled.h1`
  margin: 0;
  font-size: var(--text-xl);
  line-height: var(--leading-heading);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-tight);
  overflow-wrap: anywhere;

  /* Owner: the display size was too loud; the poster block carries the emphasis. */
  @media (min-width: 900px) {
    max-width: 16ch;
  }
`;

const IntroBody = styled.p`
  margin: 0;
  font-size: var(--text-md);
  color: var(--color-text-muted);

  @media (min-width: 900px) {
    max-width: 32ch;
    font-size: var(--text-lg);
    color: inherit;
  }
`;

/* The short line on phones, the full one on the poster; only one is ever displayed. */
const Narrow = styled.span`
  @media (min-width: 900px) {
    display: none;
  }
`;

const Wide = styled.span`
  display: none;

  @media (min-width: 900px) {
    display: inline;
  }
`;

const Panel = styled.div`
  display: grid;
  align-content: start;
  gap: var(--space-5);
  width: 100%;
  max-width: 32rem;
  justify-self: center;
  /* A clear gap between the heading and the first field. */
  padding: var(--space-7) var(--space-5);

  @media (min-width: 900px) {
    align-content: center;
    padding: var(--space-8) var(--space-6);
  }
`;

const Heading = styled.h1`
  margin: 0;
  font-size: var(--text-xl);
  line-height: var(--leading-heading);
  font-weight: var(--weight-medium);
  overflow-wrap: anywhere;

  &:focus {
    outline: none;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  scroll-margin: var(--space-5);

  label {
    font-size: var(--text-md);
    font-weight: var(--weight-medium);
    line-height: var(--leading-ui);
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

/* Success: one centred column on a soft green screen, read top to bottom in a couple of seconds. */
const SuccessMain = styled.main`
  display: grid;
  place-items: center;
  min-height: 100dvh;
  padding: var(--space-7) var(--space-5);
  background: var(--color-success-subtle);
  color: var(--color-text);
  font-size: var(--text-lg);
  line-height: var(--leading-body);
  text-align: center;
`;

const Done = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 28rem;
`;

const DoneIcon = styled.span`
  display: inline-flex;
  margin-bottom: var(--space-5);
  color: var(--color-success);
`;

const DoneBody = styled.p`
  margin: var(--space-2) 0 var(--space-7);
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
`;

const Countdown = styled.p`
  margin: var(--space-4) 0 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
`;

/** Tokens, read at runtime: confetti draws on a canvas, which can't use CSS variables directly. */
const CONFETTI_TOKENS = ["--color-success", "--color-category-1", "--color-category-2", "--color-category-3", "--color-warning"];

function celebrate() {
  const styles = getComputedStyle(document.documentElement);
  const colors = CONFETTI_TOKENS.map((t) => styles.getPropertyValue(t).trim()).filter(Boolean);
  // `disableForReducedMotion` skips it for people who ask for less motion.
  const burst = { particleCount: 80, spread: 70, startVelocity: 45, colors, disableForReducedMotion: true };
  void confetti({ ...burst, angle: 60, origin: { x: 0, y: 0.7 } });
  void confetti({ ...burst, angle: 120, origin: { x: 1, y: 0.7 } });
}

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

  // Success is its own screen: the sign-up pitch is done, so only the confirmation shows.
  if (done) {
    return (
      <SuccessMain>
        <Confirmation name={done.name} email={done.email} onNext={onNext} />
      </SuccessMain>
    );
  }

  return (
    <Main>
      <Intro>
        <IntroHeading>{copy.heading}</IntroHeading>
        <IntroBody>
          <Narrow>{copy.introShort}</Narrow>
          <Wide>{copy.intro}</Wide>
        </IntroBody>
      </Intro>
      <Panel>
        {/* autoComplete off: this is a shared tablet, so it must never suggest the last person's details. */}
        <Form action={action} noValidate autoComplete="off">
          {/* Both fields are required, so neither shows "(required)"; the inputs still carry `required`. */}
          <Field label={copy.nameLabel} error={fieldError(state, "name")}>
            {(props) => (
              <Input
                {...props}
                ref={nameRef}
                name="name"
                required
                autoComplete="off"
                autoCapitalize="words"
                defaultValue={state.data?.name}
              />
            )}
          </Field>
          <Field label={copy.emailLabel} error={fieldError(state, "email")}>
            {(props) => (
              <Input
                {...props}
                ref={emailRef}
                name="email"
                required
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
      </Panel>
    </Main>
  );
}

function Confirmation({ name, email, onNext }: { name: string; email: string; onNext: () => void }) {
  const [left, setLeft] = useState(RESET_SECONDS);
  const [paused, setPaused] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
    celebrate();
  }, []);

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
        <Icon icon={CircleCheck} size={64} />
      </DoneIcon>
      <Heading ref={headingRef} tabIndex={-1}>
        {copy.done(firstName(name))}
      </Heading>
      <DoneBody>{copy.doneBody(email)}</DoneBody>
      <BigButton $size="lg" type="button" onClick={onNext}>
        {copy.next}
      </BigButton>
      <Countdown>{paused ? copy.paused : copy.countdown(Math.max(left, 0))}</Countdown>
    </Done>
  );
}
