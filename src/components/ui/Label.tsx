"use client";

import { styled } from "next-yak";
import { Label as LabelPrimitive } from "radix-ui";

export const Label = styled(LabelPrimitive.Root)`
  display: inline-block;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: var(--space-1);

  &[data-disabled] {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;
