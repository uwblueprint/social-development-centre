import { css, styled } from "next-yak";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export const Button = styled.button<{ $variant?: Variant; $size?: Size }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-full);
  font-family: inherit;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  transition:
    background-color var(--duration) var(--ease),
    border-color var(--duration) var(--ease),
    color var(--duration) var(--ease);

  height: 40px;
  padding: 0 var(--space-5);
  font-size: var(--text-sm);

  ${({ $size }) =>
    $size === "sm" &&
    css`
      height: 32px;
      padding: 0 var(--space-4);
      font-size: var(--text-xs);
    `}
  ${({ $size }) =>
    $size === "lg" &&
    css`
      height: 48px;
      padding: 0 var(--space-6);
      font-size: var(--text-md);
    `}

  background: var(--color-primary);
  color: var(--color-on-primary);
  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }

  ${({ $variant }) =>
    $variant === "secondary" &&
    css`
      background: var(--color-bg);
      color: var(--color-text);
      border-color: var(--color-border-strong);
      &:hover:not(:disabled) {
        background: var(--color-surface);
      }
    `}
  ${({ $variant }) =>
    $variant === "ghost" &&
    css`
      background: transparent;
      color: var(--color-text);
      &:hover:not(:disabled) {
        background: var(--color-surface);
      }
    `}
  ${({ $variant }) =>
    $variant === "danger" &&
    css`
      background: var(--color-danger);
      color: var(--color-on-danger);
      &:hover:not(:disabled) {
        background: var(--color-danger);
        filter: brightness(0.92);
      }
    `}

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;
