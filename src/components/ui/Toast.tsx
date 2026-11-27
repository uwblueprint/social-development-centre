"use client";

import { keyframes, styled } from "next-yak";
import { Portal, Toast as ToastPrimitive } from "radix-ui";
import { CircleAlert, X } from "lucide-react";
import { createContext, useCallback, useContext, useState, type CSSProperties, type ReactNode } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";

/* How long a toast stays: long enough to read and reach Undo. Hovering or focusing it pauses the clock (Radix). */
const DURATION = 5000;
const DURATION_WITH_ACTION = 8000;

/* Floats up from the bottom edge as it fades in, and sinks back down as it fades out: a small, matching move (owner, Nov 2026). */
const riseIn = keyframes`
  from { opacity: 0; transform: translateY(var(--space-3)); }
`;
const fadeOut = keyframes`
  to { opacity: 0; transform: translateY(var(--space-3)); }
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
  /* As wide as the longest message needs, so a short one never wraps: --toast-width at least, up to
     --toast-width-max, never past the screen's edges. Every toast in the stack takes the widest one's width. */
  width: fit-content;
  min-width: min(var(--toast-width), calc(100vw - var(--space-5) * 2));
  max-width: min(var(--toast-width-max), calc(100vw - var(--space-5) * 2));
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
  /* A deep brand green, so a toast stands out from the page in both themes (owner, Nov 2026). */
  background: var(--color-primary-deep);
  color: var(--color-on-primary-deep);
  border: 1px solid var(--color-primary-deep);

  /* Something failed: the danger colour, with an alert icon before the message (owner, Nov 2026). */
  &[data-tone="danger"] {
    background: var(--color-danger);
    color: var(--color-on-danger);
    border-color: var(--color-danger);
  }
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  /* One line (owner, Nov 2026): message, then the action, then close. Long text wraps in its own column. */
  /* The action (or ×) sits as far from the right edge as from the top and bottom (owner, Nov 2026). */
  padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  column-gap: var(--space-2);
  /* No ×: drop its column, or its gap would widen the right edge. */
  &[data-no-close] {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  &[data-state="open"] {
    animation: ${riseIn} var(--duration) var(--ease-out);
  }
  &[data-state="closed"] {
    animation: ${fadeOut} var(--duration) var(--ease-in) forwards;
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
  background: color-mix(in oklch, currentColor 45%, transparent);
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
  color: inherit;
  margin: 0;
`;

const Description = styled(ToastPrimitive.Description)`
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
  color: inherit;
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
  color: inherit;
  cursor: pointer;

  &:hover {
    background: color-mix(in oklch, var(--color-on-primary-deep) 18%, transparent);
  }
  /* The usual ring is the brand green, which would vanish on the deep green toast. */
  &:focus-visible {
    box-shadow: 0 0 0 2px var(--color-on-primary-deep);
  }
`;

export const ToastProvider = ToastPrimitive.Provider;
export const ToastViewport = Viewport;
export const ToastTitle = Title;
export const ToastDescription = Description;
export const ToastAction = Action;
export const ToastClose = Close;

/* The message, with the danger icon before it when there is one. */
const Message = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  min-width: 0;

  [data-tone="danger"] & {
    color: var(--color-on-danger);
  }
`;

const MessageIcon = styled.span`
  display: inline-flex;
  flex: none;
  /* Centre the 16px icon on the first line of the message. */
  height: calc(var(--text-sm) * var(--leading-ui));
  align-items: center;
`;

export function Toast({
  children,
  closable = true,
  persistent,
  duration = DURATION,
  onPause,
  onResume,
  ...props
}: ToastPrimitive.ToastProps & {
  children: ReactNode;
  /** False when the toast has an action such as Undo: an X beside it is too easy to hit by mistake, and the toast goes on its own. */
  closable?: boolean;
  /**
   * Stays until the page closes it (pass `open`), with no close button and no time bar: for a state the
   * person must act on wherever they are on the page, e.g. unsaved changes with a Save action.
   */
  persistent?: boolean;
}) {
  const [paused, setPaused] = useState(false);
  return (
    <Root
      {...props}
      duration={persistent ? Infinity : duration}
      data-paused={paused ? "" : undefined}
      data-no-close={closable && !persistent ? undefined : ""}
      style={persistent ? props.style : ({ ...props.style, "--toast-duration": `${duration}ms` } as CSSProperties)}
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
      {closable && !persistent && (
        <Close aria-label="Close">
          <Icon icon={X} size={14} />
        </Close>
      )}
      {!persistent && <TimeBar aria-hidden="true" />}
    </Root>
  );
}

type ToastData = {
  id: number;
  title: ReactNode;
  description?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  /** "danger" when something failed: red, with an alert icon. Keep it to one line, e.g. "Couldn't delete the email". */
  tone?: "danger";
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
        {toasts.map(({ id, title, description, actionLabel, onAction, tone }) => (
          <Toast
            key={id}
            data-tone={tone}
            closable={!actionLabel}
            duration={actionLabel ? DURATION_WITH_ACTION : DURATION}
            onOpenChange={(open) => {
              if (!open) remove(id);
            }}
          >
            <Message>
              {tone === "danger" && (
                <MessageIcon>
                  <Icon icon={CircleAlert} size={16} />
                </MessageIcon>
              )}
              <div>
                <ToastTitle>{title}</ToastTitle>
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
            </Message>
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
