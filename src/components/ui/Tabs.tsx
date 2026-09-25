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
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  transition:
    color var(--duration) var(--ease),
    background-color var(--duration) var(--ease),
    box-shadow var(--duration) var(--ease);

  &:hover {
    color: var(--color-text);
  }

  &[data-state="active"] {
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
