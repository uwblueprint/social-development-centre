"use client";

import { styled } from "next-yak";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

export const RadioGroup = styled(RadioGroupPrimitive.Root)`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const Item = styled(RadioGroupPrimitive.Item)`
  all: unset;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border-strong);
  background: var(--color-bg);
  cursor: pointer;
  transition: border-color var(--duration) var(--ease);

  &:hover:not([data-disabled]) {
    border-color: var(--color-text-muted);
  }

  &[data-state="checked"] {
    border-color: var(--color-primary);
  }

  &:focus-visible {
    box-shadow: var(--focus-ring);
  }

  &[aria-invalid="true"] {
    border-color: var(--color-danger);
  }

  &[data-disabled] {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const Indicator = styled(RadioGroupPrimitive.Indicator)`
  display: block;
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
`;

export function RadioGroupItem(props: RadioGroupPrimitive.RadioGroupItemProps) {
  return (
    <Item {...props}>
      <Indicator />
    </Item>
  );
}
