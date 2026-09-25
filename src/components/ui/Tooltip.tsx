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
 * Opens instantly on hover or focus, and also on click/tap (stays open until
 * clicked again, Escape, or a click outside) so touch users can reach it.
 */
export function Tooltip({
  content,
  children,
  side,
}: {
  content: ReactNode;
  children: React.ReactElement;
  side?: TooltipPrimitive.TooltipContentProps["side"];
}) {
  const [open, setOpen] = React.useState(false);
  const pinned = React.useRef(false);
  const pressing = React.useRef(false);

  const close = () => {
    pinned.current = false;
    setOpen(false);
  };

  return (
    <TooltipRoot
      delayDuration={0}
      open={open}
      onOpenChange={(next) => {
        if (!next && (pinned.current || pressing.current)) return;
        setOpen(next);
      }}
    >
      <TooltipTrigger
        asChild
        onPointerDown={() => {
          pressing.current = true;
        }}
        onClick={() => {
          pressing.current = false;
          if (pinned.current) {
            close();
          } else {
            pinned.current = true;
            setOpen(true);
          }
        }}
        onBlur={() => {
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
