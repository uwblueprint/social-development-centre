"use client";

import { css, keyframes, styled } from "next-yak";

/*
 * Mirrors the Outbox's SkeletonBlock (branch gaurav/outbox-ux) so loading looks the same across the platform.
 * It should move to the kit (src/components/ui) later, and both pages should import it from there.
 *
 * A placeholder in the shape of what's coming. While loading it breathes slowly, so the page reads as
 * busy rather than broken; `$still` keeps it quiet. It stays still under reduced motion. Hidden from
 * assistive tech by its caller, which announces the loading once.
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

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
