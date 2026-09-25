"use client";

import { styled } from "next-yak";
import { Tabs as TabsPrimitive } from "radix-ui";

export const Tabs = TabsPrimitive.Root;

export const TabsList = styled(TabsPrimitive.List)`
  display: inline-flex;
  align-items: center;
  padding: var(--space-1);
  border-radius: var(--radius-full);
  background: var(--color-border);
`;

export const TabsTrigger = styled(TabsPrimitive.Trigger)`
  all: unset;
  padding: 10px var(--space-4);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--weight-regular);
  /* rgb(26 26 24 / 0.62) (--color-text-muted) is ~4.5:1 on --color-border at best;
     use a darker tint so inactive labels stay comfortably above 4.5:1. */
  color: rgb(26 26 24 / 0.72);
  cursor: pointer;
  transition:
    color var(--duration) var(--ease),
    background-color var(--duration) var(--ease),
    box-shadow var(--duration) var(--ease);

  &:hover {
    color: var(--color-text);
    background: rgb(255 255 255 / 0.5);
  }

  &[data-state="active"] {
    color: var(--color-text);
    background: var(--color-bg);
    box-shadow: var(--shadow-sm);
  }

  &[data-state="active"]:hover {
    color: var(--color-text);
    background: var(--color-bg);
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

export const TabsContent = styled(TabsPrimitive.Content)`
  padding-top: var(--space-5);

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
    border-radius: var(--radius-sm);
  }
`;
