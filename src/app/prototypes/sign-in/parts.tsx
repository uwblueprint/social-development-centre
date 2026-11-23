"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import Image from "next/image";
import { css, keyframes, styled } from "next-yak";

/**
 * A plain page: the logo centred at the top, one left-aligned column in the middle, and a line drawing of
 * Waterloo Region's skyline along the bottom.
 */
const Page = styled.main`
  display: grid;
  grid-template-rows: auto 1fr auto;
  /* One column no wider than the screen, so the wide skyline never makes the page scroll sideways. */
  grid-template-columns: minmax(0, 1fr);
  min-height: 100dvh;
  /* The bottom padding leaves room for the prototype's screen switcher. */
  padding: var(--space-5) var(--space-4) calc(var(--space-8) + var(--space-7));
  background: var(--color-bg);
`;

/** The logo sits centred at the top, above the left-aligned column. */
const LogoSlot = styled.div`
  justify-self: center;
`;

const Middle = styled.div`
  display: grid;
  place-items: center;
  padding-block: var(--space-6);
`;

/**
 * The skyline is a mask over a token colour, so it is a quiet line drawing in light mode and stays
 * visible in dark mode. Cropped to the drawing (public/illustrations/waterloo-skyline.png, 1600×182).
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

export function Screen({ children }: { children: ReactNode }) {
  return (
    <Page>
      <LogoSlot>
        <Logo />
      </LogoSlot>
      <Middle>{children}</Middle>
      <Skyline aria-hidden="true" />
    </Page>
  );
}

export const Column = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-6);
  width: 100%;
  /* 20% wider than the first 520px, so long addresses fit; on the 4px grid. */
  max-width: 624px;
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
`;

/** A stack of full-width buttons. */
export const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;
`;

export const Footnote = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-subtle);
`;

/**
 * A message that changes what the person should do next: a tinted box with an icon, a status
 * colour and the words, so it stands out from the quiet text around it. Errors and successes
 * share the shape; only the tone differs.
 */
const Callout = styled.p`
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  margin: 0;
  padding: var(--space-3) var(--space-4);
  border: 1px solid;
  border-radius: var(--radius-md);
  font-size: var(--text-md);
  line-height: var(--leading-ui);

  svg {
    flex-shrink: 0;
    margin-top: 1px;
  }
`;

/** A problem with the whole form rather than one field, e.g. offline or too many links. */
export const FormMessage = styled(Callout)`
  background: var(--color-danger-subtle);
  border-color: var(--color-danger-border);
  color: var(--color-danger);
`;

/** Something just happened that they should act on, e.g. a new link was sent. */
export const StatusLine = styled(Callout)`
  background: var(--color-success-subtle);
  border-color: var(--color-success-border);
  color: var(--color-success);
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

/** The emoji says the mood at a glance; the heading next to it always says the same thing in words. */
const Emoji = styled.span<{ $wave?: boolean }>`
  display: inline-block;
  font-size: var(--text-display);
  line-height: var(--leading-none);
  transform-origin: 70% 80%;
  animation: ${pop} var(--duration-slow) var(--ease-spring) both;

  ${({ $wave }) =>
    $wave &&
    css`
      animation:
        ${pop} var(--duration-slow) var(--ease-spring) both,
        ${wave} 1.2s var(--ease) 0.3s 1;
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

export function Heading({
  emoji,
  title,
  wave: waving,
  children,
}: {
  emoji: string;
  title: string;
  /** Waves once on arrival, for hellos and goodbyes. */
  wave?: boolean;
  children?: ReactNode;
}) {
  const emojiRef = useRef<HTMLSpanElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(
    () => alignInk(emojiRef.current, titleRef.current, emoji, title),
    [emoji, title],
  );

  return (
    <HeadingGroup>
      <Emoji ref={emojiRef} aria-hidden="true" $wave={waving}>
        {emoji}
      </Emoji>
      <Title ref={titleRef} tabIndex={-1}>
        {title}
      </Title>
      {children && <Description>{children}</Description>}
    </HeadingGroup>
  );
}

/**
 * Emoji glyphs carry empty space on their left (more for some than others), so the picture looks
 * indented from the heading under it. Measure where the ink starts in both and shift the emoji so
 * the two left edges line up exactly, whichever emoji and whichever system font draws it.
 */
function alignInk(
  emojiEl: HTMLElement | null,
  titleEl: HTMLElement | null,
  emoji: string,
  title: string,
) {
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

export function Logo() {
  return (
    <Image
      src="/brand/sdc-logo.png"
      alt="Social Development Centre Waterloo Region"
      width={62}
      height={48}
      loading="eager"
    />
  );
}

/** The quiet actions and the note under them read as one group, closer together than the column's gap. */
export const Followup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

/**
 * Secondary actions as text buttons with no side padding, so their text starts on the column's left
 * edge like everything above. Hover underlines instead of filling a box that would stick out.
 */
export const QuietRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2) var(--space-6);
  font-size: var(--text-md);

  & button {
    height: auto;
    padding: var(--space-1) 0;
    font-size: inherit;
    line-height: var(--leading-ui);
  }
  & button:hover:not(:disabled):not([aria-disabled="true"]) {
    background: transparent;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
`;

/** A text button inside a sentence, e.g. "Did you mean name@waterlooregion.org": no box, just underlined words. */
export const InlineAction = styled.span`
  & button {
    display: inline;
    vertical-align: baseline;
    height: auto;
    padding: 0;
    font-size: inherit;
    line-height: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  & button:hover:not(:disabled):not([aria-disabled="true"]) {
    background: transparent;
  }
`;
