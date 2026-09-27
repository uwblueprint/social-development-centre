"use client";

import { styled } from "next-yak";
import { Check } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { copy } from "../../copy";
import type { Step } from "./formValues";

const STEPS: { step: Step; label: string }[] = [
  { step: 1, label: copy.form.steps.type },
  { step: 2, label: copy.form.steps.details },
  { step: 3, label: copy.form.steps.review },
];

const List = styled.ol`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1) var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: var(--text-sm);
`;

const Item = styled.li<{ $current?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: ${({ $current }) => ($current ? "var(--color-text)" : "var(--color-text-muted)")};
  font-weight: ${({ $current }) => ($current ? "var(--weight-medium)" : "var(--weight-regular)")};
`;

const Separator = styled.span`
  color: var(--color-text-muted);
`;

/**
 * "1 Type · 2 Details · 3 Review". The current step is marked by weight and aria-current, done steps by a
 * check after the label (never color alone). Not clickable: Back, Next and the Review step's Edit links move between steps.
 */
export function StepIndicator({ step }: { step: Step }) {
  return (
    <List aria-label={copy.form.stepsLabel}>
      {STEPS.map((s, i) => (
        <Item key={s.step} $current={s.step === step} aria-current={s.step === step ? "step" : undefined}>
          {i > 0 && <Separator aria-hidden="true">·</Separator>}
          <span>{s.step}</span>
          {s.label}
          {s.step < step && <Icon icon={Check} size={14} label={copy.form.stepDone} />}
        </Item>
      ))}
    </List>
  );
}
