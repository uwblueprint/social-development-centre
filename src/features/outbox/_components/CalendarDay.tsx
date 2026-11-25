"use client";

import { styled } from "next-yak";
import { ListRow } from "@/components/ui/ListRow";
import { longDate, type TemplateKey } from "../_data";
import { useOutboxData } from "../_outboxData";
import { entryText, entryTone, type DayEntry } from "../_calendar";
import type { PanelMode } from "../_types";
import { CalendarEntry } from "./CalendarEntry";

const Cell = styled.div`
  position: relative;
  padding: var(--space-2) var(--space-1);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-1);
  min-width: 0;

  & + & {
    border-left: 1px solid var(--color-border);
  }
  /* Cells outside the 30 days: the earlier emails and the filler before and after. */
  &[data-muted] {
    background: var(--color-surface);
  }
  /* A quiet selected day: a light fill and a hairline ring. The filtered entries (primary) are what reads as active. */
  &[data-picked] {
    background: var(--color-bg-hover);
    /* Above its neighbours, so the ring can sit on the grid lines. */
    z-index: 1;
  }
  /* The ring is centred on the grid lines (1px out on every side) so it replaces them instead of sitting beside them. */
  &[data-picked]::before {
    content: "";
    position: absolute;
    inset: -1px;
    border: 1px solid var(--color-border-strong);
    pointer-events: none;
  }
  /* The grid's own edge clips anything outside it, so the outer columns keep the ring inside. */
  &[data-picked]:first-child::before {
    left: 0;
  }
  &[data-picked]:last-child::before {
    right: 0;
  }
  /* The day of the row the pointer or focus is on in the list: a hover fill, not a status colour. */
  &[data-hover]:not([data-picked]) {
    background: var(--color-bg-hover);
  }
`;

/*
 * The day button's hit area (::after) covers the whole cell. The entries are buttons of their own (a
 * button can't hold buttons), so they sit after it in the DOM and paint above it; the day number is
 * inside the button, ahead of the ::after, so it needs --z-raised.
 */
const DayButton = styled(ListRow)`
  width: auto;
  padding: 0;
  gap: 0;

  &:hover {
    background: transparent;
  }
  &::after {
    content: "";
    position: absolute;
    inset: 0;
  }
  &:hover::after {
    background: var(--color-bg-hover);
  }
  /* ListRow makes a focused button position: relative, which would make the 22px button (not the cell) the ::after's containing block. Stay static so the cell is. */
  &:focus-visible {
    position: static;
    box-shadow: none;
  }
  /* The ring is drawn inside the cell's edge (so the grid's overflow can't clip it) and never takes the pointer. */
  &:focus-visible::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    box-shadow: var(--focus-ring-inset);
  }
`;

const DayNum = styled.span`
  position: relative;
  z-index: var(--z-raised);
  min-width: 22px;
  height: 22px;
  line-height: 22px;
  text-align: center;
  font-size: var(--text-sm);

  &[data-today] {
    border-radius: var(--radius-full);
    background: var(--color-text);
    color: var(--color-bg);
    font-weight: var(--weight-medium);
  }
  /* "Dec 1" on the first of a month, and "Earlier": text, not a circle. */
  &[data-text] {
    padding: 0 var(--space-1);
    text-align: left;
    white-space: nowrap;
    color: var(--color-text-muted);
  }
`;

const Entries = styled.ul`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  width: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
`;

/* A full-width "Earlier" cell: the entries line up with the seven day columns below instead of stacking. */
const WideEntries = styled(Entries)`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: var(--space-1);
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

const SentText = styled.span`
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

interface CalendarDayProps {
  /** A day in the 30 days; "earlier" gathers the past emails that need attention; "empty" is filler. */
  variant: "day" | "earlier" | "empty";
  date: Date;
  /** Days from today; for "earlier", the earliest day with something that needs attention. */
  day: number;
  /** How many columns the cell spans. */
  span?: number;
  entries: DayEntry[];
  sent: number;
  picked: boolean;
  /** The pointer or focus is on one of this day's rows in the list. */
  hovered: boolean;
  activeTemplates: Set<TemplateKey>;
  onPick: (tab: PanelMode) => void;
  onFilterTemplate: (key: TemplateKey, tab: PanelMode) => void;
  onOpenTemplate: (key: TemplateKey) => void;
  /** `${day}:${template}` of entries that just went from "to review" to scheduled. */
  settling?: ReadonlySet<string>;
  /** Roving focus: this cell's day button is the calendar's one tab stop. */
  tabStop?: boolean;
  onStopFocus?: () => void;
}

const shortMonth = (d: Date) => d.toLocaleDateString("en-US", { month: "short" });

export function CalendarDay({
  variant,
  date,
  day,
  span = 1,
  entries,
  sent,
  picked,
  hovered,
  activeTemplates,
  onPick,
  onFilterTemplate,
  onOpenTemplate,
  settling,
  tabStop = false,
  onStopFocus,
}: CalendarDayProps) {
  const { templates: names } = useOutboxData();
  const earlier = variant === "earlier";
  const EntriesList = earlier && span === 7 ? WideEntries : Entries;
  const today = variant === "day" && day === 0;
  const clickable = variant !== "empty" && (entries.length > 0 || sent > 0);
  const heading = earlier ? "Earlier" : longDate(date);

  // The day button's name repeats what the cell shows: the date, then each entry.
  const parts = [...entries.map((e) => `${entryText(e)} ${names[e.template].name}`), sent > 0 ? `${sent} sent` : ""].filter(Boolean);
  const label = `${heading}${today ? ", today" : ""}${parts.length ? `: ${parts.join(", ")}` : ""}`;

  // Not-sent emails open in the tab that holds them; any other day opens in All.
  const notSent = entries.some((e) => e.kind === "notsent");
  const tab: PanelMode = notSent ? (entries.some((e) => e.tab === "failed") ? "failed" : "review") : "all";

  const firstOfMonth = variant === "day" && !today && date.getDate() === 1;
  const num =
    variant === "empty" ? null : (
      <DayNum data-today={today ? "" : undefined} data-text={earlier || firstOfMonth ? "" : undefined}>
        {earlier ? "Earlier" : firstOfMonth ? `${shortMonth(date)} 1` : date.getDate()}
      </DayNum>
    );

  return (
    <Cell
      role="gridcell"
      aria-colspan={span > 1 ? span : undefined}
      aria-selected={clickable ? picked : undefined}
      aria-current={today ? "date" : undefined}
      style={span > 1 ? { gridColumn: `span ${span}` } : undefined}
      data-muted={variant !== "day" ? "" : undefined}
      // Every real day (and Earlier) says which day it is, emails or not: a box drawn over the calendar picks by it.
      data-day={variant === "empty" ? undefined : day}
      data-picked={(clickable || variant === "day") && picked ? "" : undefined}
      data-hover={clickable && hovered ? "" : undefined}
    >
      {clickable ? (
        <DayButton
          type="button"
          aria-label={label}
          data-cal-day={day}
          tabIndex={tabStop ? 0 : -1}
          onFocus={onStopFocus}
          onClick={() => onPick(tab)}
        >
          {num}
        </DayButton>
      ) : (
        <>
          {num}
          {today && <VisuallyHidden>Today</VisuallyHidden>}
        </>
      )}
      {entries.length > 0 && (
        <EntriesList aria-label={earlier ? "Automatic emails from earlier days" : `Automatic emails on ${longDate(date)}`}>
          {entries.map((e) => (
            <li key={`${e.kind}:${e.template}`}>
              <CalendarEntry
                name={names[e.template].name}
                label={entryText(e)}
                tone={entryTone(e)}
                entryKey={e.template}
                pressed={activeTemplates.has(e.template)}
                settling={settling?.has(`${day}:${e.template}`)}
                onFilter={() => onFilterTemplate(e.template, e.tab)}
                onOpen={() => onOpenTemplate(e.template)}
              />
            </li>
          ))}
        </EntriesList>
      )}
      {sent > 0 && <SentText>{sent} sent</SentText>}
    </Cell>
  );
}
