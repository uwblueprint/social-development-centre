"use client";

import { keyframes, styled } from "next-yak";
import { Portal, Toast as ToastPrimitive } from "radix-ui";
import { X } from "lucide-react";
import { createContext, useCallback, useContext, useState, type CSSProperties, type ReactNode } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";

/* How long a toast stays: long enough to read and reach Undo. Hovering or focusing it pauses the clock (Radix). */
const DURATION = 5000;
const DURATION_WITH_ACTION = 8000;

/* In from the bottom edge, where it sits; out by fading, with no movement. */
const riseIn = keyframes`
  from { opacity: 0; transform: translateY(var(--space-4)); }
`;
const fadeOut = keyframes`
  to { opacity: 0; }
`;
/* The time left: the bar empties from right to left over the toast's duration. */
const countdown = keyframes`
  to { transform: scaleX(0); }
`;

/* Bottom centre (owner, Nov 2026): the newest toast is at the bottom, nearest the edge; older ones move up. */
const Viewport = styled(ToastPrimitive.Viewport)`
  position: fixed;
  bottom: var(--space-5);
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 340px;
  max-width: calc(100vw - var(--space-5) * 2);
  list-style: none;
  /* Auto side margins centre the fixed box between left: 0 and right: 0. */
  margin: 0 auto;
  padding: 0;
  z-index: var(--z-toast);
  outline: none;
  /* An open modal sets pointer-events: none on the body; toasts stay closable above it. */
  pointer-events: auto;
`;

const Root = styled(ToastPrimitive.Root)`
  position: relative;
  overflow: hidden;
  /* The brand primary, so a toast stands out from the page: dark green in the light theme, light mint in the dark one (owner, Nov 2026). */
  background: var(--color-primary);
  color: var(--color-on-primary);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  /* One line (owner, Nov 2026): message, then the action, then close. Long text wraps in its own column. */
  padding: var(--space-2) var(--space-3) var(--space-2) var(--space-4);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  column-gap: var(--space-2);

  &[data-state="open"] {
    animation: ${riseIn} var(--duration) var(--ease-out);
  }
  &[data-state="closed"] {
    animation: ${fadeOut} var(--duration-fast) var(--ease-in) forwards;
  }
`;

/*
 * Along the bottom edge, inside the rounded corners: how long the toast will stay. It stops while the clock
 * is paused (hover, keyboard focus, or the window losing focus). Reduced motion hides it: a bar that can't move
 * says nothing. 2px, like the tabs' active line.
 */
const TimeBar = styled.span`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: color-mix(in oklch, var(--color-on-primary) 45%, transparent);
  transform-origin: left;
  animation: ${countdown} var(--toast-duration) linear forwards;
  pointer-events: none;

  [data-paused] > & {
    animation-play-state: paused;
  }

  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
`;

const Title = styled(ToastPrimitive.Title)`
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  line-height: var(--leading-ui);
  color: var(--color-on-primary);
  margin: 0;
`;

const Description = styled(ToastPrimitive.Description)`
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
  color: var(--color-on-primary);
  opacity: 0.8;
  margin: var(--space-1) 0 0;
`;

/* The action is a kit Button (owner), on the message's line, just before close. */
const ActionRow = styled.div`
  grid-row: 1;
  grid-column: 2;
  display: flex;
`;

function Action({ altText, onClick, children }: { altText: string; onClick?: () => void; children: ReactNode }) {
  return (
    <ActionRow>
      <ToastPrimitive.Action altText={altText} asChild>
        <Button type="button" $variant="outline" $size="sm" onClick={onClick}>
          {children}
        </Button>
      </ToastPrimitive.Action>
    </ActionRow>
  );
}

const Close = styled(ToastPrimitive.Close)`
  all: unset;
  grid-row: 1;
  grid-column: 3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  color: var(--color-on-primary);
  cursor: pointer;

  &:hover {
    background: color-mix(in oklch, var(--color-on-primary) 18%, transparent);
  }
  /* The usual ring is the brand green, which would vanish on the green toast. */
  &:focus-visible {
    box-shadow: 0 0 0 2px var(--color-on-primary);
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
  duration = DURATION,
  onPause,
  onResume,
  ...props
}: ToastPrimitive.ToastProps & { children: ReactNode }) {
  const [paused, setPaused] = useState(false);
  return (
    <Root
      {...props}
      duration={duration}
      data-paused={paused ? "" : undefined}
      style={{ ...props.style, "--toast-duration": `${duration}ms` } as CSSProperties}
      onPause={() => {
        setPaused(true);
        onPause?.();
      }}
      onResume={() => {
        setPaused(false);
        onResume?.();
      }}
    >
      {children}
      <Close aria-label="Close">
        <Icon icon={X} size={14} />
      </Close>
      <TimeBar aria-hidden="true" />
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
      <ToastPrimitive.Provider swipeDirection="down">
        {children}
        {toasts.map(({ id, title, description, actionLabel, onAction }) => (
          <Toast
            key={id}
            duration={actionLabel ? DURATION_WITH_ACTION : DURATION}
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
        {/* Portalled to the body: inside the app shell, the page's entrance animation makes a stacking
            context that would trap the toast under a sheet or dialog. */}
        <Portal.Root>
          <ToastViewport />
        </Portal.Root>
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
