"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { css, keyframes, styled } from "next-yak";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { RadioGroup, RadioGroupOption } from "@/components/ui/RadioGroup";
import { Separator } from "@/components/ui/Separator";
import { AuthActions, AuthColumn, AuthHeading, AuthScreen, SdcLogo } from "@/features/auth/AuthScreen";

/*
 * Pieces shared by the email flow (/design/unsubscribe) and the cancel-membership flow
 * (/design/cancel-membership), so both follow the same three patterns (see README.md):
 * 1. One template: logo, green heading with what happened right under it, content, actions, and an
 *    undo set apart by a divider.
 * 2. A question is one bordered list of answers. Nothing opens under an answer: what follows an
 *    answer is the next step.
 * 3. A result shows as a new screen whose heading says what happened, or as a toast for a saved
 *    setting. An undo, when there is one, is a muted line with a text button.
 *
 * Motion: the logo and heading stay put from screen to screen; the heading's words cross-fade and
 * what's under it slides in from the side it came from (Shallot). A first load doesn't move. This is
 * a deliberate exception to docs/design/motion.md (page entrances are static, nudges 4px at most):
 * confirm with the design-system owner before it ships.
 */

/* ---- Light mode ---- */

/**
 * Member-facing pages are always light, whatever the device or the admin theme switch says (Shallot):
 * sets data-theme="light" on <html> while the page is open, and puts back what was there on leaving.
 * It doesn't touch the saved admin preference. For devs: a dark-mode device can see one dark frame on
 * first load before this runs; the product should set data-theme="light" on the server for these routes.
 */
export function LightOnly() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const before = root.getAttribute("data-theme");
    root.setAttribute("data-theme", "light");
    return () => {
      if (before === null) root.removeAttribute("data-theme");
      else root.setAttribute("data-theme", before);
    };
  }, []);
  return null;
}

/* ---- Template ---- */

/**
 * Sections sit further apart than AuthColumn's default, so the heading and its line read as one group.
 * `$flow` widens the column to the flow width for side-by-side offer cards.
 */
const Column = styled(AuthColumn)<{ $flow?: boolean }>`
  gap: var(--space-6);
  ${({ $flow }) =>
    $flow &&
    css`
      max-width: var(--flow-width);
    `}
`;

/**
 * The page's bottom row: "Keep membership" on the left, the way forward (Continue, Continue to
 * cancel) on the right. Natural-width buttons, not full width. On a narrow phone the right button
 * wraps under the left one and stays right-aligned.
 */
const FooterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  width: 100%;

  & > :last-child {
    margin-left: auto;
  }
`;

/* ---- Offers ---- */

/** Measures the space the offer cards have, so they stack by their own width, not the window's. */
const OfferSpace = styled.div`
  container-type: inline-size;
  width: 100%;
`;

/**
 * Offer cards side by side whenever they fit, phones included. They stack only below 300px of room
 * (a 320px phone): two cards of about 142px (a 20px card inset each side around a "Continue" button)
 * plus the 16px gap.
 */
const OfferColumns = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: var(--space-4);

  @container (max-width: 299px) {
    grid-auto-flow: row;
  }
`;

export function OfferGrid({ children }: { children: ReactNode }) {
  return (
    <OfferSpace>
      <OfferColumns>{children}</OfferColumns>
    </OfferSpace>
  );
}

/** A card's subheading (a tier's price): body size and near-black, so it reads as part of the offer, not small print. */
const OfferSubheading = styled.p`
  margin: 0 0 var(--space-1);
  font-size: var(--text-md);
  line-height: var(--leading-ui);
  color: var(--color-text);
`;

/** An offer card fills the content's width, alone or in a row. */
const FullCard = styled(Card)`
  width: 100%;
`;

/** The card's accept button fills the card's width. */
const OfferFooter = styled(CardFooter)`
  & > * {
    flex: 1;
  }
`;

/**
 * One retention offer: a kit Card with a title, one line, and the button that accepts it. The title is
 * the card's h3; offer pages have no h2, which WCAG allows (heading order is a best practice).
 */
export function OfferCard({
  title,
  subheading,
  description,
  action,
}: {
  title: string;
  /** Near-black, body size, under the title (a tier's price). */
  subheading?: ReactNode;
  /** Muted small print under the title. */
  description?: ReactNode;
  action: ReactNode;
}) {
  return (
    <FullCard>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {subheading && <OfferSubheading>{subheading}</OfferSubheading>}
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <OfferFooter>{action}</OfferFooter>
    </FullCard>
  );
}

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
 * A date range on its own line inside a `Lead`, larger and medium weight, so it reads like a
 * certificate: "April 2023 to November 2026" on the cancelled page.
 */
export const Tenure = styled.span`
  display: block;
  margin: var(--space-2) 0;
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  color: var(--color-text);
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

/* ---- Pattern 2: answers ---- */

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


/** A checkbox or answer label at body size; the kit's labels are form-label size. */
export const ChoiceText = styled.span`
  font-size: var(--text-md);
  line-height: var(--leading-ui);
  color: var(--color-text);
`;

interface Option<T extends string> {
  value: T;
  label: string;
}

export function Options<T extends string>({
  id,
  question,
  plain,
  options,
  value,
  onChange,
}: {
  id: string;
  question: string;
  /** Show `question` as a body-size sentence (`Lead`), not a medium-weight question: for an explanation above the list. */
  plain?: boolean;
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <Stack>
      {plain ? <Lead id={id}>{question}</Lead> : <Question id={id}>{question}</Question>}
      <RadioGroup aria-labelledby={id} value={value ?? ""} onValueChange={(v) => onChange(v as T)}>
        <OptionList>
          {options.map((o) => (
            <RadioGroupOption key={o.value} value={o.value} label={<ChoiceText>{o.label}</ChoiceText>} />
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

/* ---- The cancelled page's layout options (?layout=) ---- */

const KeepsakeContent = styled(CardContent)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  text-align: center;
`;

/**
 * Option 1: the membership as a keepsake card. A label, their name (the card's h3), their tier, and
 * the dates on their own larger line. Kit Card, Badge and Tenure; layout only.
 */
export function MembershipCard({ label, name, tier, dates }: { label: string; name: string; tier: string; dates: string }) {
  return (
    <FullCard>
      <KeepsakeContent>
        <CardDescription>{label}</CardDescription>
        <CardTitle>{name}</CardTitle>
        <Badge $variant="outline">{tier}</Badge>
        <Tenure>{dates}</Tenure>
      </KeepsakeContent>
    </FullCard>
  );
}

const NoteBlock = styled.figure`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
  text-align: center;
`;

const Quote = styled.blockquote`
  margin: 0;
`;

/** Option 3: a short note signed by someone at SDC. The words near-black, the signature small print. */
export function SignedNote({ children, signature }: { children: ReactNode; signature: string }) {
  return (
    <NoteBlock>
      <Quote>
        <Lead>{children}</Lead>
      </Quote>
      <figcaption>
        <Note>{signature}</Note>
      </figcaption>
    </NoteBlock>
  );
}

const Big = styled.p`
  margin: 0;
  /* Half again the heading size, so the number is the first thing read. */
  font-size: calc(var(--text-xl) * 1.5);
  font-weight: var(--weight-medium);
  line-height: var(--leading-none);
  letter-spacing: var(--tracking-tight);
  color: var(--color-brand-heading);
`;

const BigBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  text-align: center;
`;

/** Option 2: the time they've been a member as one big number, with what it means and the dates under it. */
export function BigNumber({ value, caption, dates }: { value: string; caption: string; dates: string }) {
  return (
    <BigBlock>
      <Big>{value}</Big>
      <Lead>{caption}</Lead>
      <Note>{dates}</Note>
    </BigBlock>
  );
}

/* ---- Moving between screens ---- */

/**
 * Top-aligned, not centred like AuthScreen, so the logo and heading sit at the same height on every
 * screen however much is under them.
 */
const Screen = styled(AuthScreen)`
  place-items: start center;
  padding-top: var(--space-8);
  /* A screen sliding in starts 32px to the side: clip it so a phone doesn't scroll sideways mid-slide. */
  overflow-x: clip;

  @media (max-width: 480px) {
    padding-top: var(--space-6);
  }
`;

/** The heading, and the screen's contents under it. */
const Stage = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
`;

/** A shared-axis move: fade in while travelling 32px from the side it came from, decelerating. */
const fromRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(var(--space-6));
  }
`;
const fromLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(calc(-1 * var(--space-6)));
  }
`;

type Direction = "none" | "forward" | "back";

/** The heading's words cross-fade in place when they change. */
const HeadingText = styled(Heading)<{ $moved: boolean }>`
  ${({ $moved }) =>
    $moved &&
    css`
      animation: ${fadeIn} var(--duration-slow) var(--ease-out) both;
    `}
`;

/**
 * Everything under the heading: what happened, then the content and buttons. Slides in on a new
 * screen: from the right going forward, from the left going back. Without a line under the heading,
 * it starts a little lower so a question doesn't crowd the heading.
 */
const Body = styled.div<{ $dir: Direction; $hasLine: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  width: 100%;
  ${({ $hasLine }) =>
    !$hasLine &&
    css`
      padding-top: var(--space-2);
    `}
  ${({ $dir }) =>
    $dir === "forward" &&
    css`
      animation: ${fromRight} var(--duration-slow) var(--ease-out) both;
    `}
  ${({ $dir }) =>
    $dir === "back" &&
    css`
      animation: ${fromLeft} var(--duration-slow) var(--ease-out) both;
    `}
`;

/**
 * Which way the new screen came from, by `order` (its place in the flow): a lower order is going
 * back. The first screen shown doesn't move. Kept in state, React's pattern for comparing with the
 * previous render.
 */
function useDirection(screenKey: string, order: number) {
  const [last, setLast] = useState({ screenKey, order, dir: "none" as Direction });
  if (last.screenKey !== screenKey) {
    const dir: Direction = order < last.order ? "back" : "forward";
    setLast({ screenKey, order, dir });
    return dir;
  }
  return last.dir;
}

/**
 * Pattern 1: the template every screen fills. The logo and heading stay where they are between
 * screens; everything under the heading is keyed by `screenKey`, so each screen's contents are fresh.
 * - `order`: the screen's place in the flow, so going back slides the other way.
 * - `line`: what happened, in one or two sentences, right under the heading (near-black, `Lead`).
 *   Every screen uses this one treatment; grey (`Note`) is only for small print in `children`.
 * - `undo`: a muted question and a text button, after a divider below the actions.
 * - `footer`: the bottom row, Keep membership left and the way forward right (`FooterRow`).
 * - `flow`: the wider column, for side-by-side offer cards.
 */
export function Template({
  screenKey,
  order = 0,
  heading,
  line,
  children,
  actions,
  undo,
  footer,
  flow,
}: {
  screenKey: string;
  order?: number;
  heading: string;
  line?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  undo?: ReactNode;
  footer?: ReactNode;
  flow?: boolean;
}) {
  const dir = useDirection(screenKey, order);
  return (
    <Screen>
      <Column $wide $flow={flow}>
        <SdcLogo />
        <Stage>
          <HeadingText key={heading} $moved={dir !== "none"}>
            <AuthHeading title={heading} />
          </HeadingText>
          <Body key={screenKey} $dir={dir} $hasLine={Boolean(line)}>
            {line && <Lead>{line}</Lead>}
            {children}
            {actions && <AuthActions>{actions}</AuthActions>}
            {footer && <FooterRow>{footer}</FooterRow>}
            {undo && (
              <UndoSection>
                <Separator />
                <UndoLine>{undo}</UndoLine>
              </UndoSection>
            )}
          </Body>
        </Stage>
      </Column>
    </Screen>
  );
}

/* ---- Confetti ---- */

/*
 * A small burst for "Keep membership" (Shallot): 28 pieces rise out of the thank-you line, drift
 * apart and fall away in about a second. Decorative, so hidden from screen readers and never in the
 * way of a click. Reduced motion is handled globally: the pieces finish at once, invisible.
 */

const burst = keyframes`
  0% {
    opacity: 1;
    transform: translate(0, 0) rotate(0deg);
    animation-timing-function: var(--ease-out);
  }
  35% {
    opacity: 1;
    transform: translate(calc(var(--x) * 0.7), var(--rise)) rotate(calc(var(--spin) * 0.4));
    animation-timing-function: var(--ease-in);
  }
  100% {
    opacity: 0;
    transform: translate(var(--x), var(--fall)) rotate(var(--spin));
  }
`;

const ConfettiOrigin = styled.div`
  position: absolute;
  top: 0;
  left: 50%;
  width: 0;
  height: 0;
  overflow: visible;
  pointer-events: none;
`;

const Piece = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  width: var(--space-2);
  height: var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--piece-color);
  opacity: 0;
  /* About a second and a quarter: an entrance-length beat, two and a half times over. */
  animation: ${burst} calc(var(--duration-enter) * 2.5) both;
  animation-delay: var(--delay);
`;

const pieceColors = ["var(--sdc-300)", "var(--sdc-500)", "var(--sdc-700)", "var(--color-accent)", "var(--color-warning)", "var(--color-info)"];

/** The same "random" numbers on the server and in the browser, so the page hydrates cleanly. */
function seeded(n: number) {
  const v = Math.sin(n * 12.9898) * 43758.5453;
  return v - Math.floor(v);
}

/** Each piece's path, in multiples of --space-1 (4px). */
const pieces = Array.from({ length: 28 }, (_, i) => {
  const spread = (i / 27) * 2 - 1; // -1 (far left) to 1 (far right)
  return {
    color: pieceColors[i % pieceColors.length],
    x: Math.round(spread * 40 + (seeded(i) - 0.5) * 16), // up to 160px out to each side
    rise: -Math.round(14 + seeded(i + 50) * 14), // 56 to 112px up
    fall: Math.round(20 + seeded(i + 100) * 20), // ends 80 to 160px below the line
    spin: Math.round((seeded(i + 150) - 0.5) * 1440),
    delay: Math.round(seeded(i + 200) * 120),
  };
});

export function Confetti() {
  return (
    <ConfettiOrigin aria-hidden="true">
      {pieces.map((p, i) => (
        <Piece
          key={i}
          style={
            {
              "--piece-color": p.color,
              "--x": `calc(${p.x} * var(--space-1))`,
              "--rise": `calc(${p.rise} * var(--space-1))`,
              "--fall": `calc(${p.fall} * var(--space-1))`,
              "--spin": `${p.spin}deg`,
              "--delay": `${p.delay}ms`,
            } as CSSProperties
          }
        />
      ))}
    </ConfettiOrigin>
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
