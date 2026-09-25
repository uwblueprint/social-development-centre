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
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
  padding: 12px;
  animation: ${contentShow} var(--duration) var(--ease);
  transform-origin: var(--radix-hover-card-content-transform-origin);

  &:focus {
    outline: none;
  }
`;

const Arrow = styled(HoverCardPrimitive.Arrow)`
  fill: var(--color-surface-raised);
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
