"use client";

import * as React from "react";
import type { MouseEvent } from "react";
import { styled } from "next-yak";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { TooltipContent, TooltipRoot, TooltipTrigger } from "@/components/ui/Tooltip";
import { partnersCopy } from "../_copy";

const copy = partnersCopy.emails;

/** How long the checkmark stays before the icon reverts (as in Community). */
const COPIED_MS = 1500;

const CopyIcon = styled.span<{ $shown: boolean }>`
  display: inline-flex;
  flex: none;
  color: var(--color-text-muted);
  opacity: ${({ $shown }) => ($shown ? 1 : 0)};
  transition: opacity var(--duration) var(--ease);
`;

/* The email reads as the cell's text; its own padding is cancelled so it lines up with the other cells. */
const EmailButton = styled(Button)`
  height: auto;
  min-height: 24px;
  margin: calc(var(--space-1) * -1);
  padding: var(--space-1);
  font-size: var(--text-sm);
  gap: var(--space-1);

  &:hover ${CopyIcon}, &:focus-visible ${CopyIcon} {
    opacity: 1;
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
`;

type CopyState = "idle" | "copied" | "failed";

/**
 * An email in a table cell that copies itself when clicked (the row doesn't open), then shows a checkmark
 * in place and a "Copied" tooltip for 1.5s. The copy icon appears on hover and focus.
 */
export function CopyableEmail({ email }: { email: string }) {
  const [state, setState] = React.useState<CopyState>("idle");
  const [open, setOpen] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);

  function reset() {
    clearTimeout(timer.current);
    setState("idle");
    setOpen(false);
  }

  function handleCopy(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    navigator.clipboard.writeText(email).then(
      () => show("copied"),
      () => show("failed"),
    );
  }

  function show(next: CopyState) {
    clearTimeout(timer.current);
    setState(next);
    setOpen(true);
    timer.current = setTimeout(reset, COPIED_MS);
  }

  const status = state === "copied" ? copy.copiedOne : state === "failed" ? copy.copyOneFailed : "";

  return (
    <>
      <TooltipRoot delayDuration={0} open={open && state !== "idle"} onOpenChange={(next) => !next && reset()}>
        <TooltipTrigger asChild>
          <EmailButton
            type="button"
            $variant="ghost"
            $size="sm"
            aria-label={copy.copyOne(email)}
            onClick={handleCopy}
            // Keeps Enter/Space from reaching the clickable row, which would open the panel instead.
            onKeyDown={(event) => event.stopPropagation()}
            onPointerLeave={reset}
            onBlur={reset}
          >
            <span>{email}</span>
            <CopyIcon $shown={state !== "idle"} aria-hidden="true">
              <Icon icon={state === "copied" ? Check : Copy} size={14} />
            </CopyIcon>
          </EmailButton>
        </TooltipTrigger>
        <TooltipContent>{status}</TooltipContent>
      </TooltipRoot>
      <VisuallyHidden role="status">{status}</VisuallyHidden>
    </>
  );
}

/** Copies a list of emails, comma-separated, and returns the toast title. */
export async function copyEmails(emails: string[]): Promise<string> {
  try {
    await navigator.clipboard.writeText(emails.join(", "));
    return copy.copied(emails.length);
  } catch {
    return copy.copyFailed;
  }
}
