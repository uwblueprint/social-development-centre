"use client";

import type { ReactNode } from "react";
import { styled } from "next-yak";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/Collapsible";
import { Icon } from "@/components/ui/Icon";
import { dayLabel } from "../_data";

/** Where the list scrolls to when the calendar picks a day. */
export const dayAnchorId = (day: number) => `outbox-day-${day}`;

/* Stays at the top of the list while its rows scroll under it, above the rows' raised checkboxes. */
const DayHead = styled.h2`
  position: sticky;
  /* -1px: the stuck header's own top line tucks under the scroller's edge, so no second line shows under the panel header. */
  top: -1px;
  z-index: var(--z-sticky);
  box-sizing: border-box;
  height: var(--row-height);
  margin: 0;
  padding: 0;
  background: var(--color-bg);
  /* The list's one divider rule: every header and row draws its top line; the list's wrapper hides the very first. */
  border-top: 1px solid var(--color-border);

  /* Plus a bottom line, so rows sliding under the stuck heading don't blend into it. It is drawn over the 1px just below the
     heading (outside its box, so heights are unchanged), which is exactly where the next row's or heading's top line sits:
     the two coincide, so the list still shows one line there, never two. */
  &::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: -1px;
    height: 1px;
    background: var(--color-border);
    pointer-events: none;
  }
`;

const DayToggle = styled(CollapsibleTrigger)`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  height: 100%;
  min-width: 0;
  /* Label and chevron sit on the rows' --space-4 gutters. */
  padding: 0 var(--space-4);
  border: 0;
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  text-align: left;
  cursor: pointer;

  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text);
  }
  /* Full-bleed like the rows, so the ring is drawn inside: the scrolling list would clip an outer one. */
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring-inset);
  }
  /* Long text is cut before the chevron; the chevron never moves. */
  & > span {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  & svg {
    flex: none;
    transition: transform var(--duration) var(--ease-out);
  }
  &[data-state="closed"] svg {
    transform: rotate(-90deg);
  }
`;

interface DayGroupProps {
  day: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Roving-focus wiring from the list: the stop key, whether it is the list's one tab stop, and focus tracking. */
  rovingKey: string;
  tabStop: boolean;
  onRovingFocus: (key: string) => void;
  /** The pointer or focus is on this day's heading (null: it left). Lights up the day on the calendar, like a row does. */
  onHoverDay: (day: number | null) => void;
  children: ReactNode;
}

/** One day's rows under a heading that collapses them. */
export function DayGroup({ day, open, onOpenChange, rovingKey, tabStop, onRovingFocus, onHoverDay, children }: DayGroupProps) {
  return (
    <div id={dayAnchorId(day)}>
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <DayHead>
          <DayToggle data-roving={rovingKey} tabIndex={tabStop ? 0 : -1} onFocus={() => {
              onRovingFocus(rovingKey);
              onHoverDay(day);
            }}
            onBlur={() => onHoverDay(null)}
            onMouseEnter={() => onHoverDay(day)}
            onMouseLeave={() => onHoverDay(null)}
          >
            <span>{dayLabel(day)}</span>
            <Icon icon={ChevronDown} size={14} />
          </DayToggle>
        </DayHead>
        <CollapsibleContent>{children}</CollapsibleContent>
      </Collapsible>
    </div>
  );
}
