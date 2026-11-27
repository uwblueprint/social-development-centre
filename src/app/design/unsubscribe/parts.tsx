"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Image, { type StaticImageData } from "next/image";
import { ArrowLeft, Check } from "lucide-react";
import { css, keyframes, styled } from "next-yak";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
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

/* The photo card: the referral page's banner (SplitLayout.tsx on gaurav/referrals-wired). */

/** One card: the photo banner on top, the words under it. */
const PhotoBox = styled(Card)`
  overflow: hidden;
`;

/** The banner: an SDC event photo, a green shade over its lower part, the text at the bottom left. */
const Banner = styled.div`
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: var(--space-1);
  min-height: 240px;
  padding: var(--space-5);
  background: var(--sdc-950);
  color: var(--taupe-50);

  /* Clear at the top, deep green behind the text (the referral banner's Figma gradient, simplified). */
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    background: linear-gradient(
      188deg,
      color-mix(in oklch, var(--sdc-600) 0%, transparent) 35%,
      color-mix(in oklch, var(--sdc-950) 92%, transparent) 96%
    );
  }

  @media (max-width: 599px) {
    min-height: 220px;
  }
`;

const BannerPhoto = styled(Image)`
  z-index: -2;
  object-fit: cover;
  object-position: 60% center;
`;

/** The page heading's type (--text-xl), in white on the shade. */
const BannerTitle = styled.p`
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  letter-spacing: var(--tracking-tight);
  color: var(--taupe-50);

  &:focus {
    outline: none;
  }
`;

const BannerCaption = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--taupe-100);
`;

const PhotoBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-5) var(--space-5) var(--space-6);
`;

/**
 * A photo card like the referral page's: the photo with a title and caption over it, then `children`
 * under it in the same card. The photo is decorative (alt=""); the words carry it.
 */
export function PhotoCard({
  photo,
  title,
  caption,
  children,
}: {
  photo: StaticImageData;
  title: string;
  caption?: string;
  children: ReactNode;
}) {
  return (
    <PhotoBox>
      <Banner>
        <BannerPhoto src={photo} alt="" fill sizes="624px" priority />
        <BannerTitle>{title}</BannerTitle>
        {caption && <BannerCaption>{caption}</BannerCaption>}
      </Banner>
      <PhotoBody>{children}</PhotoBody>
    </PhotoBox>
  );
}

/**
 * An action inside a sentence ("You're welcome to rejoin anytime."): the sentence's colour, underlined
 * so it isn't told apart by colour alone. A real link to the step, so it also opens in a new tab; a
 * plain click is handled by the flow.
 */
export const InlineLink = styled.a`
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
  border-radius: var(--radius-sm);

  &:hover {
    color: var(--color-text);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

/* ---- The page: matches the sign-in pages ---- */

/*
 * The same frame as the sign-in and "Check your inbox" pages (SignInParts.tsx on
 * gaurav/sign-in-magic-link): the logo centred at the top and one left-aligned column. Differences
 * (Shallot): an emoji over the heading only after an offer is accepted (the space is always kept), no
 * skyline along the bottom, the heading at --text-xl, and the
 * column starts at a fixed height instead of being centred, so the heading stays put between steps.
 * For devs: once that branch is merged, both should use one shared frame.
 */

const Page = styled.main`
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr;
  /* One column no wider than the screen. */
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

const Title = styled.h1`
  margin: 0;
  font-family: var(--font-display);
  /* The size these flows had before (Shallot: the sign-in pages' --text-display is too big here). */
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
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

const pop = keyframes`
  from {
    transform: scale(0.4) rotate(-12deg);
    opacity: 0;
  }
`;

/**
 * The space above every heading, one emoji tall, so the heading sits at the same height on every
 * screen whether or not there's an emoji in it.
 */
const EmojiSlot = styled.div`
  height: calc(var(--text-display) * var(--leading-none));
`;

/**
 * An emoji pops in only once someone has accepted an offer (Shallot: "You've switched to Supporter"),
 * a small reward. Decorative: the heading says it in words.
 */
const Emoji = styled.span`
  display: inline-block;
  font-size: var(--text-display);
  line-height: var(--leading-none);
  transform-origin: 70% 80%;
  animation: ${pop} var(--duration-slow) var(--ease-out) both;
`;

/** The line under the heading and its button, close together so they read as one offer. */
const LineGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
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

const drawCheck = keyframes`
  to {
    stroke-dashoffset: 0;
  }
`;
const fillCircle = keyframes`
  to {
    fill-opacity: 1;
  }
`;
const checkOnFill = keyframes`
  to {
    stroke: var(--color-on-primary);
  }
`;

/**
 * A check in a circle that draws itself, then the circle fills (like the heart on the referral
 * page's thank-you screen, gaurav/referrals-wired): a green check and circle, then the circle fills
 * green and the check turns white (white on --color-success is 5.5:1). These pages are always light.
 * A brand moment, so it uses the entrance tokens. Decorative; reduced motion shows it finished.
 */
const CheckMark = styled.svg`
  width: calc(var(--text-display) * var(--leading-none));
  height: calc(var(--text-display) * var(--leading-none));
  color: var(--color-success);

  & circle {
    fill: var(--color-success);
    fill-opacity: 0;
    animation: ${fillCircle} var(--duration-slow) var(--ease-out) var(--duration-enter) forwards;
  }

  /* The check's path is about 12.1 units long; 13 hides all of it before it draws. */
  & path {
    stroke-dasharray: 13;
    stroke-dashoffset: 13;
    animation:
      ${drawCheck} var(--duration-enter) var(--ease-out) forwards,
      ${checkOnFill} var(--duration-slow) var(--ease-out) var(--duration-enter) forwards;
  }
`;

function DrawnCheck() {
  return (
    <CheckMark viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m8 12 3 3 5-6" />
    </CheckMark>
  );
}

/** The heading's words only (as wide as the longest line), so confetti bursts from the middle of them. */
const TitleWords = styled.span`
  position: relative;
  display: inline-block;
`;

/** The drawn check takes the length of the draw plus the fill. */
const AFTER_CHECK = "calc(var(--duration-enter) + var(--duration-slow))";

function PageHeading({
  title,
  emoji,
  check,
  confetti,
}: {
  title: string;
  emoji?: string;
  check?: boolean;
  confetti?: boolean;
}) {
  const emojiRef = useRef<HTMLSpanElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    if (emoji) alignInk(emojiRef.current, titleRef.current, emoji, title);
  }, [emoji, title]);
  return (
    <HeadingGroup>
      <EmojiSlot aria-hidden="true">
        {check && <DrawnCheck />}
        {!check && emoji && (
          // Keyed by the emoji, so a new one pops in.
          <Emoji key={emoji} ref={emojiRef}>
            {emoji}
          </Emoji>
        )}
      </EmojiSlot>
      <Title ref={titleRef} tabIndex={-1}>
        <TitleWords>
          {title}
          {/* After the check has drawn and filled, when there is one. */}
          {confetti && <Confetti start={check ? AFTER_CHECK : "0ms"} />}
        </TitleWords>
      </Title>
    </HeadingGroup>
  );
}

/* ---- The flow card (cancel membership) ---- */

/*
 * Shallot: every step of cancelling sits in one card, so the offers read as steps of one flow, not
 * standalone pages. Three sections: a header (back arrow and the flow's name) that stays put, the
 * step's content, and a footer with the step's two buttons. The card fills the window's height so the
 * footer sits in the same place on every step; when a step is taller than the window (phones), the
 * footer sticks to the bottom of the screen so its buttons are always in reach.
 */

/** Stretches the card to the bottom of the window instead of sitting at the top. */
const FramedMiddle = styled.div`
  display: grid;
  justify-items: center;
  padding-block: var(--space-6) var(--space-7);

  @media (max-width: 480px) {
    padding-block: var(--space-5);
  }
`;

const FlowCard = styled(Card)`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 624px;
`;

/** Back arrow left, the flow's name centred, an empty cell right so the name stays centred with or without the arrow. */
const FlowHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border);
`;

const FlowBack = styled(Button)`
  justify-self: start;
  padding: 0 var(--space-2);
  color: var(--color-text-muted);
`;

/** The flow's name: says where the person is on every step. Not a heading: each step's h1 is. */
const FlowName = styled.p`
  grid-column: 2;
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  line-height: var(--leading-ui);
  color: var(--color-text);
`;

const FlowContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-5) var(--space-6) var(--space-7);
  /* The slide-in starts to the side: keep it inside the card. */
  overflow-x: clip;

  @media (max-width: 480px) {
    padding: var(--space-4) var(--space-4) var(--space-6);
  }
`;

const FlowFooter = styled.div`
  position: sticky;
  bottom: 0;
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  background: var(--color-surface-raised);

  @media (max-width: 480px) {
    padding: var(--space-3) var(--space-4);
  }
`;

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
  heading,
  check,
  confetti,
  line,
  lineAction,
  children,
  actions,
  undo,
  footer,
  frame,
}: {
  /** The flow's name: puts the screen in a card with it in the header, the back arrow beside it and `footer` in the card's footer. */
  frame?: string;
  screenKey: string;
  order?: number;
  onBack?: () => void;
  backLabel?: string;
  /** An emoji over the heading, only after someone accepts an offer. The space for it is always there. */
  emoji?: string;
  /** Leave it out when something in `children` is the page's h1 (the cancelled page's photo card). */
  heading?: string;
  /** The drawn check in the emoji's place ("Your membership is active again"). */
  check?: boolean;
  /** A confetti burst from the middle of the heading's words (after the check, if there is one). */
  confetti?: boolean;
  line?: ReactNode;
  /** A button that belongs to `line`: right under it, close, at its natural width on the left. */
  lineAction?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  undo?: ReactNode;
  footer?: ReactNode;
}) {
  const dir = useDirection(screenKey, order);
  const heads = heading && <PageHeading title={heading} emoji={emoji} check={check} confetti={confetti} />;
  const body = (inCard: boolean) => (
    <Body key={screenKey} $dir={dir} $hasLine={Boolean(line)}>
      {line &&
        (lineAction ? (
          <LineGroup>
            <Description>{line}</Description>
            <div>{lineAction}</div>
          </LineGroup>
        ) : (
          <Description>{line}</Description>
        ))}
      {children}
      {actions && <AuthActions>{actions}</AuthActions>}
      {!inCard && footer && <FooterRow>{footer}</FooterRow>}
      {undo && (
        <UndoSection>
          <Separator />
          <UndoLine>{undo}</UndoLine>
        </UndoSection>
      )}
    </Body>
  );
  const back = (Button: typeof BackButton | typeof FlowBack) =>
    onBack && (
      <Button type="button" $variant="ghost" $size="sm" aria-label={backLabel} onClick={onBack}>
        <Icon icon={ArrowLeft} size={20} />
      </Button>
    );

  if (frame) {
    return (
      <Page>
        <LogoSlot>
          <SdcLogo />
        </LogoSlot>
        <FramedMiddle>
          <FlowCard>
            <FlowHeader>
              {back(FlowBack)}
              <FlowName>{frame}</FlowName>
            </FlowHeader>
            <FlowContent>
              {heads}
              {body(true)}
            </FlowContent>
            {footer && (
              <FlowFooter>
                <FooterRow>{footer}</FooterRow>
              </FlowFooter>
            )}
          </FlowCard>
        </FramedMiddle>
      </Page>
    );
  }

  return (
    <Page>
      {back(BackButton)}
      <LogoSlot>
        <SdcLogo />
      </LogoSlot>
      <Middle>
        <Column>
          {heads}
          {body(false)}
        </Column>
      </Middle>
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

/** The middle of whatever it's placed in (the heading's words). */
const ConfettiOrigin = styled.span`
  position: absolute;
  top: 50%;
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
  /* Its own length (exempt from the motion tokens): long enough to see the pieces land. Hidden until
     it starts (forwards, not both), so a delayed burst doesn't sit in a pile first. */
  animation: ${burst} 1.6s forwards;
  animation-delay: calc(var(--start) + var(--delay));
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

/** `start`: when the burst begins, e.g. after the drawn check (a CSS time). */
export function Confetti({ start = "0ms" }: { start?: string }) {
  return (
    <ConfettiOrigin aria-hidden="true" style={{ "--start": start } as CSSProperties}>
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
