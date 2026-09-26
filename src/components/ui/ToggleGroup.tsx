"use client";

import * as React from "react";
import { styled } from "next-yak";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";

const Root = styled(ToggleGroupPrimitive.Root)`
  position: relative;
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border-radius: var(--radius-md);
  background: var(--color-border);
`;

const Indicator = styled.div`
  position: absolute;
  top: 4px;
  bottom: 4px;
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

export const ToggleGroupItem = styled(ToggleGroupPrimitive.Item)`
  all: unset;
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-sm);
  /* Mixing in more of --color-text than --color-text-muted carries (which
     only hits ~4.1:1 on the --color-border container background) reaches
     ~6.8:1, comfortably clearing WCAG 2.2 AA's 4.5:1 for text. */
  color: color-mix(in srgb, var(--color-text) 75%, transparent);
  font-family: inherit;
  font-size: var(--text-sm);
  font-weight: var(--weight-regular);
  line-height: var(--leading-ui);
  cursor: pointer;
  transition:
    color var(--duration) var(--ease),
    background-color var(--duration) var(--ease),
    box-shadow var(--duration) var(--ease);

  &:hover:not([data-disabled]) {
    color: var(--color-text);
  }

  &[data-state="on"] {
    color: var(--color-text);
  }

  &:focus-visible {
    box-shadow: var(--focus-ring);
  }

  &[data-disabled] {
    opacity: 0.45;
    cursor: not-allowed;
  }

  /* type="multiple": more than one item can be active at once, so a single
     sliding indicator (rendered only for type="single") doesn't apply.
     Each pressed item keeps its own static background instead. */
  ${Root}[data-multi] > &[data-state="on"] {
    background: var(--color-bg);
    box-shadow: var(--shadow-sm);
  }
`;

/** Measures the active `[data-state="on"]` item and reports its position
 *  relative to the (positioned) container, re-measuring on resize and
 *  whenever any descendant's `data-state` changes. */
function useActiveItemRect(containerRef: React.RefObject<HTMLElement | null>) {
  const [rect, setRect] = React.useState<{ x: number; width: number; ready: boolean }>({
    x: 0,
    width: 0,
    ready: false,
  });

  React.useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function measure() {
      const active = container!.querySelector<HTMLElement>('[data-state="on"]');
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

type ToggleGroupProps = (
  | ToggleGroupPrimitive.ToggleGroupSingleProps
  | ToggleGroupPrimitive.ToggleGroupMultipleProps
) & {
  /** Submits the selected value(s) with the surrounding form (one field per value). */
  name?: string;
};

/**
 * Segmented control. `type="single"` shows one sliding pill that animates to
 * the active item; `type="multiple"` (more than one item can be pressed)
 * falls back to a static background per pressed item.
 */
export function ToggleGroup({ children, name, ...props }: ToggleGroupProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isSingle = props.type === "single";
  const { x, width, ready } = useActiveItemRect(containerRef);
  const [inner, setInner] = React.useState<string | string[]>(
    props.defaultValue ?? (isSingle ? "" : []),
  );
  const current = props.value ?? inner;
  const submitted = (Array.isArray(current) ? current : [current]).filter(Boolean);

  const handleChange = (next: string & string[]) => {
    setInner(next);
    (props.onValueChange as ((v: string | string[]) => void) | undefined)?.(next);
  };

  return (
    <Root
      ref={containerRef}
      data-multi={isSingle ? undefined : ""}
      {...props}
      onValueChange={handleChange}
    >
      {isSingle && (
        <Indicator
          aria-hidden="true"
          style={{ transform: `translateX(${x}px)`, width: `${width}px`, opacity: ready ? 1 : 0 }}
        />
      )}
      {name && submitted.map((v) => <input key={v} type="hidden" name={name} value={v} />)}
      {children}
    </Root>
  );
}
