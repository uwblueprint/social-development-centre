"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Popover as PopoverPrimitive } from "radix-ui";
import { DayPicker, type Matcher } from "react-day-picker";
import { CalendarDays } from "lucide-react";
import { Icon } from "./Icon";
import { ErrorIcon } from "./Field";

/* ------------------------------------------------------------------ */
/* ISO ("YYYY-MM-DD") <-> Date helpers. Local time throughout, so the   */
/* value round-trips exactly through the text field, the calendar and  */
/* form submission without timezone drift.                             */
/* ------------------------------------------------------------------ */

const ISO_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseISODate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const match = ISO_PATTERN.exec(value.trim());
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  const valid =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return valid ? date : undefined;
}

function formatISODate(date: Date): string {
  const y = String(date.getFullYear()).padStart(4, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/* ------------------------------------------------------------------ */
/* Text field + calendar trigger, styled to match Input/Select.        */
/* ------------------------------------------------------------------ */

const Wrapper = styled.div`
  position: relative;
  display: block;
  width: 100%;
`;

const TextField = styled.input<{ $invalid?: boolean }>`
  display: block;
  width: 100%;
  height: 40px;
  padding: 0 76px 0 var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-strong);
  background: var(--color-bg);
  color: var(--color-text);
  font-family: inherit;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  transition:
    border-color var(--duration) var(--ease),
    box-shadow var(--duration) var(--ease);

  &::placeholder {
    color: var(--color-text-muted);
  }

  &:hover:not(:disabled):not(:focus) {
    border-color: var(--color-text-muted);
  }

  &:focus-visible,
  &:focus {
    outline: none;
    border-color: var(--color-focus);
    box-shadow: var(--focus-ring);
  }

  &[aria-invalid="true"] {
    border-color: var(--color-danger);
    box-shadow: inset 0 0 0 1px var(--color-danger);

    &:focus-visible,
    &:focus {
      box-shadow:
        inset 0 0 0 1px var(--color-danger),
        0 0 0 2px var(--color-bg),
        0 0 0 4px var(--color-danger);
    }
  }

  &:disabled {
    background: var(--color-surface);
    color: var(--color-text-muted);
    border-color: var(--color-border);
    border-style: dashed;
    cursor: not-allowed;
  }
`;

const IconGroup = styled.span`
  position: absolute;
  top: 0;
  right: 0;
  height: 40px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding-right: 4px;
`;

const ErrorSlot = styled.span`
  display: inline-flex;
  color: var(--color-danger);
  pointer-events: none;
`;

const TriggerButton = styled(PopoverPrimitive.Trigger)`
  all: unset;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  transition:
    color var(--duration) var(--ease),
    background-color var(--duration) var(--ease);

  &:hover:not(:disabled) {
    color: var(--color-text);
    background: var(--color-secondary);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  &:disabled {
    color: var(--color-text-muted);
    cursor: not-allowed;
  }
`;

/* ------------------------------------------------------------------ */
/* Calendar popover, styled to our tokens via react-day-picker's        */
/* always-applied default class names (no CSS import needed for v10).  */
/* ------------------------------------------------------------------ */

const CalendarContent = styled(PopoverPrimitive.Content)`
  z-index: 50;
  background: var(--color-surface-raised);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
  padding: var(--space-3);

  &:focus {
    outline: none;
  }

  .rdp-root {
    --rdp-day-width: 32px;
    --rdp-day-height: 32px;
    margin: 0;
  }

  .rdp-months {
    margin: 0;
  }

  .rdp-month_caption {
    display: flex;
    align-items: center;
    height: 32px;
    margin-bottom: var(--space-2);
  }

  .rdp-caption_label {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    line-height: var(--leading-ui);
    color: var(--color-text);
  }

  .rdp-nav {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .rdp-button_previous,
  .rdp-button_next {
    all: unset;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    cursor: pointer;
  }

  .rdp-button_previous:hover,
  .rdp-button_next:hover {
    background: var(--stone-100);
    color: var(--color-text);
  }

  .rdp-button_previous:focus-visible,
  .rdp-button_next:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  .rdp-button_previous[aria-disabled="true"],
  .rdp-button_next[aria-disabled="true"] {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .rdp-chevron {
    fill: currentColor;
    width: 14px;
    height: 14px;
  }

  .rdp-weekdays {
    display: flex;
  }

  .rdp-weekday {
    width: 32px;
    height: 24px;
    padding: 0;
    font-size: var(--text-xs);
    font-weight: var(--weight-regular);
    color: var(--color-text-muted);
    text-align: center;
  }

  .rdp-week {
    display: flex;
  }

  .rdp-day {
    width: 32px;
    height: 32px;
    padding: 0;
    text-align: center;
  }

  .rdp-day_button {
    all: unset;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    line-height: var(--leading-ui);
    color: var(--color-text);
    cursor: pointer;
  }

  .rdp-day_button:hover {
    background: var(--stone-100);
  }

  .rdp-day_button:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  .rdp-day[data-today] .rdp-day_button {
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .rdp-day[data-outside] .rdp-day_button {
    color: var(--color-text-subtle);
  }

  .rdp-day[data-selected] .rdp-day_button {
    background: var(--color-primary);
    color: var(--color-on-primary);
  }

  .rdp-day[data-selected] .rdp-day_button:hover {
    background: var(--color-primary-hover);
  }

  .rdp-day[data-disabled] .rdp-day_button {
    color: var(--color-border-strong);
    cursor: not-allowed;
  }

  .rdp-day[data-disabled] .rdp-day_button:hover {
    background: transparent;
  }

  /* Month/year dropdowns (for quickly reaching a far-off date, e.g. a
     date of birth): a visible label + chevron with the real <select>
     transparent on top so it still opens natively on click/keyboard. */
  .rdp-dropdowns {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .rdp-dropdown_root {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  .rdp-dropdown_root:hover .rdp-caption_label {
    color: var(--color-text);
  }

  .rdp-dropdown {
    position: absolute;
    inset: 0;
    width: 100%;
    opacity: 0;
    cursor: pointer;
  }

  .rdp-dropdown:focus-visible ~ .rdp-caption_label {
    box-shadow: var(--focus-ring);
    border-radius: var(--radius-sm);
  }

  .rdp-dropdown[data-disabled] {
    cursor: not-allowed;
  }
`;

export interface DatePickerProps {
  id?: string;
  name?: string;
  /** ISO date, "YYYY-MM-DD" — same shape as a native `<input type="date">`. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  /** ISO dates bounding the selectable/typeable range. */
  min?: string;
  max?: string;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-describedby"?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

function isInvalid(value: unknown) {
  return value === true || value === "true";
}

/**
 * Date of birth (and similar far-back dates) needs typing to stay the
 * primary path — nobody wants to click "previous month" 400 times — so the
 * text field is always interactive and authoritative; the calendar (with
 * month/year dropdowns for fast long-range navigation) is an assist opened
 * from its own button, never stealing focus on its own.
 */
export function DatePicker({
  id,
  name,
  value,
  defaultValue,
  onValueChange,
  placeholder = "YYYY-MM-DD",
  disabled,
  required,
  min,
  max,
  "aria-invalid": ariaInvalid,
  "aria-describedby": describedBy,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
}: DatePickerProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");
  const currentValue = isControlled ? (value ?? "") : internalValue;
  const [text, setText] = React.useState(currentValue);
  const [open, setOpen] = React.useState(false);

  const [syncedValue, setSyncedValue] = React.useState(currentValue);
  if (syncedValue !== currentValue) {
    setSyncedValue(currentValue);
    setText(currentValue);
  }

  const minDate = React.useMemo(() => parseISODate(min), [min]);
  const maxDate = React.useMemo(() => parseISODate(max), [max]);
  const selected = parseISODate(currentValue);
  const invalid = isInvalid(ariaInvalid);

  const disabledMatchers = React.useMemo(() => {
    const matchers: Matcher[] = [];
    if (minDate) matchers.push({ before: minDate });
    if (maxDate) matchers.push({ after: maxDate });
    return matchers.length ? matchers : undefined;
  }, [minDate, maxDate]);

  function commit(next: string) {
    if (!isControlled) setInternalValue(next);
    setSyncedValue(next);
    onValueChange?.(next);
  }

  function handleTextChange(raw: string) {
    setText(raw);
    if (raw.trim() === "") {
      commit("");
      return;
    }
    const parsed = parseISODate(raw);
    if (!parsed) return;
    if ((minDate && parsed < minDate) || (maxDate && parsed > maxDate)) return;
    commit(formatISODate(parsed));
  }

  function handleSelect(date: Date | undefined) {
    if (!date) return;
    const next = formatISODate(date);
    commit(next);
    setText(next);
    setOpen(false);
  }

  const reactId = React.useId();
  const controlId = id ?? reactId;
  const calendarRef = React.useRef<HTMLDivElement>(null);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <Wrapper>
        <TextField
          id={controlId}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          value={text}
          $invalid={invalid}
          aria-invalid={ariaInvalid}
          aria-describedby={describedBy}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          onChange={(e) => handleTextChange(e.target.value)}
        />
        <IconGroup>
          {invalid && (
            <ErrorSlot aria-hidden="true">
              <ErrorIcon />
            </ErrorSlot>
          )}
          <TriggerButton type="button" disabled={disabled} aria-label="Open calendar">
            <Icon icon={CalendarDays} size={16} />
          </TriggerButton>
        </IconGroup>
      </Wrapper>
      <PopoverPrimitive.Portal>
        <CalendarContent
          align="start"
          sideOffset={6}
          onOpenAutoFocus={(event) => {
            // Radix's default autofocus lands on the first focusable
            // descendant, which is the "previous month" nav button (it
            // comes before the day grid in DOM order) — not useful for
            // keyboard day navigation. Send focus to the day the grid
            // itself already tracks as the roving-tabindex target instead.
            event.preventDefault();
            calendarRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
          }}
        >
          <div ref={calendarRef}>
            <DayPicker
              mode="single"
              selected={selected}
              defaultMonth={selected ?? maxDate ?? new Date()}
              onSelect={handleSelect}
              captionLayout="dropdown"
              startMonth={minDate ?? new Date(new Date().getFullYear() - 120, 0)}
              endMonth={maxDate ?? new Date(new Date().getFullYear() + 20, 11)}
              disabled={disabledMatchers}
              showOutsideDays
            />
          </div>
        </CalendarContent>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
