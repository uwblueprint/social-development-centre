"use client";

import * as React from "react";
import { keyframes, styled } from "next-yak";
import { Dialog as DialogPrimitive, VisuallyHidden } from "radix-ui";
import { Command } from "cmdk";
import { Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Icon } from "./Icon";
import { closeOpenTooltip } from "./Tooltip";

/*
 * A search palette: a modal dialog (the same overlay, blur and motion as Dialog) with a cmdk combobox
 * inside. cmdk gives the WAI-ARIA combobox/listbox roles, arrow keys (looping), Home/End and Enter.
 * Filtering is the caller's job (shouldFilter is off), so results can come from anywhere and be ranked
 * however the product needs. Focus starts in the search box and returns where it was on close.
 */

const overlayShow = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const overlayHide = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const contentShow = keyframes`
  from { opacity: 0; transform: translate(-50%, var(--space-1)); }
  to { opacity: 1; transform: translate(-50%, 0); }
`;

const contentHide = keyframes`
  from { opacity: 1; transform: translate(-50%, 0); }
  to { opacity: 0; transform: translate(-50%, var(--space-1)); }
`;

const Overlay = styled(DialogPrimitive.Overlay)`
  position: fixed;
  inset: 0;
  background: var(--color-overlay);
  backdrop-filter: blur(var(--overlay-blur));
  z-index: var(--z-modal);
  animation: ${overlayShow} var(--duration) var(--ease-out);

  &[data-state="closed"] {
    animation: ${overlayHide} var(--duration-fast) var(--ease-in) forwards;
  }
`;

/* Anchored near the top, not centred, so the box doesn't jump as results grow and shrink. */
const Content = styled(DialogPrimitive.Content)`
  position: fixed;
  top: 12vh;
  left: 50%;
  transform: translate(-50%, 0);
  width: calc(100vw - 2 * var(--space-3));
  max-width: 600px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-surface-raised);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-modal);
  animation: ${contentShow} var(--duration) var(--ease-out);

  &[data-state="closed"] {
    animation: ${contentHide} var(--duration-fast) var(--ease-in) forwards;
  }

  &:focus {
    outline: none;
  }

  @media (max-width: 767px) {
    top: var(--space-3);
  }

  [cmdk-root] {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
`;

const SearchRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 0 var(--space-4);
  height: 52px;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-muted);
  flex-shrink: 0;
`;

const SearchInput = styled(Command.Input)`
  all: unset;
  flex: 1;
  min-width: 0;
  height: 100%;
  font-family: inherit;
  font-size: var(--text-md);
  color: var(--color-text);

  &::placeholder {
    color: var(--color-text-muted);
  }
`;

const Kbd = styled.kbd`
  flex-shrink: 0;
  padding: 0 var(--space-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
  letter-spacing: var(--tracking-mono);
  color: var(--color-text-subtle);
`;

const List = styled(Command.List)<{ $hidden: boolean }>`
  display: ${({ $hidden }) => ($hidden ? "none" : "block")};
  overflow-y: auto;
  overscroll-behavior: contain;
  max-height: min(440px, 60dvh);
  padding: var(--space-2);
  scroll-padding-block: var(--space-2);
`;

const Group = styled(Command.Group)`
  & + & {
    margin-top: var(--space-2);
  }

  [cmdk-group-heading] {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    line-height: var(--leading-ui);
    color: var(--color-text-muted);
  }
`;

const Item = styled(Command.Item)`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: var(--menu-row-height);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--color-text);
  cursor: pointer;
  scroll-margin: var(--space-2);

  &[data-selected="true"] {
    background: var(--color-bg-hover);
  }

  > svg {
    flex-shrink: 0;
    color: var(--color-text-muted);
  }
`;

const ItemLabel = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ItemDetail = styled.span`
  flex-shrink: 1;
  min-width: 0;
  max-width: 50%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const Match = styled.strong`
  font-weight: var(--weight-medium);
`;

const Message = styled.div<{ $tone: "neutral" | "danger" }>`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: var(--menu-row-height);
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-sm);
  color: ${({ $tone }) => ($tone === "danger" ? "var(--color-danger)" : "var(--color-text-muted)")};

  > svg {
    flex-shrink: 0;
  }
`;

const pulse = keyframes`
  from { opacity: 1; }
  50% { opacity: 0.5; }
  to { opacity: 1; }
`;

const SkeletonRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: var(--menu-row-height);
  padding: 0 var(--space-2);

  &::before,
  &::after {
    content: "";
    height: var(--space-3);
    border-radius: var(--radius-sm);
    background: var(--color-bg-hover);
    animation: ${pulse} 1.6s var(--ease-out) infinite;
  }
  &::before {
    width: var(--space-4);
  }
  &::after {
    width: 40%;
  }
`;

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Accessible name for the dialog and the search box, e.g. "Search". */
  label: string;
  placeholder: string;
  search: string;
  onSearchChange: (search: string) => void;
  /** The selected item's value (controlled), so callers can act on it, e.g. Ctrl+Enter. */
  value?: string;
  onValueChange?: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  /** The search box, e.g. to put focus back after a "Clear search" button. */
  inputRef?: React.Ref<HTMLInputElement>;
  /** Return false to keep focus where the palette leaves it (e.g. after navigating), instead of restoring it. */
  restoreFocus?: () => boolean;
  /** Shown instead of the list when nothing matches. */
  empty?: React.ReactNode;
  children: React.ReactNode;
}

export function CommandPalette({
  open,
  onOpenChange,
  label,
  placeholder,
  search,
  onSearchChange,
  value,
  onValueChange,
  onKeyDown,
  inputRef,
  restoreFocus,
  empty,
  children,
}: CommandPaletteProps) {
  // Opened by a shortcut, there's no trigger for Radix to return focus to: remember where focus was.
  const returnTo = React.useRef<HTMLElement | null>(null);
  const content = React.useRef<HTMLDivElement>(null);
  // Reopened during its closing animation, Radix doesn't move focus again: put it in the search box.
  React.useEffect(() => {
    const input = content.current?.querySelector<HTMLInputElement>("[cmdk-input]");
    if (open && input && document.activeElement !== input) input.focus();
    // Any tooltip open on the page (e.g. on the button that opened this) would float above the blur.
    if (open) closeOpenTooltip();
  }, [open]);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <Overlay />
        <Content
          ref={content}
          aria-describedby={undefined}
          onOpenAutoFocus={() => {
            returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (restoreFocus && !restoreFocus()) return;
            if (returnTo.current?.isConnected) returnTo.current.focus();
          }}
        >
          <VisuallyHidden.Root asChild>
            <DialogPrimitive.Title>{label}</DialogPrimitive.Title>
          </VisuallyHidden.Root>
          {/* No vim bindings: Ctrl+K must stay free to close the palette, and Ctrl+J/N/P aren't expected here. */}
          <Command label={label} shouldFilter={false} loop vimBindings={false} value={value} onValueChange={onValueChange} onKeyDown={onKeyDown}>
            <SearchRow>
              <Icon icon={Search} size={18} />
              <SearchInput ref={inputRef} value={search} onValueChange={onSearchChange} placeholder={placeholder} aria-label={label} />
              <Kbd aria-hidden="true">Esc</Kbd>
            </SearchRow>
            {/* The list stays in the DOM when empty: the search box's aria-controls points at it. */}
            <List $hidden={Boolean(empty)}>{empty ? null : children}</List>
            {empty}
          </Command>
        </Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** A group of results, titled unless it's a one-off like an error and its retry. */
export function CommandPaletteGroup({ heading, children }: { heading?: string; children: React.ReactNode }) {
  return <Group heading={heading}>{children}</Group>;
}

export function CommandPaletteItem({
  value,
  icon,
  label,
  detail,
  onSelect,
}: {
  /** Unique across the whole palette. */
  value: string;
  icon: LucideIcon;
  /** The result's name; pass a `CommandPaletteMatch` to bold the part that matched. */
  label: React.ReactNode;
  /** Secondary text on the right, e.g. an email address or the page a setting is on. */
  detail?: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <Item value={value} onSelect={onSelect}>
      <Icon icon={icon} size={16} />
      <ItemLabel>{label}</ItemLabel>
      {detail && <ItemDetail>{detail}</ItemDetail>}
    </Item>
  );
}

/** Text with the matched range in medium weight. Weight, not colour, so it reads in every state. */
export function CommandPaletteMatch({ text, range }: { text: string; range: readonly [number, number] | null }) {
  if (!range) return <>{text}</>;
  const [start, end] = range;
  return (
    <>
      {text.slice(0, start)}
      <Match>{text.slice(start, end)}</Match>
      {text.slice(end)}
    </>
  );
}

/** A row that isn't a result: an error or a status. Pair a danger tone with an icon (never colour alone). */
export function CommandPaletteMessage({
  icon,
  tone = "neutral",
  children,
}: {
  icon: LucideIcon;
  tone?: "neutral" | "danger";
  children: React.ReactNode;
}) {
  return (
    <Message $tone={tone} role="status">
      <Icon icon={icon} size={16} />
      {children}
    </Message>
  );
}

/**
 * Placeholder rows while a group loads. Shows nothing for the first 200ms, so a fast answer never
 * flickers; the label is read to screen readers.
 */
export function CommandPaletteLoading({ label, rows = 2 }: { label: string; rows?: number }) {
  const [shown, setShown] = React.useState(false);
  React.useEffect(() => {
    const timer = setTimeout(() => setShown(true), 200);
    return () => clearTimeout(timer);
  }, []);
  return (
    <Command.Loading label={label}>
      {shown && Array.from({ length: rows }, (_, i) => <SkeletonRow key={i} aria-hidden="true" />)}
    </Command.Loading>
  );
}
