"use client";

import * as React from "react";
import { styled } from "next-yak";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { DisabledArea, DisabledIcon, type DisabledReasonText } from "./DisabledReason";

export const RadioGroup = styled(RadioGroupPrimitive.Root)`
  display: flex;
  flex-direction: column;
  gap: 2px;
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

/* ---------------------------------------------------------------------- */
/* RadioGroupOption: a full-width row so clicking anywhere in it selects   */
/* the option, with a hover background and a ring that darkens to match.   */
/* ---------------------------------------------------------------------- */

const Row = styled.label`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--duration) var(--ease);

  &:hover:not([data-disabled]) {
    background: var(--stone-100);
  }

  &:hover:not([data-disabled]) ${Item}:not([data-disabled]) {
    border-color: var(--color-text-muted);
  }

  &[data-disabled] {
    cursor: not-allowed;
  }
`;

const RowText = styled.span`
  font-size: var(--text-sm);
  color: var(--color-text);
  line-height: var(--leading-ui);

  [data-disabled] > & {
    opacity: 0.45;
  }
`;

type RadioOptionDisabledProps =
  | { disabled?: false; disabledReason?: never }
  | { disabled: true; disabledReason: DisabledReasonText };

export type RadioGroupOptionProps = Omit<
  RadioGroupPrimitive.RadioGroupItemProps,
  "disabled" | "children"
> &
  RadioOptionDisabledProps & {
    /** Visible label for this option; the whole row is clickable. */
    label: React.ReactNode;
  };

export function RadioGroupOption({
  label,
  disabled,
  disabledReason,
  id,
  ...props
}: RadioGroupOptionProps) {
  const reactId = React.useId();
  const itemId = id ?? reactId;

  const row = (
    <Row htmlFor={itemId} data-disabled={disabled ? "" : undefined}>
      <Item id={itemId} disabled={disabled} {...props}>
        <Indicator />
      </Item>
      <RowText>{label}</RowText>
      {disabled && <DisabledIcon reason={disabledReason} />}
    </Row>
  );

  return disabled ? <DisabledArea reason={disabledReason}>{row}</DisabledArea> : row;
}
