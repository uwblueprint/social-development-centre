"use client";

import { keyframes, styled } from "next-yak";
import { HoverCard as HoverCardPrimitive } from "radix-ui";
import type { ReactNode } from "react";

/*
 * Overlay enter/exit: a short fade plus a 4px nudge toward the trigger side, vertical only. The old
 * scale + transform-origin (a Radix var that isn't measured on the first frame) and the horizontal
 * slide made the panel twitch sideways as Radix settled its position. Exit is a plain fade. Only the
 * inner content animates, never Radix's positioned wrapper.
 */
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeInBelow = keyframes`
  from { opacity: 0; transform: translateY(calc(var(--space-1) * -1)); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeInAbove = keyframes`
  from { opacity: 0; transform: translateY(var(--space-1)); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const Content = styled(HoverCardPrimitive.Content)`
  z-index: var(--z-tooltip);
  width: 300px;
  background: var(--color-surface-raised);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
  padding: 14px 16px;
  line-height: var(--leading-body);

  &:focus {
    outline: none;
  }

  &[data-state="open"] {
    animation: ${fadeIn} var(--duration) var(--ease-out);
  }

  &[data-state="open"][data-side="bottom"] {
    animation: ${fadeInBelow} var(--duration) var(--ease-out);
  }

  &[data-state="open"][data-side="top"] {
    animation: ${fadeInAbove} var(--duration) var(--ease-out);
  }

  &[data-state="closed"] {
    animation: ${fadeOut} var(--duration-fast) var(--ease-in) forwards;
  }
`;

const Arrow = styled(HoverCardPrimitive.Arrow)`
  fill: var(--color-surface-raised);
`;

/*
 * Underlined link affordance for hover card triggers (e.g. @mentions), so
 * hovering/focusing something is discoverable before the card ever opens.
 */
export const HoverCardTriggerLink = styled.button`
  all: unset;
  display: inline;
  color: var(--color-text);
  text-decoration: underline dotted;
  text-decoration-color: var(--color-text-subtle);
  text-underline-offset: 3px;
  cursor: pointer;

  &:hover {
    color: var(--color-accent);
    text-decoration-style: solid;
    text-decoration-color: var(--color-accent);
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
    border-radius: var(--radius-sm);
  }
`;

export const HoverCard = HoverCardPrimitive.Root;
export const HoverCardTrigger = HoverCardPrimitive.Trigger;

export function HoverCardContent({
  children,
  sideOffset = 8,
  ...props
}: HoverCardPrimitive.HoverCardContentProps & { children: ReactNode }) {
  return (
    <HoverCardPrimitive.Portal>
      <Content sideOffset={sideOffset} {...props}>
        {children}
        <Arrow />
      </Content>
    </HoverCardPrimitive.Portal>
  );
}
