"use client";

import { keyframes, styled } from "next-yak";
import { Toast as ToastPrimitive } from "radix-ui";
import { X } from "lucide-react";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Icon } from "./Icon";

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(16px); }
  to { opacity: 1; transform: translateX(0); }
`;

const Viewport = styled(ToastPrimitive.Viewport)`
  position: fixed;
  bottom: var(--space-5);
  right: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 340px;
  max-width: calc(100vw - var(--space-5) * 2);
  list-style: none;
  margin: 0;
  padding: 0;
  z-index: 70;
  outline: none;
`;

const Root = styled(ToastPrimitive.Root)`
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 14px 16px;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
  column-gap: var(--space-3);

  &[data-state="open"] {
    animation: ${slideIn} var(--duration) var(--ease);
  }
  &[data-state="closed"] {
    animation: ${slideIn} var(--duration) var(--ease) reverse;
  }
`;

const Title = styled(ToastPrimitive.Title)`
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  line-height: var(--leading-ui);
  color: var(--color-text);
  margin: 0;
`;

const Description = styled(ToastPrimitive.Description)`
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
  margin: var(--space-1) 0 0;
`;

/* Separated from the title/description with its own top divider and gap so
   it never reads as part of the message body, and right-aligned like a
   dialog/card's action row. */
const Action = styled(ToastPrimitive.Action)`
  grid-column: 1 / -1;
  justify-self: end;
  margin-top: var(--space-3);
  padding-top: var(--space-2);
  width: 100%;
  border: none;
  border-top: 1px solid var(--color-border);
  background: none;
  text-align: right;
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-accent);
  cursor: pointer;

  &:focus-visible {
    box-shadow: var(--focus-ring);
    border-radius: var(--radius-sm);
  }
`;

const Close = styled(ToastPrimitive.Close)`
  all: unset;
  grid-row: 1;
  grid-column: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
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

export const ToastProvider = ToastPrimitive.Provider;
export const ToastViewport = Viewport;
export const ToastTitle = Title;
export const ToastDescription = Description;
export const ToastAction = Action;
export const ToastClose = Close;

export function Toast({
  children,
  ...props
}: ToastPrimitive.ToastProps & { children: ReactNode }) {
  return (
    <Root {...props}>
      {children}
      <Close aria-label="Close">
        <Icon icon={X} size={14} />
      </Close>
    </Root>
  );
}

type ToastData = {
  id: number;
  title: ReactNode;
  description?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

type ToastContextValue = {
  toast: (data: Omit<ToastData, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;

/** Wrap your app (or demo) in this once to enable useToast(). */
export function AppToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const toast = useCallback((data: Omit<ToastData, "id">) => {
    setToasts((prev) => [...prev, { ...data, id: ++toastId }]);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {toasts.map(({ id, title, description, actionLabel, onAction }) => (
          <Toast
            key={id}
            onOpenChange={(open) => {
              if (!open) remove(id);
            }}
          >
            <div>
              <ToastTitle>{title}</ToastTitle>
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {actionLabel && (
              <ToastAction altText={actionLabel} onClick={onAction}>
                {actionLabel}
              </ToastAction>
            )}
          </Toast>
        ))}
        <ToastViewport />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within an AppToastProvider");
  }
  return ctx;
}
