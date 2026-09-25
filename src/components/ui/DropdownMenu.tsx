"use client";

import { css, keyframes, styled } from "next-yak";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import type { ReactNode } from "react";

const contentShow = keyframes`
  from { opacity: 0; transform: translateY(-4px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const Content = styled(DropdownMenuPrimitive.Content)`
  z-index: 50;
  min-width: 220px;
  background: var(--color-surface-raised);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
  padding: 4px;
  animation: ${contentShow} var(--duration) var(--ease);
  transform-origin: var(--radix-dropdown-menu-content-transform-origin);

  &:focus {
    outline: none;
  }
`;

const itemStyles = css`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 32px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--color-text);
  cursor: pointer;
  outline: none;
  user-select: none;
  position: relative;
`;

const Item = styled(DropdownMenuPrimitive.Item)`
  ${itemStyles}

  &[data-highlighted] {
    background: var(--color-surface);
  }
  &[data-disabled] {
    color: var(--color-text-muted);
    cursor: not-allowed;
  }
`;

const CheckboxItem = styled(DropdownMenuPrimitive.CheckboxItem)`
  ${itemStyles}
  padding-left: var(--space-7);

  &[data-highlighted] {
    background: var(--color-surface);
  }
  &[data-disabled] {
    color: var(--color-text-muted);
    cursor: not-allowed;
  }
`;

const ItemIndicator = styled(DropdownMenuPrimitive.ItemIndicator)`
  position: absolute;
  left: var(--space-2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: var(--color-text);
`;

const Label = styled(DropdownMenuPrimitive.Label)`
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const Separator = styled(DropdownMenuPrimitive.Separator)`
  height: 1px;
  margin: var(--space-2) var(--space-1);
  background: var(--color-border);
`;

const Shortcut = styled.span`
  margin-left: auto;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8.5L6.5 12L13 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuItem = Item;
export const DropdownMenuLabel = Label;
export const DropdownMenuSeparator = Separator;
export const DropdownMenuShortcut = Shortcut;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

export function DropdownMenuContent({
  children,
  sideOffset = 6,
  ...props
}: DropdownMenuPrimitive.DropdownMenuContentProps & { children: ReactNode }) {
  return (
    <DropdownMenuPrimitive.Portal>
      <Content sideOffset={sideOffset} {...props}>
        {children}
      </Content>
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuCheckboxItem({
  children,
  ...props
}: DropdownMenuPrimitive.DropdownMenuCheckboxItemProps & { children: ReactNode }) {
  return (
    <CheckboxItem {...props}>
      <ItemIndicator>
        <CheckIcon />
      </ItemIndicator>
      {children}
    </CheckboxItem>
  );
}
