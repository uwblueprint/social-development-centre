"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Lock } from "lucide-react";
import { Button } from "./Button";
import { Icon } from "./Icon";

type ButtonProps = React.ComponentProps<typeof Button>;
import { Tooltip } from "./Tooltip";

/*
 * Every disabled control should explain why it is disabled.
 * The reason is product copy: ask the product owner for it, never invent one.
 * If they decline or it isn't known, pass `null` to opt out explicitly.
 */
export type DisabledReasonText = string | null;

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

// Focusable so keyboard and screen-reader users can reach the reason; styled to blend with the disabled control.
const LockButton = styled.button`
  all: unset;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  color: var(--color-text-subtle);
  cursor: not-allowed;

  &:focus-visible {
    box-shadow: var(--focus-ring);
  }
`;

export function DisabledIcon({ reason }: { reason: DisabledReasonText }) {
  if (!reason) return null;
  return (
    <LockButton type="button" aria-label={`Unavailable: ${reason}`}>
      <Icon icon={Lock} size={14} />
    </LockButton>
  );
}

/** Hovering anywhere in the area, or focusing/clicking its lock icon, shows the reason. */
export function DisabledArea({
  reason,
  block,
  children,
}: {
  reason: DisabledReasonText;
  block?: boolean;
  children: React.ReactNode;
}) {
  if (!reason) return <Area $block={block}>{children}</Area>;
  return (
    <Tooltip content={reason}>
      <Area $block={block}>{children}</Area>
    </Tooltip>
  );
}

/**
 * Inline wrapper for single controls. A `Button` gets the lock inside it, before its label, and stays
 * focusable (aria-disabled instead of disabled) so the reason opens on hover, focus or tap. Other
 * controls (checkbox rows, switches) get the lock after them.
 */
export function DisabledReason({
  reason,
  children,
}: {
  reason: DisabledReasonText;
  children: React.ReactNode;
}) {
  if (reason && React.isValidElement<ButtonProps>(children) && children.type === Button) {
    const { children: label, ...props } = children.props;
    return (
      <Tooltip content={reason}>
        {/* The button's own onClick never runs: it's disabled. */}
        <Button {...props} disabled={undefined} aria-disabled onClick={(event) => event.preventDefault()}>
          <Icon icon={Lock} size={14} />
          {label}
        </Button>
      </Tooltip>
    );
  }
  return (
    <DisabledArea reason={reason}>
      {children}
      <DisabledIcon reason={reason} />
    </DisabledArea>
  );
}
