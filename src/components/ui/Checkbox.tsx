"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { DisabledArea, DisabledIcon, type DisabledReasonText } from "./DisabledReason";
import { Label } from "./Label";

/*
 * Two distinct non-interactive states:
 * - disabled: the underlying value is unknown/unavailable, so the box always
 *   renders blank (no check, no dash) regardless of `checked`, filled with
 *   --color-disabled-bg to read as "off".
 * - readOnly: the value IS known and stays visible (check/dash shown, muted
 *   colors) but can't be changed. Still focusable so the reason is reachable.
 * Both show a lock icon with the reason on hover/focus.
 */

/*
 * The border is drawn inside the box (an inset box-shadow in --checkbox-border), so the box is exactly
 * 20px in every state and checking never shifts the label.
 */
const Root = styled(CheckboxPrimitive.Root)`
  all: unset;
  --checkbox-border: var(--color-border-strong);
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  box-shadow: inset 0 0 0 1px var(--checkbox-border);
  cursor: pointer;
  transition:
    background-color var(--duration) var(--ease),
    box-shadow var(--duration) var(--ease);

  &:hover:not([data-disabled]):not([data-readonly]) {
    --checkbox-border: var(--color-text-muted);
  }

  &[data-state="checked"],
  &[data-state="indeterminate"] {
    background: var(--color-primary);
    --checkbox-border: var(--color-primary);
  }

  &:focus-visible {
    box-shadow:
      inset 0 0 0 1px var(--checkbox-border),
      var(--focus-ring);
  }

  &[aria-invalid="true"] {
    --checkbox-border: var(--color-danger);
  }

  /* Disabled: state unknown, always blank, never shows a check. */
  &[data-disabled] {
    background: var(--color-bg-hover);
    --checkbox-border: var(--color-bg-hover);
    cursor: not-allowed;
  }

  &[data-disabled][data-state="checked"],
  &[data-disabled][data-state="indeterminate"] {
    background: var(--color-bg-hover);
    --checkbox-border: var(--color-bg-hover);
  }

  /* Read-only: value stays visible, muted, but can't be toggled. */
  &[data-readonly] {
    cursor: not-allowed;
  }

  &[data-readonly][data-state="checked"],
  &[data-readonly][data-state="indeterminate"] {
    background: var(--color-text-muted);
    --checkbox-border: var(--color-text-muted);
  }
`;

const Indicator = styled(CheckboxPrimitive.Indicator)`
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-on-primary);
`;

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2 6.2L4.6 8.8L10 3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2.5 6H9.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

type CheckboxStateProps =
  | { disabled?: false; readOnly?: false; disabledReason?: never }
  | { disabled: true; readOnly?: false; disabledReason: DisabledReasonText }
  | { disabled?: false; readOnly: true; disabledReason: DisabledReasonText };

export type CheckboxProps = Omit<
  CheckboxPrimitive.CheckboxProps,
  "disabled" | "readOnly"
> &
  CheckboxStateProps & {
    /** Renders the checkbox as a row: box, label, then the lock icon when unavailable. */
    label?: React.ReactNode;
  };

const LabelRow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
`;

export function Checkbox({
  disabled,
  readOnly,
  disabledReason,
  checked,
  defaultChecked,
  onCheckedChange,
  label,
  ...props
}: CheckboxProps) {
  const autoId = React.useId();
  const id = props.id ?? autoId;
  const nonInteractive = disabled || readOnly;

  // Always fully controlled here (never hand Radix an uncontrolled
  // `checked={undefined}`): disabled/read-only both need to *freeze* the
  // value, which only works if we're the one deciding it on every render
  // instead of letting Radix's own internal state react to clicks.
  const isControlled = checked !== undefined;
  const [innerChecked, setInnerChecked] = React.useState<CheckboxPrimitive.CheckedState>(
    defaultChecked ?? false,
  );
  const currentChecked = isControlled ? checked : innerChecked;
  // Disabled hides the real value: force the visual/reported state to
  // "unchecked" so nothing about it can be inferred.
  const visualChecked = disabled ? false : currentChecked;

  function handleCheckedChange(next: CheckboxPrimitive.CheckedState) {
    if (!isControlled) setInnerChecked(next);
    onCheckedChange?.(next);
  }

  const control = (
    <Root
      {...props}
      id={id}
      checked={visualChecked}
      disabled={disabled}
      aria-disabled={readOnly ? true : undefined}
      data-readonly={readOnly ? "" : undefined}
      onCheckedChange={nonInteractive ? undefined : handleCheckedChange}
    >
      <Indicator>{visualChecked === "indeterminate" ? <DashIcon /> : <CheckIcon />}</Indicator>
    </Root>
  );

  const labelled = label ? (
    <LabelRow>
      {control}
      <Label htmlFor={id} data-disabled={nonInteractive ? "" : undefined}>
        {label}
      </Label>
    </LabelRow>
  ) : (
    control
  );

  if (!nonInteractive) return labelled;

  return (
    <DisabledArea reason={disabledReason}>
      {labelled}
      <DisabledIcon reason={disabledReason} />
    </DisabledArea>
  );
}
