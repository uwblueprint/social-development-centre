"use client";

import { styled } from "next-yak";
import { overlayMotion } from "./overlayMotion";
import { Popover as PopoverPrimitive } from "radix-ui";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

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

  ${overlayMotion}
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
  /* Cancel sits on the far left, lined up with the content, away from the action (owner, Nov 2026). */
  & > [data-cancel],
  & > [data-back],
  & > :has(> [data-cancel], > [data-back]) {
    order: -1;
    margin-inline-end: auto;
  }
`;

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;
/** Closes the popover; unstyled, like DialogClose. Wrap a CancelButton in it with asChild. */
export const PopoverClose = PopoverPrimitive.Close;

export function PopoverContent({
  children,
  sideOffset = 8,
  showClose = true,
  showArrow = true,
  ...props
}: PopoverPrimitive.PopoverContentProps & {
  children: ReactNode;
  showClose?: boolean;
  /** The small arrow pointing at the trigger. Leave it off when the popover sits right under a button (e.g. filters). */
  showArrow?: boolean;
}) {
  return (
    <PopoverPrimitive.Portal>
      <Content sideOffset={sideOffset} {...props}>
        {children}
        {showClose && (
          <CloseButton aria-label="Close">
            <Icon icon={X} size={14} />
          </CloseButton>
        )}
        {showArrow && <Arrow />}
      </Content>
    </PopoverPrimitive.Portal>
  );
}
