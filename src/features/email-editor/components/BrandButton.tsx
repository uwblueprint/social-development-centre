"use client";

import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";

/**
 * The editor's main action in SDC green (owner). The kit's primary is still near-black;
 * when the palette moves to green this becomes plain `<Button>`.
 */
export const BrandButton = styled(Button)`
  background: var(--color-brand);
  color: var(--color-on-brand);

  &:hover:not(:disabled) {
    background: var(--color-brand-hover);
  }

  &[aria-disabled="true"],
  &[aria-disabled="true"]:hover {
    background: var(--color-disabled-bg);
    color: var(--color-text-subtle);
  }
`;
