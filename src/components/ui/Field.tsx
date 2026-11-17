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
  /* Baseline, not center: "(required)" is smaller text and must sit on the label's line. */
  align-items: baseline;
  gap: var(--space-1);
`;

const Required = styled.span`
  color: var(--color-text-muted);
  font-size: var(--text-xs);
`;

/* One line under the control: the hint (or the error, which replaces it) left, the counter right. */
const Footer = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
`;

const Hint = styled.span`
  min-width: 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const Counter = styled.span<{ $warning?: boolean }>`
  flex: none;
  margin-left: auto;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  /* The count itself says how little is left, so this isn't a color-only signal. */
  &[data-warning] {
    color: var(--color-danger);
    font-weight: var(--weight-medium);
  }
`;

/** A control's character counter, shown by its `Field` on the hint line. */
export interface FieldCounterState {
  remaining: number;
  /** Near the limit (the last 10%): the counter turns danger-colored and medium weight. */
  warning: boolean;
  /** Shown at all (owner: less subtext): only once a quarter or less of the limit is left. */
  visible: boolean;
}

const FieldCounterContext = React.createContext<((counter: FieldCounterState | null) => void) | null>(null);

/**
 * For kit controls with a `maxLength` (e.g. `Textarea`): hands the counter to the enclosing `Field`,
 * which shows it on the hint line with id `{control id}-counter`. Returns whether a Field shows it;
 * when false the control renders its own counter.
 */
export function useFieldCounter(counter: FieldCounterState | null): boolean {
  const setCounter = React.useContext(FieldCounterContext);
  const remaining = counter?.remaining;
  const warning = counter?.warning;
  const visible = counter?.visible;
  React.useLayoutEffect(() => {
    if (!setCounter) return;
    setCounter(remaining === undefined ? null : { remaining, warning: !!warning, visible: !!visible });
  }, [setCounter, remaining, warning, visible]);
  React.useLayoutEffect(() => (setCounter ? () => setCounter(null) : undefined), [setCounter]);
  return setCounter !== null;
}

/** "{n} characters left". */
export function characterCountText(remaining: number) {
  return `${remaining} ${remaining === 1 ? "character" : "characters"} left`;
}

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
  /** The control's id. Set it when something links to the field, e.g. an `ErrorSummary`; otherwise one is generated. */
  id?: string;
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
  id,
  disabled,
  disabledReason,
  children,
}: FieldProps) {
  const generatedId = React.useId();
  const controlId = id ?? generatedId;
  const hintId = React.useId();
  const errorId = React.useId();
  const [counter, setCounter] = React.useState<FieldCounterState | null>(null);

  // The error replaces the hint line, so only one of them describes the control.
  const describedBy = (error ? errorId : hint ? hintId : null) ?? undefined;

  const body = (
    <Wrapper>
      <LabelRow>
        <Label htmlFor={controlId} data-disabled={disabled ? "" : undefined}>
          {label}
        </Label>
        {required && <Required>(required)</Required>}
        {disabled && <DisabledIcon reason={disabledReason} />}
      </LabelRow>
      <FieldCounterContext.Provider value={setCounter}>
        {children({
          id: controlId,
          disabled,
          required,
          "aria-describedby": describedBy,
          "aria-invalid": error ? true : undefined,
        })}
      </FieldCounterContext.Provider>
      {(hint || error || counter?.visible) && (
        <Footer>
          {error ? (
            <ErrorMessage id={errorId}>
              <ErrorIcon />
              <span>{error}</span>
            </ErrorMessage>
          ) : (
            hint && <Hint id={hintId}>{hint}</Hint>
          )}
          {/* The control adds this id to its own aria-describedby. */}
          {counter?.visible && (
            <Counter id={`${controlId}-counter`} data-warning={counter.warning ? "" : undefined}>
              {characterCountText(counter.remaining)}
            </Counter>
          )}
        </Footer>
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
