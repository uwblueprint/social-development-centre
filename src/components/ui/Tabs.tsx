"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Tabs as TabsPrimitive } from "radix-ui";

export const Tabs = TabsPrimitive.Root;

const ListRoot = styled(TabsPrimitive.List)`
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: var(--space-1);
  border-radius: var(--radius-md);
  background: var(--color-border);
`;

const Indicator = styled.div`
  position: absolute;
  top: var(--space-1);
  bottom: var(--space-1);
  left: 0;
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  box-shadow: var(--shadow-sm);
  pointer-events: none;
  will-change: transform;
  transition:
    transform var(--duration-slow) var(--ease-spring),
    width var(--duration-slow) var(--ease-spring),
    opacity var(--duration) var(--ease);
`;

export const TabsTrigger = styled(TabsPrimitive.Trigger)`
  all: unset;
  position: relative;
  z-index: 1;
  padding: 10px var(--space-4);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: var(--weight-regular);
  line-height: var(--leading-ui);
  /* --color-text-muted is only ~4.5:1 on --color-border at best; mix in more
     of --color-text so inactive labels stay comfortably above 4.5:1. */
  color: color-mix(in srgb, var(--color-text) 72%, transparent);
  cursor: pointer;
  transition: color var(--duration) var(--ease);

  &:hover {
    color: var(--color-text);
  }

  &[data-state="active"] {
    color: var(--color-text);
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

/** Measures the active `[data-state="active"]` trigger and reports its
 *  position relative to the (positioned) list, re-measuring on resize and
 *  whenever any descendant's `data-state` changes (i.e. on tab switch). */
function useActiveTriggerRect(containerRef: React.RefObject<HTMLElement | null>) {
  const [rect, setRect] = React.useState<{ x: number; width: number; ready: boolean }>({
    x: 0,
    width: 0,
    ready: false,
  });

  React.useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function measure() {
      const active = container!.querySelector<HTMLElement>('[data-state="active"]');
      if (!active) {
        setRect((r) => (r.ready ? { x: 0, width: 0, ready: false } : r));
        return;
      }
      setRect({ x: active.offsetLeft, width: active.offsetWidth, ready: true });
    }

    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(container);
    const mutationObserver = new MutationObserver(measure);
    mutationObserver.observe(container, {
      attributes: true,
      attributeFilter: ["data-state"],
      subtree: true,
    });
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [containerRef]);

  return rect;
}

/** Tab list with a single sliding pill that animates to the active trigger. */
export function TabsList({ children, ...props }: TabsPrimitive.TabsListProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { x, width, ready } = useActiveTriggerRect(containerRef);

  return (
    <ListRoot ref={containerRef} {...props}>
      <Indicator
        aria-hidden="true"
        style={{ transform: `translateX(${x}px)`, width: `${width}px`, opacity: ready ? 1 : 0 }}
      />
      {children}
    </ListRoot>
  );
}
