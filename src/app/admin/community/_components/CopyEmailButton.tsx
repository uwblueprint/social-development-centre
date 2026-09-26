"use client";

import * as React from "react";
import type { MouseEvent } from "react";
import { styled } from "next-yak";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { TooltipContent, TooltipRoot, TooltipTrigger } from "@/components/ui/Tooltip";
import { communityCopy as copy } from "../_copy";

/** How long the "Copied" confirmation stays before the button reverts. */
const COPIED_MS = 1500;

const IconButton = styled(Button)`
  width: 24px;
  height: 24px;
  padding: 0;
  flex-shrink: 0;
  color: var(--color-text-muted);

  &:hover:not(:disabled) {
    color: var(--color-text);
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
 * Icon button that copies `email`, then shows "Copied" (check icon and tooltip)
 * for 1.5s before reverting. The tooltip is controlled here rather than through
 * the kit's click-to-pin `Tooltip`, so it always closes when the pointer
 * leaves or focus moves, and the confirmation can never linger.
 */
export function CopyEmailButton({ email, className }: { email: string; className?: string }) {
  const [open, setOpen] = React.useState(false);
  const [state, setState] = React.useState<CopyState>("idle");
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  function reset() {
    clearTimeout(timer.current);
    setState("idle");
    setOpen(false);
  }

  function show(next: CopyState) {
    clearTimeout(timer.current);
    setState(next);
    setOpen(true);
    timer.current = setTimeout(reset, COPIED_MS);
  }

  function handleCopy(event: MouseEvent) {
    event.stopPropagation();
    // Stops Radix closing the tooltip on click, so the confirmation can show.
    event.preventDefault();
    navigator.clipboard.writeText(email).then(
      () => show("copied"),
      () => show("failed"),
    );
  }

  const label = state === "copied" ? copy.copyButton.copied : state === "failed" ? copy.copyButton.failed : copy.copyButton.label;

  return (
    <>
      <TooltipRoot
        delayDuration={0}
        open={open}
        onOpenChange={(next) => (next ? setOpen(true) : reset())}
      >
        <TooltipTrigger asChild>
          <IconButton
            type="button"
            $variant="ghost"
            $size="sm"
            className={className}
            aria-label={copy.copyButton.label}
            onClick={handleCopy}
            // Keeps Enter/Space from reaching a clickable table row, which would open the panel instead.
            onKeyDown={(event) => event.stopPropagation()}
            onPointerLeave={reset}
            onBlur={reset}
          >
            <Icon icon={state === "copied" ? Check : Copy} size={14} />
          </IconButton>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </TooltipRoot>
      <VisuallyHidden role="status">{state === "idle" ? "" : label}</VisuallyHidden>
    </>
  );
}
