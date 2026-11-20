import * as React from "react";

/*
 * A selection box, like Figma's: press, drag, and a box follows the pointer. This hook only draws the box and
 * reports it; the caller decides what the box selects (list rows, calendar days) and where a drag may start.
 * Mouse and pen only: on touch, dragging scrolls.
 *
 * A press only becomes a drag once the pointer has moved a few pixels: a click that doesn't move still does
 * what it did, and the click that ends a drag is swallowed so it doesn't act on whatever it lands on.
 * It never starts in places where dragging means something else: text fields, the tabs, dialogs, menus, and
 * anything marked `data-no-marquee` (the selection bar, the email being read or edited, whose text stays selectable).
 * With `scrollRef`, the box's start is pinned to that scroll box's content and it scrolls near its top or bottom
 * edge, so the box grows with the scroll.
 */

/** How far the pointer moves before a press becomes a drag. */
const DRAG_THRESHOLD = 5;
/** How close to the scroll box's top or bottom edge the pointer must be to scroll it, and the fastest it scrolls per frame. */
const EDGE = 40;
const MAX_STEP = 16;

const NO_START = [
  "input",
  "textarea",
  "select",
  "[contenteditable='true']",
  "[role='dialog']",
  "[role='alertdialog']",
  "[role='menu']",
  "[role='listbox']",
  "[role='tablist']",
  "[data-radix-popper-content-wrapper]",
  "[data-no-marquee]",
].join(", ");

/** The box in viewport coordinates, for a fixed-position overlay. */
export interface MarqueeBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Whether a rectangle (a row, a day cell) touches the box, even partly. */
export const touches = (r: DOMRect, box: MarqueeBox) =>
  r.top < box.top + box.height && r.bottom > box.top && r.left < box.left + box.width && r.right > box.left;

interface Options {
  /** Off when there is nothing to select. */
  enabled?: boolean;
  /** Whether a press on this element may start this box (the list's box and the calendar's split the page between them). */
  canStart: (target: Element) => boolean;
  /** A drag began: read modifier keys here (Shift, Ctrl or Cmd usually add to the selection). */
  onStart?: (event: PointerEvent) => void;
  /** The box moved (`done` false) or the drag ended (`done` true). */
  onBox: (box: MarqueeBox, done: boolean) => void;
  /** A scroll box the drag scrolls near its edges, with the box's start pinned to its content. */
  scrollRef?: React.RefObject<HTMLElement | null>;
}

export function useMarquee({ enabled = true, canStart, onStart, onBox, scrollRef }: Options) {
  const [box, setBox] = React.useState<MarqueeBox | null>(null);
  const latest = React.useRef({ canStart, onStart, onBox });
  React.useEffect(() => {
    latest.current = { canStart, onStart, onBox };
  });

  React.useEffect(() => {
    if (!enabled) return;
    let drag: {
      pointerId: number;
      startX: number;
      startY: number;
      /** The scroll box's scrollTop at the start: the start point moves with its content when it scrolls. */
      startScroll: number;
      x: number;
      y: number;
      active: boolean;
      event: PointerEvent;
    } | null = null;
    let current: MarqueeBox | null = null;
    let frame = 0;
    let swallowClick = false;

    const update = () => {
      if (!drag?.active) return;
      const scroller = scrollRef?.current;
      const startY = drag.startY - ((scroller?.scrollTop ?? 0) - drag.startScroll);
      current = {
        left: Math.min(drag.startX, drag.x),
        top: Math.min(startY, drag.y),
        width: Math.abs(drag.x - drag.startX),
        height: Math.abs(drag.y - startY),
      };
      setBox(current);
      latest.current.onBox(current, false);
    };

    // Near the scroll box's top or bottom edge, scroll it and grow the box every frame, until the drag ends.
    const tick = () => {
      const scroller = scrollRef?.current;
      if (!scroller || !drag?.active) return;
      const rect = scroller.getBoundingClientRect();
      const over = drag.y < rect.top + EDGE ? drag.y - (rect.top + EDGE) : drag.y > rect.bottom - EDGE ? drag.y - (rect.bottom - EDGE) : 0;
      if (over) {
        const before = scroller.scrollTop;
        scroller.scrollTop += Math.max(-MAX_STEP, Math.min(MAX_STEP, Math.round((over / EDGE) * MAX_STEP)));
        if (scroller.scrollTop !== before) update();
      }
      frame = requestAnimationFrame(tick);
    };

    const end = () => {
      cancelAnimationFrame(frame);
      if (drag?.active) {
        swallowClick = true;
        document.documentElement.style.removeProperty("user-select");
        // If no click follows (released over another element), don't let it swallow a later one.
        setTimeout(() => (swallowClick = false), 0);
        if (current) latest.current.onBox(current, true);
      }
      drag = null;
      current = null;
      setBox(null);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };

    const onMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.pointerId) return;
      drag.x = e.clientX;
      drag.y = e.clientY;
      if (!drag.active) {
        if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < DRAG_THRESHOLD) return;
        drag.active = true;
        // Dragging the box, not selecting text on the way.
        window.getSelection()?.removeAllRanges();
        document.documentElement.style.setProperty("user-select", "none");
        latest.current.onStart?.(drag.event);
        if (scrollRef) frame = requestAnimationFrame(tick);
      }
      update();
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch" || e.button !== 0) return;
      const target = e.target as Element | null;
      if (!target || target.closest(NO_START) || !latest.current.canStart(target)) return;
      // Not on a page scrollbar (outside the document's content box), or the scroll box's own.
      if (e.clientX >= document.documentElement.clientWidth || e.clientY >= document.documentElement.clientHeight) return;
      const scroller = scrollRef?.current;
      if (scroller?.contains(target) && e.clientX > scroller.getBoundingClientRect().left + scroller.clientWidth) return;
      drag = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startScroll: scroller?.scrollTop ?? 0,
        x: e.clientX,
        y: e.clientY,
        active: false,
        event: e,
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", end);
      window.addEventListener("pointercancel", end);
    };

    // The click that ends a drag lands on whatever is under the pointer: it must not act.
    const onClick = (e: MouseEvent) => {
      if (!swallowClick) return;
      swallowClick = false;
      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener("pointerdown", onDown);
    document.addEventListener("click", onClick, true);
    return () => {
      end();
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("click", onClick, true);
    };
  }, [enabled, scrollRef]);

  return box;
}
