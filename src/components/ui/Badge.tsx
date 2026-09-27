import { css, styled } from "next-yak";

type Variant = "neutral" | "primary" | "success" | "warning" | "danger" | "info" | "outline";
/** Non-status colors for kinds of thing (e.g. opportunity types). Overrides `$variant`'s colors. */
export type BadgeCategory = 1 | 2 | 3 | 4 | 5;

/*
 * Badges show state and never look clickable: no neutral fill (a filled grey chip reads as a secondary
 * button), a hairline border, muted text, and a height well under the smallest button (32px).
 */
export const Badge = styled.span<{ $variant?: Variant; $category?: BadgeCategory }>`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  height: calc(var(--space-4) + var(--space-1));
  padding: 0 calc(var(--space-3) / 2);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: var(--weight-regular);
  line-height: var(--leading-none);
  white-space: nowrap;
  cursor: default;

  /* A leading <Icon size={12..14} /> never shrinks. */
  svg {
    flex-shrink: 0;
  }

  background: transparent;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);

  ${({ $variant }) =>
    $variant === "primary" &&
    css`
      background: var(--color-primary);
      color: var(--color-on-primary);
      border-color: var(--color-primary);
    `}
  ${({ $variant }) =>
    $variant === "success" &&
    css`
      background: var(--color-success-subtle);
      color: var(--color-success);
      border-color: var(--color-success-border);
    `}
  ${({ $variant }) =>
    $variant === "warning" &&
    css`
      background: var(--color-warning-subtle);
      color: var(--color-warning);
      border-color: var(--color-warning-border);
    `}
  ${({ $variant }) =>
    $variant === "danger" &&
    css`
      background: var(--color-danger-subtle);
      color: var(--color-danger);
      border-color: var(--color-danger-border);
    `}
  ${({ $variant }) =>
    $variant === "info" &&
    css`
      background: var(--color-info-subtle);
      color: var(--color-info);
      border-color: var(--color-info-border);
    `}
  /* Same quiet outline as neutral, with full-strength text for a count or category that matters more. */
  ${({ $variant }) =>
    $variant === "outline" &&
    css`
      color: var(--color-text);
    `}
  /* Categories come last so they win over any $variant. */
  ${({ $category }) =>
    $category === 1 &&
    css`
      background: var(--color-category-1-subtle);
      color: var(--color-category-1);
      border-color: var(--color-category-1-border);
    `}
  ${({ $category }) =>
    $category === 2 &&
    css`
      background: var(--color-category-2-subtle);
      color: var(--color-category-2);
      border-color: var(--color-category-2-border);
    `}
  ${({ $category }) =>
    $category === 3 &&
    css`
      background: var(--color-category-3-subtle);
      color: var(--color-category-3);
      border-color: var(--color-category-3-border);
    `}
  ${({ $category }) =>
    $category === 4 &&
    css`
      background: var(--color-category-4-subtle);
      color: var(--color-category-4);
      border-color: var(--color-category-4-border);
    `}
  ${({ $category }) =>
    $category === 5 &&
    css`
      background: var(--color-category-5-subtle);
      color: var(--color-category-5);
      border-color: var(--color-category-5-border);
    `}
`;
