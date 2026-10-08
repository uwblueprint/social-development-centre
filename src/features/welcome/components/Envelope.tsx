"use client";

import { useRef, useState } from "react";
import { keyframes, styled } from "next-yak";
import { ArrowUp } from "lucide-react";
import { Icon } from "@/components/ui/Icon";

/*
 * The first thing a member sees: a closed, doodled envelope addressed to them. Opening it peels the
 * heart sticker, folds the flap back and slides the letter out, then hands over to the welcome step.
 * The envelope is one big button; a floating hint underneath says to click (or tap) it.
 * With reduced motion it opens at once.
 */

const OPEN_MS = 1750;

const peel = keyframes`
  to {
    opacity: 0;
    transform: translate(-50%, -80%) scale(1.25) rotate(-18deg);
  }
`;
/* The flap swaps layers halfway, so once it is folded back the letter slides out in front of it. */
const unfold = keyframes`
  0% {
    transform: rotateX(0);
    z-index: 4;
  }
  49% {
    z-index: 4;
  }
  50% {
    z-index: 1;
  }
  100% {
    transform: rotateX(180deg);
    z-index: 1;
  }
`;
const slideOut = keyframes`
  to {
    transform: translateY(-58%);
  }
`;
const fadeOut = keyframes`
  to {
    opacity: 0;
  }
`;
const float = keyframes`
  50% {
    translate: 0 calc(var(--space-2) * -1);
  }
`;

const Scene = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-6);
  padding: var(--space-5) var(--space-4);
  min-height: 100dvh;
`;

const Card = styled.button`
  all: unset;
  position: relative;
  width: min(86vw, 32.5rem, calc((100dvh - 12.5rem) * 1.5));
  aspect-ratio: 3 / 2;
  cursor: pointer;
  perspective: 75rem;
  rotate: -2deg;
  filter: drop-shadow(var(--shadow-survey-sheet));
  transition: translate var(--duration-slow) var(--ease-spring);

  &:hover {
    translate: 0 calc(var(--space-1) * -1);
  }
  &:focus-visible {
    outline: 3px solid var(--color-focus);
    outline-offset: var(--space-3);
  }

  & > * {
    position: absolute;
  }
  svg {
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .paper {
    fill: var(--survey-paper);
    stroke: var(--survey-ink);
    stroke-width: 2.5;
    stroke-linejoin: round;
  }
  .inside {
    fill: var(--survey-envelope-inside);
    stroke: var(--survey-ink);
    stroke-width: 2.5;
  }
  .crease {
    fill: none;
    stroke: var(--survey-ink);
    stroke-width: 2.5;
    opacity: 0.7;
  }
  .sticker {
    fill: var(--survey-doodle-orange);
    stroke: var(--survey-ink);
    stroke-width: 1.6;
    stroke-linejoin: round;
  }

  &[data-opening] .sticker-wrap {
    animation: ${peel} var(--duration-slow) ease-in forwards;
  }
  &[data-opening] .flap {
    animation: ${unfold} var(--duration-enter) var(--ease) var(--duration-slow) forwards;
  }
  &[data-opening] .letter {
    animation: ${slideOut} calc(var(--duration-enter) * 1.5) var(--ease) calc(var(--duration-enter) * 2) forwards;
  }
  &[data-opening] .address {
    animation: ${fadeOut} var(--duration-slow) var(--ease) calc(var(--duration-enter) * 2) forwards;
  }
`;

const Inside = styled.svg`
  z-index: 0;
`;

const Letter = styled.span`
  left: 6%;
  right: 6%;
  top: 6%;
  height: 90%;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 7%;
  padding: 7% 8%;
  border: 2px solid var(--survey-ink);
  border-radius: var(--radius-sm);
  background: var(--survey-paper);
`;

const LetterTitle = styled.span`
  font-family: var(--font-survey-display);
  font-size: clamp(var(--text-sm), 3.6vw, var(--text-lg));
  line-height: var(--leading-heading);
  color: var(--survey-ink);
`;

const Line = styled.span<{ $short?: boolean }>`
  display: block;
  width: ${({ $short }) => ($short ? "60%" : "100%")};
  height: var(--space-1);
  border-radius: var(--radius-full);
  background: var(--survey-paper-tint);
  box-shadow: inset 0 0 0 1px var(--color-border);
`;

const Pocket = styled.svg`
  z-index: 3;
`;

const Flap = styled.span`
  left: 0;
  right: 0;
  top: 0;
  height: 56%;
  z-index: 4;
  transform-origin: 50% 0;
  transform-style: preserve-3d;
`;

const Sticker = styled.span`
  left: 50%;
  top: 56%;
  z-index: 6;
  width: clamp(var(--space-7), 13vw, 4.5rem);
  aspect-ratio: 1;
  transform: translate(-50%, -50%) rotate(-12deg);

  svg {
    position: static;
    width: 78%;
    height: 78%;
    margin: 11%;
  }
`;

const Address = styled.span`
  left: 50%;
  bottom: 13%;
  z-index: 5;
  display: grid;
  justify-items: start;
  gap: 2px;
  min-width: 52%;
  translate: -50% 0;
  color: var(--survey-ink);
  pointer-events: none;
`;

const AddressTo = styled.span`
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const AddressName = styled.span`
  width: 100%;
  padding-bottom: var(--space-1);
  border-bottom: 2.5px dashed var(--survey-ink);
  font-family: var(--font-survey-display);
  font-size: clamp(var(--text-lg), 5.4vw, var(--text-xl));
  line-height: var(--leading-heading);
  overflow-wrap: anywhere;
`;

const Hint = styled.p`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  padding: var(--space-2) var(--space-4);
  border: 2px solid var(--survey-ink);
  border-radius: var(--radius-full);
  background: var(--survey-paper);
  box-shadow: var(--shadow-survey-small);
  color: var(--survey-ink);
  font-family: var(--font-survey-display);
  font-size: var(--text-lg);
  rotate: 1.5deg;
  cursor: pointer;
  animation: ${float} calc(var(--duration-slow) * 7) ease-in-out infinite;
  transition: opacity var(--duration-slow) var(--ease);

  &[data-hidden] {
    opacity: 0;
    animation: none;
  }

  .tap {
    display: none;
  }
  @media (hover: none) {
    .click {
      display: none;
    }
    .tap {
      display: inline;
    }
  }
`;

export function Envelope({
  name,
  copy,
  onOpened,
}: {
  /** Who the envelope is addressed to. */
  name: string;
  copy: { to: string; open: string; hintClick: string; hintTap: string; letterTitle: string };
  onOpened: () => void;
}) {
  const [opening, setOpening] = useState(false);
  const done = useRef(false);

  function open() {
    if (opening) return;
    setOpening(true);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(
      () => {
        if (done.current) return;
        done.current = true;
        onOpened();
      },
      reduce ? 0 : OPEN_MS,
    );
  }

  return (
    <Scene>
      <Card type="button" aria-label={copy.open} data-opening={opening ? "" : undefined} onClick={open}>
        <Inside viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true">
          <rect className="inside" x="0" y="0" width="300" height="200" rx="6" vectorEffect="non-scaling-stroke" />
        </Inside>
        <Letter className="letter" aria-hidden="true">
          <LetterTitle>{copy.letterTitle}</LetterTitle>
          <Line />
          <Line />
          <Line $short />
          <Line />
          <Line $short />
        </Letter>
        <Pocket viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true">
          <path
            className="paper"
            vectorEffect="non-scaling-stroke"
            d="M0 6 Q0 0 6 0 L150 112 L294 0 Q300 0 300 6 L300 194 Q300 200 294 200 L6 200 Q0 200 0 194 Z"
          />
          <path className="crease" vectorEffect="non-scaling-stroke" d="M0 200 L128 96 M300 200 L172 96" />
        </Pocket>
        <Flap className="flap" aria-hidden="true">
          <svg viewBox="0 0 300 112" preserveAspectRatio="none">
            <path className="paper" vectorEffect="non-scaling-stroke" d="M2 0 L298 0 L156 108 Q150 113 144 108 Z" />
          </svg>
        </Flap>
        <Sticker className="sticker-wrap" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path
              className="sticker"
              d="M12 21s-7.4-4.5-9.6-8.9C.8 8.9 2.6 4.6 6.3 4.6c2.1 0 3.4 1.1 4.2 2.4.8-1.3 2.2-2.4 4.3-2.4 3.8 0 5.5 4.3 3.9 7.5C16.6 16.5 12 21 12 21z"
            />
          </svg>
        </Sticker>
        <Address className="address" aria-hidden="true">
          <AddressTo>{copy.to}</AddressTo>
          <AddressName>{name}</AddressName>
        </Address>
      </Card>
      {/* The envelope is the control; this only points at it, so screen readers skip it. */}
      <Hint aria-hidden="true" data-hidden={opening ? "" : undefined} onClick={open}>
        <Icon icon={ArrowUp} size={18} />
        <span className="click">{copy.hintClick}</span>
        <span className="tap">{copy.hintTap}</span>
      </Hint>
    </Scene>
  );
}
