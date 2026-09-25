"use client";

import { styled } from "next-yak";
import { Progress as ProgressPrimitive } from "radix-ui";

const Root = styled(ProgressPrimitive.Root)`
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
`;

const Indicator = styled(ProgressPrimitive.Indicator)`
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--radius-full);
  transition: transform var(--duration) var(--ease);
`;

export function Progress({
  value,
  max = 100,
  "aria-label": ariaLabel = "Progress",
  ...props
}: ProgressPrimitive.ProgressProps & { "aria-label"?: string }) {
  const pct = Math.round(((value ?? 0) / max) * 100);
  return (
    <Root value={value} max={max} aria-label={ariaLabel} {...props}>
      <Indicator style={{ transform: `translateX(-${100 - pct}%)` }} />
    </Root>
  );
}
