"use client";

import { styled } from "next-yak";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";

export const ToggleGroup = styled(ToggleGroupPrimitive.Root)`
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 2px;
  padding: var(--space-1);
  border-radius: var(--radius-full);
  background: var(--color-border);
`;

export const ToggleGroupItem = styled(ToggleGroupPrimitive.Item)`
  all: unset;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-full);
  color: var(--color-text);
  font-family: inherit;
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color var(--duration) var(--ease),
    color var(--duration) var(--ease);

  &:hover:not([data-disabled]) {
    background: var(--color-border);
  }

  &[data-state="on"] {
    background: var(--color-bg);
    color: var(--color-text);
    box-shadow: var(--shadow-sm);
  }

  &:focus-visible {
    box-shadow: var(--focus-ring);
  }

  &[data-disabled] {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;
