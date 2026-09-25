"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Label } from "./Label";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const Hint = styled.span`
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const ErrorMessage = styled.span`
  font-size: var(--text-xs);
  color: var(--color-danger);
`;

export interface FieldControlProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

export interface FieldProps {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  disabled?: boolean;
  children: (props: FieldControlProps) => React.ReactNode;
}

export function Field({ label, hint, error, disabled, children }: FieldProps) {
  const controlId = React.useId();
  const hintId = React.useId();
  const errorId = React.useId();

  const describedBy = [hint ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <Wrapper>
      <Label htmlFor={controlId} data-disabled={disabled ? "" : undefined}>
        {label}
      </Label>
      {children({
        id: controlId,
        "aria-describedby": describedBy,
        "aria-invalid": Boolean(error),
      })}
      {hint && !error && <Hint id={hintId}>{hint}</Hint>}
      {error && (
        <ErrorMessage id={errorId} role="alert">
          {error}
        </ErrorMessage>
      )}
    </Wrapper>
  );
}
