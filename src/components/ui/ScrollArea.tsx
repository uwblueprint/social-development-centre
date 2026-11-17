"use client";

import { styled } from "next-yak";
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";
import type { ReactNode } from "react";

/* The viewport clips, so it reserves the focus ring's reach (4px) as padding and the root gives it back as negative margin. */
const Root = styled(ScrollAreaPrimitive.Root)`
  overflow: hidden;
  margin: calc(var(--space-1) * -1);
`;

const Viewport = styled(ScrollAreaPrimitive.Viewport)`
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: var(--space-1);

  & > div {
    display: block !important;
  }
`;

const Scrollbar = styled(ScrollAreaPrimitive.Scrollbar)`
  display: flex;
  touch-action: none;
  user-select: none;
  padding: 2px;
  background: transparent;

  &[data-orientation="vertical"] {
    width: 10px;
  }
  &[data-orientation="horizontal"] {
    flex-direction: column;
    height: 10px;
  }
`;

const Thumb = styled(ScrollAreaPrimitive.Thumb)`
  flex: 1;
  background: var(--color-border-strong);
  border-radius: var(--radius-full);
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    min-width: 20px;
    min-height: 20px;
  }
`;

export function ScrollArea({
  children,
  style,
  ...props
}: ScrollAreaPrimitive.ScrollAreaProps & { children: ReactNode }) {
  return (
    <Root style={style} {...props}>
      <Viewport>{children}</Viewport>
      <Scrollbar orientation="vertical">
        <Thumb />
      </Scrollbar>
      <Scrollbar orientation="horizontal">
        <Thumb />
      </Scrollbar>
      <ScrollAreaPrimitive.Corner />
    </Root>
  );
}
