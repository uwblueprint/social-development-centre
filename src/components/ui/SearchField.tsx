"use client";

import * as React from "react";
import { keyframes, styled } from "next-yak";
import { LoaderCircle, Search, X } from "lucide-react";
import { Icon } from "./Icon";

/** Wait after the last keystroke before searching. NN/g and Algolia put the sweet spot around 300ms. */
const SEARCH_DELAY_MS = 300;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const Form = styled.form`
  display: block;
  width: 100%;
`;

const Wrapper = styled.span`
  position: relative;
  display: block;
  width: 100%;
`;

const Leading = styled.span`
  position: absolute;
  top: 0;
  left: var(--space-3);
  height: 40px;
  display: inline-flex;
  align-items: center;
  color: var(--color-text-muted);
  pointer-events: none;
`;

const Spinner = styled.span`
  display: inline-flex;
  animation: ${spin} 0.8s linear infinite;
`;

const StyledInput = styled.input`
  display: block;
  width: 100%;
  height: 40px;
  /* Leading icon column (12 + 16 + 8) on the left, room for the clear button on the right. */
  padding: 0 calc(var(--space-6) + var(--space-2)) 0 calc(var(--space-3) + var(--space-5));
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

  /* The custom clear button replaces the native affordances. */
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
    cursor: not-allowed;
    border-color: transparent;
    background-image: var(--dashed-border);
    background-size: var(--dashed-border-size);
    background-position: var(--dashed-border-position);
    background-repeat: var(--dashed-border-repeat);
    background-origin: border-box;
  }
`;

const Actions = styled.span`
  position: absolute;
  top: 0;
  right: var(--space-1);
  height: 40px;
  display: inline-flex;
  align-items: center;
`;

const ClearButton = styled.button`
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

export interface SearchFieldProps
  extends Omit<React.ComponentPropsWithoutRef<"input">, "type" | "onSubmit" | "aria-label"> {
  /** Names the field for screen readers. Required: a search field has no visible label, only its icon and placeholder. */
  "aria-label": string;
  /**
   * Runs the search. Called with the field's text 300ms after the last keystroke, right away on Enter,
   * and with "" when the clear (×) button is clicked.
   */
  onSearch: (value: string) => void;
  /** True while results are loading: the leading search icon becomes a spinner. */
  pending?: boolean;
  /** Accessible label for the clear button. Defaults to "Clear search". */
  clearLabel?: string;
}

/** Sets an input's value the way typing would, so React's `onChange` fires for controlled callers too. */
function setNativeValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

/**
 * Instant search for filtering a list: searches 300ms after the last keystroke, immediately on Enter,
 * and clears with the × button. No visible label: a leading search icon, a placeholder and a required
 * `aria-label` (the search-field exception to "every control has a visible label").
 * Works controlled (`value` + `onChange`) or uncontrolled (`defaultValue`).
 */
export const SearchField = React.forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { className, style, value, defaultValue, onChange, onSearch, pending = false, clearLabel = "Clear search", disabled, ...props },
  ref,
) {
  const innerRef = React.useRef<HTMLInputElement>(null);
  React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

  const controlled = value !== undefined;
  const [uncontrolledText, setUncontrolledText] = React.useState(defaultValue == null ? "" : String(defaultValue));
  const text = controlled ? String(value ?? "") : uncontrolledText;

  // Always call the latest onSearch from the timer, without restarting it when the caller re-renders.
  const onSearchRef = React.useRef(onSearch);
  React.useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelPending = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  React.useEffect(() => cancelPending, [cancelPending]);

  function searchNow(next: string) {
    cancelPending();
    onSearchRef.current(next);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!controlled) setUncontrolledText(event.target.value);
    onChange?.(event);
    const next = event.target.value;
    cancelPending();
    timer.current = setTimeout(() => {
      timer.current = null;
      onSearchRef.current(next);
    }, SEARCH_DELAY_MS);
  }

  function handleClear() {
    const input = innerRef.current;
    if (input) setNativeValue(input, "");
    searchNow("");
    input?.focus();
  }

  return (
    <Form
      className={className}
      style={style}
      role="search"
      aria-busy={pending || undefined}
      onSubmit={(event) => {
        event.preventDefault();
        searchNow(innerRef.current?.value ?? text);
      }}
    >
      <Wrapper>
        <Leading aria-hidden="true">
          {pending ? (
            <Spinner>
              <Icon icon={LoaderCircle} size={16} />
            </Spinner>
          ) : (
            <Icon icon={Search} size={16} />
          )}
        </Leading>
        <StyledInput
          ref={innerRef}
          type="search"
          value={controlled ? value : uncontrolledText}
          onChange={handleChange}
          disabled={disabled}
          {...props}
        />
        {text && !disabled && (
          <Actions>
            <ClearButton type="button" aria-label={clearLabel} onClick={handleClear}>
              <Icon icon={X} size={14} />
            </ClearButton>
          </Actions>
        )}
      </Wrapper>
    </Form>
  );
});
