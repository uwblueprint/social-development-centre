"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { css, keyframes, styled } from "next-yak";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { RadioGroup, RadioGroupOption } from "@/components/ui/RadioGroup";
import { Separator } from "@/components/ui/Separator";
import { AuthActions, SdcLogo } from "@/features/auth/AuthScreen";

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
 * Motion: the logo and heading stay put from screen to screen (the heading's words just change);
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

/** A card's subheading (a tier's price): body size and near-black, so it reads as part of the offer, not small print. */
const OfferSubheading = styled.p`
  margin: 0 0 var(--space-1);
  font-size: var(--text-md);
  line-height: var(--leading-ui);
  color: var(--color-text);
`;

/**
 * An offer card fills the content's width, alone or in a row. A column, so in a row of two the
 * buttons sit at the bottom and line up even when one card has more above them.
 */
const FullCard = styled(Card)`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

/** The card's accept button fills the card's width. */
const OfferFooter = styled(CardFooter)`
  margin-top: auto;
  & > * {
    flex: 1;
  }
`;

/**
 * One retention offer: a kit Card with a title, one line, and the button that accepts it. The title is
 * the card's h3; offer pages have no h2, which WCAG allows (heading order is a best practice).
 */
/** The title with a badge beside it (the member's current plan); wraps under on a narrow card. */
const TitleRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1) var(--space-2);

  & h3 {
    margin: 0;
  }
`;

/**
 * One retention offer: a kit Card with a title, one line, and the button that accepts it. The title is
 * the card's h3; offer pages have no h2, which WCAG allows (heading order is a best practice).
 */
export function OfferCard({
  title,
  badge,
  subheading,
  description,
  action,
}: {
  title: string;
  /** A short label beside the title, e.g. "Current plan". */
  badge?: string;
  /** Near-black, body size, under the title (a tier's price). */
  subheading?: ReactNode;
  /** Muted small print under the title. */
  description?: ReactNode;
  action: ReactNode;
}) {
  return (
    <FullCard>
      <CardHeader>
        <TitleRow>
          <CardTitle>{title}</CardTitle>
          {badge && <Badge $variant="outline">{badge}</Badge>}
        </TitleRow>
        {subheading && <OfferSubheading>{subheading}</OfferSubheading>}
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <OfferFooter>{action}</OfferFooter>
    </FullCard>
  );
}

/** Measures the space the offer cards have, so they stack by their own width, not the window's. */
const OfferSpace = styled.div`
  container-type: inline-size;
  width: 100%;
`;

/** Two offer cards side by side; stacked only below 300px of room (a 320px phone). */
const OfferColumns = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);

  @container (max-width: 299px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export function OfferPair({ children }: { children: ReactNode }) {
  return (
    <OfferSpace>
      <OfferColumns>{children}</OfferColumns>
    </OfferSpace>
  );
}

/* ---- Confirm a plan change ---- */

/** "You still have 20 days left": a quiet info panel (status tokens), centred. */
export const InfoPanel = styled.p`
  width: 100%;
  margin: 0;
  padding: var(--space-4);
  border: 1px solid var(--color-info-border);
  border-radius: var(--radius-lg);
  background: var(--color-info-subtle);
  color: var(--color-text);
  line-height: var(--leading-ui);
`;

const Benefits = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
  gap: var(--space-2) var(--space-4);
  width: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Benefit = styled.li`
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  line-height: var(--leading-ui);

  & svg {
    flex: none;
    margin-top: var(--space-1);
    color: var(--color-success);
  }
`;

/** What the member will have access to, each with a check (the words carry it, not the colour). */
export function BenefitList({ items }: { items: string[] }) {
  return (
    <Benefits>
      {items.map((item) => (
        <Benefit key={item}>
          <Icon icon={Check} size={16} />
          {item}
        </Benefit>
      ))}
    </Benefits>
  );
}

/** The undo, after a divider: an afterthought, not the next step. */
const UndoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;
`;

/** Content under the heading, full width, left-aligned like the heading. */
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

/** Small print. Muted, 4.5:1. */
export const Note = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);

  &:focus {
    outline: none;
  }
`;

/** A sentence that matters (the restart date, what a plan gives): body size, near-black. */
export const Lead = styled.p`
  margin: 0;
  font-size: var(--text-md);
  line-height: var(--leading-ui);
  color: var(--color-text);

  &:focus {
    outline: none;
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
  justify-content: flex-start;
  gap: var(--space-2);
`;

/* ---- The cancelled page ---- */

const Big = styled.p`
  margin: 0;
  /* Half again the heading size, so the number is the first thing read. */
  font-size: calc(var(--text-xl) * 1.5);
  font-weight: var(--weight-medium);
  line-height: var(--leading-none);
  letter-spacing: var(--tracking-tight);
  color: var(--color-brand-heading);
`;

const YearsContent = styled(CardContent)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  text-align: center;
`;

/** The way back in, at the bottom of the card, after a divider. */
const YearsFooter = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: 0 var(--space-5) var(--space-3);
`;

/**
 * The cancelled page's card: the time they've been a member as one big number, what it means, the
 * dates in small print, then the way back in after a divider (`rejoin`: a muted line and a text
 * button, like an undo).
 */
export function YearsCard({ value, caption, dates, rejoin }: { value: string; caption: string; dates: string; rejoin: ReactNode }) {
  return (
    <FullCard>
      <YearsContent>
        <Big>{value}</Big>
        <Lead>{caption}</Lead>
        <Note>{dates}</Note>
      </YearsContent>
      <YearsFooter>
        <Separator />
        <UndoLine>{rejoin}</UndoLine>
      </YearsFooter>
    </FullCard>
  );
}

/* ---- The page: matches the sign-in pages ---- */

/*
 * The same frame as the sign-in and "Check your inbox" pages (SignInParts.tsx on
 * gaurav/sign-in-magic-link): the logo centred at the top, one left-aligned column, a big emoji over a
 * display-size heading, and Waterloo Region's skyline along the bottom. One difference: the column
 * starts at a fixed height instead of being centred, so the heading stays put between steps.
 * For devs: once that branch is merged, both should use one shared frame.
 */

const Page = styled.main`
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr auto;
  /* One column no wider than the screen, so the wide skyline never makes the page scroll sideways. */
  grid-template-columns: minmax(0, 1fr);
  min-height: 100dvh;
  padding: var(--space-5) var(--space-4) 0;
  background: var(--color-bg);
  /* A screen sliding in starts 32px to the side: clip it so a phone doesn't scroll sideways mid-slide. */
  overflow-x: clip;
`;

const LogoSlot = styled.div`
  justify-self: center;
`;

/** Top-aligned, so the heading sits at the same height on every step. */
const Middle = styled.div`
  display: grid;
  place-items: start center;
  padding-block: var(--space-7) var(--space-8);

  @media (max-width: 480px) {
    padding-block: var(--space-6);
  }
`;

/**
 * The skyline is a mask over a token colour, so it's a quiet line drawing in light mode and stays
 * visible in dark mode (public/illustrations/waterloo-skyline.png, 1600×182, from the sign-in branch).
 * Decorative, so screen readers skip it.
 */
const Skyline = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  aspect-ratio: 1600 / 182;
  background-color: var(--color-border-strong);
  mask: url("/illustrations/waterloo-skyline.png") center bottom / contain no-repeat;
  -webkit-mask: url("/illustrations/waterloo-skyline.png") center bottom / contain no-repeat;
`;

/** The column: 624px like the sign-in pages, everything left-aligned. */
const Column = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-6);
  width: 100%;
  max-width: 624px;
`;

/** The back arrow, top left of the page: small, grey, quiet. */
const BackButton = styled(Button)`
  position: absolute;
  top: var(--space-4);
  left: var(--space-4);
  padding: 0 var(--space-2);
  color: var(--color-text-muted);
`;

const HeadingGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-4);
  width: 100%;
`;

const pop = keyframes`
  from {
    transform: scale(0.4) rotate(-12deg);
    opacity: 0;
  }
`;

const wave = keyframes`
  0%, 100% { transform: rotate(0deg); }
  20% { transform: rotate(16deg); }
  40% { transform: rotate(-8deg); }
  60% { transform: rotate(14deg); }
  80% { transform: rotate(-4deg); }
`;

/** The emoji says the mood at a glance; the heading under it says the same thing in words. Pops in on each new step. */
const Emoji = styled.span<{ $wave?: boolean }>`
  display: inline-block;
  font-size: var(--text-display);
  line-height: var(--leading-none);
  transform-origin: 70% 80%;
  animation: ${pop} var(--duration-slow) var(--ease-out) both;

  ${({ $wave }) =>
    $wave &&
    css`
      animation:
        ${pop} var(--duration-slow) var(--ease-out) both,
        ${wave} 1.2s var(--ease-out) 0.3s 1;
    `}
`;

const Title = styled.h1`
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-display);
  font-weight: var(--weight-medium);
  line-height: var(--leading-display);
  letter-spacing: var(--tracking-tight);
  color: var(--color-brand-heading);
  overflow-wrap: anywhere;
  text-wrap: balance;

  &:focus {
    outline: none;
  }
`;

/** What happened, under the heading: large and muted, with the facts (dates, amounts) near-black. */
const Description = styled.p`
  margin: 0;
  font-size: var(--text-lg);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
  text-wrap: pretty;

  strong {
    font-weight: var(--weight-medium);
    color: var(--color-text);
  }
`;

/**
 * Emoji glyphs carry empty space on their left, so the picture looks indented from the heading under
 * it. Measure where the ink starts in both and shift the emoji so the left edges line up (from the
 * sign-in pages).
 */
function alignInk(emojiEl: HTMLElement | null, titleEl: HTMLElement | null, emoji: string, title: string) {
  if (!emojiEl || !titleEl) return;
  const context = document.createElement("canvas").getContext("2d");
  if (!context) return;
  const inkStart = (el: HTMLElement, text: string) => {
    const style = getComputedStyle(el);
    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    return -context.measureText(text).actualBoundingBoxLeft;
  };
  const shift = inkStart(emojiEl, emoji) - inkStart(titleEl, title.charAt(0));
  emojiEl.style.marginInlineStart = `${-shift}px`;
}

function PageHeading({ emoji, title, wave: waving }: { emoji: string; title: string; wave?: boolean }) {
  const emojiRef = useRef<HTMLSpanElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => alignInk(emojiRef.current, titleRef.current, emoji, title), [emoji, title]);
  return (
    <HeadingGroup>
      {/* Keyed by the emoji, so a new one pops in. */}
      <Emoji key={emoji} ref={emojiRef} aria-hidden="true" $wave={waving}>
        {emoji}
      </Emoji>
      <Title ref={titleRef} tabIndex={-1}>
        {title}
      </Title>
    </HeadingGroup>
  );
}

/* ---- Moving between screens ---- */

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
 * - `onBack`: shows the back arrow top left. Every screen but a flow's first one.
 * - `backLabel`: the arrow's name for screen readers.
 * - `line`: what happened, in one or two sentences, right under the heading (near-black, `Lead`).
 *   Every screen uses this one treatment; grey (`Note`) is only for small print in `children`.
 * - `undo`: a muted question and a text button, after a divider below the actions.
 * - `footer`: the bottom row, Keep membership left and the way forward right (`FooterRow`).
 */
export function Template({
  screenKey,
  order = 0,
  onBack,
  backLabel = "Back",
  emoji,
  wave: waving,
  heading,
  line,
  children,
  actions,
  undo,
  footer,
}: {
  screenKey: string;
  order?: number;
  onBack?: () => void;
  backLabel?: string;
  /** One emoji above the heading that says the mood (decorative: the heading says it in words). */
  emoji: string;
  /** The emoji waves once on arrival, for goodbyes. */
  wave?: boolean;
  heading: string;
  line?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  undo?: ReactNode;
  footer?: ReactNode;
}) {
  const dir = useDirection(screenKey, order);
  return (
    <Page>
      {onBack && (
        <BackButton type="button" $variant="ghost" $size="sm" aria-label={backLabel} onClick={onBack}>
          <Icon icon={ArrowLeft} size={20} />
        </BackButton>
      )}
      <LogoSlot>
        <SdcLogo />
      </LogoSlot>
      <Middle>
        <Column>
          <PageHeading emoji={emoji} title={heading} wave={waving} />
          <Body key={screenKey} $dir={dir} $hasLine={Boolean(line)}>
            {line && <Description>{line}</Description>}
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
        </Column>
      </Middle>
      <Skyline aria-hidden="true" />
    </Page>
  );
}

/* ---- Confetti ---- */

/*
 * A small burst for "Keep membership" and "Rejoin SDC" (Shallot): 28 paper pieces shoot up out of
 * the thank-you line, hang for a moment, then flutter down and fade.
 *
 * Exempt from docs/design/motion.md (Shallot: "allow confetti to bypass rules"): its own duration and
 * curves, chosen to read as paper under gravity, not UI. Still decorative, so hidden from screen
 * readers and never in the way of a click; reduced motion is still honoured (handled globally: the
 * pieces finish at once, invisible), because that's accessibility, not style.
 */

const burst = keyframes`
  0% {
    opacity: 1;
    transform: translate(0, 0) rotate(0deg) rotateY(0deg);
    /* Shot upward: fast out, slowing to the top of the arc. */
    animation-timing-function: cubic-bezier(0.15, 0.7, 0.3, 1);
  }
  30% {
    opacity: 1;
    transform: translate(calc(var(--x) * 0.6), var(--rise)) rotate(calc(var(--spin) * 0.3)) rotateY(180deg);
    /* Falling: picks up speed, but paper never falls hard. */
    animation-timing-function: cubic-bezier(0.45, 0, 0.75, 0.6);
  }
  80% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(var(--x), var(--fall)) rotate(var(--spin)) rotateY(900deg);
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
  /* Its own length (exempt from the motion tokens): long enough to see the pieces land. */
  animation: ${burst} 1.6s both;
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
