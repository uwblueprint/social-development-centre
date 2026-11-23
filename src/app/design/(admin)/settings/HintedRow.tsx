"use client";

import * as React from "react";
import { TooltipContent, TooltipRoot, TooltipTrigger } from "@/components/ui/Tooltip";
import { Cell, Row, RowLabel } from "./parts";

/** How long someone can sit in a field doing nothing before we assume they're unsure what it is. */
const PAUSE_MS = 2000;

/**
 * A labelled field with a hint that appears in two cases only:
 * - the pointer is on the label (someone asking what this is), or
 * - the field is focused and nothing happens for two seconds (someone who is stuck).
 * It never shows while they are typing or clicking, and it points at the label, so it can't cover another field.
 */
export function HintedRow({
  label,
  field,
  hint,
  children,
}: {
  label: string;
  /** The kind of field, when its first line of text doesn't sit in the middle of a 40px control. */
  field?: "textarea";
  hint: string;
  children: React.ReactNode;
}) {
  const [hover, setHover] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setPaused(false);
  }, []);

  React.useEffect(() => stop, [stop]);

  return (
    <TooltipRoot
      open={hover || paused}
      onOpenChange={(open) => {
        setHover(open);
        if (!open) setPaused(false);
      }}
    >
      <Row>
        <TooltipTrigger asChild>
          <RowLabel data-field={field}>
            {label}
          </RowLabel>
        </TooltipTrigger>
        <Cell
          onFocusCapture={() => {
            stop();
            timer.current = setTimeout(() => setPaused(true), PAUSE_MS);
          }}
          onBlurCapture={stop}
          onKeyDownCapture={stop}
          onPointerDownCapture={stop}
        >
          {children}
        </Cell>
      </Row>
      <TooltipContent side="top" align="start">
        {hint}
      </TooltipContent>
    </TooltipRoot>
  );
}
