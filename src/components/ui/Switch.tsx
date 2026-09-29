"use client";

import { styled } from "next-yak";
import { Switch as SwitchPrimitive } from "radix-ui";

const Root = styled(SwitchPrimitive.Root)`
  all: unset;
  position: relative;
  width: 40px;
  height: 24px;
  flex-shrink: 0;
  border-radius: var(--radius-full);
  background: var(--color-border-strong);
  cursor: pointer;
  transition: background-color var(--duration) var(--ease);

  &[data-state="checked"] {
    background: var(--color-primary);
  }
  &:focus-visible {
    box-shadow: var(--focus-ring);
  }
  &[data-disabled] {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const Thumb = styled(SwitchPrimitive.Thumb)`
  display: block;
  width: 18px;
  height: 18px;
  border-radius: var(--radius-full);
  background: var(--color-bg);
  box-shadow: var(--shadow-sm);
  transform: translateX(3px);
  transition: transform var(--duration) var(--ease);

  &[data-state="checked"] {
    transform: translateX(19px);
  }
`;

export function Switch(props: SwitchPrimitive.SwitchProps) {
  return (
    <Root {...props}>
      <Thumb />
    </Root>
  );
}
