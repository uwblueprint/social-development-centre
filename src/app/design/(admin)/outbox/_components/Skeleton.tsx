"use client";

import { css, keyframes, styled } from "next-yak";

/*
 * A placeholder in the shape of what's coming (a line of text, a checkbox, a search field). While loading it
 * breathes slowly, so the page reads as busy rather than broken; `$still` keeps it quiet (e.g. behind an error).
 * Hidden from assistive tech by its caller, which announces the loading once.
 *
 * The keyframes live in this .tsx with the styled component that uses them: next-yak only emits keyframes
 * from files that render styles.
 */
const breathe = keyframes`
  50% {
    opacity: 0.45;
  }
`;

export const SkeletonBlock = styled.span<{ $width?: string; $height?: string; $radius?: string; $still?: boolean }>`
  display: block;
  flex: none;
  width: ${({ $width }) => $width ?? "100%"};
  height: ${({ $height }) => $height ?? "var(--space-3)"};
  border-radius: ${({ $radius }) => $radius ?? "var(--radius-sm)"};
  background: var(--color-surface);
  /* About 1.4s a breath. ease-in-out, not a motion token: the tokens ease one way, and a loop needs both ends soft. */
  animation: ${breathe} calc(var(--duration-slow) * 6) ease-in-out infinite;
  ${({ $still }) =>
    $still &&
    css`
      animation: none;
    `}

  /* No movement: a still block still reads as a placeholder. */
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
