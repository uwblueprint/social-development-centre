"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Tooltip } from "./Tooltip";

/*
 * Every disabled control must explain why it is disabled.
 * The reason is product copy: ask the product owner for it, never invent one.
 * Disabled controls can't take focus, so the reason is also exposed through a
 * focusable lock button whose accessible name includes the reason.
 */

const Area = styled.span<{ $block?: boolean }>`
  display: ${({ $block }) => ($block ? "flex" : "inline-flex")};
  flex-direction: ${({ $block }) => ($block ? "column" : "row")};
  align-items: ${({ $block }) => ($block ? "stretch" : "center")};
  gap: var(--space-2);
  cursor: not-allowed;

  & :disabled,
  & [data-disabled] {
    pointer-events: none;
  }
`;

const LockButton = styled.button`
  all: unset;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border-radius: var(--radius-full);
  color: var(--color-text-muted);
  cursor: help;

  &:hover {
    color: var(--color-text);
    background: var(--color-secondary);
  }
  &:focus-visible {
    box-shadow: var(--focus-ring);
  }
`;

export function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function DisabledIcon({ reason }: { reason: string }) {
  return (
    <LockButton type="button" aria-label={`Unavailable: ${reason}`}>
      <LockIcon />
    </LockButton>
  );
}

/** Hovering anywhere in the area, or focusing/clicking its lock icon, shows the reason. */
export function DisabledArea({
  reason,
  block,
  children,
}: {
  reason: string;
  block?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip content={reason}>
      <Area $block={block}>{children}</Area>
    </Tooltip>
  );
}

/** Inline wrapper for single controls (checkbox rows, switches, buttons): control, then lock icon. */
export function DisabledReason({
  reason,
  children,
}: {
  reason: string;
  children: React.ReactNode;
}) {
  return (
    <DisabledArea reason={reason}>
      {children}
      <DisabledIcon reason={reason} />
    </DisabledArea>
  );
}
