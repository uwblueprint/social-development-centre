"use client";

import * as React from "react";
import { css, styled } from "next-yak";
import { ErrorIcon } from "./Field";

const Wrapper = styled.span`
  position: relative;
  display: block;
  width: 100%;
`;

const StyledInput = styled.input<{ $invalid?: boolean }>`
  display: block;
  width: 100%;
  height: 40px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-strong);
  background: var(--color-bg);
  color: var(--color-text);
  font-family: inherit;
  font-size: var(--text-sm);
  line-height: 1;
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
  top: 0;
  right: 0;
  height: 40px;
  width: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-danger);
  pointer-events: none;
`;

function isInvalid(value: unknown) {
  return value === true || value === "true";
}

export type InputProps = React.ComponentPropsWithoutRef<"input">;

/**
 * Single-line text entry. Renders as a small wrapper around the native
 * `<input>` so an invalid value can show an error icon at the right edge
 * without changing the API: `ref` and all native props still forward to
 * the `<input>` itself.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { "aria-invalid": ariaInvalid, className, style, ...props },
  ref,
) {
  const invalid = isInvalid(ariaInvalid);
  return (
    <Wrapper className={className} style={style}>
      <StyledInput ref={ref} aria-invalid={ariaInvalid} $invalid={invalid} {...props} />
      {invalid && (
        <IconSlot aria-hidden="true">
          <ErrorIcon />
        </IconSlot>
      )}
    </Wrapper>
  );
});
