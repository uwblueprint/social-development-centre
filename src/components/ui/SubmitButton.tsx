"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { keyframes, styled } from "next-yak";
import { LoaderCircle } from "lucide-react";
import { Button } from "./Button";
import { Icon } from "./Icon";

const Label = styled.span<{ $hidden: boolean }>`
  visibility: ${({ $hidden }) => ($hidden ? "hidden" : "visible")};
`;

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const Spinner = styled.span`
  position: absolute;
  inset: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  svg {
    animation: ${spin} 0.8s linear infinite;
  }
`;

const Relative = styled(Button)`
  position: relative;
`;

/**
 * Submit button for forms backed by a server action. While the action runs it
 * shows a spinner at the same width, announces busy state, and ignores repeat clicks.
 */
export function SubmitButton({ children, onClick, ...props }: ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return (
    <Relative
      type="submit"
      aria-disabled={pending || undefined}
      aria-busy={pending || undefined}
      onClick={(e) => {
        if (pending) e.preventDefault();
        else onClick?.(e);
      }}
      {...props}
    >
      <Label $hidden={pending}>{children}</Label>
      {pending && (
        <Spinner aria-hidden="true">
          <Icon icon={LoaderCircle} size={16} />
        </Spinner>
      )}
    </Relative>
  );
}
