"use client";

import { keyframes, styled } from "next-yak";
import { Popover as PopoverPrimitive } from "radix-ui";
import type { ReactNode } from "react";

const contentShow = keyframes`
  from { opacity: 0; transform: translateY(4px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const Content = styled(PopoverPrimitive.Content)`
  z-index: 50;
  width: 280px;
  background: var(--color-surface-raised);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
  padding: 12px;
  animation: ${contentShow} var(--duration) var(--ease);
  transform-origin: var(--radix-popover-content-transform-origin);

  &:focus {
    outline: none;
  }
`;

const Arrow = styled(PopoverPrimitive.Arrow)`
  fill: var(--color-surface-raised);
`;

const CloseButton = styled(PopoverPrimitive.Close)`
  all: unset;
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  color: var(--color-text-muted);
  cursor: pointer;

  &:hover {
    background: var(--color-surface);
    color: var(--color-text);
  }
  &:focus-visible {
    box-shadow: var(--focus-ring);
  }
`;

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export const PopoverClose = CloseButton;

export function PopoverContent({
  children,
  sideOffset = 8,
  showClose = true,
  ...props
}: PopoverPrimitive.PopoverContentProps & { children: ReactNode; showClose?: boolean }) {
  return (
    <PopoverPrimitive.Portal>
      <Content sideOffset={sideOffset} {...props}>
        {children}
        {showClose && <CloseButton aria-label="Close">×</CloseButton>}
        <Arrow />
      </Content>
    </PopoverPrimitive.Portal>
  );
}
