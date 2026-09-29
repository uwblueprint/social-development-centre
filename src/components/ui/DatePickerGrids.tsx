"use client";

import * as React from "react";
import { css, styled } from "next-yak";
import { DayPicker, type Matcher } from "react-day-picker";
import { isMonthOutOfRange, isYearOutOfRange, YEARS_PER_PAGE } from "./isoDate";

/*
 * The calendar's three views (days, months, years). The month and year grids share the day grid's look
 * (36px cells, hover and selected colors) and their own roving-tabindex arrow-key navigation.
 */

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

/* Roving-tabindex arrow-key navigation shared by the month and year
   grids: only the active cell is tab-stoppable, arrow keys move it
   (stepping over disabled cells), and it grabs DOM focus once, on
   mount — each grid is remounted fresh whenever the view switches to it. */
function useRovingGrid(itemCount: number, cols: number, initialIndex: number, isDisabled: (i: number) => boolean) {
  const [activeIndex, setActiveIndex] = React.useState(initialIndex);
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const focusActiveCell = React.useEffectEvent(() => {
    refs.current[activeIndex]?.focus();
    // Runs once, when this grid mounts — it owns the initial focus hand-off.
  });
  React.useEffect(() => {
    focusActiveCell();
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

const monthShortFormat = new Intl.DateTimeFormat(undefined, { month: "short" });
const monthLongFormat = new Intl.DateTimeFormat(undefined, { month: "long" });

export function MonthsGrid({
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

export function YearsGrid({
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
export function DaysView({
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
  const focusFirstDay = React.useEffectEvent(() => {
    containerRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
  });
  React.useEffect(() => {
    focusFirstDay();
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
