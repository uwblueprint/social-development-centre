"use client";

import type { MouseEvent } from "react";
import { styled } from "next-yak";

/*
 * Visually hidden until focused; then it shows top-left over the page with the primary focus ring.
 * Each link sits in the same spot, so only the focused one is ever visible.
 */
const Link = styled.a`
  position: fixed;
  top: var(--space-2);
  left: var(--space-2);
  z-index: var(--z-toast);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  box-shadow: var(--shadow-md);
  color: var(--color-text);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  line-height: var(--leading-ui);
  text-decoration: none;
  white-space: nowrap;

  /* Hidden, but still focusable and read by screen readers. */
  &:not(:focus) {
    width: 1px;
    height: 1px;
    padding: 0;
    border: 0;
    overflow: hidden;
    clip-path: inset(50%);
    box-shadow: none;
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring), var(--shadow-md);
  }
`;

export interface SkipLinkItem {
  /** The `id` of the element to move focus to. Give that element `tabIndex={-1}` and a `:focus-visible` ring. */
  targetId: string;
  /** Sentence case, e.g. "Skip to main content". */
  label: string;
}

/**
 * Skip links: render first in the page, so they are the first tab stops. Activating one moves focus to its
 * target (a plain `#hash` jump scrolls but doesn't reliably move focus). A link whose target isn't on the
 * page is left out by the caller, not here.
 */
export function SkipLinks({ links }: { links: SkipLinkItem[] }) {
  const go = (event: MouseEvent<HTMLAnchorElement>, targetId: string) => {
    const target = document.getElementById(targetId);
    if (!target) return;
    event.preventDefault();
    target.focus();
    target.scrollIntoView({ block: "nearest" });
  };
  return (
    <>
      {links.map((l) => (
        <Link key={l.targetId} href={`#${l.targetId}`} onClick={(e) => go(e, l.targetId)}>
          {l.label}
        </Link>
      ))}
    </>
  );
}
