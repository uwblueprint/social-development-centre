"use client";

import { keyframes, styled } from "next-yak";
import { AlertDialog as AlertDialogPrimitive } from "radix-ui";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

// Owner decision 9: subtle enter and exit. Radix keeps the element mounted until the exit animation ends.
const overlayShow = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const overlayHide = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const contentShow = keyframes`
  from { opacity: 0; transform: translate(-50%, -50%) scale(0.98); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
`;

const contentHide = keyframes`
  from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  to { opacity: 0; transform: translate(-50%, -50%) scale(0.98); }
`;

const Overlay = styled(AlertDialogPrimitive.Overlay)`
  position: fixed;
  inset: 0;
  background: var(--color-overlay);
  /* Dialogs blur what's behind them; sheets don't (see tokens: --overlay-blur). */
  backdrop-filter: blur(var(--overlay-blur));
  z-index: var(--z-modal);
  animation: ${overlayShow} var(--duration-slow) var(--ease);

  &[data-state="closed"] {
    animation: ${overlayHide} var(--duration-slow) var(--ease) forwards;
  }
`;

const Content = styled(AlertDialogPrimitive.Content)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90vw;
  max-width: 440px;
  max-height: 85vh;
  overflow-y: auto;
  background: var(--color-surface-raised);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 20px;
  z-index: var(--z-modal);
  animation: ${contentShow} var(--duration-slow) var(--ease);

  &[data-state="closed"] {
    animation: ${contentHide} var(--duration-slow) var(--ease) forwards;
  }

  &:focus {
    outline: none;
  }
`;

const CloseButton = styled(AlertDialogPrimitive.Cancel)`
  all: unset;
  position: absolute;
  top: 14px;
  right: 14px;
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

const Title = styled(AlertDialogPrimitive.Title)`
  margin: 0 0 4px;
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  letter-spacing: var(--tracking-tight);
  color: var(--color-text);
  padding-right: var(--space-6);
`;

const Description = styled(AlertDialogPrimitive.Description)`
  margin: 0 0 var(--space-4);
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-5);
`;

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogTitle = Title;
export const AlertDialogDescription = Description;
export const AlertDialogCancel = AlertDialogPrimitive.Cancel;
export const AlertDialogAction = AlertDialogPrimitive.Action;
export const AlertDialogActions = Actions;

export function AlertDialogContent({
  children,
  ...props
}: AlertDialogPrimitive.AlertDialogContentProps & { children: ReactNode }) {
  return (
    <AlertDialogPrimitive.Portal>
      <Overlay />
      <Content {...props}>
        {children}
        <CloseButton aria-label="Close">
          <Icon icon={X} size={16} />
        </CloseButton>
      </Content>
    </AlertDialogPrimitive.Portal>
  );
}
