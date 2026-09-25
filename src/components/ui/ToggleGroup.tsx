"use client";

import { styled } from "next-yak";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";

export const ToggleGroup = styled(ToggleGroupPrimitive.Root)`
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 2px;
  padding: 4px;
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
  /* rgb(26 26 24 / 0.75): darker than --color-text-muted (0.62), which only
     hits ~4.1:1 on the --color-border container background. This reaches
     ~6.8:1, comfortably clearing WCAG 2.2 AA's 4.5:1 for text. */
  color: rgb(26 26 24 / 0.75);
  font-family: inherit;
  font-size: var(--text-sm);
  font-weight: var(--weight-regular);
  cursor: pointer;
  transition:
    color var(--duration) var(--ease),
    background-color var(--duration) var(--ease),
    box-shadow var(--duration) var(--ease);

  &:hover:not([data-disabled]) {
    color: var(--color-text);
    background: rgb(255 255 255 / 0.5);
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
