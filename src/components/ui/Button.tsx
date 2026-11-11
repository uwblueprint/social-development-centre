import { css, styled } from "next-yak";

/** No "link" variant (owner): every action is a box. Text-like actions use `ghost`. */
type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "danger-outline";
type Size = "sm" | "md" | "lg";

export const Button = styled.button<{ $variant?: Variant; $size?: Size }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-weight: var(--weight-regular);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);

  height: 36px;
  padding: 0 var(--space-4);
  font-size: var(--text-sm);

  ${({ $size }) =>
    $size === "sm" &&
    css`
      height: 32px;
      padding: 0 var(--space-3);
      font-size: var(--text-xs);
    `}
  ${({ $size }) =>
    $size === "lg" &&
    css`
      height: 44px;
      padding: 0 var(--space-5);
      font-size: var(--text-md);
    `}

  background: var(--color-primary);
  color: var(--color-on-primary);
  &:hover:not(:disabled):not([aria-disabled="true"]) {
    background: var(--color-primary-hover);
  }

  ${({ $variant }) =>
    $variant === "secondary" &&
    css`
      background: var(--color-secondary);
      color: var(--color-text);
      &:hover:not(:disabled):not([aria-disabled="true"]) {
        background: var(--color-secondary-hover);
      }
    `}
  ${({ $variant }) =>
    $variant === "outline" &&
    css`
      background: var(--color-bg);
      color: var(--color-text);
      border-color: var(--color-border-strong);
      &:hover:not(:disabled):not([aria-disabled="true"]) {
        background: var(--color-outline-hover);
      }
    `}
  ${({ $variant }) =>
    $variant === "ghost" &&
    css`
      background: transparent;
      color: var(--color-text);
      &:hover:not(:disabled):not([aria-disabled="true"]) {
        background: var(--color-bg-hover);
      }
    `}
  /* A quieter destructive action that isn't the main one on the screen, e.g. "Move to trash". */
  ${({ $variant }) =>
    $variant === "danger-outline" &&
    css`
      background: var(--color-bg);
      color: var(--color-danger);
      border-color: var(--color-danger);
      &:hover:not(:disabled):not([aria-disabled="true"]) {
        background: var(--color-danger-subtle);
      }
    `}
  ${({ $variant }) =>
    $variant === "danger" &&
    css`
      background: var(--color-danger);
      color: var(--color-on-danger);
      &:hover:not(:disabled):not([aria-disabled="true"]) {
        background: var(--color-danger);
        filter: brightness(0.92);
      }
    `}


  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  /* aria-disabled: a button that explains why it's disabled stays focusable (DisabledReason). */
  &:disabled,
  &[aria-disabled="true"] {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;
