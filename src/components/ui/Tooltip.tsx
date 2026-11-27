"use client";

import * as React from "react";
import { styled } from "next-yak";
import { overlayMotion } from "./internal";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import type { ReactNode } from "react";

const ContentBase = styled(TooltipPrimitive.Content)`
  z-index: var(--z-tooltip);
  max-width: 260px;
  background: var(--color-text);
  color: var(--color-bg);
  font-size: var(--text-xs);
  font-weight: var(--weight-regular);
  line-height: var(--leading-ui);
  border-radius: var(--radius-sm);
  padding: 6px 10px;
  box-shadow: var(--shadow-md);

  --overlay-enter-duration: var(--duration-fast);
  ${overlayMotion}
`;

/* motion="none": no enter or exit animation, so it vanishes the instant it closes. */
const Content = styled(ContentBase)`
  &[data-motion="none"] {
    animation: none;
  }
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
  motion = "default",
  ...props
}: TooltipPrimitive.TooltipContentProps & {
  children: ReactNode;
  /** `"none"` skips the fade and slide in and out, for tooltips that follow the pointer across a chart. */
  motion?: "default" | "none";
}) {
  return (
    <TooltipPrimitive.Portal>
      <Content sideOffset={sideOffset} data-motion={motion} {...props}>
        {children}
        <Arrow />
      </Content>
    </TooltipPrimitive.Portal>
  );
}

/**
 * The tooltip that's open now. Only one shows at a time: opening another (by hover, focus or click)
 * closes this one, e.g. hovering one sidebar item while another has keyboard focus.
 */
let openTooltip: React.RefObject<() => void> | null = null;

/** Closes the open tooltip, e.g. when a modal opens over it from the keyboard while the pointer rests on its trigger. */
export function closeOpenTooltip() {
  openTooltip?.current();
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
  const trigger = React.useRef<HTMLButtonElement>(null);
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
    if (openTooltip === closeSelf) openTooltip = null;
    setOpen(false);
  };
  // `close` only touches refs and state setters, so the first one stays valid.
  const closeSelf = React.useRef(close);
  const forget = () => {
    if (openTooltip === closeSelf) openTooltip = null;
  };
  const show = () => {
    if (openTooltip && openTooltip !== closeSelf) openTooltip.current();
    openTooltip = closeSelf;
    setOpen(true);
  };
  React.useEffect(() => forget, []);

  return (
    <TooltipRoot
      delayDuration={delayDuration}
      open={open}
      onOpenChange={(next) => {
        if (!next && (pinned.current || pressing.current)) return;
        if (next && suppressed.current) return;
        if (next && coveredByModal(trigger.current)) return;
        if (next) show();
        else {
          forget();
          setOpen(false);
        }
      }}
    >
      <TooltipTrigger
        ref={trigger}
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
          focusTimer.current = setTimeout(() => !suppressed.current && !coveredByModal(trigger.current) && show(), delayDuration);
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
            show();
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

/**
 * A dialog is open and this trigger isn't inside it: the tooltip would float over the dialog (tooltips sit
 * above modals so ones inside a dialog still show). A dialog that's closing doesn't count.
 */
function coveredByModal(trigger: HTMLElement | null) {
  const open = document.querySelectorAll('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]');
  return Array.from(open).some((dialog) => !trigger || !dialog.contains(trigger));
}
