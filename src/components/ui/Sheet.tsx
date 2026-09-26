"use client";

import * as React from "react";

import { keyframes, styled } from "next-yak";
import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

const overlayShow = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideIn = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
`;

const Overlay = styled(DialogPrimitive.Overlay)`
  position: fixed;
  inset: 0;
  background: var(--color-overlay);
  z-index: 40;
  animation: ${overlayShow} var(--duration) var(--ease);
`;

const Content = styled(DialogPrimitive.Content)`
  &:focus {
    outline: none;
  }

  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 41;
  display: flex;
  flex-direction: column;
  width: 420px;
  max-width: 100vw;
  background: var(--color-surface-raised);
  box-shadow: var(--shadow-lg);
  animation: ${slideIn} var(--duration-slow) var(--ease);

  &:focus {
    outline: none;
  }

  @media (max-width: 640px) {
    width: 100vw;
  }
`;

const CloseButton = styled(DialogPrimitive.Close)`
  all: unset;
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
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

const Header = styled.div`
  position: relative;
  flex-shrink: 0;
  padding: var(--space-5) var(--space-6) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const Body = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-5) var(--space-6);
`;

const Footer = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
`;

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetTitle = Title;
export const SheetDescription = Description;
export const SheetHeader = Header;
export const SheetBody = Body;
export const SheetFooter = Footer;

/** Focuses the panel itself on open (not its first field), so typing can't overwrite a value by accident. */
export function SheetContent({
  children,
  onOpenAutoFocus,
  ...props
}: DialogPrimitive.DialogContentProps & { children: ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <Content
        ref={ref}
        tabIndex={-1}
        onOpenAutoFocus={(e) => {
          onOpenAutoFocus?.(e);
          if (e.defaultPrevented) return;
          e.preventDefault();
          ref.current?.focus();
        }}
        {...props}
      >
        {children}
        <CloseButton aria-label="Close panel">
          <Icon icon={X} size={16} />
        </CloseButton>
      </Content>
    </DialogPrimitive.Portal>
  );
}
