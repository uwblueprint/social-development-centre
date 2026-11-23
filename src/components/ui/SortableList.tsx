"use client";

import * as React from "react";
import { css, styled } from "next-yak";
import { GripVertical } from "lucide-react";
import { Icon } from "./Icon";

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const Item = styled.li<{ $table: boolean; $clickable: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) 0;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  transition: transform var(--duration) var(--ease-out);

  /* Table rows: the Table's row height and inset dividers, and its hover box, so a sortable list can sit under a Table-style header. */
  ${({ $table }) =>
    $table &&
    css`
      min-height: var(--row-height);
      padding: 0 var(--space-3);
      border-bottom: 0;
      border-radius: var(--radius-sm);

      &:not(:last-child)::after {
        content: "";
        position: absolute;
        left: var(--space-3);
        right: var(--space-3);
        bottom: 0;
        height: 1px;
        background: var(--color-border);
        pointer-events: none;
      }
      &:not([data-dragging="true"]):is(:hover, :focus-within) {
        background: var(--color-bg-hover);
        box-shadow: inset 0 0 0 1px var(--color-border);
      }
      &:not([data-dragging="true"]):is(:hover, :focus-within)::after,
      &:has(+ li:is(:hover, :focus-within))::after {
        background: transparent;
      }
    `}
  ${({ $clickable }) => $clickable && "cursor: pointer;"}

  &[data-dragging="true"] {
    z-index: var(--z-raised);
    background: var(--color-surface-raised);
    box-shadow: var(--shadow-md);
    border-radius: var(--radius-md);
    /* Follows the pointer exactly; only the other rows animate. */
    transition: none;
  }
`;

/* A 40px square so it is easy to grab with a finger; touch-action none keeps the page from scrolling mid-drag. */
const Handle = styled.button`
  all: unset;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  cursor: grab;
  touch-action: none;

  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text);
  }
  &:focus-visible {
    box-shadow: var(--focus-ring);
  }
  &[data-dragging="true"] {
    cursor: grabbing;
  }
`;

/* The row's place in the order: 1 is first. Decorative; the handle's label says the position aloud. */
const Position = styled.span`
  flex-shrink: 0;
  min-width: 3ch;
  text-align: center;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  font-variant-numeric: tabular-nums;
  color: var(--color-text-muted);
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
`;

const LiveRegion = styled.div`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
`;

export interface SortableListProps<T> {
  items: T[];
  /** Stable id for each item; never the index. */
  getId: (item: T) => string;
  /** What each item is called in the controls and announcements, e.g. "Gold". */
  getLabel: (item: T) => string;
  /** Called with the full list in its new order, after a drop or an arrow press. */
  onReorder: (next: T[]) => void;
  /** Names the list for screen readers. */
  "aria-label": string;
  /**
   * "table" drops the position numbers and gives rows the Table's height, inset dividers and hover box, so the list
   * lines up under a Table-style header row. Default "list".
   */
  variant?: "list" | "table";
  /** Makes the whole row clickable (outside its buttons and links), e.g. to open the item. */
  onRowClick?: (item: T) => void;
  /** One item's content: its text and any buttons. The drag handle and arrows are added for you. */
  children: (item: T) => React.ReactNode;
}

interface Drag {
  id: string;
  from: number;
  to: number;
  /** How far the pointer has moved down (negative: up) since the press. */
  dy: number;
  /** Where each row's middle was when the drag began, and how tall the dragged row is. */
  centers: number[];
  height: number;
}

/** How close to the top or bottom edge (px) a held row starts scrolling, and the fastest it scrolls (px per frame). */
const EDGE = 80;
const MAX_SCROLL = 18;

/** The nearest ancestor that scrolls on its own, or null when the page does. */
function scrollParent(element: HTMLElement): HTMLElement | null {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const overflow = getComputedStyle(node).overflowY;
    if ((overflow === "auto" || overflow === "scroll") && node.scrollHeight > node.clientHeight) return node;
  }
  return null;
}

/** A row's new place, given where its middle now is among the others' original middles. */
function targetIndex(drag: Pick<Drag, "from" | "centers">, dy: number): number {
  const middle = drag.centers[drag.from] + dy;
  let target = 0;
  drag.centers.forEach((center, i) => {
    if (i !== drag.from && center < middle) target += 1;
  });
  return target;
}

function moved<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * A list people put in their own order. Each row shows its place (1, 2, 3…). Drag a row by its handle with
 * a mouse, a touchpad or a finger. With the keyboard, focus the handle and press Up or Down; Escape
 * cancels a drag. Each move is announced to screen readers.
 */
export function SortableList<T>({ items, getId, getLabel, onReorder, children, variant = "list", onRowClick, ...props }: SortableListProps<T>) {
  const rows = React.useRef(new Map<string, HTMLLIElement>());
  const [drag, setDrag] = React.useState<Drag | null>(null);
  const [announcement, setAnnouncement] = React.useState("");
  /** Where the pointer was when the press began, and how far the page had scrolled then. */
  const startY = React.useRef(0);
  const startScroll = React.useRef(0);
  /** Where the pointer is now, so the scroll loop keeps working while the pointer is still. */
  const pointerY = React.useRef(0);
  /** The scrolling box the list sits in (null: the page itself). */
  const scroller = React.useRef<HTMLElement | null>(null);
  const dragging = drag !== null;

  const scrolled = () => (scroller.current ? scroller.current.scrollTop : window.scrollY);

  /** Moves the dragged row to the pointer, counting any scrolling since the press. */
  const follow = React.useCallback(() => {
    const dy = pointerY.current + scrolled() - (startY.current + startScroll.current);
    setDrag((d) => (d ? { ...d, dy, to: targetIndex(d, dy) } : d));
  }, []);

  // Holding a row near the top or bottom edge scrolls that way, faster the closer to the edge.
  React.useEffect(() => {
    if (!dragging) return;
    let frame = 0;
    const tick = () => {
      const box = scroller.current?.getBoundingClientRect();
      const top = box ? Math.max(box.top, 0) : 0;
      const bottom = box ? Math.min(box.bottom, window.innerHeight) : window.innerHeight;
      const y = pointerY.current;
      const up = Math.min(1, Math.max(0, (top + EDGE - y) / EDGE));
      const down = Math.min(1, Math.max(0, (y - (bottom - EDGE)) / EDGE));
      const speed = (down - up) * MAX_SCROLL;
      if (speed !== 0) {
        if (scroller.current) scroller.current.scrollTop += speed;
        else window.scrollBy(0, speed);
        follow();
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [dragging, follow]);

  function announce(item: T, position: number) {
    setAnnouncement(`${getLabel(item)} moved to position ${position} of ${items.length}.`);
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length || to === from) return;
    announce(items[from], to + 1);
    onReorder(moved(items, from, to));
  }

  function start(event: React.PointerEvent<HTMLButtonElement>, index: number) {
    // Left mouse button, or touch and pen; not a right-click.
    if (event.pointerType === "mouse" && event.button !== 0) return;
    scroller.current = scrollParent(event.currentTarget);
    const scroll = scrolled();
    // Measured in the scrolling content's own coordinates, so they stay right as it scrolls.
    const centers = items.map((item) => {
      const rect = rows.current.get(getId(item))?.getBoundingClientRect();
      return rect ? rect.top + rect.height / 2 + scroll : 0;
    });
    const height = rows.current.get(getId(items[index]))?.getBoundingClientRect().height ?? 0;
    event.currentTarget.setPointerCapture(event.pointerId);
    startY.current = event.clientY;
    startScroll.current = scroll;
    pointerY.current = event.clientY;
    setDrag({ id: getId(items[index]), from: index, to: index, dy: 0, centers, height });
  }

  function track(event: React.PointerEvent<HTMLButtonElement>) {
    if (!drag) return;
    pointerY.current = event.clientY;
    follow();
  }

  function drop() {
    if (!drag) return;
    const { from, to } = drag;
    setDrag(null);
    move(from, to);
  }

  function handleKey(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "Escape" && drag) {
      setDrag(null);
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      move(index, index + (event.key === "ArrowUp" ? -1 : 1));
    }
  }

  /** Rows between the dragged row's old and new place slide out of its way. */
  function offsetOf(index: number): number {
    if (!drag || index === drag.from) return 0;
    if (drag.from < drag.to && index > drag.from && index <= drag.to) return -drag.height;
    if (drag.from > drag.to && index >= drag.to && index < drag.from) return drag.height;
    return 0;
  }

  return (
    <>
      <List aria-label={props["aria-label"]}>
        {items.map((item, index) => {
          const id = getId(item);
          const label = getLabel(item);
          const held = drag !== null && drag.id === id;
          const offset = drag !== null && held ? drag.dy : offsetOf(index);
          return (
            <Item
              key={id}
              ref={(node) => {
                if (node) rows.current.set(id, node);
                else rows.current.delete(id);
              }}
              data-dragging={held || undefined}
              $table={variant === "table"}
              $clickable={!!onRowClick}
              onClick={
                onRowClick
                  ? (event) => {
                      // Portalled menus and dialogs bubble through React; only clicks inside the row itself count.
                      if (!event.currentTarget.contains(event.target as Node)) return;
                      if ((event.target as HTMLElement).closest("button, a, input, [role='menuitem']")) return;
                      onRowClick(item);
                    }
                  : undefined
              }
              style={offset ? { transform: `translateY(${offset}px)` } : undefined}
            >
              <Handle
                type="button"
                aria-label={`Reorder ${label}, position ${index + 1} of ${items.length}. Drag it, or press the up or down arrow key to move it.`}
                data-dragging={held || undefined}
                onPointerDown={(event) => start(event, index)}
                onPointerMove={track}
                onPointerUp={drop}
                onPointerCancel={() => setDrag(null)}
                onKeyDown={(event) => handleKey(event, index)}
              >
                <Icon icon={GripVertical} size={16} />
              </Handle>
              {variant === "list" && <Position aria-hidden="true">{index + 1}</Position>}
              <Content>{children(item)}</Content>
            </Item>
          );
        })}
      </List>
      <LiveRegion role="status" aria-live="polite">
        {announcement}
      </LiveRegion>
    </>
  );
}
