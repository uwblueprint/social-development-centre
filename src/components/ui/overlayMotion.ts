import { css } from "next-yak";

/*
 * Overlay enter/exit: a short fade plus a 4px nudge toward the trigger side, vertical only. The old
 * scale + transform-origin (a Radix var that isn't measured on the first frame) and the horizontal
 * slide made the panel twitch sideways as Radix settled its position. Exit is a plain fade. Only the
 * inner content animates, never Radix's positioned wrapper. See docs/design/motion.md.
 *
 * The keyframes live in tokens.ts's global styles: next-yak doesn't carry keyframes declared here
 * into the components that use this mixin, and Radix keeps a closed overlay on screen until its
 * exit animation ends.
 *
 * Tooltips mark open as "delayed-open" or "instant-open"; everything else uses "open".
 */
export const overlayMotion = css`
  &[data-state="open"],
  &[data-state="delayed-open"],
  &[data-state="instant-open"] {
    animation: overlay-fade-in var(--overlay-duration, var(--duration)) var(--ease-out);
  }

  &[data-state="open"][data-side="bottom"],
  &[data-state="delayed-open"][data-side="bottom"],
  &[data-state="instant-open"][data-side="bottom"] {
    animation: overlay-fade-in-below var(--overlay-duration, var(--duration)) var(--ease-out);
  }

  &[data-state="open"][data-side="top"],
  &[data-state="delayed-open"][data-side="top"],
  &[data-state="instant-open"][data-side="top"] {
    animation: overlay-fade-in-above var(--overlay-duration, var(--duration)) var(--ease-out);
  }

  &[data-state="closed"] {
    animation: overlay-fade-out var(--duration-fast) var(--ease-in) forwards;
  }
`;
