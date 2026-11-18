"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import type { FocusEvent } from "react";
import { keyframes, styled } from "next-yak";
import { Tabs as TabsPrimitive } from "radix-ui";

/**
 * Pass `activationMode="manual"` when selecting a tab is not free (it loads content): arrow keys then
 * move focus only, and Enter or Space selects. The default stays automatic (arrow keys select), which
 * is the ARIA recommendation when panels appear instantly.
 */
export const Tabs = TabsPrimitive.Root;

const StyledTabsList = styled(TabsPrimitive.List)`
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: var(--space-4);
  /* A scroll container clips outer shadows, so it reserves the focus ring's reach (4px) on every side
     as padding and gives it back as negative margin: the tabs sit where they always did. The tabs'
     offsetLeft counts the padding, and so does the indicator's left: 0, so they stay aligned. The
     divider is a background line, not a border or shadow, so it stays where the tabs end (4px up from
     the padding box's bottom) and stops at the visible edges. Narrow screens can still swipe sideways;
     the scrollbar is hidden (keyboard focus scrolls the active tab into view, ring included). */
  padding: var(--space-1);
  margin: calc(var(--space-1) * -1);
  scroll-padding: var(--space-1);
  background: linear-gradient(var(--color-border), var(--color-border)) no-repeat var(--space-1) calc(100% - var(--space-1)) / calc(100% - 2 * var(--space-1)) 1px;
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
 * The active line slides from the old tab to the new one, resizing to the new tab's width as it goes.
 * Positioned from the selected tab's box via --tab-x / --tab-w. The first placement doesn't animate
 * (it waits for data-indicator="ready"). Reduced motion is handled globally.
 */
const sweep = keyframes`
  from { transform: translateX(-100%); }
  to { transform: translateX(250%); }
`;

const Indicator = styled.span`
  position: absolute;
  left: 0;
  /* Level with the tabs' bottom edge, above the list's bottom padding. */
  bottom: var(--space-1);
  width: var(--tab-w, 0);
  height: 2px;
  background: var(--color-text);
  translate: var(--tab-x, 0) 0;
  pointer-events: none;
  overflow: hidden;

  ${StyledTabsList}[data-indicator="ready"] & {
    transition:
      translate var(--duration-slow) var(--ease-out),
      width var(--duration-slow) var(--ease-out);
  }

  /* Loading: the line becomes a quiet track with a --color-primary segment sweeping across the tab's width. */
  ${StyledTabsList}[data-loading] & {
    background: var(--color-border-strong);
  }

  ${StyledTabsList}[data-loading] &::after {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 40%;
    background: var(--color-primary);
    animation: ${sweep} calc(var(--duration-slow) * 5) var(--ease) infinite;
  }

  /* No movement: a fixed half-width segment still reads as busy. */
  @media (prefers-reduced-motion: reduce) {
    ${StyledTabsList}[data-loading] &::after {
      width: 50%;
      animation: none;
    }
  }
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
`;

interface TabsListProps extends TabsPrimitive.TabsListProps {
  /** The selected tab's content is loading: its underline shows a sweeping progress line and the list is `aria-busy`. */
  loading?: boolean;
  /** Announced politely while `loading`, e.g. "Loading All". Without it the animation is the only cue, so always pass it. */
  loadingLabel?: string;
}

/** Every tab set shares the active line. */
export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(function TabsList({ children, loading = false, loadingLabel, ...props }, ref) {
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
      // Start over next time, or a remount (React runs effects twice in dev) never reaches "ready" and never slides.
      list.removeAttribute("data-indicator");
      mutations.disconnect();
      resize.disconnect();
    };
  }, []);

  return (
    <>
      <StyledTabsList {...props} ref={listRef} data-loading={loading ? "" : undefined} aria-busy={loading || undefined}>
        {children}
        <Indicator aria-hidden="true" />
      </StyledTabsList>
      {/* Outside the tablist (its children are tabs), so the announcement isn't a tablist child. */}
      <VisuallyHidden role="status">{loading && loadingLabel ? loadingLabel : ""}</VisuallyHidden>
    </>
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
    color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);

  &:hover {
    color: var(--color-text);
  }

  /* aria-selected, not data-state: a Tooltip trigger wrapping the tab overwrites data-state. */
  &[aria-selected="true"] {
    color: var(--color-text);
    border-bottom-color: var(--color-text);
  }

  /* The focus ring hugs the label box (the trigger's content box, padding and underline excluded), so it
     never covers the active underline: ring = where the keyboard is, underline = what is selected. The
     ring's 4px reach stays inside the trigger (its padding), so nothing clips it. */
  position: relative;

  &::after {
    content: "";
    position: absolute;
    inset: var(--space-3) var(--space-1) calc(var(--space-3) - 2px);
    border-radius: var(--radius-sm);
    pointer-events: none;
  }

  &:focus-visible::after {
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
