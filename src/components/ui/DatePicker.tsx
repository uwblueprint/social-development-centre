"use client";

import * as React from "react";
import { css, styled } from "next-yak";
import { Popover as PopoverPrimitive } from "radix-ui";
import { DayPicker, type Matcher } from "react-day-picker";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
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
/* Month/year range helpers, shared by the day grid's own navigation   */
/* and the custom month/year picker views below. A month or year only */
/* counts as "out of range" when it falls *entirely* outside min/max — */
/* if min/max lands mid-month (or mid-year), that month/year still has */
/* selectable days, so navigation to it stays enabled.                 */
/* ------------------------------------------------------------------ */

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function clampDate(date: Date, min?: Date, max?: Date): Date {
  if (min && date < min) return min;
  if (max && date > max) return max;
  return date;
}

function isMonthOutOfRange(year: number, month: number, min?: Date, max?: Date): boolean {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  if (min && end < monthStart(min)) return true;
  if (max && start > monthEnd(max)) return true;
  return false;
}

function isYearOutOfRange(year: number, min?: Date, max?: Date): boolean {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  if (min && end < monthStart(min)) return true;
  if (max && start > monthEnd(max)) return true;
  return false;
}

function isYearsPageOutOfRange(pageStart: number, min?: Date, max?: Date): boolean {
  const start = new Date(pageStart, 0, 1);
  const end = new Date(pageStart + YEARS_PER_PAGE - 1, 11, 31);
  if (min && end < monthStart(min)) return true;
  if (max && start > monthEnd(max)) return true;
  return false;
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
/* Calendar popover. A fixed content width keeps the popover from      */
/* resizing as it switches between the day grid and the month/year     */
/* picker views. No rules/dividers separate the header, grid and       */
/* footer — spacing alone does that job.                                */
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
`;

const CalendarBody = styled.div`
  width: 252px;

  .rdp-root {
    --rdp-day-width: 36px;
    --rdp-day-height: 36px;
    margin: 0;
  }

  .rdp-months,
  .rdp-month {
    margin: 0;
  }

  .rdp-weekdays {
    display: flex;
  }

  .rdp-weekday {
    width: 36px;
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
    width: 36px;
    height: 36px;
    padding: 0;
    text-align: center;
  }

  .rdp-day_button {
    all: unset;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: 36px;
    height: 36px;
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    line-height: var(--leading-ui);
    color: var(--color-text);
    cursor: pointer;
  }

  .rdp-day_button:hover {
    background: var(--color-bg-hover);
  }

  .rdp-day_button:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  /* Today: a subtle dot rather than a loud outline — dropped once the day
     is also selected, since the filled background already says enough. */
  .rdp-day[data-today] .rdp-day_button {
    font-weight: var(--weight-medium);
  }

  .rdp-day[data-today]:not([data-selected]) .rdp-day_button::after {
    content: "";
    position: absolute;
    bottom: 4px;
    width: 4px;
    height: 4px;
    border-radius: var(--radius-full);
    background: var(--color-primary);
  }

  .rdp-day[data-outside] .rdp-day_button {
    color: var(--color-text-subtle);
  }

  .rdp-day[data-outside] .rdp-day_button::after {
    display: none;
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
`;

/* ------------------------------------------------------------------ */
/* Header: shared by all three views (day grid, month grid, year grid).*/
/* The label doubles as a button that drills from "May 1990" down to a  */
/* month grid, then a year grid — the fast path to a birthdate that no  */
/* one wants to reach by clicking "previous month" 400 times. The nav    */
/* chevrons page whichever view is showing (month / year / 12-year page)*/
/* ------------------------------------------------------------------ */

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  height: 32px;
  margin-bottom: var(--space-2);
`;

const LabelButton = styled.button`
  all: unset;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  height: 28px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text);
  cursor: pointer;

  &:hover {
    background: var(--color-bg-hover);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

const StaticLabel = styled.span`
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 var(--space-2);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text);
`;

const NavGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
`;

const NavButton = styled.button`
  all: unset;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--color-bg-hover);
    color: var(--color-text);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

/* ------------------------------------------------------------------ */
/* Month/year grids: the same visual language as the day grid (36px    */
/* cells, --color-bg-hover on hover, --color-primary when selected),   */
/* with their own roving-tabindex arrow-key navigation.                */
/* ------------------------------------------------------------------ */

const GridWrap = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-1);
`;

const GridCell = styled.button<{ $selected?: boolean; $current?: boolean }>`
  all: unset;
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  font-weight: ${({ $current }) => ($current ? "var(--weight-medium)" : "var(--weight-regular)")};
  color: var(--color-text);
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--color-bg-hover);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  &:disabled {
    color: var(--color-border-strong);
    cursor: not-allowed;
  }

  ${({ $current, $selected }) =>
    $current &&
    !$selected &&
    css`
      &::after {
        content: "";
        position: absolute;
        bottom: 4px;
        width: 4px;
        height: 4px;
        border-radius: var(--radius-full);
        background: var(--color-primary);
      }
    `}

  ${({ $selected }) =>
    $selected &&
    css`
      background: var(--color-primary);
      color: var(--color-on-primary);

      &:hover:not(:disabled) {
        background: var(--color-primary-hover);
      }
    `}
`;

const TodayRow = styled.div`
  display: flex;
  justify-content: center;
  margin-top: var(--space-2);
`;

const TodayButton = styled.button`
  all: unset;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-text-muted);
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--color-bg-hover);
    color: var(--color-text);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

/* Roving-tabindex arrow-key navigation shared by the month and year
   grids: only the active cell is tab-stoppable, arrow keys move it
   (stepping over disabled cells), and it grabs DOM focus once, on
   mount — each grid is remounted fresh whenever the view switches to it. */
function useRovingGrid(itemCount: number, cols: number, initialIndex: number, isDisabled: (i: number) => boolean) {
  const [activeIndex, setActiveIndex] = React.useState(initialIndex);
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);

  React.useEffect(() => {
    refs.current[activeIndex]?.focus();
    // Runs once, when this grid mounts — it owns the initial focus hand-off.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent, index: number) => {
      let delta = 0;
      if (event.key === "ArrowRight") delta = 1;
      else if (event.key === "ArrowLeft") delta = -1;
      else if (event.key === "ArrowDown") delta = cols;
      else if (event.key === "ArrowUp") delta = -cols;
      else return;

      event.preventDefault();
      const dir = delta > 0 ? 1 : -1;
      let next = index + delta;
      while (next >= 0 && next < itemCount && isDisabled(next)) next += dir;
      if (next < 0 || next >= itemCount) return;
      setActiveIndex(next);
      refs.current[next]?.focus();
    },
    [cols, itemCount, isDisabled],
  );

  return { activeIndex, setActiveIndex, refs, handleKeyDown };
}

const MONTH_COLS = 4;
const YEAR_COLS = 4;
const YEARS_PER_PAGE = 12;

const monthShortFormat = new Intl.DateTimeFormat(undefined, { month: "short" });
const monthLongFormat = new Intl.DateTimeFormat(undefined, { month: "long" });

function MonthsGrid({
  year,
  selectedDate,
  todayDate,
  rangeStart,
  rangeEnd,
  onSelectMonth,
}: {
  year: number;
  selectedDate: Date | undefined;
  todayDate: Date;
  rangeStart: Date | undefined;
  rangeEnd: Date | undefined;
  onSelectMonth: (month: number) => void;
}) {
  const isDisabled = React.useCallback(
    (i: number) => isMonthOutOfRange(year, i, rangeStart, rangeEnd),
    [year, rangeStart, rangeEnd],
  );
  const initialIndex = React.useMemo(() => {
    if (selectedDate && selectedDate.getFullYear() === year) return selectedDate.getMonth();
    if (todayDate.getFullYear() === year) return todayDate.getMonth();
    return 0;
  }, [selectedDate, todayDate, year]);
  const { activeIndex, setActiveIndex, refs, handleKeyDown } = useRovingGrid(
    12,
    MONTH_COLS,
    initialIndex,
    isDisabled,
  );

  return (
    <GridWrap role="group" aria-label={`Months, ${year}`}>
      {Array.from({ length: 12 }, (_, i) => {
        const date = new Date(year, i, 1);
        const selected = !!selectedDate && selectedDate.getFullYear() === year && selectedDate.getMonth() === i;
        const current = todayDate.getFullYear() === year && todayDate.getMonth() === i;
        return (
          <GridCell
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            tabIndex={i === activeIndex ? 0 : -1}
            disabled={isDisabled(i)}
            $selected={selected}
            $current={current}
            aria-label={monthLongFormat.format(date) + " " + year}
            aria-current={current ? "date" : undefined}
            onFocus={() => setActiveIndex(i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onClick={() => onSelectMonth(i)}
          >
            {monthShortFormat.format(date)}
          </GridCell>
        );
      })}
    </GridWrap>
  );
}

function YearsGrid({
  pageStart,
  selectedDate,
  todayDate,
  rangeStart,
  rangeEnd,
  onSelectYear,
}: {
  pageStart: number;
  selectedDate: Date | undefined;
  todayDate: Date;
  rangeStart: Date | undefined;
  rangeEnd: Date | undefined;
  onSelectYear: (year: number) => void;
}) {
  const isDisabled = React.useCallback(
    (i: number) => isYearOutOfRange(pageStart + i, rangeStart, rangeEnd),
    [pageStart, rangeStart, rangeEnd],
  );
  const initialIndex = React.useMemo(() => {
    if (selectedDate) {
      const idx = selectedDate.getFullYear() - pageStart;
      if (idx >= 0 && idx < YEARS_PER_PAGE) return idx;
    }
    const todayIdx = todayDate.getFullYear() - pageStart;
    if (todayIdx >= 0 && todayIdx < YEARS_PER_PAGE) return todayIdx;
    return 0;
  }, [selectedDate, todayDate, pageStart]);
  const { activeIndex, setActiveIndex, refs, handleKeyDown } = useRovingGrid(
    YEARS_PER_PAGE,
    YEAR_COLS,
    initialIndex,
    isDisabled,
  );

  return (
    <GridWrap role="group" aria-label={`${pageStart}–${pageStart + YEARS_PER_PAGE - 1}`}>
      {Array.from({ length: YEARS_PER_PAGE }, (_, i) => {
        const year = pageStart + i;
        const selected = selectedDate?.getFullYear() === year;
        const current = todayDate.getFullYear() === year;
        return (
          <GridCell
            key={year}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            tabIndex={i === activeIndex ? 0 : -1}
            disabled={isDisabled(i)}
            $selected={selected}
            $current={current}
            aria-current={current ? "date" : undefined}
            onFocus={() => setActiveIndex(i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onClick={() => onSelectYear(year)}
          >
            {year}
          </GridCell>
        );
      })}
    </GridWrap>
  );
}

/* The day grid, wrapped so it can grab focus on mount the same way the
   month/year grids do (each is a distinct view, remounted when the
   header's chevrons/label switch back to it). */
function DaysView({
  selected,
  displayMonth,
  onMonthChange,
  onSelect,
  disabledMatchers,
  rangeStart,
  rangeEnd,
  containerRef,
}: {
  selected: Date | undefined;
  displayMonth: Date;
  onMonthChange: (month: Date) => void;
  onSelect: (date: Date | undefined) => void;
  disabledMatchers: Matcher[] | undefined;
  rangeStart: Date;
  rangeEnd: Date;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  React.useEffect(() => {
    containerRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DayPicker
      mode="single"
      selected={selected}
      month={displayMonth}
      onMonthChange={onMonthChange}
      onSelect={onSelect}
      components={{ Nav: () => <></>, MonthCaption: () => <></> }}
      startMonth={rangeStart}
      endMonth={rangeEnd}
      disabled={disabledMatchers}
      showOutsideDays
      formatters={{
        formatWeekdayName: (day) => day.toLocaleDateString(undefined, { weekday: "narrow" }),
      }}
    />
  );
}

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
 * text field is always interactive and authoritative; the calendar is an
 * assist opened from its own button, never stealing focus on its own. Its
 * header label drills from a day grid down to a month grid, then a year
 * grid, for fast long-range navigation to a birthdate.
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
  // Midnight, local time — comparable to minDate/maxDate/selected, which are
  // all parsed from ISO dates the same way (no time-of-day component).
  const today = React.useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const rangeStart = React.useMemo(
    () => minDate ?? new Date(today.getFullYear() - 120, 0, 1),
    [minDate, today],
  );
  const rangeEnd = React.useMemo(() => maxDate ?? new Date(today.getFullYear() + 20, 11, 31), [maxDate, today]);

  const disabledMatchers = React.useMemo(() => {
    const matchers: Matcher[] = [];
    if (minDate) matchers.push({ before: minDate });
    if (maxDate) matchers.push({ after: maxDate });
    return matchers.length ? matchers : undefined;
  }, [minDate, maxDate]);

  /* Which of the three views the popover currently shows, the month it's
     displaying (also the day grid's controlled `month`), and — only
     meaningful in the years view — the 12-year page's first year. */
  const [view, setView] = React.useState<"days" | "months" | "years">("days");
  const [displayMonth, setDisplayMonth] = React.useState(() => clampDate(selected ?? today, minDate, maxDate));
  const [yearsPageStart, setYearsPageStart] = React.useState(0);

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

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      // Every time it opens, start over at the day grid for whichever
      // date is currently selected (or today, absent a selection).
      setView("days");
      setDisplayMonth(clampDate(selected ?? today, minDate, maxDate));
    }
  }

  function handleLabelClick() {
    if (view === "days") {
      setView("months");
    } else if (view === "months") {
      setYearsPageStart(displayMonth.getFullYear() - 5);
      setView("years");
    }
  }

  function handlePrev() {
    if (view === "days") setDisplayMonth((d) => addMonths(d, -1));
    else if (view === "months") setDisplayMonth((d) => new Date(d.getFullYear() - 1, d.getMonth(), 1));
    else setYearsPageStart((p) => p - YEARS_PER_PAGE);
  }

  function handleNext() {
    if (view === "days") setDisplayMonth((d) => addMonths(d, 1));
    else if (view === "months") setDisplayMonth((d) => new Date(d.getFullYear() + 1, d.getMonth(), 1));
    else setYearsPageStart((p) => p + YEARS_PER_PAGE);
  }

  function selectMonth(month: number) {
    setDisplayMonth(new Date(displayMonth.getFullYear(), month, 1));
    setView("days");
  }

  function selectYear(year: number) {
    setDisplayMonth(new Date(year, displayMonth.getMonth(), 1));
    setView("months");
  }

  function goToToday() {
    setDisplayMonth(monthStart(clampDate(today, minDate, maxDate)));
    setView("days");
  }

  const todayDisabled = (minDate && today < minDate) || (maxDate && today > maxDate);

  const canGoPrev =
    view === "days"
      ? !isMonthOutOfRange(
          addMonths(displayMonth, -1).getFullYear(),
          addMonths(displayMonth, -1).getMonth(),
          minDate,
          maxDate,
        )
      : view === "months"
        ? !isYearOutOfRange(displayMonth.getFullYear() - 1, minDate, maxDate)
        : !isYearsPageOutOfRange(yearsPageStart - YEARS_PER_PAGE, minDate, maxDate);

  const canGoNext =
    view === "days"
      ? !isMonthOutOfRange(
          addMonths(displayMonth, 1).getFullYear(),
          addMonths(displayMonth, 1).getMonth(),
          minDate,
          maxDate,
        )
      : view === "months"
        ? !isYearOutOfRange(displayMonth.getFullYear() + 1, minDate, maxDate)
        : !isYearsPageOutOfRange(yearsPageStart + YEARS_PER_PAGE, minDate, maxDate);

  const headerLabel =
    view === "days"
      ? displayMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })
      : view === "months"
        ? String(displayMonth.getFullYear())
        : `${yearsPageStart}–${yearsPageStart + YEARS_PER_PAGE - 1}`;

  const reactId = React.useId();
  const controlId = id ?? reactId;
  const calendarRef = React.useRef<HTMLDivElement>(null);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
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
          align="end"
          sideOffset={6}
          onOpenAutoFocus={(event) => {
            // Radix's default autofocus lands on the first focusable
            // descendant, which is our header's month/year label — not
            // useful for keyboard day navigation. Send focus to the day
            // the grid itself already tracks as the roving-tabindex
            // target instead (each view's own mount effect does the
            // same hand-off later, when the header switches views).
            event.preventDefault();
            calendarRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
          }}
        >
          <CalendarBody ref={calendarRef}>
            <Header>
              {view === "years" ? (
                <StaticLabel>{headerLabel}</StaticLabel>
              ) : (
                <LabelButton type="button" onClick={handleLabelClick}>
                  {headerLabel}
                  <Icon icon={ChevronDown} size={14} />
                </LabelButton>
              )}
              <NavGroup>
                <NavButton type="button" aria-label="Previous" disabled={!canGoPrev} onClick={handlePrev}>
                  <Icon icon={ChevronLeft} size={16} />
                </NavButton>
                <NavButton type="button" aria-label="Next" disabled={!canGoNext} onClick={handleNext}>
                  <Icon icon={ChevronRight} size={16} />
                </NavButton>
              </NavGroup>
            </Header>

            {view === "days" && (
              <DaysView
                selected={selected}
                displayMonth={displayMonth}
                onMonthChange={setDisplayMonth}
                onSelect={handleSelect}
                disabledMatchers={disabledMatchers}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                containerRef={calendarRef}
              />
            )}
            {view === "months" && (
              <MonthsGrid
                year={displayMonth.getFullYear()}
                selectedDate={selected}
                todayDate={today}
                rangeStart={minDate}
                rangeEnd={maxDate}
                onSelectMonth={selectMonth}
              />
            )}
            {view === "years" && (
              <YearsGrid
                pageStart={yearsPageStart}
                selectedDate={selected}
                todayDate={today}
                rangeStart={minDate}
                rangeEnd={maxDate}
                onSelectYear={selectYear}
              />
            )}

            <TodayRow>
              <TodayButton type="button" disabled={!!todayDisabled} onClick={goToToday}>
                Today
              </TodayButton>
            </TodayRow>
          </CalendarBody>
        </CalendarContent>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
