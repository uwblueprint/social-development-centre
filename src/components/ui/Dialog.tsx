"use client";

import { keyframes, styled } from "next-yak";
import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

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
  padding: 20px;
  z-index: 41;
  animation: ${contentShow} var(--duration) var(--ease);

  &:focus {
    outline: none;
  }
`;

const CloseButton = styled(DialogPrimitive.Close)`
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
    background: var(--color-surface);
    color: var(--color-text);
  }
  &:focus-visible {
    box-shadow: var(--focus-ring);
  }
`;

const Title = styled(DialogPrimitive.Title)`
  margin: 0 0 4px;
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  letter-spacing: var(--tracking-tight);
  color: var(--color-text);
  padding-right: var(--space-6);
`;

const Description = styled(DialogPrimitive.Description)`
  margin: 0 0 20px;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;

/* A top divider clearly separates action buttons from the body content
   above, the same rule used across cards/popovers/alert dialogs. */
const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
`;

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = Title;
export const DialogDescription = Description;
export const DialogActions = Actions;

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
          <Icon icon={X} size={16} />
        </CloseButton>
      </Content>
    </DialogPrimitive.Portal>
  );
}
