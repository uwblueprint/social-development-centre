"use client";

import Link from "next/link";
import { css, styled } from "next-yak";

/*
 * A link that looks and presses like the kit's Button. The kit has none (a <button> can't navigate), and the feed's main
 * action is a link: to the partner's own page in a new tab, so it works without script and can open in a new window.
 * Same variants, sizes and states as Button; if other screens need it, this should move into src/components/ui/.
 */
type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";
interface LookProps {
  $variant?: Variant;
  $size?: Size;
  $block?: boolean;
}

const look = css<LookProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-sizing: border-box;
  max-width: 100%;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-weight: var(--weight-regular);
  line-height: 1;
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  transition:
    background-color var(--duration) var(--ease),
    border-color var(--duration) var(--ease),
    color var(--duration) var(--ease),
    transform var(--duration) var(--ease);
  height: 36px;
  padding: 0 var(--space-4);
  font-size: var(--text-sm);
  width: ${({ $block }) => ($block ? "100%" : "auto")};
  ${({ $size }) =>
    $size === "sm" &&
    css`
      height: 32px;
      padding: 0 var(--space-3);
      font-size: var(--text-xs);
    `}
  ${({ $size }) =>
    $size === "lg" &&
    css`
      height: 44px;
      padding: 0 var(--space-5);
      font-size: var(--text-md);
    `}

  background: var(--color-primary);
  color: var(--color-on-primary);
  &:hover {
    background: var(--color-primary-hover);
  }
  ${({ $variant }) =>
    $variant === "secondary" &&
    css`
      background: var(--color-secondary);
      color: var(--color-text);
      &:hover {
        background: var(--color-secondary-hover);
      }
    `}
  ${({ $variant }) =>
    $variant === "outline" &&
    css`
      background: var(--color-bg);
      color: var(--color-text);
      border-color: var(--color-border-strong);
      &:hover {
        background: var(--color-bg-hover);
      }
    `}
  ${({ $variant }) =>
    $variant === "ghost" &&
    css`
      background: transparent;
      color: var(--color-text);
      &:hover {
        background: var(--color-bg-hover);
      }
    `}

  &:active {
    transform: scale(0.96);
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

/** An external link (partner's page): a plain anchor. Pass `target="_blank"` and `rel="noopener noreferrer"`. */
export const ButtonLink = styled.a<LookProps>`
  ${look}
`;

/** An in-app link: client-side navigation. */
export const NavButtonLink = styled(Link)<LookProps>`
  ${look}
`;
