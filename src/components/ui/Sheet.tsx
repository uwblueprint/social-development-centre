"use client";

import * as React from "react";

import { keyframes, styled } from "next-yak";
import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { keepEscapeForTagSelection } from "./TagInput";

// Subtle enter and exit. A short slide plus fade, not the full panel width.
// Radix keeps the element mounted until the exit animation ends.
const overlayShow = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const overlayHide = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(var(--space-6)); }
  to { opacity: 1; transform: translateX(0); }
`;

const slideOut = keyframes`
  from { opacity: 1; transform: translateX(0); }
  to { opacity: 0; transform: translateX(var(--space-6)); }
`;

const Overlay = styled(DialogPrimitive.Overlay)`
  position: fixed;
  inset: 0;
  background: var(--color-overlay);
  z-index: var(--z-modal);
  animation: ${overlayShow} var(--duration-slow) var(--ease);

  &[data-state="closed"] {
    animation: ${overlayHide} var(--duration-slow) var(--ease) forwards;
  }
`;

const Content = styled(DialogPrimitive.Content)<{ $size?: SheetSize }>`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: var(--z-modal);
  /* The panel's horizontal inset matches the ListPage gutter, so a sheet lines up with the page. */
  --sheet-inset: var(--space-6);
  display: flex;
  flex-direction: column;
  width: ${({ $size }) => ($size === "wide" ? "min(720px, 100vw)" : "480px")};
  max-width: 100vw;
  background: var(--color-surface-raised);
  box-shadow: var(--shadow-lg);
  animation: ${slideIn} var(--duration-slow) var(--ease);

  &[data-state="closed"] {
    animation: ${slideOut} var(--duration-slow) var(--ease) forwards;
  }

  &:focus {
    outline: none;
  }

  @media (max-width: 767px) {
    --sheet-inset: var(--space-4);
  }

  @media (max-width: 640px) {
    width: 100vw;
  }
`;

export type SheetSize = "default" | "wide";

const CloseButton = styled(DialogPrimitive.Close)`
  all: unset;
  position: absolute;
  top: var(--space-4);
  /* The icon's right edge sits on the inset line. */
  right: calc(var(--sheet-inset) - var(--space-2));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  color: var(--color-text-muted);
  cursor: pointer;

  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text);
  }
  &:focus-visible {
    box-shadow: var(--focus-ring);
  }
`;

const Title = styled(DialogPrimitive.Title)`
  margin: 0;
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  letter-spacing: var(--tracking-tight);
  color: var(--color-text);
  padding-right: var(--space-6);
`;

const Description = styled(DialogPrimitive.Description)`
  margin: var(--space-1) 0 0;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;

/* Header, body and footer share one inset so edges line up down the panel. */
const HeaderRoot = styled.div`
  position: relative;
  flex-shrink: 0;
  /* The header's top padding matches its sides. */
  padding: var(--sheet-inset) var(--sheet-inset) var(--space-5);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

/* With `actions`: the title and the buttons share one row, vertically centred together. */
const HeaderTopRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 32px;

  & > :first-child {
    flex: 1;
    min-width: 0;
    padding-right: 0;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--space-1);
`;

/* The same 32px square as a `$size="sm"` ghost icon Button, so it matches the actions beside it. */
const InlineCloseButton = styled(DialogPrimitive.Close)`
  all: unset;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  color: var(--color-text);
  cursor: pointer;
  transition: background-color var(--duration) var(--ease);

  &:hover {
    background: var(--color-bg-hover);
  }
  &:focus-visible {
    box-shadow: var(--focus-ring);
  }
`;

const Body = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-5) var(--sheet-inset);
`;

const Footer = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4) var(--sheet-inset);
  border-top: 1px solid var(--color-border);
`;

/** Lets a `SheetHeader` with `actions` take over the close button, so it sits beside them. */
const InlineCloseContext = React.createContext<((inline: boolean) => void) | null>(null);

const CLOSE_LABEL = "Close panel";

/**
 * The panel's header. Pass `actions` (e.g. a ⋯ menu trigger, a 32px `$size="sm"` icon Button) to put
 * the first child (usually `SheetTitle`), the actions and the close button in one row, vertically
 * centred; the other children sit below. Without `actions`, the close button floats top-right.
 */
export function SheetHeader({
  actions,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { actions?: ReactNode }) {
  const setInlineClose = React.useContext(InlineCloseContext);
  const hasActions = actions !== undefined && actions !== null && actions !== false;
  React.useLayoutEffect(() => {
    if (!hasActions || !setInlineClose) return;
    setInlineClose(true);
    return () => setInlineClose(false);
  }, [hasActions, setInlineClose]);

  if (!hasActions) return <HeaderRoot {...props}>{children}</HeaderRoot>;
  const [first, ...rest] = React.Children.toArray(children);
  return (
    <HeaderRoot {...props}>
      <HeaderTopRow>
        {first}
        <HeaderActions>
          {actions}
          <InlineCloseButton aria-label={CLOSE_LABEL}>
            <Icon icon={X} size={16} />
          </InlineCloseButton>
        </HeaderActions>
      </HeaderTopRow>
      {rest}
    </HeaderRoot>
  );
}

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetTitle = Title;
export const SheetDescription = Description;
export const SheetBody = Body;
export const SheetFooter = Footer;

/**
 * Focuses the panel itself on open (not its first field), so typing can't overwrite a value by accident.
 * `size="wide"` is `min(720px, 100vw)`, for content with its own width, such as a 600px email.
 */
export function SheetContent({
  children,
  onOpenAutoFocus,
  onEscapeKeyDown,
  size = "default",
  ...props
}: DialogPrimitive.DialogContentProps & { children: ReactNode; size?: SheetSize }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [inlineClose, setInlineClose] = React.useState(false);
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <Content
        ref={ref}
        $size={size}
        tabIndex={-1}
        onOpenAutoFocus={(e) => {
          onOpenAutoFocus?.(e);
          if (e.defaultPrevented) return;
          e.preventDefault();
          ref.current?.focus();
        }}
        onEscapeKeyDown={(event) => {
          keepEscapeForTagSelection(event);
          if (!event.defaultPrevented) onEscapeKeyDown?.(event);
        }}
        {...props}
      >
        <InlineCloseContext.Provider value={setInlineClose}>{children}</InlineCloseContext.Provider>
        {!inlineClose && (
          <CloseButton aria-label={CLOSE_LABEL}>
            <Icon icon={X} size={16} />
          </CloseButton>
        )}
      </Content>
    </DialogPrimitive.Portal>
  );
}
