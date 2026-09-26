import { css, styled } from "next-yak";

type Variant = "neutral" | "primary" | "success" | "danger" | "outline";

export const Badge = styled.span<{ $variant?: Variant }>`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  height: 24px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: var(--weight-regular);
  line-height: 1;
  white-space: nowrap;
  border: 1px solid transparent;

  background: var(--color-secondary);
  color: var(--color-text);

  ${({ $variant }) =>
    $variant === "primary" &&
    css`
      background: var(--color-primary);
      color: var(--color-on-primary);
    `}
  ${({ $variant }) =>
    $variant === "success" &&
    css`
      background: var(--color-success-subtle);
      color: var(--color-success);
    `}
  ${({ $variant }) =>
    $variant === "danger" &&
    css`
      background: var(--color-danger-subtle);
      color: var(--color-danger);
    `}
  ${({ $variant }) =>
    $variant === "outline" &&
    css`
      background: transparent;
      color: var(--color-text);
      border-color: var(--color-border-strong);
    `}
`;
