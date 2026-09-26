"use client";

import * as React from "react";
import Link from "next/link";
import { css, styled } from "next-yak";
import { Field } from "@/components/ui/Field";
import { Input, type InputProps } from "@/components/ui/Input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup";

/* Layout pieces shared by the form and its per-kind sections. Layout only; visuals come from the kit. */

const SectionRoot = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-top: var(--space-6);
  border-top: 1px solid var(--color-border);
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
`;

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const id = React.useId();
  return (
    <SectionRoot aria-labelledby={id}>
      <SectionTitle id={id}>{title}</SectionTitle>
      {children}
    </SectionRoot>
  );
}

/** Two fields side by side from 520px up; stacked below. */
export const FieldRow = styled.div`
  display: grid;
  gap: var(--space-5) var(--space-4);
  grid-template-columns: 1fr;
  align-items: start;

  @media (min-width: 520px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const CounterRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-1);
`;

/* Matches the Textarea counter so single-line and multi-line limits read the same. */
const Counter = styled.span<{ $warning?: boolean }>`
  font-size: var(--text-xs);
  color: var(--color-text-muted);

  ${({ $warning }) =>
    $warning &&
    css`
      color: var(--color-danger);
      font-weight: var(--weight-medium);
    `}
`;

/** Input with a live "N characters left" counter, like Textarea's. */
export function CountedInput({ max, value, ...props }: Omit<InputProps, "maxLength" | "value"> & { max: number; value: string }) {
  const counterId = React.useId();
  const remaining = Math.max(0, max - value.length);
  const describedBy = [props["aria-describedby"], counterId].filter(Boolean).join(" ");
  return (
    <div>
      <Input {...props} value={value} maxLength={max} aria-describedby={describedBy} />
      <CounterRow>
        <Counter id={counterId} $warning={remaining <= max * 0.1}>
          {remaining} {remaining === 1 ? "character" : "characters"} left
        </Counter>
      </CounterRow>
    </div>
  );
}

/**
 * A short single choice (2–3 options) as a segmented ToggleGroup inside a Field.
 * Submits `name` through the kit's hidden inputs. `data-invalid` lets the form focus it on error.
 */
export function ChoiceField({
  label,
  name,
  value,
  onChange,
  options,
  error,
  required,
  hint,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: Record<string, string>;
  error?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      {(p) => (
        <ToggleGroup
          type="single"
          id={p.id}
          name={name}
          value={value}
          onValueChange={(v: string) => {
            // Radix lets a single toggle group be emptied by clicking the active item; keep the choice.
            if (v) onChange(v);
          }}
          aria-label={label}
          aria-describedby={p["aria-describedby"]}
          data-invalid={error ? "" : undefined}
        >
          {Object.entries(options).map(([v, text]) => (
            <ToggleGroupItem key={v} value={v}>
              {text}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
    </Field>
  );
}

/* Links that navigate (never Button, per docs/components/Button.md), sized like the kit's buttons. */
export const GhostLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  line-height: var(--leading-none);
  color: var(--color-text);
  text-decoration: none;
  white-space: nowrap;
  transition: background-color var(--duration) var(--ease);

  &:hover {
    background: var(--color-bg-hover);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

export const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  width: fit-content;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  text-decoration: none;
  border-radius: var(--radius-sm);

  &:hover {
    color: var(--color-text);
    text-decoration: underline;
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;
