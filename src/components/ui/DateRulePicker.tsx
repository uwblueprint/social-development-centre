"use client";

import { useEffect, useRef, useState } from "react";
import { styled } from "next-yak";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "./Popover";
import { RangeCalendar, type RangeCalendarMode } from "./RangeCalendar";
import { ToggleGroup, ToggleGroupItem } from "./ToggleGroup";

/** A date rule: before or after one date, or between two. Dates are ISO (YYYY-MM-DD); "" means not set. */
export interface DateRule {
  op: RangeCalendarMode;
  from: string;
  to: string;
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dateOf = (value: string) => new Date(`${value}T12:00:00`);
const short = (value: string) => dateOf(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const long = (value: string) => dateOf(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/** The first and last day of the month a date falls in. */
export function monthOf(date: Date): { from: string; to: string } {
  return { from: iso(new Date(date.getFullYear(), date.getMonth(), 1)), to: iso(new Date(date.getFullYear(), date.getMonth() + 1, 0)) };
}

/** The rule in words: "Between Nov 1 and Nov 30, 2026", "Before Nov 5, 2026". Reversed ranges read in order. */
export function formatDateRule({ op, from, to }: DateRule, empty = "Pick dates"): string {
  if (op !== "between") return from ? `${op === "before" ? "Before" : "After"} ${long(from)}` : empty;
  if (!from && !to) return empty;
  if (!to) return `After ${long(from)}`;
  if (!from) return `Before ${long(to)}`;
  const [a, b] = from <= to ? [from, to] : [to, from];
  return `Between ${a.slice(0, 4) === b.slice(0, 4) ? short(a) : long(a)} and ${long(b)}`;
}

export interface DateRulePickerProps {
  value: DateRule;
  onValueChange: (value: DateRule) => void;
  /** Names the rule for assistive tech, e.g. "Join date". */
  label: string;
  disabled?: boolean;
  /** Called when the popover opens or closes (e.g. to group the changes made while it's open into one undo step). */
  onOpenChange?: (open: boolean) => void;
  /** Opens the popover once when it turns true (e.g. right after the rule is added), then calls onOpenRequestHandled. */
  openRequest?: boolean;
  onOpenRequestHandled?: () => void;
}

/**
 * A date rule as plain text; clicking it opens Before / After / Between above a RangeCalendar.
 * The popover is anchored to where the text was when it opened, so it stays put while the text changes width.
 */
export function DateRulePicker({ value, onValueChange, label, disabled, onOpenChange, openRequest = false, onOpenRequestHandled }: DateRulePickerProps) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLSpanElement>(null);
  const [frozen, setFrozen] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  function handleOpenChange(next: boolean) {
    if (next) {
      const r = boxRef.current?.getBoundingClientRect();
      setFrozen(r ? { left: r.left, top: r.top, width: r.width, height: r.height } : null);
    }
    setOpen(next);
    onOpenChange?.(next);
  }

  useEffect(() => {
    if (!openRequest) return;
    handleOpenChange(true);
    onOpenRequestHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRequest]);

  // Switching rule keeps the first date; Between fills the end with the end of that month.
  function setOp(next: RangeCalendarMode) {
    if (next === value.op) return;
    const from = value.from || monthOf(new Date()).from;
    onValueChange(next === "between" ? { op: next, from, to: value.to || monthOf(dateOf(from)).to } : { op: next, from, to: "" });
  }

  const text = formatDateRule(value);
  return (
    <Box ref={boxRef}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        {frozen && (
          <PopoverAnchor asChild>
            <FrozenAnchor aria-hidden style={frozen} />
          </PopoverAnchor>
        )}
        <PopoverTrigger asChild>
          <Trigger type="button" disabled={disabled} aria-haspopup="dialog" aria-label={`${label}: ${text}. Change dates`}>
            {text}
          </Trigger>
        </PopoverTrigger>
        <Content align="start" showClose={false}>
          <Switcher>
            <ToggleGroup type="single" value={value.op} onValueChange={(v) => v && setOp(v as RangeCalendarMode)} aria-label={`${label} rule`}>
              <ToggleGroupItem value="before">Before</ToggleGroupItem>
              <ToggleGroupItem value="after">After</ToggleGroupItem>
              <ToggleGroupItem value="between">Between</ToggleGroupItem>
            </ToggleGroup>
          </Switcher>
          <RangeCalendar
            mode={value.op}
            value={{ from: value.from, to: value.to }}
            onValueChange={(v) => onValueChange({ ...value, from: v.from ?? "", to: v.to ?? "" })}
            aria-label={label}
          />
        </Content>
      </Popover>
    </Box>
  );
}

const Box = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  display: inline-flex;
  align-items: center;
`;

/* An invisible box fixed at the trigger's rect from when the popover opened, so the popover never follows the text. */
const FrozenAnchor = styled.span`
  position: fixed;
  pointer-events: none;
  visibility: hidden;
`;

/* Plain text that opens the calendar: no box of its own, a focus ring for keyboard users. */
const Trigger = styled.button`
  all: unset;
  box-sizing: border-box;
  flex: 1 1 auto;
  min-width: 0;
  min-height: var(--space-6);
  display: inline-flex;
  align-items: center;
  color: var(--color-text);
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  border-radius: var(--radius-sm);
  cursor: pointer;
  user-select: none;

  &:focus-visible {
    box-shadow: var(--focus-ring);
  }
  &:disabled {
    cursor: default;
  }
`;

const Content = styled(PopoverContent)`
  && {
    width: auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
`;

/* Before / After / Between share the calendar's width equally. */
const Switcher = styled.div`
  && > [role="radiogroup"],
  && > [role="group"] {
    display: flex;
    width: 100%;
  }
  && [role="radio"] {
    flex: 1 1 0;
  }
`;
