import { css, keyframes } from "next-yak";

/*
 * Overlay enter/exit: a short fade plus a 4px nudge toward the trigger side, vertical only. The old
 * scale + transform-origin (a Radix var that isn't measured on the first frame) and the horizontal
 * slide made the panel twitch sideways as Radix settled its position. Exit is a plain fade. Only the
 * inner content animates, never Radix's positioned wrapper. See docs/design/motion.md.
 */
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeInBelow = keyframes`
  from { opacity: 0; transform: translateY(calc(var(--space-1) * -1)); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeInAbove = keyframes`
  from { opacity: 0; transform: translateY(var(--space-1)); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

/** Shared by every Radix overlay content (menus, popovers, selects, tooltips, hover cards). */
export const overlayMotion = css`
  &[data-state="open"] {
    animation: ${fadeIn} var(--duration) var(--ease-out);
  }

  &[data-state="open"][data-side="bottom"] {
    animation: ${fadeInBelow} var(--duration) var(--ease-out);
  }

  &[data-state="open"][data-side="top"] {
    animation: ${fadeInAbove} var(--duration) var(--ease-out);
  }

  &[data-state="closed"] {
    animation: ${fadeOut} var(--duration-fast) var(--ease-in) forwards;
  }
`;
