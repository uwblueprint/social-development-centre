"use client";

import { forwardRef, useCallback } from "react";
import type { FocusEvent } from "react";
import { styled } from "next-yak";
import { Tabs as TabsPrimitive } from "radix-ui";

export const Tabs = TabsPrimitive.Root;

export const TabsList = styled(TabsPrimitive.List)`
  display: flex;
  align-items: flex-end;
  gap: var(--space-4);
  /* The divider is an inset shadow, not a border, so the active underline sits inside the list and
     nothing overflows vertically. Narrow screens can still swipe sideways; the scrollbar is hidden
     (keyboard focus scrolls the active tab into view). */
  box-shadow: inset 0 -1px 0 var(--color-border);
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const StyledTabsTrigger = styled(TabsPrimitive.Trigger)`
  all: unset;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  padding: var(--space-3) var(--space-1) calc(var(--space-3) - 2px);
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

  /* aria-selected, not data-state: a Tooltip trigger wrapping the tab overwrites data-state. */
  &[aria-selected="true"] {
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

/**
 * On a narrow screen, TabsList scrolls sideways instead of wrapping. Arrow-key navigation (and clicking
 * a partly clipped tab) moves focus here, but Radix focuses it with `preventScroll` — needed globally so
 * tabbing through a page never jumps it — which also skips the *local* horizontal scroll this list
 * needs. Without this, a tab can end up focused and active while sitting outside the visible strip
 * (WCAG 2.4.7): confirmed at 320px, where "Paying members" lands 31px past the list's clipped edge.
 */
export const TabsTrigger = forwardRef<HTMLButtonElement, TabsPrimitive.TabsTriggerProps>(function TabsTrigger(
  { onFocus, ...props },
  ref,
) {
  const handleFocus = useCallback(
    (event: FocusEvent<HTMLButtonElement>) => {
      onFocus?.(event);
      event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" });
    },
    [onFocus],
  );
  return <StyledTabsTrigger {...props} ref={ref} onFocus={handleFocus} />;
});

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
