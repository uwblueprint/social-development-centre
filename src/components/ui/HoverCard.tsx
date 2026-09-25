"use client";

import { keyframes, styled } from "next-yak";
import { HoverCard as HoverCardPrimitive } from "radix-ui";
import type { ReactNode } from "react";

const contentShow = keyframes`
  from { opacity: 0; transform: translateY(4px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const Content = styled(HoverCardPrimitive.Content)`
  z-index: 50;
  width: 300px;
  background: var(--color-surface-raised);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
  padding: 14px 16px;
  line-height: var(--leading-body);
  animation: ${contentShow} var(--duration) var(--ease);
  transform-origin: var(--radix-hover-card-content-transform-origin);

  &:focus {
    outline: none;
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
