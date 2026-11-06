"use client";

import * as React from "react";
import { keyframes, styled } from "next-yak";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Icon } from "./Icon";
import { Input } from "./Input";
import { formatISODate, parseISODate } from "./DatePicker";
import { parseTypedDate } from "./dateText";

export type RangeCalendarMode = "before" | "after" | "between";

/** ISO dates ("YYYY-MM-DD"). "before" and "after" use `from` only. */
export interface RangeCalendarValue {
  from?: string;
  to?: string;
}

export interface RangeCalendarProps {
  mode: RangeCalendarMode;
  value: RangeCalendarValue;
  onValueChange: (value: RangeCalendarValue) => void;
  /** Accessible name for the grid. */
  "aria-label"?: string;
}

const fade = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const Root = styled.div`
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const Fields = styled.div`
  display: flex;
  gap: var(--space-2);

  & > span {
    flex: 1 1 0;
    min-width: 0;
  }

  & input {
    height: 32px;
    padding: 0 var(--space-2);
  }

  /* Active = the end being picked next, or an input with mouse focus: a darker 1px border. */
  & input[data-active="true"]:not(:focus) {
    border-color: var(--color-text);
  }

  /* Mouse focus shows the active style only; the kit ring is for keyboard focus (arrived by Tab). */
  &:not([data-keyboard]) input:focus,
  &:not([data-keyboard]) input:focus-visible {
    border-color: var(--color-text);
    box-shadow: none;
  }
`;

const Header = styled.div`
  display: grid;
  grid-template-columns: 28px 1fr 28px;
  align-items: center;
  gap: var(--space-1);
  height: 32px;
`;

const YearsLabel = styled.span`
  justify-self: center;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text);
`;

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
    outline: none;
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

  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

const Body = styled.div`
  animation: ${fade} var(--duration) var(--ease);
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 40px);
`;

const Weekday = styled.div`
  height: 28px;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  text-align: center;
  line-height: 28px;
`;

/* The cell carries the band. A corner is rounded only when no in-range neighbour touches it, so the band reads as one shape across rows. */
const Cell = styled.div`
  width: 40px;
  height: 40px;

  &[data-band="true"] {
    background: var(--color-range-band);
  }

  &[data-tl="true"] {
    border-top-left-radius: var(--radius-md);
  }

  &[data-tr="true"] {
    border-top-right-radius: var(--radius-md);
  }

  &[data-bl="true"] {
    border-bottom-left-radius: var(--radius-md);
  }

  &[data-br="true"] {
    border-bottom-right-radius: var(--radius-md);
  }
`;

const DayButton = styled.button`
  all: unset;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text);
  cursor: pointer;

  &:hover {
    background: var(--color-bg-hover);
  }

  &:focus:not(:focus-visible) {
    outline: none;
    box-shadow: none;
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  &[data-outside="true"] {
    color: var(--color-text-subtle);
  }

  &[data-today="true"] {
    font-weight: var(--weight-medium);
  }

  &[data-today="true"]:not([data-edge])::after {
    content: "";
    position: absolute;
    bottom: 5px;
    width: 4px;
    height: 4px;
    border-radius: var(--radius-full);
    background: var(--color-text);
  }

  &[data-edge="true"] {
    background: var(--color-primary);
    color: var(--color-on-primary);
    font-weight: var(--weight-medium);
  }

  &[data-edge="true"]:hover {
    background: var(--color-primary);
  }
`;

/* Months or years: 12 cells sized to the same height as the day grid. */
const PickGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(4, 1fr);
  height: 268px;
  padding-top: var(--space-1);
`;

const PickCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PickButton = styled.button`
  all: unset;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 72px;
  height: 40px;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-text);
  cursor: pointer;

  &:hover {
    background: var(--color-bg-hover);
  }

  &:focus:not(:focus-visible) {
    outline: none;
    box-shadow: none;
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  &[data-viewed="true"]::after {
    content: "";
    position: absolute;
    bottom: 5px;
    width: 4px;
    height: 4px;
    border-radius: var(--radius-full);
    background: var(--color-text);
  }
`;

const weekdayShort = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const weekdayLong = new Intl.DateTimeFormat("en-US", { weekday: "long" });
const monthFormat = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });
const monthLongFormat = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const monthNameShort = new Intl.DateTimeFormat("en-US", { month: "short" });
const fieldFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const dayLabelFormat = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

function addDays(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta);
}

type Level = "day" | "month" | "year";
type FieldName = "start" | "end";

const YEAR_BLOCK = 12;
const blockStartOf = (year: number) => Math.floor(year / YEAR_BLOCK) * YEAR_BLOCK;

/**
 * A month calendar for picking the edge(s) of a date rule. "between" takes two clicks (start, then end);
 * "after" and "before" take one and tint every visible day on that side. The band is a light fill, the
 * picked ends are stronger (the end is solid), every day in it is exposed as selected to assistive tech,
 * and the date inputs above the grid state the dates in text, so color is never the only signal.
 * Clicking the title zooms out to months, then years; the picked dates are kept at every level.
 */
export function RangeCalendar({ mode, value, onValueChange, "aria-label": ariaLabel = "Calendar" }: RangeCalendarProps) {
  const today = React.useMemo(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);
  const rawFrom = parseISODate(value.from);
  const rawTo = mode === "between" ? parseISODate(value.to) : undefined;
  // Entered back to front still reads as one range.
  const [from, to] = rawFrom && rawTo && rawTo < rawFrom ? [rawTo, rawFrom] : [rawFrom, rawTo];

  const [month, setMonth] = React.useState(() => {
    const d = from ?? today;
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [focusDate, setFocusDate] = React.useState<Date>(() => from ?? today);
  const [level, setLevel] = React.useState<Level>("day");
  const [browseYear, setBrowseYear] = React.useState(month.getFullYear());
  const [blockStart, setBlockStart] = React.useState(blockStartOf(month.getFullYear()));
  const [pickIndex, setPickIndex] = React.useState(0);
  const [draft, setDraft] = React.useState<{ field: FieldName; text: string } | null>(null);
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const wantFocus = React.useRef(false);

  // On open, focus lands in the grid (not an input) so arrow keys work and screen readers enter the calendar.
  React.useEffect(() => {
    const t = window.setTimeout(() => {
      const el = bodyRef.current?.querySelector<HTMLElement>('[tabindex="0"]');
      if (el && !document.activeElement?.closest("input")) el.focus({ preventScroll: true });
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  React.useEffect(() => {
    if (!wantFocus.current) return;
    wantFocus.current = false;
    const body = bodyRef.current;
    if (!body) return;
    const target =
      level === "day"
        ? body.querySelector<HTMLElement>(`[data-date="${formatISODate(focusDate)}"]`)
        : body.querySelector<HTMLElement>(`[data-index="${pickIndex}"]`);
    target?.focus();
  }, [focusDate, month, level, pickIndex, browseYear, blockStart]);

  // Six weeks starting on Monday, with the neighbouring months' days filling the ends.
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = addDays(first, -((first.getDay() + 6) % 7));
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const weeks = Array.from({ length: 6 }, (_, i) => days.slice(i * 7, i * 7 + 7));
  const tabStop = days.find((d) => d.getTime() === focusDate.getTime()) ?? first;

  function pick(date: Date) {
    const iso = formatISODate(date);
    if (mode !== "between") {
      onValueChange({ from: iso });
    } else if (rawFrom && !rawTo) {
      // Second click: the earlier date is the start, whichever was clicked first.
      onValueChange(date < rawFrom ? { from: iso, to: value.from } : { from: value.from, to: iso });
    } else {
      onValueChange({ from: iso, to: "" });
    }
    setFocusDate(date);
  }

  function showDate(date: Date) {
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setFocusDate(date);
    setLevel("day");
  }

  function moveFocus(date: Date) {
    wantFocus.current = true;
    setFocusDate(date);
    if (date.getMonth() !== month.getMonth() || date.getFullYear() !== month.getFullYear()) {
      setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }

  function onKeyDown(event: React.KeyboardEvent, date: Date) {
    const step: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (event.key in step) {
      event.preventDefault();
      moveFocus(addDays(date, step[event.key]));
    } else if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      const delta = event.key === "PageUp" ? -1 : 1;
      const lastDay = new Date(date.getFullYear(), date.getMonth() + delta + 1, 0).getDate();
      moveFocus(new Date(date.getFullYear(), date.getMonth() + delta, Math.min(date.getDate(), lastDay)));
    }
  }

  function inBand(date: Date) {
    const t = date.getTime();
    if (mode === "between") return !!from && !!to && t >= from.getTime() && t <= to.getTime();
    if (!from) return false;
    return mode === "after" ? t >= from.getTime() : t <= from.getTime();
  }

  // Both ends of a range (or the one picked date) are solid chips; days between them use the band.
  function isSolid(date: Date) {
    const t = date.getTime();
    return t === from?.getTime() || (mode === "between" && t === to?.getTime());
  }

  // The inputs show the dates; the one being edited shows what is typed.
  const fieldText = (d?: Date) => (d ? fieldFormat.format(d) : "");
  function commit(field: FieldName) {
    if (draft?.field !== field) return;
    const date = parseTypedDate(draft.text);
    setDraft(null);
    if (!date) return; // Invalid text reverts without a message.
    const iso = formatISODate(date);
    if (mode !== "between") onValueChange({ from: iso });
    else if (field === "start") onValueChange({ from: iso, to: rawTo ? value.to : "" });
    else onValueChange({ from: rawFrom ? value.from : iso, to: iso });
    showDate(date);
  }
  const activeField: FieldName = draft?.field ?? (mode === "between" && rawFrom && !rawTo ? "end" : "start");
  // Where the caret sat after the last click on an already-focused input, so a double-click can put it back.
  function inputProps(field: FieldName, d: Date | undefined, name: string) {
    return {
      "data-active": activeField === field,
      "aria-label": name,
      placeholder: "Pick a date",
      autoComplete: "off",
      value: draft?.field === field ? draft.text : fieldText(d),
      onFocus: () => {
        setDraft({ field, text: fieldText(d) });
      },
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setDraft({ field, text: e.target.value }),
      onBlur: () => {
        commit(field);
      },
      onMouseDown: (e: React.MouseEvent<HTMLInputElement>) => {
        const input = e.currentTarget;
        if (document.activeElement === input) {
          delete input.dataset.caret; // Already focused: the browser places the caret.
          return;
        }
        // First click: focus and select everything, so typing replaces the date.
        e.preventDefault();
        input.focus();
        input.select();
      },
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit(field);
        }
      },
    };
  }

  // Zoom levels: the day grid, the 12 months of a year, a block of 12 years.
  function zoomOut() {
    if (level === "day") {
      setBrowseYear(month.getFullYear());
      setPickIndex(month.getMonth());
      setLevel("month");
    } else if (level === "month") {
      setBlockStart(blockStartOf(browseYear));
      setPickIndex(browseYear - blockStartOf(browseYear));
      setLevel("year");
    }
  }

  function step(delta: number) {
    if (level === "day") setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));
    else if (level === "month") setBrowseYear(browseYear + delta);
    else setBlockStart(blockStart + delta * YEAR_BLOCK);
  }

  function choose(index: number, viaKeyboard: boolean) {
    wantFocus.current = viaKeyboard;
    if (level === "year") {
      const year = blockStart + index;
      setBrowseYear(year);
      setPickIndex(month.getFullYear() === year ? month.getMonth() : 0);
      setLevel("month");
    } else {
      const lastDay = new Date(browseYear, index + 1, 0).getDate();
      showDate(new Date(browseYear, index, Math.min(focusDate.getDate(), lastDay)));
    }
  }

  function onPickKeyDown(event: React.KeyboardEvent, index: number) {
    const delta: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 };
    if (event.key in delta) {
      event.preventDefault();
      const next = index + delta[event.key];
      if (next >= 0 && next < 12) {
        wantFocus.current = true;
        setPickIndex(next);
      }
    } else if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      step(event.key === "PageUp" ? -1 : 1);
    }
  }

  const yearsTitle = `${blockStart} – ${blockStart + YEAR_BLOCK - 1}`;
  const stepName = { day: "month", month: "year", year: "years" }[level];
  const title = level === "day" ? monthFormat.format(month) : String(browseYear);

  return (
    <Root>
      <Fields
        onPointerDownCapture={(e) => e.currentTarget.removeAttribute("data-keyboard")}
        onKeyDownCapture={(e) => {
          if (e.key === "Tab") e.currentTarget.setAttribute("data-keyboard", "");
        }}
      >
        <Input {...inputProps("start", from, mode === "between" ? "Start date" : "Date")} />
        {mode === "between" && <Input {...inputProps("end", to, "End date")} />}
      </Fields>
      <div>
        <Header>
          <NavButton type="button" aria-label={`Previous ${stepName}`} onClick={() => step(-1)}>
            <Icon icon={ChevronLeft} size={16} />
          </NavButton>
          {level === "year" ? (
            <YearsLabel aria-live="polite">{yearsTitle}</YearsLabel>
          ) : (
            <TitleButton
              type="button"
              aria-label={`${title}, ${level === "day" ? "choose month" : "choose year"}`}
              onClick={zoomOut}
            >
              {title}
            </TitleButton>
          )}
          <NavButton type="button" aria-label={`Next ${stepName}`} onClick={() => step(1)}>
            <Icon icon={ChevronRight} size={16} />
          </NavButton>
        </Header>
        <Body key={level} ref={bodyRef}>
          {level === "day" ? (
            <div role="grid" aria-label={`${ariaLabel}, ${monthLongFormat.format(month)}`}>
              <Row role="row">
                {weeks[0].map((d, i) => (
                  <Weekday key={i} role="columnheader" aria-label={weekdayLong.format(d)}>
                    {weekdayShort.format(d).slice(0, 2)}
                  </Weekday>
                ))}
              </Row>
              {weeks.map((week, w) => (
                <Row key={w} role="row">
                  {week.map((date, i) => {
                    const band = inBand(date);
                    const up = w > 0 && inBand(days[(w - 1) * 7 + i]);
                    const down = w < 5 && inBand(days[(w + 1) * 7 + i]);
                    const left = i > 0 && inBand(days[w * 7 + i - 1]);
                    const right = i < 6 && inBand(days[w * 7 + i + 1]);
                    const solid = isSolid(date);
                                    const isToday = date.getTime() === today.getTime();
                    return (
                      <Cell
                        key={i}
                        role="gridcell"
                        aria-selected={band || solid}
                        data-band={band}
                        data-tl={!up && !left}
                        data-tr={!up && !right}
                        data-bl={!down && !left}
                        data-br={!down && !right}
                      >
                        <DayButton
                          type="button"
                          data-date={formatISODate(date)}
                          data-edge={solid || undefined}
                          data-today={isToday}
                          data-outside={date.getMonth() !== month.getMonth()}
                          tabIndex={date.getTime() === tabStop.getTime() ? 0 : -1}
                          aria-label={dayLabelFormat.format(date)}
                          aria-current={isToday ? "date" : undefined}
                          onClick={() => pick(date)}
                          onFocus={() => setFocusDate(date)}
                          onKeyDown={(e) => onKeyDown(e, date)}
                        >
                          {date.getDate()}
                        </DayButton>
                      </Cell>
                    );
                  })}
                </Row>
              ))}
            </div>
          ) : (
            <PickGrid
              role="grid"
              aria-label={level === "month" ? `${ariaLabel}, months of ${browseYear}` : `${ariaLabel}, years ${yearsTitle}`}
            >
              {Array.from({ length: 12 }, (_, i) => {
                const isMonths = level === "month";
                const year = blockStart + i;
                const viewed = isMonths ? browseYear === month.getFullYear() && i === month.getMonth() : year === month.getFullYear();
                const label = isMonths ? monthNameShort.format(new Date(browseYear, i, 1)) : String(year);
                const full = isMonths ? monthLongFormat.format(new Date(browseYear, i, 1)) : String(year);
                return (
                  <PickCell key={i} role="gridcell" aria-current={viewed ? "true" : undefined}>
                    <PickButton
                      type="button"
                      data-index={i}
                      data-viewed={viewed}
                      tabIndex={i === pickIndex ? 0 : -1}
                      aria-label={full}
                      onFocus={() => setPickIndex(i)}
                      onClick={(e) => choose(i, e.detail === 0)}
                      onKeyDown={(e) => onPickKeyDown(e, i)}
                    >
                      {label}
                    </PickButton>
                  </PickCell>
                );
              })}
            </PickGrid>
          )}
        </Body>
      </div>
    </Root>
  );
}
