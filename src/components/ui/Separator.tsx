"use client";

import { styled } from "next-yak";
import { Separator as SeparatorPrimitive } from "radix-ui";

export const Separator = styled(SeparatorPrimitive.Root)`
  flex-shrink: 0;
  background: var(--color-border);

  &[data-orientation="horizontal"] {
    height: 1px;
    width: 100%;
  }
  &[data-orientation="vertical"] {
    height: 100%;
    width: 1px;
  }
`;
