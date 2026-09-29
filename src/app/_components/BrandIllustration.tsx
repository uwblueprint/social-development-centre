import type * as React from "react";
import { keyframes, styled } from "next-yak";

/* The traveller (or goose) drifts gently. Reduced motion is handled globally. */
const drift = keyframes`
  from {
    translate: 0 0;
  }
  to {
    translate: 0 calc(var(--space-2) * -1);
  }
`;

/*
 * The line drawings (404, offline) in brand taupe: the SVG is black line art on a white square,
 * used as a luminance mask. The frame is the line colour; the masked layer on top is the ground colour and
 * shows only where the drawing is white. Light: taupe-600 on taupe-50; dark: the inverse, taupe-500 on taupe-900.
 */
const Frame = styled.div`
  position: relative;
  width: min(100%, calc(var(--space-8) * 6));
  aspect-ratio: 1;
  margin-bottom: var(--space-2);
  /* Square, not rounded: the ground matches the page, so a radius is invisible, and its soft corners
     let the line colour through as faint arcs (visible as hairlines when zoomed in). */
  overflow: hidden;
  background: var(--illustration-line);
  animation: ${drift} calc(var(--duration-slow) * 12) var(--ease) infinite alternate;

  &::after {
    content: "";
    position: absolute;
    /* 2px past the frame on every side: the mask's soft (antialiased) edge falls outside and is clipped,
       so no hairline of the line colour shows at the edges when zoomed in. */
    inset: calc(var(--space-1) / -2);
    background: var(--illustration-ground);
    mask: var(--illustration-src) center / contain no-repeat;
    mask-mode: luminance;
  }
`;

export function BrandIllustration({ src, label }: { src: string; label: string }) {
  return <Frame role="img" aria-label={label} style={{ "--illustration-src": `url("${src}")` } as React.CSSProperties} />;
}
