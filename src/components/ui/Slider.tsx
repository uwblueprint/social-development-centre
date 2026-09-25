"use client";

import { styled } from "next-yak";
import { Slider as SliderPrimitive } from "radix-ui";

const Root = styled(SliderPrimitive.Root)`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 20px;
  touch-action: none;
  user-select: none;
  cursor: pointer;

  &[data-disabled] {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const Track = styled(SliderPrimitive.Track)`
  position: relative;
  flex-grow: 1;
  height: 4px;
  border-radius: var(--radius-full);
  background: var(--color-border);
`;

const Range = styled(SliderPrimitive.Range)`
  position: absolute;
  height: 100%;
  border-radius: var(--radius-full);
  background: var(--color-primary);
`;

const Thumb = styled(SliderPrimitive.Thumb)`
  display: block;
  width: 18px;
  height: 18px;
  border-radius: var(--radius-full);
  background: var(--color-bg);
  border: 1px solid var(--color-border-strong);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--duration) var(--ease);

  &:hover {
    border-color: var(--color-primary);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

export function Slider(props: SliderPrimitive.SliderProps) {
  const values = props.value ?? props.defaultValue ?? [0];
  return (
    <Root {...props}>
      <Track>
        <Range />
      </Track>
      {values.map((_, i) => (
        <Thumb key={i} />
      ))}
    </Root>
  );
}
