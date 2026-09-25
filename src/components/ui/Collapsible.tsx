"use client";

import { keyframes, styled } from "next-yak";
import { Collapsible as CollapsiblePrimitive } from "radix-ui";

const openAnim = keyframes`
  from { height: 0; }
  to { height: var(--radix-collapsible-content-height); }
`;

const closeAnim = keyframes`
  from { height: var(--radix-collapsible-content-height); }
  to { height: 0; }
`;

export const Collapsible = CollapsiblePrimitive.Root;
export const CollapsibleTrigger = CollapsiblePrimitive.Trigger;

export const CollapsibleContent = styled(CollapsiblePrimitive.Content)`
  overflow: hidden;

  &[data-state="open"] {
    animation: ${openAnim} var(--duration) var(--ease);
  }
  &[data-state="closed"] {
    animation: ${closeAnim} var(--duration) var(--ease);
  }
`;
