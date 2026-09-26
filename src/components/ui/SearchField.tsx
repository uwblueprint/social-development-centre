"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Search, X } from "lucide-react";
import { Icon } from "./Icon";

const Form = styled.form`
  display: block;
  width: 100%;
`;

const Wrapper = styled.span`
  position: relative;
  display: block;
  width: 100%;
`;

const StyledInput = styled.input`
  display: block;
  width: 100%;
  height: 40px;
  padding: 0 68px 0 var(--space-3);
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

  /* Custom clear/submit buttons replace the native affordances. */
  &::-webkit-search-cancel-button,
  &::-webkit-search-decoration {
    display: none;
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

  &:disabled {
    background: var(--color-surface);
    color: var(--color-text-muted);
    border-color: var(--color-border);
    border-style: dashed;
    cursor: not-allowed;
  }
`;

const Actions = styled.span`
  position: absolute;
  top: 0;
  right: 4px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
`;

const ActionButton = styled.button`
  all: unset;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;

  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text);
  }
  &:focus-visible {
    box-shadow: var(--focus-ring);
  }
`;

export interface SearchFieldProps extends Omit<React.ComponentPropsWithoutRef<"input">, "type" | "onSubmit"> {
  /** Called with the field's current text when the person presses Enter or clicks the search button. */
  onSubmit?: (value: string) => void;
  /** Called when the clear (×) button is clicked, after the field is emptied. Defaults to submitting an empty search. */
  onClear?: () => void;
  /** Accessible label for the trailing search button. Defaults to "Search". */
  submitLabel?: string;
  /** Accessible label for the clear button. Defaults to "Clear search". */
  clearLabel?: string;
}

/**
 * A single-line text entry for filtering a list, submitted on Enter or via
 * the trailing search button — never live as you type. Shows a clear (×)
 * button once there's text. Wrap in `Field` for a visible label.
 */
export const SearchField = React.forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { className, style, value, onChange, onSubmit, onClear, submitLabel = "Search", clearLabel = "Clear search", ...props },
  ref,
) {
  const innerRef = React.useRef<HTMLInputElement>(null);
  React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

  const stringValue = value == null ? "" : String(value);
  const hasValue = !!stringValue;

  function handleClear() {
    if (onClear) onClear();
    else onSubmit?.("");
    innerRef.current?.focus();
  }

  return (
    <Form
      className={className}
      style={style}
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.(stringValue);
      }}
    >
      <Wrapper>
        <StyledInput ref={innerRef} type="search" value={value} onChange={onChange} {...props} />
        <Actions>
          {hasValue && (
            <ActionButton type="button" aria-label={clearLabel} onClick={handleClear}>
              <Icon icon={X} size={14} />
            </ActionButton>
          )}
          <ActionButton type="submit" aria-label={submitLabel}>
            <Icon icon={Search} size={16} />
          </ActionButton>
        </Actions>
      </Wrapper>
    </Form>
  );
});
