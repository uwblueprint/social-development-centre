"use client";

import { css, styled } from "next-yak";
import { Check, Plus } from "lucide-react";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { Icon } from "./Icon";

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
    background: var(--color-secondary);
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

/**
 * Toggleable pill for pickers/filters. Selected state is shown with a
 * background/text color change AND a check icon, so it never relies on
 * color alone.
 */
export function SelectableTag({
  selected = false,
  children,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  selected?: boolean;
  children: ReactNode;
}) {
  return (
    <SelectableTagRoot type="button" $selected={selected} aria-pressed={selected} {...props}>
      <IconSlot aria-hidden="true">
        <Icon icon={selected ? Check : Plus} size={14} />
      </IconSlot>
      {children}
    </SelectableTagRoot>
  );
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
