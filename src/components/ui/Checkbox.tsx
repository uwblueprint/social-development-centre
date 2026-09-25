"use client";

import { styled } from "next-yak";
import { Checkbox as CheckboxPrimitive } from "radix-ui";

const Root = styled(CheckboxPrimitive.Root)`
  all: unset;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-strong);
  background: var(--color-bg);
  cursor: pointer;
  transition:
    background-color var(--duration) var(--ease),
    border-color var(--duration) var(--ease);

  &:hover:not([data-disabled]) {
    border-color: var(--color-text-muted);
  }

  &[data-state="checked"],
  &[data-state="indeterminate"] {
    background: var(--color-primary);
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

export function Checkbox(props: CheckboxPrimitive.CheckboxProps) {
  return (
    <Root {...props}>
      <Indicator>{props.checked === "indeterminate" ? <DashIcon /> : <CheckIcon />}</Indicator>
    </Root>
  );
}
