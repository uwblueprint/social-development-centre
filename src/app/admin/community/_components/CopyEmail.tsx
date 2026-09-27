"use client";

import * as React from "react";
import type { MouseEvent } from "react";
import { styled } from "next-yak";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { TruncatedEmail } from "@/components/ui/TruncatedText";
import { TooltipContent, TooltipRoot, TooltipTrigger } from "@/components/ui/Tooltip";
import { communityCopy as copy } from "../_copy";

/** How long the "Copied" confirmation stays before the icon reverts. */
const COPIED_MS = 1500;

/*
 * The email itself is the control: text and icon in one ghost button that reads as text, so a click
 * anywhere on it copies. It keeps the cell's alignment (the padding is cancelled
 * by an equal negative margin), with the hover fill showing it's clickable.
 */
const Trigger = styled(Button)`
  height: auto;
  min-height: 24px;
  max-width: 100%;
  margin: 0 calc(var(--space-1) * -1);
  padding: 0 var(--space-1);
  gap: var(--space-1);
  justify-content: flex-start;
  font-size: inherit;
  line-height: var(--leading-ui);
  text-align: left;
  /* One line in the table, which scrolls sideways; the panel lets long addresses wrap (see EmailLine). */
  white-space: nowrap;
  color: inherit;

  /* Lets a truncating address shrink inside the button (the truncate prop). */
  [data-email] {
    min-width: 0;
  }

  &:active:not(:disabled) {
    transform: none;
  }

  [data-copy-icon] {
    display: inline-flex;
    flex-shrink: 0;
    color: var(--color-text-muted);
    opacity: 0;
    transition: opacity var(--duration) var(--ease);
  }
  &:hover [data-copy-icon],
  &:focus-visible [data-copy-icon],
  &[data-copied] [data-copy-icon] {
    opacity: 1;
  }
  /* No hover on touch screens: keep the icon visible. */
  @media (hover: none) {
    [data-copy-icon] {
      opacity: 1;
    }
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
 * An email address that copies itself when clicked (text or icon). The icon turns into a check and a
 * "Copied" tooltip shows for 1.5s, then both revert; the confirmation is in place, so there's no toast.
 * Stops clicks and key presses from reaching a clickable table row. `truncate` (table cells) cuts a long
 * address in the middle, keeping the domain; the copy and the accessible name are always the whole address.
 */
export function CopyEmail({ email, className, truncate = false }: { email: string; className?: string; truncate?: boolean }) {
  const [state, setState] = React.useState<CopyState>("idle");
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  function reset() {
    clearTimeout(timer.current);
    setState("idle");
  }

  function show(next: CopyState) {
    clearTimeout(timer.current);
    setState(next);
    timer.current = setTimeout(reset, COPIED_MS);
  }

  function handleCopy(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    navigator.clipboard.writeText(email).then(
      () => show("copied"),
      () => show("failed"),
    );
  }

  const label = state === "copied" ? copy.copyButton.copied : state === "failed" ? copy.copyButton.failed : "";

  return (
    <>
      {/* Only the confirmation is a tooltip: hovering every email in a table shouldn't pop one up. */}
      <TooltipRoot open={state !== "idle"} onOpenChange={(next) => !next && reset()}>
        <TooltipTrigger asChild>
          <Trigger
            type="button"
            $variant="ghost"
            className={className}
            aria-label={copy.table.copyEmailLabel(email)}
            data-copied={state === "copied" ? "" : undefined}
            onClick={handleCopy}
            // Keeps Enter/Space from reaching a clickable table row, which would open the panel instead.
            onKeyDown={(event) => event.stopPropagation()}
            onPointerLeave={reset}
            onBlur={reset}
          >
            <span data-email="">{truncate ? <TruncatedEmail email={email} /> : email}</span>
            <span data-copy-icon="" aria-hidden="true">
              <Icon icon={state === "copied" ? Check : Copy} size={14} />
            </span>
          </Trigger>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </TooltipRoot>
      <VisuallyHidden role="status">{label}</VisuallyHidden>
    </>
  );
}
