"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Label } from "./Label";
import { DisabledArea, DisabledIcon, type DisabledReasonText } from "./DisabledReason";
import { CircleAlert } from "lucide-react";
import { Icon } from "./Icon";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
`;

const LabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-1);
`;

const Required = styled.span`
  color: var(--color-text-muted);
  font-size: var(--text-xs);
`;

const Hint = styled.span`
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const ErrorMessage = styled.span`
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: var(--text-xs);
  color: var(--color-danger);

  svg {
    flex-shrink: 0;
    margin-top: 1px;
  }
`;

export function ErrorIcon() {
  return <Icon icon={CircleAlert} size={14} />;
}

export interface FieldControlProps {
  id: string;
  disabled?: boolean;
  required?: boolean;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

interface BaseFieldProps {
  label: React.ReactNode;
  hint?: React.ReactNode;
  /** Say what went wrong and how to fix it, e.g. "Enter a URL starting with https://". */
  error?: React.ReactNode;
  required?: boolean;
  children: (props: FieldControlProps) => React.ReactNode;
}

type DisabledProps =
  | { disabled?: false; disabledReason?: never }
  | {
      disabled: true;
      /**
       * Ask the product owner for the real reason; never invent one.
       * Pass null only if they decline or it isn't known.
       */
      disabledReason: DisabledReasonText;
    };

export type FieldProps = BaseFieldProps & DisabledProps;

export function Field({
  label,
  hint,
  error,
  required,
  disabled,
  disabledReason,
  children,
}: FieldProps) {
  const controlId = React.useId();
  const hintId = React.useId();
  const errorId = React.useId();

  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") ||
    undefined;

  const body = (
    <Wrapper>
      <LabelRow>
        <Label htmlFor={controlId} data-disabled={disabled ? "" : undefined}>
          {label}
        </Label>
        {required && <Required>(required)</Required>}
        {disabled && <DisabledIcon reason={disabledReason} />}
      </LabelRow>
      {children({
        id: controlId,
        disabled,
        required,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })}
      {hint && <Hint id={hintId}>{hint}</Hint>}
      {error && (
        <ErrorMessage id={errorId}>
          <ErrorIcon />
          <span>{error}</span>
        </ErrorMessage>
      )}
    </Wrapper>
  );

  return disabled ? (
    <DisabledArea reason={disabledReason} block>
      {body}
    </DisabledArea>
  ) : (
    body
  );
}
