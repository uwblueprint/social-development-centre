"use client";

import { styled } from "next-yak";
import { Select as SelectPrimitive } from "radix-ui";

const Trigger = styled(SelectPrimitive.Trigger)`
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  width: 100%;
  height: 40px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-strong);
  background: var(--color-bg);
  color: var(--color-text);
  font-family: inherit;
  font-size: var(--text-sm);
  cursor: pointer;
  transition:
    border-color var(--duration) var(--ease),
    box-shadow var(--duration) var(--ease);

  &[data-placeholder] {
    color: var(--color-text-muted);
  }

  &:hover:not([data-disabled]) {
    border-color: var(--color-text-muted);
  }

  &:focus-visible {
    outline: none;
    border-color: var(--color-focus);
    box-shadow: var(--focus-ring);
  }

  &[aria-invalid="true"] {
    border-color: var(--color-danger);
    &:focus-visible {
      box-shadow: 0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-danger);
    }
  }

  &[data-disabled] {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--color-surface);
  }
`;

const Icon = styled(SelectPrimitive.Icon)`
  display: inline-flex;
  color: var(--color-text-muted);
  flex-shrink: 0;
`;

const Content = styled(SelectPrimitive.Content)`
  overflow: hidden;
  background: var(--color-surface-raised);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border);
  z-index: 50;
`;

const Viewport = styled(SelectPrimitive.Viewport)`
  padding: var(--space-2);
`;

const Item = styled(SelectPrimitive.Item)`
  all: unset;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  height: 36px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--color-text);
  cursor: pointer;

  &[data-highlighted] {
    background: var(--color-surface);
    outline: none;
  }

  &[data-disabled] {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const ScrollButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  color: var(--color-text-muted);
  cursor: default;
`;

function ChevronIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 6.2L4.6 8.8L10 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Select({
  children,
  placeholder,
  "aria-invalid": ariaInvalid,
  ...props
}: SelectPrimitive.SelectProps & { placeholder?: string; "aria-invalid"?: boolean }) {
  return (
    <SelectPrimitive.Root {...props}>
      <Trigger aria-invalid={ariaInvalid}>
        <SelectPrimitive.Value placeholder={placeholder} />
        <Icon>
          <ChevronIcon />
        </Icon>
      </Trigger>
      <SelectPrimitive.Portal>
        <Content position="popper" sideOffset={6}>
          <SelectPrimitive.ScrollUpButton asChild>
            <ScrollButton>
              <ChevronIcon />
            </ScrollButton>
          </SelectPrimitive.ScrollUpButton>
          <Viewport>{children}</Viewport>
          <SelectPrimitive.ScrollDownButton asChild>
            <ScrollButton>
              <ChevronIcon />
            </ScrollButton>
          </SelectPrimitive.ScrollDownButton>
        </Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export function SelectItem({
  children,
  ...props
}: SelectPrimitive.SelectItemProps) {
  return (
    <Item {...props}>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator>
        <CheckIcon />
      </SelectPrimitive.ItemIndicator>
    </Item>
  );
}
