"use client";

import { css, styled } from "next-yak";
import { Check, Plus } from "lucide-react";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { Icon } from "./Icon";
import type { DisabledReasonText } from "./DisabledReason";
import { Tooltip } from "./Tooltip";

const tagBase = css`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  font-size: var(--text-sm);
  font-weight: var(--weight-regular);
  line-height: 1.2;
  color: var(--color-text);
  white-space: nowrap;
`;

const StaticTagRoot = styled.span`
  ${tagBase}
`;

const SelectableTagRoot = styled.button<{ $selected?: boolean }>`
  ${tagBase}
  cursor: pointer;
  transition:
    background-color var(--duration) var(--ease),
    border-color var(--duration) var(--ease),
    color var(--duration) var(--ease);

  &:hover {
    border-color: var(--color-border-strong);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  ${({ $selected }) =>
    $selected &&
    css`
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: var(--color-on-primary);

      &:hover {
        border-color: var(--color-primary);
      }
    `}

  /*
   * Disabled (aria-disabled, so it stays focusable for the reason's tooltip): muted text (taupe-600,
   * 7.6:1 on white, still readable), a dashed border, and no hover change. Not color alone: the border
   * style and the tooltip carry it too.
   */
  &[aria-disabled="true"] {
    background: var(--color-bg);
    color: var(--color-text-muted);
    cursor: not-allowed;
    border-color: transparent;
    background-image: var(--dashed-border);
    background-size: var(--dashed-border-size);
    background-position: var(--dashed-border-position);
    background-repeat: var(--dashed-border-repeat);
    background-origin: border-box;
  }
`;

const RemovableTagRoot = styled.span`
  ${tagBase}
  padding-right: 6px;
`;

/* Fixed size regardless of selected state, so toggling never changes the
   tag's width or reflows a line of tags. */
const IconSlot = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
`;

const RemoveButton = styled.button`
  all: unset;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  color: var(--color-text-muted);
  cursor: pointer;

  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text);
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

function XIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Outlined, non-interactive pill for static labels. */
export function Tag({
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { children: ReactNode }) {
  return <StaticTagRoot {...props}>{children}</StaticTagRoot>;
}

type SelectableTagDisabledProps =
  | { disabled?: false; disabledReason?: never }
  | {
      disabled: true;
      /** Shown in a tooltip on hover, focus or tap. Ask the product owner; pass null only if they decline. */
      disabledReason: DisabledReasonText;
    };

export type SelectableTagProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "disabled"> & {
  selected?: boolean;
  children: ReactNode;
} & SelectableTagDisabledProps;

/**
 * Toggleable pill for pickers/filters. Selected state is shown with a
 * background/text color change AND a check icon, so it never relies on
 * color alone. `disabled` (with a required `disabledReason`) keeps it
 * focusable (`aria-disabled`), mutes it, blocks toggling and shows the
 * reason in a tooltip.
 */
export function SelectableTag({
  selected = false,
  children,
  disabled,
  disabledReason,
  onClick,
  ...props
}: SelectableTagProps) {
  const tag = (
    <SelectableTagRoot
      type="button"
      $selected={selected && !disabled}
      aria-pressed={selected}
      aria-disabled={disabled || undefined}
      onClick={disabled ? (event) => event.preventDefault() : onClick}
      {...props}
    >
      <IconSlot aria-hidden="true">
        <Icon icon={selected ? Check : Plus} size={14} />
      </IconSlot>
      {children}
    </SelectableTagRoot>
  );
  return disabled && disabledReason ? <Tooltip content={disabledReason}>{tag}</Tooltip> : tag;
}

/** Pill with a trailing remove (×) button, for showing current selections. */
export function RemovableTag({
  children,
  onRemove,
  ...props
}: Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  children: ReactNode;
  onRemove: () => void;
}) {
  const label = typeof children === "string" ? children : undefined;
  return (
    <RemovableTagRoot {...props}>
      {children}
      <RemoveButton type="button" aria-label={label ? `Remove ${label}` : "Remove"} onClick={onRemove}>
        <XIcon />
      </RemoveButton>
    </RemovableTagRoot>
  );
}

/** Wrap a list of Tag/SelectableTag/RemovableTag with the standard 8px gap. */
export const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;
