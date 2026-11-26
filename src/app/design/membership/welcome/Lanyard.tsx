"use client";

import * as React from "react";
import { styled } from "next-yak";

/*
 * The membership card on a lanyard, hanging from the top of the window. Grab the card and pull it anywhere:
 * the strap stretches after it from the top edge and the card tilts to hang off the strap. Let go and it
 * springs back to where it hangs, with a little bounce.
 *
 * The card's offset and the strap are written straight to the DOM each frame (no React state), so it
 * follows the pointer smoothly. The animation only runs while it's held or settling. People who ask for
 * reduced motion can still pull it; it snaps back without the bounce.
 */

/** Strap length at rest, in px: from the top of the window to the clip. */
const STRAP = 190;
/** The spring back to rest: stiffness (per s²) and damping (per s). A couple of soft bounces. */
const STIFFNESS = 90;
const DAMPING = 9;
/** How far the card can be pulled from where it hangs, in px. */
const REACH = 320;

const Rig = styled.div`
  position: relative;
  width: 100%;
  max-width: 320px;
  padding-top: ${STRAP}px;
  /* The strap and clip: the card's line colour, quiet grey in light mode and white in dark mode. */
  --lanyard-line: var(--color-border-strong);

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) & {
      --lanyard-line: var(--taupe-50);
    }
  }
  :root[data-theme="dark"] & {
    --lanyard-line: var(--taupe-50);
  }
`;

/* The strap: two bands from the top of the window to the card's clip, in the card's line colour. */
const Strap = styled.svg`
  position: absolute;
  left: 50%;
  top: 0;
  width: 1px;
  height: 1px;
  overflow: visible;
  color: var(--lanyard-line);
  pointer-events: none;
`;

/* The card and its clip: grabbable. touch-action: none so a drag on a phone pulls it instead of scrolling. */
const Tag = styled.div`
  position: relative;
  transform-origin: 50% 0;
  will-change: transform;
  cursor: grab;
  touch-action: none;
  user-select: none;

  &[data-dragging] {
    cursor: grabbing;
  }
`;

/* The clip at the top of the card, where the strap attaches. */
const Clip = styled.svg`
  position: absolute;
  left: 50%;
  top: calc(var(--space-4) * -1);
  transform: translateX(-50%);
  overflow: visible;
  color: var(--lanyard-line);
  pointer-events: none;
`;

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function Lanyard({ children }: { children: React.ReactNode }) {
  const tagRef = React.useRef<HTMLDivElement>(null);
  const bandsRef = React.useRef<SVGGElement>(null);
  // Where the card is, relative to where it hangs (px), and how fast it's moving (px/s).
  const state = React.useRef({ x: 0, y: 0, vx: 0, vy: 0, dragging: false, grabX: 0, grabY: 0, frame: 0, last: 0 });

  /** Draws the card and strap for the current offset. */
  const draw = React.useCallback(() => {
    const s = state.current;
    const tag = tagRef.current;
    const bands = bandsRef.current;
    if (!tag || !bands) return;
    // The clip's position, from the strap's anchor at the top of the window.
    const cx = s.x;
    const cy = STRAP + s.y;
    // The card hangs off the strap, so it tilts along it (a little less, so it stays readable).
    const tilt = Math.atan2(-cx, Math.max(cy, 1)) * 0.6;
    tag.style.transform = `translate(${s.x}px, ${s.y}px) rotate(${tilt}rad)`;
    // Slack (pushed closer than its length): the strap sags sideways instead of going straight.
    const slack = Math.max(0, STRAP - Math.hypot(cx, cy));
    const bend = slack * 0.6;
    const paths = bands.children;
    const spread = [-9, -4, 4, 9];
    for (let i = 0; i < paths.length; i++) {
      const top = spread[i] * 2.4;
      const bottom = spread[i] * 0.35;
      const mx = (top + cx + bottom) / 2 + bend;
      const my = cy / 2;
      paths[i].setAttribute("d", `M ${top} -6 Q ${mx} ${my}, ${cx + bottom} ${cy - 18}`);
    }
  }, []);

  React.useLayoutEffect(draw, [draw]);

  React.useEffect(() => {
    const s = state.current;
    return () => cancelAnimationFrame(s.frame);
  }, []);

  /** Springs back to rest, frame by frame, then stops. */
  const settle = React.useCallback(() => {
    const s = state.current;
    const tick = (now: number) => {
      const dt = Math.min((now - s.last) / 1000, 1 / 30);
      s.last = now;
      s.vx += (-STIFFNESS * s.x - DAMPING * s.vx) * dt;
      s.vy += (-STIFFNESS * s.y - DAMPING * s.vy) * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (Math.hypot(s.x, s.y) < 0.3 && Math.hypot(s.vx, s.vy) < 2) {
        s.x = s.y = s.vx = s.vy = 0;
        s.frame = 0;
        draw();
        return;
      }
      draw();
      s.frame = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(s.frame);
    s.last = performance.now();
    s.frame = requestAnimationFrame(tick);
  }, [draw]);

  function grab(e: React.PointerEvent<HTMLDivElement>) {
    const s = state.current;
    cancelAnimationFrame(s.frame);
    s.frame = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.dataset.dragging = "";
    s.dragging = true;
    s.grabX = e.clientX - s.x;
    s.grabY = e.clientY - s.y;
    s.vx = s.vy = 0;
    s.last = performance.now();
  }

  function drag(e: React.PointerEvent<HTMLDivElement>) {
    const s = state.current;
    if (!s.dragging) return;
    let x = e.clientX - s.grabX;
    let y = e.clientY - s.grabY;
    // Held by the strap: it can't be pulled further than REACH from where it hangs.
    const d = Math.hypot(x, y);
    if (d > REACH) {
      x = (x / d) * REACH;
      y = (y / d) * REACH;
    }
    const now = performance.now();
    const dt = Math.max((now - s.last) / 1000, 1 / 240);
    s.vx = (x - s.x) / dt;
    s.vy = (y - s.y) / dt;
    s.x = x;
    s.y = y;
    s.last = now;
    draw();
  }

  function release(e: React.PointerEvent<HTMLDivElement>) {
    const s = state.current;
    if (!s.dragging) return;
    s.dragging = false;
    delete e.currentTarget.dataset.dragging;
    if (reduced()) {
      s.x = s.y = s.vx = s.vy = 0;
      draw();
      return;
    }
    // A flick keeps some of its speed, within reason.
    const speed = Math.hypot(s.vx, s.vy);
    if (speed > 1500) {
      s.vx = (s.vx / speed) * 1500;
      s.vy = (s.vy / speed) * 1500;
    }
    settle();
  }

  const line = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" } as const;

  return (
    <Rig>
      <Strap aria-hidden="true" focusable="false" {...line}>
        <g ref={bandsRef}>
          <path strokeWidth={1.6} />
          <path strokeWidth={1} opacity={0.7} />
          <path strokeWidth={1} opacity={0.7} />
          <path strokeWidth={1.6} />
        </g>
      </Strap>
      <Tag ref={tagRef} onPointerDown={grab} onPointerMove={drag} onPointerUp={release} onPointerCancel={release}>
        <Clip width={20} height={22} viewBox="-10 -4 20 22" aria-hidden="true" focusable="false" {...line}>
          {/* A small rounded clip and the ring through the card. */}
          <path d="M -7 -2 L 7 -2.5 L 7.5 8 L -7.5 8.5 Z" strokeWidth={1.5} />
          <path d="M 0 8 C -5 9, -5 17, 0 17 C 5 17, 5 9, 0 8" strokeWidth={1.4} />
        </Clip>
        {children}
      </Tag>
    </Rig>
  );
}
