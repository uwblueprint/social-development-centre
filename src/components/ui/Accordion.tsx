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
`;

const Trigger = styled(AccordionPrimitive.Trigger)`
  all: unset;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-1);
  font-size: var(--text-md);
  font-weight: 500;
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

const Chevron = styled.svg`
  flex-shrink: 0;
  color: var(--color-text-muted);
  transition: transform var(--duration) var(--ease);

  [data-state="open"] > & {
    transform: rotate(180deg);
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
    padding: 0 var(--space-1) var(--space-4);
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
        <Chevron width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </Chevron>
      </Trigger>
    </Header>
  );
}
