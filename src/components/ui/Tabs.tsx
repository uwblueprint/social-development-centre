"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import type { FocusEvent } from "react";
import { styled } from "next-yak";
import { Tabs as TabsPrimitive } from "radix-ui";

export const Tabs = TabsPrimitive.Root;

const StyledTabsList = styled(TabsPrimitive.List)`
  position: relative;
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

  /* Once the sliding indicator is measured, it replaces the active tab's own underline. */
  &[data-indicator] [aria-selected="true"] {
    border-bottom-color: transparent;
  }
`;

/*
 * The active line slides between tabs (owner: subtle but fun), with a slight spring. Positioned from the
 * selected tab's box via --tab-x / --tab-w. Reduced motion is handled globally.
 */
const Indicator = styled.span`
  position: absolute;
  left: 0;
  bottom: 0;
  width: var(--tab-w, 0);
  height: 2px;
  background: var(--color-text);
  translate: var(--tab-x, 0) 0;
  pointer-events: none;

  [data-indicator="ready"] > & {
    transition:
      translate var(--duration-slow) var(--ease-spring),
      width var(--duration-slow) var(--ease-spring);
  }
`;

/** Every tab set shares the sliding active line. */
export const TabsList = forwardRef<HTMLDivElement, TabsPrimitive.TabsListProps>(function TabsList({ children, ...props }, ref) {
  const listRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => listRef.current as HTMLDivElement);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    let frame = 0;
    const place = () => {
      const tab = list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
      if (!tab) {
        list.removeAttribute("data-indicator");
        return;
      }
      list.style.setProperty("--tab-x", `${tab.offsetLeft}px`);
      list.style.setProperty("--tab-w", `${tab.offsetWidth}px`);
      // The first placement jumps into position; only later changes slide.
      if (!list.hasAttribute("data-indicator")) {
        list.setAttribute("data-indicator", "");
        frame = window.setTimeout(() => list.setAttribute("data-indicator", "ready"), 50);
      }
    };
    place();
    const mutations = new MutationObserver(place);
    mutations.observe(list, { subtree: true, attributes: true, attributeFilter: ["aria-selected"], childList: true, characterData: true });
    const resize = new ResizeObserver(place);
    resize.observe(list);
    list.querySelectorAll('[role="tab"]').forEach((tab) => resize.observe(tab));
    return () => {
      window.clearTimeout(frame);
      mutations.disconnect();
      resize.disconnect();
    };
  }, []);

  return (
    <StyledTabsList {...props} ref={listRef}>
      {children}
      <Indicator aria-hidden="true" />
    </StyledTabsList>
  );
});

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
