import type { ComponentProps } from "react";
import { css, styled } from "next-yak";

/** No "link" variant (owner): every action is a box. Text-like actions use `ghost`. */
type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "danger-outline" | "danger-secondary";
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
      /* A light outline (owner, Nov 2026): the label identifies a button, so WCAG 1.4.11's 3:1 doesn't apply to its border.
         Inputs keep --color-border-strong, since their border is what shows where to type. Darkens on hover. */
      border-color: var(--taupe-400);
      &:hover:not(:disabled):not([aria-disabled="true"]) {
        background: var(--color-bg-hover);
        border-color: var(--color-border-strong);
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
  /* Delete as a secondary action: light red fill, red label (owner, Nov 2026). Use it instead of an icon-only trash button. */
  ${({ $variant }) =>
    $variant === "danger-secondary" &&
    css`
      background: var(--color-danger-subtle);
      color: var(--color-danger);
      &:hover:not(:disabled):not([aria-disabled="true"]) {
        background: color-mix(in oklch, var(--color-danger) 10%, var(--color-danger-subtle));
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

/**
 * The dismiss button in a dialog or popover footer: always secondary, always "Cancel" unless told otherwise.
 * Footers (DialogActions, AlertDialogActions, PopoverActions) pin it to the far left, away from the action.
 * Wrap it in DialogClose / AlertDialogCancel / PopoverClose with asChild.
 */
export function CancelButton({ children = "Cancel", ...props }: ComponentProps<typeof Button>) {
  return (
    <Button type="button" $variant="secondary" data-cancel="" {...props}>
      {children}
    </Button>
  );
}
