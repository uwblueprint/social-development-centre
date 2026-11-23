"use client";

import { styled } from "next-yak";
import { createPortal } from "react-dom";
import type { MarqueeBox } from "./useMarquee";

/* The selection box: a primary outline over a faint primary wash, square-cornered. Fixed over the whole page
   (it can start beside what it selects and spill past it) and on the body at the top layer, so nothing (sticky
   day headings, the selection bar, toasts) ever covers it. Never in the way of the pointer. */
const Box = styled.div`
  position: fixed;
  z-index: var(--z-toast);
  border: 1px solid var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  pointer-events: none;
`;

/** Draws the selection box while a drag is on (see useMarquee). */
export function MarqueeOverlay({ box }: { box: MarqueeBox | null }) {
  if (!box) return null;
  return createPortal(<Box aria-hidden="true" style={{ top: box.top, left: box.left, width: box.width, height: box.height }} />, document.body);
}
