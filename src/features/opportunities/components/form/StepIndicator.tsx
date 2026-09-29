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
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: var(--text-sm);
`;

/*
 * One segment per step: a thin bar, then "1 Type". Done and current bars are filled; the current label is
 * the text colour and medium weight, done labels add a check. Quiet by design (owner: no big black circle).
 */
const Item = styled.li<{ $state: "done" | "current" | "todo" }>`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
  color: ${({ $state }) => ($state === "current" ? "var(--color-text)" : "var(--color-text-muted)")};
  font-weight: ${({ $state }) => ($state === "current" ? "var(--weight-medium)" : "var(--weight-regular)")};

`;

/* The segment's track, with a fill that grows left to right like a loading bar when the step is reached. */
const Track = styled.span`
  position: relative;
  height: 3px;
  overflow: hidden;
  border-radius: var(--radius-full);
  background: var(--color-border);
`;

const Fill = styled.span<{ $filled: boolean }>`
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--color-primary);
  transform-origin: left center;
  scale: ${({ $filled }) => ($filled ? "1 1" : "0 1")};
  transition: scale var(--duration-enter) var(--ease);
`;

const Label = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  min-width: 0;
`;

const Number = styled.span`
  font-variant-numeric: tabular-nums;
`;

export function StepIndicator({ step }: { step: Step }) {
  return (
    <List aria-label={copy.form.stepsLabel}>
      {STEPS.map((s) => {
        const state = s.step < step ? "done" : s.step === step ? "current" : "todo";
        return (
          <Item key={s.step} $state={state} aria-current={state === "current" ? "step" : undefined}>
            <Track aria-hidden="true">
              <Fill $filled={state !== "todo"} />
            </Track>
            <Label>
              <Number>{s.step}</Number>
              {s.label}
              {state === "done" && <Icon icon={Check} size={14} label={copy.form.stepDone} />}
            </Label>
          </Item>
        );
      })}
    </List>
  );
}
