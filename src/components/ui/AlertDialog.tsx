"use client";

import { keyframes, styled } from "next-yak";
import { AlertDialog as AlertDialogPrimitive } from "radix-ui";
import type { ReactNode } from "react";

const overlayShow = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const contentShow = keyframes`
  from { opacity: 0; transform: translate(-50%, -48%) scale(0.97); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
`;

const Overlay = styled(AlertDialogPrimitive.Overlay)`
  position: fixed;
  inset: 0;
  background: var(--color-overlay);
  z-index: 40;
  animation: ${overlayShow} var(--duration) var(--ease);
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
  padding: var(--space-6);
  z-index: 41;
  animation: ${contentShow} var(--duration) var(--ease);

  &:focus {
    outline: none;
  }
`;

const Title = styled(AlertDialogPrimitive.Title)`
  margin: 0 0 var(--space-2);
  font-size: var(--text-lg);
  font-weight: 600;
  letter-spacing: var(--tracking-tight);
  color: var(--color-text);
`;

const Description = styled(AlertDialogPrimitive.Description)`
  margin: 0 0 var(--space-5);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
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
      <Content {...props}>{children}</Content>
    </AlertDialogPrimitive.Portal>
  );
}
