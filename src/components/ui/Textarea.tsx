"use client";

import * as React from "react";
import { css, styled } from "next-yak";
import { ErrorIcon } from "./Field";

const Wrapper = styled.span`
  position: relative;
  display: block;
  width: 100%;
`;

const StyledTextarea = styled.textarea<{ $invalid?: boolean }>`
  display: block;
  width: 100%;
  min-height: 96px;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-strong);
  background: var(--color-bg);
  color: var(--color-text);
  font-family: inherit;
  font-size: var(--text-sm);
  line-height: 1.5;
  resize: vertical;
  transition:
    border-color var(--duration) var(--ease),
    box-shadow var(--duration) var(--ease);

  &::placeholder {
    color: var(--color-text-muted);
  }

  &:hover:not(:disabled):not(:focus) {
    border-color: var(--color-text-muted);
  }

  &:focus-visible,
  &:focus {
    outline: none;
    border-color: var(--color-focus);
    box-shadow: var(--focus-ring);
  }

  ${({ $invalid }) =>
    $invalid &&
    css`
      /* Constant border-width; the extra 1px comes from an inset shadow so
         the control doesn't shift layout when it becomes invalid. */
      padding-right: 36px;
      border-color: var(--color-danger);
      box-shadow: inset 0 0 0 1px var(--color-danger);

      &:focus-visible,
      &:focus {
        box-shadow:
          inset 0 0 0 1px var(--color-danger),
          0 0 0 2px var(--color-bg),
          0 0 0 4px var(--color-danger);
      }
    `}

  &:disabled {
    background: var(--color-surface);
    color: var(--color-text-muted);
    border-color: var(--color-border);
    border-style: dashed;
    cursor: not-allowed;
  }
`;

const IconSlot = styled.span`
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  display: inline-flex;
  color: var(--color-danger);
  pointer-events: none;
`;

const CounterRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-1);
`;

const Counter = styled.span<{ $warning?: boolean }>`
  font-size: var(--text-xs);
  color: var(--color-text-muted);

  ${({ $warning }) =>
    $warning &&
    css`
      /* The count itself says how little is left, so this isn't a
         color-only signal; the weight just reinforces it. */
      color: var(--color-danger);
      font-weight: var(--weight-medium);
    `}
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

function isInvalid(value: unknown) {
  return value === true || value === "true";
}

export type TextareaProps = React.ComponentPropsWithoutRef<"textarea">;

/**
 * Multi-line text entry. When `maxLength` is set it shows a live
 * "N characters left" counter (wired via `aria-describedby`), warns as the
 * limit approaches, and announces that fact politely at 20/10/0 characters
 * left rather than on every keystroke. Works both controlled (`value`) and
 * uncontrolled (`defaultValue`).
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    id,
    maxLength,
    value,
    defaultValue,
    onChange,
    "aria-invalid": ariaInvalid,
    "aria-describedby": describedBy,
    className,
    ...props
  },
  ref,
) {
  const reactId = React.useId();
  const controlId = id ?? reactId;
  const counterId = `${controlId}-counter`;

  const isControlled = value !== undefined;
  const [innerValue, setInnerValue] = React.useState(() =>
    defaultValue != null ? String(defaultValue) : "",
  );
  const currentLength = (isControlled ? String(value ?? "") : innerValue).length;
  const hasLimit = typeof maxLength === "number";
  const remaining = hasLimit ? Math.max(0, maxLength - currentLength) : null;
  const warning = hasLimit && remaining !== null ? remaining <= maxLength * 0.1 : false;

  const lastRemaining = React.useRef<number | null>(null);
  const [announcement, setAnnouncement] = React.useState("");

  React.useEffect(() => {
    if (remaining === null) return;
    const prev = lastRemaining.current;
    if (prev !== null && remaining !== prev) {
      // Most-severe-first so a big paste/delete that skips over a
      // threshold still announces the one that matters most.
      for (const threshold of [0, 10, 20]) {
        if (remaining <= threshold && prev > threshold) {
          setAnnouncement(remaining === 1 ? "1 character left" : `${remaining} characters left`);
          break;
        }
      }
    }
    lastRemaining.current = remaining;
  }, [remaining]);

  const invalid = isInvalid(ariaInvalid);
  const describedByIds = [describedBy, hasLimit ? counterId : null].filter(Boolean).join(" ");

  return (
    <Wrapper className={className}>
      <StyledTextarea
        ref={ref}
        id={controlId}
        maxLength={maxLength}
        value={value}
        defaultValue={isControlled ? undefined : defaultValue}
        onChange={(event) => {
          if (!isControlled) setInnerValue(event.target.value);
          onChange?.(event);
        }}
        aria-invalid={ariaInvalid}
        aria-describedby={describedByIds || undefined}
        $invalid={invalid}
        {...props}
      />
      {invalid && (
        <IconSlot aria-hidden="true">
          <ErrorIcon />
        </IconSlot>
      )}
      {hasLimit && (
        <CounterRow>
          <Counter id={counterId} $warning={warning}>
            {remaining} {remaining === 1 ? "character" : "characters"} left
          </Counter>
        </CounterRow>
      )}
      <VisuallyHidden aria-live="polite">{announcement}</VisuallyHidden>
    </Wrapper>
  );
});
