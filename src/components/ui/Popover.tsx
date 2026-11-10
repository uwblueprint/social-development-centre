"use client";

import { keyframes, styled } from "next-yak";
import { Popover as PopoverPrimitive } from "radix-ui";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

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

const Content = styled(PopoverPrimitive.Content)`
  z-index: var(--z-popover);
  width: 280px;
  background: var(--color-surface-raised);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
  padding: 12px;

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
    background: var(--color-bg-hover);
    color: var(--color-text);
  }
  &:focus-visible {
    box-shadow: var(--focus-ring);
  }
`;

export const PopoverActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-4);
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
        {showClose && (
          <CloseButton aria-label="Close">
            <Icon icon={X} size={14} />
          </CloseButton>
        )}
        <Arrow />
      </Content>
    </PopoverPrimitive.Portal>
  );
}
