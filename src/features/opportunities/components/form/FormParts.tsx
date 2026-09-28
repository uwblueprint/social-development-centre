"use client";

import * as React from "react";
import Link from "next/link";
import { styled } from "next-yak";
import { Field, useFieldCounter } from "@/components/ui/Field";
import { Input, type InputProps } from "@/components/ui/Input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup";
import { fieldId } from "./formValues";

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

/** `headingId` makes the heading a focus target (tabIndex -1), e.g. when a form step opens. */
export function Section({ title, headingId, children }: { title: string; headingId?: string; children: React.ReactNode }) {
  const generatedId = React.useId();
  const id = headingId ?? generatedId;
  return (
    <SectionRoot aria-labelledby={id}>
      <SectionTitle id={id} tabIndex={headingId ? -1 : undefined}>
        {title}
      </SectionTitle>
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

/**
 * Input with a live "N characters left" counter, like Textarea's. Inside a Field the counter sits on the
 * Field's hint line (kit `useFieldCounter`, id `{id}-counter`).
 */
export function CountedInput({ max, value, ...props }: Omit<InputProps, "maxLength" | "value"> & { max: number; value: string }) {
  const remaining = Math.max(0, max - value.length);
  useFieldCounter({ remaining, warning: remaining <= max * 0.1 });
  const describedBy = [props["aria-describedby"], props.id ? `${props.id}-counter` : null].filter(Boolean).join(" ");
  return <Input {...props} value={value} maxLength={max} aria-describedby={describedBy || undefined} />;
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
    <Field id={fieldId(name)} label={label} hint={hint} error={error} required={required}>
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
