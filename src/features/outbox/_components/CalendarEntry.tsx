"use client";

import * as React from "react";
import { keyframes, styled } from "next-yak";
import { ListRow } from "@/components/ui/ListRow";
import { Tooltip } from "@/components/ui/Tooltip";

/*
 * One automatic email on one day: "3 · Thank-you: standard". Click filters the list to that template
 * (and clicks it off again), double-click opens the automatic email. Neutral when scheduled; status
 * tints say "to review" and "not sent" in words too. 24px tall, the smallest target WCAG 2.5.8 allows.
 */
/* An approved email's entry changes from the "to review" tint to its scheduled colour in place: fade, no movement. */
const settle = keyframes`
  from {
    background: var(--color-warning-subtle);
    color: var(--color-warning);
  }
`;

const Entry = styled(ListRow)`
  display: flex;
  align-items: center;
  gap: var(--space-1);
  width: 100%;
  height: var(--space-5);
  padding: 0 calc(var(--space-1) * 1.5);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: var(--weight-regular);
  background: var(--color-secondary);
  color: var(--color-text);

  &:hover {
    background: var(--color-secondary-hover);
  }
  /* On a highlighted day (picked, the list row's day, or the day under the pointer) the cell's fill is the same
     taupe as a scheduled entry, so the entry would vanish into it: it turns white there and keeps its hover. */
  [data-picked] &:not([data-tone]):not([aria-pressed="true"]),
  [data-hover] &:not([data-tone]):not([aria-pressed="true"]),
  [role="gridcell"]:has(> button:hover) &:not([data-tone]):not([aria-pressed="true"]) {
    background: var(--color-bg);
  }
  [data-picked] &:not([data-tone]):not([aria-pressed="true"]):hover,
  [data-hover] &:not([data-tone]):not([aria-pressed="true"]):hover {
    background: var(--color-secondary-hover);
  }
  &[data-settling] {
    animation: ${settle} var(--duration-slow) var(--ease-out);
  }
  &[data-tone="strong"] {
    background: var(--color-text);
    color: var(--color-bg);
  }
  &[data-tone="review"] {
    background: var(--color-warning-subtle);
    color: var(--color-warning);
  }
  &[data-tone="danger"] {
    background: var(--color-danger-subtle);
    color: var(--color-danger);
  }
  /* The template filtered on: primary for every tone, in words too (aria-pressed). */
  &[aria-pressed="true"] {
    background: var(--color-primary);
    color: var(--color-on-primary);
  }
  &[aria-pressed="true"]:hover:not(:focus-visible) {
    background: var(--color-primary-hover);
    box-shadow: none;
  }
  &:focus-visible {
    box-shadow: var(--focus-ring);
  }
  & > span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

interface CalendarEntryProps {
  /** The automatic email's full name. */
  name: string;
  /** The count, e.g. "3" or "2 to review". */
  label: string;
  tone: "strong" | "review" | "danger" | undefined;
  /** The template's key: the calendar's keyboard handling reads it to open the automatic email. */
  entryKey: string;
  /** This template is the one the list is filtered to. */
  pressed: boolean;
  /** This entry just changed from "to review" to scheduled. */
  settling?: boolean;
  onFilter: () => void;
  onOpen: () => void;
}

/** The tooltip carries the full name and only shows when the label is cut off with an ellipsis. */
export function CalendarEntry({ name, label, tone, entryKey, pressed, settling, onFilter, onOpen }: CalendarEntryProps) {
  const textRef = React.useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = React.useState(false);

  // Measured when the box resizes. `truncated` is a dependency because the tooltip wraps the button
  // only while it's true, which swaps the span for a new element that needs observing.
  React.useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const measure = () => setTruncated(el.scrollWidth > el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [truncated, name, label]);

  const entry = (
    <Entry
      type="button"
      // Not a tab stop: the calendar is one stop, and "e" on a day steps into its entries (see OutboxCalendar).
      tabIndex={-1}
      data-cal-entry={entryKey}
      data-tone={tone}
      data-settling={settling ? "" : undefined}
      aria-pressed={pressed}
      aria-label={`${label} ${name}. ${pressed ? "Remove this filter" : "Filter the list to this automatic email"}`}
      // A double-click sends two clicks first; only the first may toggle the filter.
      onClick={(event) => event.detail <= 1 && onFilter()}
      onDoubleClick={onOpen}
    >
      <span ref={textRef}>
        {label} · {name}
      </span>
    </Entry>
  );

  return truncated ? (
    <Tooltip pinOnClick={false} delayDuration={300} content={name}>
      {entry}
    </Tooltip>
  ) : (
    entry
  );
}
