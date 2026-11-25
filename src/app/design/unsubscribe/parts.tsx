"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { styled } from "next-yak";
import { Collapsible, CollapsibleContent } from "@/components/ui/Collapsible";
import { RadioGroup, RadioGroupOption } from "@/components/ui/RadioGroup";
import { Separator } from "@/components/ui/Separator";
import { AuthActions, AuthColumn, AuthHeading, AuthScreen, SdcLogo } from "@/features/auth/AuthScreen";

/*
 * Pieces shared by the email flow (/design/unsubscribe) and the cancel-membership flow
 * (/design/cancel-membership), so both follow the same three patterns (see README.md):
 * 1. One template: logo, green heading with what happened right under it, content, actions, and an
 *    undo set apart by a divider.
 * 2. A question is one bordered list of answers; choosing one slides open its follow-up.
 * 3. A result shows as a new screen whose heading says what happened, or as a toast for a saved
 *    setting. An undo, when there is one, is a muted line with a text button.
 *
 * Motion follows docs/design/motion.md: screens and follow-up contents don't fade in (page entrances
 * are static); only the kit's Collapsible height reveal moves.
 */

/* ---- Template ---- */

/** Sections sit further apart than AuthColumn's default, so the heading and its line read as one group. */
const Column = styled(AuthColumn)`
  gap: var(--space-6);
`;

/** The heading and what happened, one group: closer than sections (--space-6), with room to breathe. */
const HeadingGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
`;

/** The undo, after a divider: an afterthought, not the next step. */
const UndoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;
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

/** Content under the heading, full width. Messages in it are centred like the heading; questions and answer lists stay left-aligned. */
export const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;
`;

/** A question above a list of answers, centred like the heading. */
export const Question = styled.h2`
  margin: 0;
  text-align: center;
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
`;

/** Small print, centred under the heading. Muted, 4.5:1. */
export const Note = styled.p`
  margin: 0;
  text-align: center;
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

/** What happened, at body size, near-black and centred. The template's line under the heading. */
export const Lead = styled.p`
  margin: 0;
  text-align: center;
  font-size: var(--text-md);
  line-height: var(--leading-ui);
  color: var(--color-text);

  &:focus {
    outline: none;
  }
`;

/**
 * A link inside a sentence: the sentence's colour, underlined so it isn't told apart by colour alone.
 * Same as the login page's ContactLink (src/app/login/SignInForm.tsx).
 */
export const TextLink = styled(Link)`
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
  border-radius: var(--radius-sm);

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
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


/** A follow-up's contents, inset under its answer. Padding also keeps focus rings inside the clip. */
export const FollowUpBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-1) var(--space-3) var(--space-3);
`;

/** A checkbox or answer label at body size; the kit's labels are form-label size. */
export const ChoiceText = styled.span`
  font-size: var(--text-md);
  line-height: var(--leading-ui);
  color: var(--color-text);
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
                  <CollapsibleContent>
                    <FollowUpBody>{o.followUp}</FollowUpBody>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          ))}
        </OptionList>
      </RadioGroup>
    </Stack>
  );
}

/* ---- The undo ---- */

/** "Unsubscribed by mistake? Resubscribe": a muted line with a text button, centred. */
const UndoLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
`;

/**
 * Pattern 1: the template every screen fills. Keyed by `screenKey`, so each screen is a fresh tree.
 * - `line`: what happened, in one or two sentences, right under the heading (near-black, `Lead`).
 *   Every screen uses this one treatment; grey (`Note`) is only for small print in `children`.
 * - `undo`: a muted question and a text button, after a divider below the actions.
 */
export function Template({
  screenKey,
  heading,
  line,
  children,
  actions,
  undo,
}: {
  screenKey: string;
  heading: string;
  line?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  undo?: ReactNode;
}) {
  return (
    <AuthScreen>
      <Column $wide key={screenKey}>
        <SdcLogo />
        <HeadingGroup>
          <Heading>
            <AuthHeading title={heading} />
          </Heading>
          {line && <Lead>{line}</Lead>}
        </HeadingGroup>
        {children}
        {actions && <AuthActions>{actions}</AuthActions>}
        {undo && (
          <UndoSection>
            <Separator />
            <UndoLine>{undo}</UndoLine>
          </UndoSection>
        )}
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
