import { css, styled } from "next-yak";

/*
 * Small building blocks shared by several kit components. Internal to src/components/ui: app code
 * uses the components, not these.
 */

/** True when an `aria-invalid` value means invalid (React passes it through as a boolean or "true"). */
export function isInvalid(value: unknown) {
  return value === true || value === "true";
}

/** Text for screen readers only: in the accessibility tree, invisible on screen. */
export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

/*
 * Overlay enter/exit: a short fade plus a 4px nudge toward the trigger side, vertical only. The old
 * scale + transform-origin (a Radix var that isn't measured on the first frame) and the horizontal
 * slide made the panel twitch sideways as Radix settled its position. Exit is a plain fade. Only the
 * inner content animates, never Radix's positioned wrapper.
 *
 * The keyframes are global, in tokens.ts: next-yak doesn't emit keyframes declared next to a shared css
 * mixin, and a missing exit animation leaves Radix overlays mounted after they close.
 */
/**
 * The overlay enter/exit animation, for a Radix content element (it reads data-state and data-side).
 * Tooltip opens faster by setting --overlay-enter-duration to var(--duration-fast).
 */
export const overlayMotion = css`
  &[data-state="open"] {
    animation: overlay-fade-in var(--overlay-enter-duration, var(--duration)) var(--ease-out);
  }

  &[data-state="open"][data-side="bottom"] {
    animation: overlay-fade-in-below var(--overlay-enter-duration, var(--duration)) var(--ease-out);
  }

  &[data-state="open"][data-side="top"] {
    animation: overlay-fade-in-above var(--overlay-enter-duration, var(--duration)) var(--ease-out);
  }

  &[data-state="closed"] {
    animation: overlay-fade-out var(--duration-fast) var(--ease-in) forwards;
  }
`;
