"use client";

import * as React from "react";
import { keyframes, styled } from "next-yak";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import type { ReactNode } from "react";

const contentShow = keyframes`
  from { opacity: 0; transform: translateY(2px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Content = styled(TooltipPrimitive.Content)`
  z-index: 60;
  max-width: 260px;
  background: var(--color-text);
  color: var(--color-bg);
  font-size: var(--text-xs);
  font-weight: var(--weight-regular);
  line-height: var(--leading-ui);
  border-radius: var(--radius-sm);
  padding: 6px 10px;
  box-shadow: var(--shadow-md);
  animation: ${contentShow} 100ms var(--ease);
  transform-origin: var(--radix-tooltip-content-transform-origin);
`;

const Arrow = styled(TooltipPrimitive.Arrow)`
  fill: var(--color-text);
`;

export function TooltipProvider({
  delayDuration = 0,
  skipDelayDuration = 300,
  ...props
}: TooltipPrimitive.TooltipProviderProps) {
  return (
    <TooltipPrimitive.Provider
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
      {...props}
    />
  );
}

export const TooltipRoot = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({
  children,
  sideOffset = 6,
  ...props
}: TooltipPrimitive.TooltipContentProps & { children: ReactNode }) {
  return (
    <TooltipPrimitive.Portal>
      <Content sideOffset={sideOffset} {...props}>
        {children}
        <Arrow />
      </Content>
    </TooltipPrimitive.Portal>
  );
}

/**
 * Opens on hover or focus (instantly by default; pass `delayDuration` to wait), and also on click/tap
 * (stays open until clicked again, Escape, or a click outside) so touch users can reach it.
 * Pass `pinOnClick={false}` when the trigger does something on click (e.g. a nav link): a click then
 * closes the tooltip instead of pinning it.
 */
export function Tooltip({
  content,
  children,
  side,
  delayDuration = 0,
  pinOnClick = true,
}: {
  content: ReactNode;
  children: React.ReactElement;
  side?: TooltipPrimitive.TooltipContentProps["side"];
  /** Milliseconds to wait on hover or focus before opening. Default 0 (instant). */
  delayDuration?: number;
  /** Click/tap toggles a pinned tooltip (default). `false`: hover and focus only, and a click closes it. */
  pinOnClick?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const pinned = React.useRef(false);
  const pressing = React.useRef(false);
  // Radix opens on keyboard focus instantly; with a delay, focus waits the same as hover.
  const pointerDown = React.useRef(false);
  // With pinOnClick off, a click keeps it shut (even a pending hover-open) until the pointer leaves.
  const suppressed = React.useRef(false);
  const focusTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearFocusTimer = () => {
    if (focusTimer.current) clearTimeout(focusTimer.current);
    focusTimer.current = null;
  };
  React.useEffect(() => clearFocusTimer, []);

  const close = () => {
    clearFocusTimer();
    pinned.current = false;
    setOpen(false);
  };

  return (
    <TooltipRoot
      delayDuration={delayDuration}
      open={open}
      onOpenChange={(next) => {
        if (!next && (pinned.current || pressing.current)) return;
        if (next && suppressed.current) return;
        setOpen(next);
      }}
    >
      <TooltipTrigger
        asChild
        onPointerDown={() => {
          pointerDown.current = true;
          if (pinOnClick) pressing.current = true;
        }}
        onPointerUp={() => {
          pointerDown.current = false;
        }}
        onPointerLeave={() => {
          suppressed.current = false;
        }}
        onFocus={(event) => {
          if (delayDuration <= 0) return;
          // Stops Radix's instant open; a focus that comes from a click doesn't open it at all.
          event.preventDefault();
          if (pointerDown.current) return;
          clearFocusTimer();
          focusTimer.current = setTimeout(() => !suppressed.current && setOpen(true), delayDuration);
        }}
        onClick={() => {
          if (!pinOnClick) {
            suppressed.current = true;
            close();
            return;
          }
          pressing.current = false;
          if (pinned.current) {
            close();
          } else {
            pinned.current = true;
            setOpen(true);
          }
        }}
        onBlur={() => {
          clearFocusTimer();
          suppressed.current = false;
          pinned.current = false;
        }}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent
        side={side}
        onEscapeKeyDown={close}
        onPointerDownOutside={close}
      >
        {content}
      </TooltipContent>
    </TooltipRoot>
  );
}
