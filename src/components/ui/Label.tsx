"use client";

import { styled } from "next-yak";
import { Label as LabelPrimitive } from "radix-ui";

export const Label = styled(LabelPrimitive.Root)`
  display: inline-block;
  font-size: var(--text-sm);
  font-weight: var(--weight-regular);
  color: var(--color-text);
  margin-bottom: var(--space-1);
  cursor: pointer;

  /* Structural case: label wraps its control, e.g. <Label><Checkbox disabled />text</Label>. */
  &:has(:disabled),
  &:has([data-disabled]) {
    cursor: not-allowed;
  }

  /* Sibling case: the control lives outside the label; callers pass data-disabled explicitly. */
  &[data-disabled] {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;
