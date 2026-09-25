"use client";

import { keyframes, styled } from "next-yak";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { ReactNode } from "react";

const overlayShow = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const contentShow = keyframes`
  from { opacity: 0; transform: translate(-50%, -48%) scale(0.97); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
`;

const Overlay = styled(DialogPrimitive.Overlay)`
  position: fixed;
  inset: 0;
  background: var(--color-overlay);
  z-index: 40;
  animation: ${overlayShow} var(--duration) var(--ease);
`;

const Content = styled(DialogPrimitive.Content)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90vw;
  max-width: 480px;
  max-height: 85vh;
  overflow-y: auto;
  background: var(--color-surface-raised);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--space-6);
  z-index: 41;
  animation: ${contentShow} var(--duration) var(--ease);

  &:focus {
    outline: none;
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
    background: var(--color-surface);
    color: var(--color-text);
  }
  &:focus-visible {
    box-shadow: var(--focus-ring);
  }
`;

const Title = styled(DialogPrimitive.Title)`
  margin: 0 0 var(--space-2);
  font-size: var(--text-lg);
  font-weight: 600;
  letter-spacing: var(--tracking-tight);
  color: var(--color-text);
  padding-right: var(--space-6);
`;

const Description = styled(DialogPrimitive.Description)`
  margin: 0 0 var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = Title;
export const DialogDescription = Description;

export function DialogContent({
  children,
  ...props
}: DialogPrimitive.DialogContentProps & { children: ReactNode }) {
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <Content {...props}>
        {children}
        <CloseButton aria-label="Close">
          <CloseIcon />
        </CloseButton>
      </Content>
    </DialogPrimitive.Portal>
  );
}
