"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";

/** A span of whole months, as "YYYY-MM". A single month has `from === to`. */
export interface MonthRange {
  from: string;
  to: string;
}

export interface MonthRangePickerProps {
  /** `null` means all time (only when `allTime` is on). */
  value: MonthRange | null;
  onValueChange: (value: MonthRange | null) => void;
  /** Earliest and latest pickable months, "YYYY-MM". Months outside are muted and disabled. */
  min?: string;
  max?: string;
  /** Adds an "All time" button under the months. */
  allTime?: boolean;
  /** "compact" is the height of a default Button, for beside buttons in a page header. */
  size?: "default" | "compact";
  id?: string;
  disabled?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

const short = new Intl.DateTimeFormat("en-US", { month: "short" });
const long = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

const toKey = (year: number, month: number) => `${year}-${String(month + 1).padStart(2, "0")}`;
const parse = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return { year: y, month: m - 1 };
};
const monthName = (key: string) => {
  const { year, month } = parse(key);
  return short.format(new Date(year, month, 1));
};

const YEAR_BLOCK = 12;
const blockStartOf = (year: number) => Math.floor(year / YEAR_BLOCK) * YEAR_BLOCK;

/** "Nov 2026", "Jan – Mar 2026", "Nov 2025 – Feb 2026", or "All time". */
export function formatMonthRange(value: MonthRange | null): string {
  if (!value) return "All time";
  const a = parse(value.from);
  const b = parse(value.to);
  if (value.from === value.to) return `${monthName(value.from)} ${a.year}`;
  if (a.year === b.year) return `${monthName(value.from)} – ${monthName(value.to)} ${b.year}`;
  return `${monthName(value.from)} ${a.year} – ${monthName(value.to)} ${b.year}`;
}

/* Looks like the kit's other pickers (Select, DateRulePicker): a 40px field, not a button. */
const Trigger = styled.button`
  all: unset;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  height: var(--control-height);
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: border-color var(--duration-fast) var(--ease-out);

  &[data-size="compact"] {
    height: 36px;
  }
  &:hover:not(:disabled) {
    border-color: var(--color-text-muted);
  }
  &:focus-visible {
    box-shadow: var(--focus-ring);
  }
  &:disabled {
    cursor: not-allowed;
    color: var(--color-text-muted);
    background: var(--color-disabled-bg);
  }

  & > span {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  & > svg {
    flex-shrink: 0;
    color: var(--color-text-muted);
  }
`;

const Panel = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

/* Same header as RangeCalendar: previous, the year, next. */
const Header = styled.div`
  display: grid;
  grid-template-columns: 28px 1fr 28px;
  align-items: center;
  height: 32px;
`;

const YearsLabel = styled.span`
  justify-self: center;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
`;

/* Same as RangeCalendar: the year is a button that zooms out to a block of years. */
const TitleButton = styled.button`
  all: unset;
  justify-self: center;
  padding: 0 var(--space-2);
  height: 28px;
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text);
  cursor: pointer;

  &:hover {
    background: var(--color-bg-hover);
  }
  &:focus-visible {
    box-shadow: var(--focus-ring);
  }
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
    box-shadow: var(--focus-ring);
  }
  &:disabled {
    cursor: default;
    opacity: 0.4;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  row-gap: var(--space-1);
`;

/* Rows exist for assistive tech only; the cells sit straight in the 3-column grid. */
const GridRow = styled.div`
  display: contents;
`;

/* The cell carries the band, like RangeCalendar: one shape, rounded only where the range ends on a row. */
const Cell = styled.div`
  display: flex;
  height: 40px;

  &[data-band="true"] {
    background: var(--color-range-band);
  }
  &[data-start="true"] {
    border-top-left-radius: var(--radius-md);
    border-bottom-left-radius: var(--radius-md);
  }
  &[data-end="true"] {
    border-top-right-radius: var(--radius-md);
    border-bottom-right-radius: var(--radius-md);
  }
`;

const MonthButton = styled.button`
  all: unset;
  position: relative;
  box-sizing: border-box;
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-text);
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--color-bg-hover);
  }
  &:focus:not(:focus-visible) {
    box-shadow: none;
  }
  &:focus-visible {
    box-shadow: var(--focus-ring);
  }
  &:disabled {
    cursor: default;
    color: var(--color-text-subtle);
  }

  /* This month: a dot, as RangeCalendar marks today. */
  &[data-now="true"]:not([data-edge])::after {
    content: "";
    position: absolute;
    bottom: 5px;
    width: 4px;
    height: 4px;
    border-radius: var(--radius-full);
    background: var(--color-text);
  }

  &[data-edge="true"],
  &[data-edge="true"]:hover {
    background: var(--color-primary);
    color: var(--color-on-primary);
    font-weight: var(--weight-medium);
  }
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-border);
`;

/**
 * Pick one month or a run of months, the way RangeCalendar picks days: click a month, then click another
 * to end the range (either order); clicking the same month twice picks just that month. The trigger shows
 * the range in words, so the picked state never rests on colour alone.
 */
export function MonthRangePicker({
  value,
  onValueChange,
  min,
  max,
  allTime = false,
  size = "default",
  id,
  disabled,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  "aria-describedby": ariaDescribedby,
}: MonthRangePickerProps) {
  const now = React.useMemo(() => {
    const d = new Date();
    return toKey(d.getFullYear(), d.getMonth());
  }, []);
  const [open, setOpen] = React.useState(false);
  const [year, setYear] = React.useState(() => parse(value?.to ?? max ?? now).year);
  const [anchor, setAnchor] = React.useState<string | null>(null);
  const [hover, setHover] = React.useState<string | null>(null);
  const [focusKey, setFocusKey] = React.useState(value?.to ?? max ?? now);
  const [level, setLevel] = React.useState<"month" | "year">("month");
  const [blockStart, setBlockStart] = React.useState(() => blockStartOf(parse(value?.to ?? max ?? now).year));
  const [focusYear, setFocusYear] = React.useState(() => parse(value?.to ?? max ?? now).year);
  const gridRef = React.useRef<HTMLDivElement>(null);
  const wantFocus = React.useRef(false);

  React.useEffect(() => {
    if (!wantFocus.current) return;
    wantFocus.current = false;
    const key = level === "month" ? focusKey : String(focusYear);
    gridRef.current?.querySelector<HTMLElement>(`[data-key="${key}"]`)?.focus();
  }, [focusKey, year, level, focusYear, blockStart]);

  const minYear = min ? parse(min).year : -Infinity;
  const maxYear = max ? parse(max).year : Infinity;
  const outside = (key: string) => (!!min && key < min) || (!!max && key > max);
  const yearOutside = (y: number) => y < minYear || y > maxYear;

  // While picking the end, the band follows the pointer from the first click.
  const shown: MonthRange | null =
    anchor !== null
      ? { from: [anchor, hover ?? anchor].sort()[0], to: [anchor, hover ?? anchor].sort()[1] }
      : value;

  function openChange(next: boolean) {
    setOpen(next);
    if (next) {
      const key = value?.to ?? max ?? now;
      setYear(parse(key).year);
      setFocusKey(key);
      setBlockStart(blockStartOf(parse(key).year));
      setFocusYear(parse(key).year);
    }
    setLevel("month");
    setAnchor(null);
    setHover(null);
  }

  function pick(key: string) {
    if (anchor === null) {
      setAnchor(key);
      onValueChange({ from: key, to: key });
      return;
    }
    const [from, to] = [anchor, key].sort();
    onValueChange({ from, to });
    setAnchor(null);
    setOpen(false);
  }

  function move(key: string, delta: number) {
    const { year: y, month: m } = parse(key);
    const d = new Date(y, m + delta, 1);
    const next = toKey(d.getFullYear(), d.getMonth());
    if (outside(next)) return;
    wantFocus.current = true;
    setFocusKey(next);
    setYear(d.getFullYear());
  }

  function zoomOut() {
    wantFocus.current = true;
    setBlockStart(blockStartOf(year));
    setFocusYear(year);
    setLevel("year");
  }

  function pickYear(y: number) {
    // Back to that year's months, on the same month as before when it can be picked.
    const sameMonth = toKey(y, parse(focusKey).month);
    const target = !outside(sameMonth) ? sameMonth : Array.from({ length: 12 }, (_, m) => toKey(y, m)).find((k) => !outside(k)) ?? sameMonth;
    wantFocus.current = true;
    setYear(y);
    setFocusKey(target);
    setLevel("month");
  }

  function moveYear(y: number, delta: number) {
    const next = y + delta;
    if (yearOutside(next)) return;
    wantFocus.current = true;
    setFocusYear(next);
    setBlockStart(blockStartOf(next));
  }

  function onYearKeyDown(event: React.KeyboardEvent, y: number) {
    const delta: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3, PageUp: -YEAR_BLOCK, PageDown: YEAR_BLOCK };
    if (event.key in delta) {
      event.preventDefault();
      moveYear(y, delta[event.key]);
    }
  }

  function onKeyDown(event: React.KeyboardEvent, key: string) {
    const delta: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3, PageUp: -12, PageDown: 12 };
    if (event.key in delta) {
      event.preventDefault();
      move(key, delta[event.key]);
    }
  }

  const text = formatMonthRange(value);
  const yearsTitle = `${blockStart} – ${blockStart + YEAR_BLOCK - 1}`;
  const yearTabStop =
    focusYear >= blockStart && focusYear < blockStart + YEAR_BLOCK && !yearOutside(focusYear)
      ? focusYear
      : Array.from({ length: YEAR_BLOCK }, (_, i) => blockStart + i).find((y) => !yearOutside(y));
  // The tab stop is the focused month, or else the first pickable month of the year shown.
  const tabStop =
    parse(focusKey).year === year && !outside(focusKey)
      ? focusKey
      : Array.from({ length: 12 }, (_, m) => toKey(year, m)).find((key) => !outside(key));

  return (
    <Popover open={open} onOpenChange={openChange}>
      <PopoverTrigger asChild>
        <Trigger
          type="button"
          id={id}
          data-size={size}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-label={ariaLabel ? `${ariaLabel}: ${text}` : undefined}
          aria-labelledby={ariaLabelledby}
          aria-describedby={ariaDescribedby}
        >
          <Icon icon={Calendar} />
          <span>{text}</span>
          <Icon icon={ChevronDown} />
        </Trigger>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        showClose={false}
        aria-label={ariaLabel ?? "Months"}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
        }}
      >
        <Panel>
          <Header>
            <NavButton
              type="button"
              aria-label={level === "month" ? "Previous year" : "Previous years"}
              disabled={level === "month" ? year <= minYear : blockStart <= minYear}
              onClick={() => (level === "month" ? setYear(year - 1) : setBlockStart(blockStart - YEAR_BLOCK))}
            >
              <Icon icon={ChevronLeft} size={16} />
            </NavButton>
            {level === "month" ? (
              <TitleButton type="button" aria-label={`${year}, choose year`} aria-live="polite" onClick={zoomOut}>
                {year}
              </TitleButton>
            ) : (
              <YearsLabel aria-live="polite">{yearsTitle}</YearsLabel>
            )}
            <NavButton
              type="button"
              aria-label={level === "month" ? "Next year" : "Next years"}
              disabled={level === "month" ? year >= maxYear : blockStart + YEAR_BLOCK > maxYear}
              onClick={() => (level === "month" ? setYear(year + 1) : setBlockStart(blockStart + YEAR_BLOCK))}
            >
              <Icon icon={ChevronRight} size={16} />
            </NavButton>
          </Header>
          {level === "year" ? (
            <Grid ref={gridRef} role="grid" aria-label={`${ariaLabel ?? "Months"}, years ${yearsTitle}`}>
              {Array.from({ length: 4 }, (_, row) => (
                <GridRow key={row} role="row">
                  {Array.from({ length: 3 }, (_, col) => {
                    const y = blockStart + row * 3 + col;
                    const inRange = (yy: number) => !!shown && yy >= parse(shown.from).year && yy <= parse(shown.to).year;
                    const band = inRange(y);
                    return (
                      <Cell
                        key={y}
                        role="gridcell"
                        aria-selected={band}
                        data-band={band}
                        data-start={band && (col === 0 || !inRange(y - 1))}
                        data-end={band && (col === 2 || !inRange(y + 1))}
                      >
                        <MonthButton
                          type="button"
                          data-key={y}
                          data-now={y === year}
                          disabled={yearOutside(y)}
                          tabIndex={y === yearTabStop ? 0 : -1}
                          aria-label={String(y)}
                          aria-current={y === year ? "true" : undefined}
                          onClick={() => pickYear(y)}
                          onFocus={() => setFocusYear(y)}
                          onKeyDown={(e) => onYearKeyDown(e, y)}
                        >
                          {y}
                        </MonthButton>
                      </Cell>
                    );
                  })}
                </GridRow>
              ))}
            </Grid>
          ) : (
            <Grid ref={gridRef} role="grid" aria-label={`${ariaLabel ?? "Months"}, ${year}`} onPointerLeave={() => setHover(null)}>
              {Array.from({ length: 4 }, (_, row) => (
                <GridRow key={row} role="row">
                  {Array.from({ length: 3 }, (_, col) => {
                    const m = row * 3 + col;
                    const key = toKey(year, m);
                    const band = !!shown && key >= shown.from && key <= shown.to;
                    const edge = !!shown && (key === shown.from || key === shown.to);
                    const prevIn = !!shown && col > 0 && toKey(year, m - 1) >= shown.from && toKey(year, m - 1) <= shown.to;
                    const nextIn = !!shown && col < 2 && toKey(year, m + 1) >= shown.from && toKey(year, m + 1) <= shown.to;
                    return (
                      <Cell key={key} role="gridcell" aria-selected={band} data-band={band} data-start={band && !prevIn} data-end={band && !nextIn}>
                        <MonthButton
                          type="button"
                          data-key={key}
                          data-edge={edge || undefined}
                          data-now={key === now}
                          disabled={outside(key)}
                          tabIndex={key === tabStop ? 0 : -1}
                          aria-label={long.format(new Date(year, m, 1))}
                          aria-current={key === now ? "date" : undefined}
                          onClick={() => pick(key)}
                          onPointerEnter={() => anchor !== null && setHover(key)}
                          onFocus={() => {
                            setFocusKey(key);
                            if (anchor !== null) setHover(key);
                          }}
                          onKeyDown={(e) => onKeyDown(e, key)}
                        >
                          {short.format(new Date(year, m, 1))}
                        </MonthButton>
                      </Cell>
                    );
                  })}
                </GridRow>
              ))}
            </Grid>
          )}
          {allTime && (
            <Footer>
              {allTime && (
                <Button
                  type="button"
                  $variant="ghost"
                  $size="sm"
                  aria-pressed={value === null}
                  onClick={() => {
                    onValueChange(null);
                    setOpen(false);
                  }}
                >
                  All time
                </Button>
              )}
            </Footer>
          )}
        </Panel>
      </PopoverContent>
    </Popover>
  );
}
