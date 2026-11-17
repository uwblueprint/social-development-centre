import { css } from "next-yak";

/*
 * Overlay enter/exit: a short fade plus a 4px nudge toward the trigger side, vertical only. The old
 * scale + transform-origin (a Radix var that isn't measured on the first frame) and the horizontal
 * slide made the panel twitch sideways as Radix settled its position. Exit is a plain fade. Only the
 * inner content animates, never Radix's positioned wrapper. See docs/design/motion.md.
 *
 * The keyframes are global, in tokens.ts: next-yak doesn't emit keyframes declared in a mixin-only
 * module like this one, and a missing exit animation leaves Radix overlays mounted after they close.
 */

/**
 * Shared by every Radix overlay content (menus, popovers, selects, tooltips, hover cards).
 * Set --overlay-duration to change how fast it enters (Tooltip uses --duration-fast).
 */
export const overlayMotion = css`
  &[data-state="open"] {
    animation: overlay-fade-in var(--overlay-duration, var(--duration)) var(--ease-out);
  }

  &[data-state="open"][data-side="bottom"] {
    animation: overlay-fade-in-below var(--overlay-duration, var(--duration)) var(--ease-out);
  }

  &[data-state="open"][data-side="top"] {
    animation: overlay-fade-in-above var(--overlay-duration, var(--duration)) var(--ease-out);
  }

  &[data-state="closed"] {
    animation: overlay-fade-out var(--duration-fast) var(--ease-in) forwards;
  }
`;
