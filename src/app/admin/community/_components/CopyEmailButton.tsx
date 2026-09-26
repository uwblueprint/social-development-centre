"use client";

import type { MouseEvent } from "react";
import { styled } from "next-yak";
import { Copy } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { communityCopy as copy } from "../_copy";

const IconButton = styled.button`
  all: unset;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--duration) var(--ease), background-color var(--duration) var(--ease), color var(--duration) var(--ease);

  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text);
  }
  &:focus-visible {
    opacity: 1;
    box-shadow: var(--focus-ring);
  }
`;

/**
 * Small icon button that copies `email` to the clipboard and toasts. Stays
 * invisible until its container is hovered or the button itself is focused —
 * wrap it and the email text together and add `&:hover button, &:focus-within button { opacity: 1; }`.
 */
export function CopyEmailButton({ email, className }: { email: string; className?: string }) {
  const { toast } = useToast();

  function handleCopy(event: MouseEvent) {
    event.stopPropagation();
    void navigator.clipboard.writeText(email).then(
      () => toast({ title: copy.toast.emailCopied }),
      () => toast({ title: copy.toast.emailCopied }),
    );
  }

  return (
    <IconButton type="button" className={className} aria-label={copy.table.copyEmailLabel} onClick={handleCopy}>
      <Icon icon={Copy} size={13} />
    </IconButton>
  );
}
