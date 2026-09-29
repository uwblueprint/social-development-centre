"use client";

import * as React from "react";
import { keyframes, styled } from "next-yak";

/**
 * Which part of the "filling in from Eventbrite" animation is showing.
 * `loading`: waiting on Eventbrite, the line bobs at the top. `scanning`: the line sweeps down and fields fill.
 */
export type ScanPhase = "idle" | "loading" | "scanning";

const bob = keyframes`
  from {
    translate: 0 0;
  }
  to {
    translate: 0 var(--space-2);
  }
`;

const fieldFilled = keyframes`
  from {
    color: transparent;
    background-color: var(--color-eventbrite-subtle);
    box-shadow: 0 0 0 1px var(--color-eventbrite-border);
  }
  30% {
    color: var(--color-text);
    background-color: var(--color-eventbrite-subtle);
    box-shadow: 0 0 0 1px var(--color-eventbrite-border);
  }
  to {
    color: var(--color-text);
    background-color: var(--color-bg);
    box-shadow: 0 0 0 0 transparent;
  }
`;

const MagicScan = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  /* Matches the form's own gap so a divider inside never touches the section above it. */
  gap: var(--space-6);

  /* Waiting on Eventbrite: fields stay empty. */
  &[data-phase="loading"] :is(input, textarea, [role="combobox"]) {
    color: transparent;
  }
  /* Filling: each field fills when the line reaches it (--reveal-at, set per field). */
  &[data-phase="scanning"] :is(input, textarea, [role="combobox"]) {
    animation: ${fieldFilled} calc(var(--duration-slow) * 4) var(--ease) var(--reveal-at, 0ms) backwards;
  }
`;

/* One thin bright line with a soft radial glow. Stacked halos read as a lightsaber, so there is a single wash. */
const ScanLine = styled.div`
  position: absolute;
  z-index: var(--z-raised);
  top: 0;
  left: calc(var(--space-4) * -1);
  right: calc(var(--space-4) * -1);
  height: 2px;
  background: var(--color-eventbrite-bright);
  pointer-events: none;

  &::before {
    content: "";
    position: absolute;
    inset: calc(var(--space-8) * -1) 0;
    background: radial-gradient(
      ellipse 60% 50% at 50% 50%,
      color-mix(in srgb, var(--color-eventbrite-bright) 32%, transparent),
      color-mix(in srgb, var(--color-eventbrite-bright) 10%, transparent) 55%,
      transparent 75%
    );
    pointer-events: none;
  }

  &[data-phase="loading"] {
    animation: ${bob} var(--duration-slow) var(--ease) infinite alternate;
  }
`;

/** The nearest scrolling ancestor, or the page. */
function scrollParentOf(el: HTMLElement): HTMLElement {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) return node;
  }
  return (document.scrollingElement as HTMLElement) ?? document.documentElement;
}

/**
 * Wraps a group of fields with the Eventbrite "magic fill" animation. During `scanning` a line sweeps down
 * the area at constant speed (`--duration-scan`) and the page scrolls with it; each field's text appears as
 * the line passes it. `onDone` fires when the sweep ends. With reduced motion there is no bob or sweep and
 * the fields appear at once.
 */
export function MagicScanArea({
  phase,
  onDone,
  children,
}: {
  phase: ScanPhase;
  onDone: () => void;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const lineRef = React.useRef<HTMLDivElement>(null);
  // Held in a ref so a new `onDone` identity doesn't restart the sweep.
  const doneRef = React.useRef(onDone);
  React.useEffect(() => {
    doneRef.current = onDone;
  });

  React.useLayoutEffect(() => {
    const area = ref.current;
    const line = lineRef.current;
    if (phase !== "scanning" || !area || !line) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduce ? 0 : parseFloat(getComputedStyle(area).getPropertyValue("--duration-scan")) * 1000 || 0;
    const box = area.getBoundingClientRect();
    // Each visible field fills when the line reaches its top edge. Hidden inputs behind Selects are skipped.
    area
      .querySelectorAll<HTMLElement>('input:not([type="hidden"]):not([aria-hidden="true"]), textarea, [role="combobox"]')
      .forEach((field) => {
        const at = Math.min(Math.max((field.getBoundingClientRect().top - box.top) / Math.max(box.height, 1), 0), 1);
        field.style.setProperty("--reveal-at", `${Math.round(at * duration)}ms`);
      });
    const scroller = scrollParentOf(area);
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = duration ? Math.min((now - start) / duration, 1) : 1;
      const y = t * area.offsetHeight;
      line.style.top = `${y}px`;
      // Keep the line about a third of the way down the screen so the page scrolls with it.
      if (!reduce) {
        const lineTop = area.getBoundingClientRect().top + y;
        const target = scroller.clientHeight / 3;
        scroller.scrollTop += lineTop - target - (scroller === document.scrollingElement ? 0 : scroller.getBoundingClientRect().top);
      }
      if (t < 1) frame = requestAnimationFrame(tick);
      else doneRef.current();
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  return (
    <MagicScan ref={ref} data-phase={phase === "idle" ? undefined : phase}>
      {phase !== "idle" && <ScanLine ref={lineRef} data-phase={phase} aria-hidden="true" />}
      {children}
    </MagicScan>
  );
}
