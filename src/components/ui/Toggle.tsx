"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Toggle as TogglePrimitive } from "radix-ui";

/*
 * States (verified for WCAG 2.2 AA contrast):
 * - off:          bg --color-bg,        border --color-border-strong, text --color-text
 * - off + hover:  bg --color-secondary, text --color-text
 * - on:           bg --color-primary,   text --color-on-primary, + check icon (non-color cue)
 * - on + hover:   bg --color-primary-hover, text --color-on-primary
 * - disabled:     reduced opacity, not-allowed cursor (color alone never carries the pressed state)
 */

const CheckIcon = styled.svg`
  display: none;
  flex-shrink: 0;
`;

function Check() {
  return (
    <CheckIcon width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2 6.2L4.6 8.8L10 3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </CheckIcon>
  );
}

const Root = styled(TogglePrimitive.Root)`
  all: unset;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  height: 40px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border-strong);
  background: var(--color-bg);
  color: var(--color-text);
  font-family: inherit;
  font-size: var(--text-sm);
  font-weight: var(--weight-regular);
  cursor: pointer;
  transition:
    background-color var(--duration) var(--ease),
    color var(--duration) var(--ease),
    border-color var(--duration) var(--ease);

  ${CheckIcon} {
    display: none;
  }

  &:hover:not([data-disabled]) {
    background: var(--color-secondary);
    color: var(--color-text);
  }

  &[data-state="on"] {
    background: var(--color-primary);
    color: var(--color-on-primary);
    border-color: var(--color-primary);

    ${CheckIcon} {
      display: inline-flex;
    }
  }

  &[data-state="on"]:hover:not([data-disabled]) {
    background: var(--color-primary-hover);
    color: var(--color-on-primary);
    border-color: var(--color-primary-hover);
  }

  &:focus-visible {
    box-shadow: var(--focus-ring);
  }

  &[data-disabled] {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

export function Toggle({ children, ...props }: TogglePrimitive.ToggleProps) {
  return (
    <Root {...props}>
      <Check />
      {children}
    </Root>
  );
}
