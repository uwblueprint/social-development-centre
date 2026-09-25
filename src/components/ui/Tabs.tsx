"use client";

import { styled } from "next-yak";
import { Tabs as TabsPrimitive } from "radix-ui";

export const Tabs = TabsPrimitive.Root;

export const TabsList = styled(TabsPrimitive.List)`
  display: flex;
  align-items: flex-end;
  gap: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  overflow-x: auto;
`;

export const TabsTrigger = styled(TabsPrimitive.Trigger)`
  all: unset;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  padding: var(--space-3) var(--space-1) calc(var(--space-3) - 2px);
  margin-bottom: -1px;
  border-bottom: 2px solid transparent;
  font-size: var(--text-sm);
  font-weight: var(--weight-regular);
  line-height: var(--leading-ui);
  /* --color-text-muted is only ~4.5:1 on white at best; mix in more of
     --color-text so inactive labels stay comfortably above 4.5:1. */
  color: color-mix(in srgb, var(--color-text) 72%, transparent);
  cursor: pointer;
  white-space: nowrap;
  transition:
    color var(--duration) var(--ease),
    border-color var(--duration) var(--ease);

  &:hover {
    color: var(--color-text);
  }

  &[data-state="active"] {
    color: var(--color-text);
    border-bottom-color: var(--color-text);
  }

  &:focus-visible {
    border-radius: var(--radius-sm);
    box-shadow: var(--focus-ring);
  }

  &[data-disabled] {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

/** Muted count/suffix shown after a tab's label, e.g. `Paying members`<TabsCount>(12)</TabsCount>. Always muted, active or not. */
export const TabsCount = styled.span`
  margin-left: var(--space-1);
  color: var(--color-text-muted);
`;

export const TabsContent = styled(TabsPrimitive.Content)`
  padding-top: var(--space-5);

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
    border-radius: var(--radius-sm);
  }
`;
