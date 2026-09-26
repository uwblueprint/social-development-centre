"use client";

import { css, styled } from "next-yak";
import { Avatar as AvatarPrimitive } from "radix-ui";

type Size = "sm" | "md" | "lg";

const Root = styled(AvatarPrimitive.Root)<{ $size?: Size }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: var(--radius-full);
  background: var(--color-secondary);
  border: 2px solid var(--color-bg);
  vertical-align: middle;

  width: 40px;
  height: 40px;

  ${({ $size }) =>
    $size === "sm" &&
    css`
      width: 28px;
      height: 28px;
    `}
  ${({ $size }) =>
    $size === "lg" &&
    css`
      width: 56px;
      height: 56px;
    `}
`;

const Image = styled(AvatarPrimitive.Image)`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const Fallback = styled(AvatarPrimitive.Fallback)<{ $size?: Size }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--color-text-muted);
  font-weight: var(--weight-regular);
  font-size: var(--text-sm);

  ${({ $size }) =>
    $size === "sm" &&
    css`
      font-size: var(--text-xs);
    `}
  ${({ $size }) =>
    $size === "lg" &&
    css`
      font-size: var(--text-lg);
    `}
`;

export function Avatar({
  src,
  alt = "",
  initials,
  size = "md",
  ...props
}: AvatarPrimitive.AvatarProps & {
  src?: string;
  alt?: string;
  initials: string;
  size?: Size;
}) {
  return (
    <Root $size={size} {...props}>
      {src && <Image src={src} alt={alt} />}
      <Fallback $size={size} delayMs={src ? 400 : undefined}>
        {initials}
      </Fallback>
    </Root>
  );
}
