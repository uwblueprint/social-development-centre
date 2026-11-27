"use client";

import { keyframes, styled } from "next-yak";
import { Collapsible as CollapsiblePrimitive } from "radix-ui";

const openAnim = keyframes`
  from { height: 0; overflow: hidden; }
  to { height: var(--radix-collapsible-content-height); overflow: hidden; }
`;

const closeAnim = keyframes`
  from { height: var(--radix-collapsible-content-height); overflow: hidden; }
  to { height: 0; overflow: hidden; }
`;

export const Collapsible = CollapsiblePrimitive.Root;
export const CollapsibleTrigger = CollapsiblePrimitive.Trigger;

/* Clips only while the height animates: at rest, children's focus rings reach past the box. */
export const CollapsibleContent = styled(CollapsiblePrimitive.Content)`

  &[data-state="open"] {
    animation: ${openAnim} var(--duration-slow) var(--ease-out);
  }
  &[data-state="closed"] {
    animation: ${closeAnim} var(--duration) var(--ease-in);
  }
`;
