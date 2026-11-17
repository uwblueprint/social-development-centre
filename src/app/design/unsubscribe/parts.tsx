"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { keyframes, styled } from "next-yak";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Collapsible, CollapsibleContent } from "@/components/ui/Collapsible";
import { Icon } from "@/components/ui/Icon";
import { RadioGroup, RadioGroupOption } from "@/components/ui/RadioGroup";
import { AuthActions, AuthColumn, AuthHeading, AuthScreen, SdcLogo } from "@/features/auth/AuthScreen";

/*
 * Pieces shared by the email flow (/design/unsubscribe) and the cancel-membership flow
 * (/design/cancel-membership), so both follow the same three patterns (see README.md):
 * 1. One template: logo, green heading (with at most one short line under it), content, actions.
 * 2. A question is one bordered list of answers; choosing one slides open its follow-up.
 * 3. The button a person presses changes its text to the result and stops doing anything. An undo,
 *    when there is one, is a muted line with a text button.
 */

/* ---- Template ---- */

export const fadeIn = keyframes`
  from {
    opacity: 0;
  }
`;

/** Each new screen fades in (reduced motion is handled globally). Key it by screen. */
export const Column = styled(AuthColumn)`
  animation: ${fadeIn} var(--duration) var(--ease);
`;

/**
 * The green heading, sized to the width it has: full size in the 440px column, smaller as the
 * screen narrows (about 23px on a 360px phone). A container query, so every screen gets it from
 * the template. For devs: this belongs in AuthHeading itself (src/features/auth/AuthScreen.tsx).
 */
export const Heading = styled.div`
  container-type: inline-size;
  width: 100%;

  & h1 {
    font-size: clamp(var(--text-lg), 7cqi, var(--text-xl));
  }
`;

/** Content under the heading: left-aligned, full width. */
export const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;
`;

/** A question above a list of answers. */
export const Question = styled.h2`
  margin: 0;
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
`;

/** Small print, left-aligned. Muted, 4.5:1. */
export const Note = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);

  &:focus {
    outline: none;
  }
`;

/** A follow-up's description: smaller than the answer above it, so the answer reads first. */
export const Body = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
`;

/** A message the page is about, at body size (the membership line after unsubscribing). */
export const Lead = styled.p`
  margin: 0;
  font-size: var(--text-md);
  line-height: var(--leading-ui);
  color: var(--color-text);

  &:focus {
    outline: none;
  }
`;

/* ---- Pattern 2: answers with follow-ups ---- */

/** One bordered group of answers, divided by 1px lines (no shadow: shadows are for overlays). */
export const OptionList = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);

  > * + * {
    border-top: 1px solid var(--color-border);
  }
`;

/** A follow-up slides open at the slower height duration, the token for "things with real distance". */
export const FollowUp = styled(CollapsibleContent)`
  &&[data-state] {
    animation-duration: var(--duration-slow);
  }
`;

/** A follow-up's contents, inset under its answer. Padding also keeps focus rings inside the clip. */
export const FollowUpBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-1) var(--space-3) var(--space-3);
  animation: ${fadeIn} var(--duration-slow) var(--ease);
`;

/** A checkbox or answer label at body size; the kit's labels are form-label size. */
export const ChoiceText = styled.span`
  font-size: var(--text-md);
  line-height: var(--leading-ui);
  color: var(--color-text);
`;

export const Choices = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

interface Option<T extends string> {
  value: T;
  label: string;
  followUp?: ReactNode;
}

export function Options<T extends string>({
  id,
  question,
  options,
  value,
  onChange,
}: {
  id: string;
  question: string;
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <Stack>
      <Question id={id}>{question}</Question>
      <RadioGroup aria-labelledby={id} value={value ?? ""} onValueChange={(v) => onChange(v as T)}>
        <OptionList>
          {options.map((o) => (
            <div key={o.value}>
              <RadioGroupOption value={o.value} label={<ChoiceText>{o.label}</ChoiceText>} />
              {o.followUp && (
                <Collapsible open={value === o.value}>
                  <FollowUp>
                    <FollowUpBody>{o.followUp}</FollowUpBody>
                  </FollowUp>
                </Collapsible>
              )}
            </div>
          ))}
        </OptionList>
      </RadioGroup>
    </Stack>
  );
}

/* ---- Pattern 3: results ---- */

/**
 * A pressed button's result: same place, its text says what happened, and it does nothing more.
 * aria-disabled on the secondary style, not `disabled`: the kit fades disabled buttons below 4.5:1,
 * and this text needs reading. No disabled reason (design: the label explains it). It's a plain kit
 * Button (a function, not a component) so React updates the pressed button in place and focus stays
 * on it; no transition, so it doesn't fade through the old button's colours.
 */
export const done = (label: string) => (
  <Button type="button" $variant="secondary" $size="lg" aria-disabled="true" style={{ transition: "none" }}>
    <Icon icon={Check} size={16} />
    {label}
  </Button>
);

/** "Unsubscribed by mistake? Resubscribe": a muted line with a text button. */
export const UndoLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
`;

/**
 * A result line that replaces a button that's gone (Resubscribe, Restart). Fades in and takes focus,
 * so keyboard and screen-reader users aren't dropped at the top of the page.
 */
export function StatusLine({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <FadingNote ref={ref} role="status" tabIndex={-1}>
      {children}
    </FadingNote>
  );
}

export const FadingNote = styled(Note)`
  animation: ${fadeIn} var(--duration) var(--ease);
`;

/** Pattern 1: the template every screen fills. Keyed by `screenKey` so each screen fades in. */
export function Template({
  screenKey,
  heading,
  line,
  children,
  actions,
}: {
  screenKey: string;
  heading: string;
  line?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <AuthScreen>
      <Column $wide key={screenKey}>
        <SdcLogo />
        <Heading>
          <AuthHeading title={heading} description={line} />
        </Heading>
        {children}
        {actions && <AuthActions>{actions}</AuthActions>}
      </Column>
    </AuthScreen>
  );
}

/** A new screen replaces the old one, so move focus to its heading for screen readers. */
export function useFocusHeadingOn(key: unknown) {
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    document.querySelector<HTMLElement>("main h1")?.focus();
  }, [key]);
}
