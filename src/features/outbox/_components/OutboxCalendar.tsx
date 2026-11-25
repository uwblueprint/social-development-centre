"use client";

/*
 * Keyboard: the calendar is a grid with ONE tab stop (the day you last used, else the picked day, else
 * today, else the first day with emails). Days with nothing to show and the muted filler are skipped.
 *
 *   Left / Right        previous / next day that has emails ("Earlier" comes first)
 *   Up / Down           same weekday a week earlier / later; Down from "Earlier" goes to the first day,
 *                       Up from the first row goes to "Earlier"
 *   Home / End          first / last day in the week; Ctrl+Home / Ctrl+End first / last in the grid
 *   Enter or Space      pick the day (the list shows it in All, or in the tab that holds its problems)
 *   e                   step into the day's automatic emails (Tab does not: they are not tab stops)
 *   in the emails:
 *     Up / Down, Home / End   move between them
 *     Enter                   filter the list to that template; Enter again lifts it (a click)
 *     Shift+Enter or o        open the automatic email in a new tab (the double-click)
 *     Escape                  back to the day
 *   Tab / Shift+Tab     leave the grid; Shift+Tab from an email reaches its day
 *
 * ARIA: role="grid" with rows, column headers and gridcells; aria-selected marks the picked day,
 * aria-current="date" today. Rings show for keyboard focus only (:focus-visible). The calendar never
 * sets hoverDay: that comes from the list's rows.
 */

import * as React from "react";
import { styled } from "next-yak";
import { LAST_DAY, shortWeekdays, todayDate, type Send, type TemplateKey } from "../_data";
import { dayEntries, dayIndex, earlierEntries, groupSendsByDay, rangeWeeks } from "../_calendar";
import type { PanelMode } from "../_types";
import { useOutboxData } from "../_outboxData";
import { CalendarDay } from "./CalendarDay";
import { CalendarState } from "./CalendarState";
import { OutboxIntro } from "./OutboxIntro";
import { MarqueeOverlay } from "./MarqueeOverlay";
import { touches, useMarquee } from "./useMarquee";

/* Interactive text: dragging across the calendar shouldn't select it. */
const Section = styled.section`
  -webkit-user-select: none;
  user-select: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;

  @media (min-width: 900px) {
    flex: 1;
  }
`;

/* The calendar's name for screen readers and the skip link's target: there for them, not drawn on the page. */
const Title = styled.h2`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

const Grid = styled.div`
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  @media (min-width: 900px) {
    flex: 1;
  }
`;

/* Holds the grid and, when the Outbox is empty, the intro card over it. */
const GridArea = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;

  @media (min-width: 900px) {
    flex: 1;
  }
`;

const Week = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));

  & + & {
    border-top: 1px solid var(--color-border);
  }
`;

/* A week of days: never shorter than the minimum; on desktop the weeks share the height left over equally. */
const DayWeek = styled(Week)`
  min-height: var(--calendar-day-min-height);

  @media (min-width: 900px) {
    flex: 1 0 var(--calendar-day-min-height);
  }
`;

const Weekday = styled.div`
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-text-muted);
  background: var(--color-surface);

  /* The full name is in the title; no dotted underline on every column. */
  & abbr {
    text-decoration: none;
  }
`;

interface OutboxCalendarProps {
  sends: Send[];
  pickedDay: number | null;
  /** The day of the list row the pointer or focus is on. */
  hoverDay: number | null;
  /** State lab: today's send has already gone out. */
  afterSend: boolean;
  /** State lab: the date "today" falls on; the calendar lays out from it. Defaults to the demo's today. */
  today?: Date;
  activeTemplates: Set<TemplateKey>;
  onPickDay: (day: number, tab: PanelMode) => void;
  onFilterTemplate: (key: TemplateKey, tab: PanelMode) => void;
  onOpenTemplate: (key: TemplateKey) => void;
  /** `${day}:${template}` of entries that just went from "to review" to scheduled. */
  settling?: ReadonlySet<string>;
  /** Loading or couldn't load swap the grid for a placeholder or an error under the same title. */
  status?: "ready" | "loading" | "failed";
  /** Loading has gone on longer than expected. */
  takingLonger?: boolean;
  onRetry?: () => void;
  /** Days picked with a box (the list is filtered to them): they show as picked. */
  filterDays?: ReadonlySet<number>;
  /** A box drawn over the calendar picked these days. */
  onPickDays?: (days: number[]) => void;
}

const NO_DAYS: ReadonlySet<number> = new Set();

export function OutboxCalendar({
  sends,
  pickedDay,
  hoverDay,
  afterSend,
  today = todayDate(),
  activeTemplates,
  onPickDay,
  onFilterTemplate,
  onOpenTemplate,
  settling,
  status = "ready",
  takingLonger = false,
  onRetry = () => {},
  filterDays = NO_DAYS,
  onPickDays = () => {},
}: OutboxCalendarProps) {
  const byDay = React.useMemo(() => groupSendsByDay(sends), [sends]);
  const { templates } = useOutboxData();
  const earlier = React.useMemo(() => earlierEntries(sends, templates), [sends, templates]);
  const weeks = React.useMemo(() => rangeWeeks(today), [today]);

  // Drag a box over the calendar to pick the days it touches: they light up as you go, and letting go filters
  // the list (in All) to them. Starts only inside the grid; anywhere else a box picks list rows (RecipientsPanel).
  const [boxDays, setBoxDays] = React.useState<ReadonlySet<number> | null>(null);
  const marqueeBox = useMarquee({
    enabled: status === "ready" && sends.length > 0,
    canStart: (target) => !!target.closest("[data-cal-grid]"),
    onBox: (box, done) => {
      const days = new Set<number>();
      for (const cell of gridRef.current?.querySelectorAll<HTMLElement>("[data-day]") ?? []) {
        if (touches(cell.getBoundingClientRect(), box)) days.add(Number(cell.dataset.day));
      }
      if (done) {
        setBoxDays(null);
        if (days.size > 0) onPickDays([...days]);
      } else setBoxDays(days);
    },
  });
  const shownDays = boxDays ?? filterDays;

  // Roving focus. Stops are keyed by day: "Earlier" uses its own (negative) day, the rest their day number.
  const [activeDay, setActiveDay] = React.useState<number | null>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);
  const dayData = (day: number) => dayEntries(byDay.get(day) ?? [], day, afterSend, templates);
  const hasEarlierEntries = earlier.entries.length > 0;
  const stops: number[] = [];
  if (hasEarlierEntries) stops.push(earlier.day);
  for (let d = 0; d <= LAST_DAY; d++) {
    const { entries, sent } = dayData(d);
    if (entries.length > 0 || sent > 0) stops.push(d);
  }
  const stopDay =
    activeDay !== null && stops.includes(activeDay)
      ? activeDay
      : pickedDay !== null && stops.includes(pickedDay)
        ? pickedDay
        : stops.includes(0)
          ? 0
          : (stops[0] ?? null);

  const focusDay = (day: number) => gridRef.current?.querySelector<HTMLElement>(`[data-cal-day="${day}"]`)?.focus();

  const onGridKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (e.altKey || e.metaKey) return;
    const entryKey = target.dataset.calEntry;
    if (entryKey) {
      const cell = target.closest<HTMLElement>('[role="gridcell"]');
      const entries = Array.from(cell?.querySelectorAll<HTMLElement>("[data-cal-entry]") ?? []);
      const at = entries.indexOf(target);
      if (e.key === "Escape") {
        e.preventDefault();
        cell?.querySelector<HTMLElement>("[data-cal-day]")?.focus();
      } else if ((e.key === "Enter" && e.shiftKey) || e.key === "o") {
        // Enter would click (toggle the filter); the shifted one is the double-click's keyboard twin.
        e.preventDefault();
        onOpenTemplate(entryKey as TemplateKey);
      } else if (!e.ctrlKey && !e.shiftKey && ["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
        e.preventDefault();
        const next = e.key === "ArrowDown" ? at + 1 : e.key === "ArrowUp" ? at - 1 : e.key === "Home" ? 0 : entries.length - 1;
        entries[Math.max(0, Math.min(next, entries.length - 1))]?.focus();
      }
      return;
    }
    const dayAttr = target.dataset.calDay;
    if (dayAttr === undefined || e.shiftKey) return;
    const day = Number(dayAttr);
    const at = stops.indexOf(day);
    const weekOf = (d: number) => Math.floor((d + today.getDay()) / 7);
    let next: number | undefined;
    if (e.key === "e" && !e.ctrlKey) {
      e.preventDefault();
      target.closest<HTMLElement>('[role="gridcell"]')?.querySelector<HTMLElement>("[data-cal-entry]")?.focus();
      return;
    } else if (e.key === "ArrowRight") next = stops[at + 1];
    else if (e.key === "ArrowLeft") next = stops[at - 1];
    else if (e.key === "ArrowDown") {
      next = day < 0 ? stops.find((d) => d >= 0) : undefined;
      for (let d = day + 7; day >= 0 && d <= LAST_DAY && next === undefined; d += 7) if (stops.includes(d)) next = d;
    } else if (e.key === "ArrowUp" && day >= 0) {
      for (let d = day - 7; d >= 0 && next === undefined; d -= 7) if (stops.includes(d)) next = d;
      if (next === undefined && hasEarlierEntries) next = earlier.day;
    } else if (e.key === "Home" || e.key === "End") {
      const group = e.ctrlKey ? stops : stops.filter((d) => d >= 0 && day >= 0 && weekOf(d) === weekOf(day));
      next = e.key === "Home" ? group[0] : group[group.length - 1];
    } else return;
    e.preventDefault();
    if (next !== undefined) focusDay(next);
  };

  if (status !== "ready") {
    return (
      <Section aria-labelledby="outbox-calendar-title">
        <Title id="outbox-calendar-title" tabIndex={-1}>Scheduled</Title>
        <CalendarState state={status} takingLonger={takingLonger} onRetry={onRetry} />
      </Section>
    );
  }

  const lead = weeks[0].filter((d) => dayIndex(d, today) < 0).length;
  const hasEarlier = earlier.entries.length > 0;
  const earlierCell = (span: number) => (
    <CalendarDay
      variant="earlier"
      date={weeks[0][0]}
      day={earlier.day}
      span={span}
      entries={earlier.entries}
      sent={0}
      picked={(pickedDay !== null && pickedDay < 0) || [...shownDays].some((d) => d < 0)}
      hovered={hoverDay !== null && hoverDay < 0}
      activeTemplates={activeTemplates}
      tabStop={stopDay === earlier.day}
      onStopFocus={() => setActiveDay(earlier.day)}
      onPick={(tab) => onPickDay(earlier.day, tab)}
      onFilterTemplate={onFilterTemplate}
      onOpenTemplate={onOpenTemplate}
      settling={settling}
    />
  );

  return (
    <Section aria-labelledby="outbox-calendar-title">
      <Title id="outbox-calendar-title" tabIndex={-1}>Scheduled</Title>

      <GridArea>
      <Grid
        ref={gridRef}
        data-cal-grid=""
        role="grid"
        aria-label={`Scheduled, next ${LAST_DAY} days`}
        // Empty, the grid is the backdrop for the intro: nothing in it to reach or read.
        aria-hidden={sends.length === 0 || undefined}
        inert={sends.length === 0 || undefined}
        onKeyDown={onGridKeyDown}
      >
        <Week role="row">
          {shortWeekdays.map((w) => (
            <Weekday key={w.full} role="columnheader">
              <abbr title={w.full}>{w.short}</abbr>
            </Weekday>
          ))}
        </Week>
        {lead === 0 && hasEarlier && <Week role="row">{earlierCell(7)}</Week>}
        {weeks.map((days, w) => (
          <DayWeek key={days[0].toISOString()} role="row">
            {w === 0 && lead > 0 && hasEarlier && earlierCell(lead)}
            {days.map((date) => {
              const day = dayIndex(date, today);
              if (day < 0 && hasEarlier) return null;
              if (day < 0 || day > LAST_DAY) {
                return (
                  <CalendarDay
                    key={day}
                    variant="empty"
                    date={date}
                    day={day}
                    entries={[]}
                    sent={0}
                    picked={false}
                    hovered={false}
                    activeTemplates={activeTemplates}
                    onPick={() => {}}
                    onFilterTemplate={onFilterTemplate}
                    onOpenTemplate={onOpenTemplate}
                  />
                );
              }
              const { entries, sent } = dayData(day);
              return (
                <CalendarDay
                  key={day}
                  variant="day"
                  date={date}
                  day={day}
                  entries={entries}
                  sent={sent}
                  picked={pickedDay === day || shownDays.has(day)}
                  hovered={hoverDay === day}
                  activeTemplates={activeTemplates}
                  tabStop={stopDay === day}
                  onStopFocus={() => setActiveDay(day)}
                  onPick={(tab) => onPickDay(day, tab)}
                  onFilterTemplate={onFilterTemplate}
                  onOpenTemplate={onOpenTemplate}
                  settling={settling}
                />
              );
            })}
          </DayWeek>
        ))}
      </Grid>
      {sends.length === 0 && <OutboxIntro />}
      <MarqueeOverlay box={marqueeBox} />
      </GridArea>
    </Section>
  );
}
