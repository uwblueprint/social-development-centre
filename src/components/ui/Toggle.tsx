"use client";

import { styled } from "next-yak";
import { Toggle as TogglePrimitive } from "radix-ui";

/*
 * States (verified for WCAG 2.2 AA contrast):
 * - off:          bg --color-bg,        border --color-border-strong, text --color-text
 * - off + hover:  bg --color-secondary, text --color-text
 * - on:           bg --color-primary,   text --color-on-primary
 * - on + hover:   bg --color-primary-hover, text --color-on-primary
 * - disabled:     reduced opacity, not-allowed cursor
 */

const Root = styled(TogglePrimitive.Root)`
  all: unset;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-strong);
  background: var(--color-bg);
  color: var(--color-text);
  font-family: inherit;
  font-size: var(--text-sm);
  font-weight: var(--weight-regular);
  line-height: var(--leading-ui);
  cursor: pointer;
  transition:
    background-color var(--duration) var(--ease),
    color var(--duration) var(--ease),
    border-color var(--duration) var(--ease);

  &:hover:not([data-disabled]) {
    background: var(--color-bg-hover);
    color: var(--color-text);
  }

  &[data-state="on"] {
    background: var(--color-primary);
    color: var(--color-on-primary);
    border-color: var(--color-primary);
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
  return <Root {...props}>{children}</Root>;
}
