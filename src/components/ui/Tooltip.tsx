"use client";

import { keyframes, styled } from "next-yak";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import type { ReactNode } from "react";

const contentShow = keyframes`
  from { opacity: 0; transform: translateY(2px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const Content = styled(TooltipPrimitive.Content)`
  z-index: 60;
  max-width: 240px;
  background: var(--color-text);
  color: var(--color-bg);
  font-size: var(--text-xs);
  line-height: 1.4;
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  box-shadow: var(--shadow-md);
  animation: ${contentShow} var(--duration) var(--ease);
  transform-origin: var(--radix-tooltip-content-transform-origin);
`;

const Arrow = styled(TooltipPrimitive.Arrow)`
  fill: var(--color-text);
`;

export const TooltipProvider = TooltipPrimitive.Provider;
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

/** Convenience wrapper: <Tooltip content="..."><button>...</button></Tooltip> */
export function Tooltip({
  content,
  children,
  side,
  delayDuration,
}: {
  content: ReactNode;
  children: ReactNode;
  side?: TooltipPrimitive.TooltipContentProps["side"];
  delayDuration?: number;
}) {
  return (
    <TooltipRoot delayDuration={delayDuration}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{content}</TooltipContent>
    </TooltipRoot>
  );
}
