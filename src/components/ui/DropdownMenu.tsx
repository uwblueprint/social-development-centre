"use client";

import { css, keyframes, styled } from "next-yak";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

const contentShow = keyframes`
  from { opacity: 0; transform: translateY(-4px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const Content = styled(DropdownMenuPrimitive.Content)`
  z-index: 50;
  min-width: 220px;
  background: var(--color-surface-raised);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
  padding: 4px;
  animation: ${contentShow} var(--duration) var(--ease);
  transform-origin: var(--radix-dropdown-menu-content-transform-origin);

  &:focus {
    outline: none;
  }
`;

/*
 * Every row reserves the same leading column (whether or not it renders a
 * checkbox glyph there) so item labels line up regardless of item type, and
 * every row is a uniform 32px tall with matching line-height (modeled on
 * Linear's menus).
 */
const itemStyles = css`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  height: 32px;
  line-height: var(--leading-ui);
  padding: 0 var(--space-3) 0 var(--space-7);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--color-text);
  cursor: pointer;
  outline: none;
  user-select: none;
  position: relative;

  &[data-highlighted] {
    background: var(--stone-100);
  }
  &[data-disabled] {
    color: var(--color-text-muted);
    cursor: not-allowed;
  }
`;

const Item = styled(DropdownMenuPrimitive.Item)`
  ${itemStyles}
`;

const CheckboxItem = styled(DropdownMenuPrimitive.CheckboxItem)`
  ${itemStyles}
`;

/*
 * Always rendered (forceMount), even when unchecked, so unchecked items show
 * an empty box and read as checkable at a glance.
 */
const IndicatorBox = styled(DropdownMenuPrimitive.ItemIndicator)`
  position: absolute;
  left: var(--space-2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-strong);
  background: var(--color-bg);
  color: var(--color-on-primary);

  svg {
    opacity: 0;
  }

  &[data-state="checked"] {
    background: var(--color-primary);
    border-color: var(--color-primary);
  }
  &[data-state="checked"] svg {
    opacity: 1;
  }
`;

const Label = styled(DropdownMenuPrimitive.Label)`
  padding: var(--space-2) var(--space-3) var(--space-2) var(--space-7);
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

const Shortcut = styled.kbd`
  margin-left: auto;
  padding: 2px 6px;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  line-height: var(--leading-none);
  color: var(--color-text-subtle);
  background: var(--stone-100);
  border: 1px solid var(--stone-200);
  border-radius: var(--radius-sm);
`;

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
      <IndicatorBox forceMount>
        <Icon icon={Check} size={12} />
      </IndicatorBox>
      {children}
    </CheckboxItem>
  );
}
