"use client";

import { keyframes, styled } from "next-yak";
import { Accordion as AccordionPrimitive } from "radix-ui";
import type { ReactNode } from "react";

const openAnim = keyframes`
  from { height: 0; }
  to { height: var(--radix-accordion-content-height); }
`;

const closeAnim = keyframes`
  from { height: var(--radix-accordion-content-height); }
  to { height: 0; }
`;

export const Accordion = AccordionPrimitive.Root;

export const AccordionItem = styled(AccordionPrimitive.Item)`
  border-bottom: 1px solid var(--color-border);

  &:first-child {
    border-top: 1px solid var(--color-border);
  }
`;

const Header = styled(AccordionPrimitive.Header)`
  display: flex;
  margin: 0;
`;

const Trigger = styled(AccordionPrimitive.Trigger)`
  all: unset;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  gap: var(--space-3);
  padding: 14px 0;
  font-size: var(--text-md);

  &[data-state="open"] {
    padding-bottom: 6px;
  }
  font-weight: var(--weight-regular);
  color: var(--color-text);
  cursor: pointer;

  &:focus-visible {
    box-shadow: var(--focus-ring);
    border-radius: var(--radius-sm);
  }

  &[data-disabled] {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

/**
 * Plus that morphs into a minus: the horizontal bar always stays, the
 * vertical bar rotates 90deg and fades out when the item opens.
 */
const PlusMinus = styled.svg`
  flex-shrink: 0;
  color: var(--color-text-muted);

  rect:last-child {
    transform-origin: 8px 8px;
    transition:
      transform var(--duration) var(--ease),
      opacity var(--duration) var(--ease);
  }

  [data-state="open"] & rect:last-child {
    transform: rotate(90deg);
    opacity: 0;
  }
`;

export const AccordionContent = styled(AccordionPrimitive.Content)`
  overflow: hidden;
  font-size: var(--text-sm);
  color: var(--color-text-muted);

  &[data-state="open"] {
    animation: ${openAnim} var(--duration) var(--ease);
  }
  &[data-state="closed"] {
    animation: ${closeAnim} var(--duration) var(--ease);
  }

  & > div {
    padding: 0 0 14px;
  }
`;

export function AccordionTrigger({
  children,
  ...props
}: AccordionPrimitive.AccordionTriggerProps & { children: ReactNode }) {
  return (
    <Header>
      <Trigger {...props}>
        {children}
        <PlusMinus width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="3" y="7.25" width="10" height="1.5" rx="0.75" fill="currentColor" />
          <rect x="7.25" y="3" width="1.5" height="10" rx="0.75" fill="currentColor" />
        </PlusMinus>
      </Trigger>
    </Header>
  );
}
