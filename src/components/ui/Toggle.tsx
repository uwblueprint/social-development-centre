"use client";

import { styled } from "next-yak";
import { Toggle as TogglePrimitive } from "radix-ui";

export const Toggle = styled(TogglePrimitive.Root)`
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
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color var(--duration) var(--ease),
    color var(--duration) var(--ease),
    border-color var(--duration) var(--ease);

  &:hover:not([data-disabled]) {
    background: var(--color-surface);
  }

  &[data-state="on"] {
    background: var(--color-primary);
    color: var(--color-on-primary);
    border-color: var(--color-primary);
  }

  &:focus-visible {
    box-shadow: var(--focus-ring);
  }

  &[data-disabled] {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;
