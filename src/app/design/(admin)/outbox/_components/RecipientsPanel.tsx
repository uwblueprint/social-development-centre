"use client";

/*
 * Keyboard (the whole Outbox screen; the calendar's model is planned separately)
 *
 * Tab order, top to bottom:
 *   1 Outbox tabs (one stop; Left/Right switch tab, Home/End jump)   2 Search field (and its clear x)
 *   3 Template filter button (opens a checklist, focus moves to its first checkbox, Esc returns to the button)
 *   4 One stop per active filter chip: its link, then its remove x
 *   5 THE LIST: one stop (the row you last used, or the first row)
 *   6 Selection bar, only while something is ticked (it is the next stop after the list)
 *   7 Right pane: the open email (Back to calendar, Edit email, ..., Delete, Approve / Resend) or the calendar
 *
 * The list is one tab stop with roving focus ("roving buttons", not a listbox: each row is an openable
 * button, and a listbox option may not hold the pointer-only checkbox or the day headings between rows).
 * Each row is a real button, so Enter and Space open it (aria-current marks the open one); a ticked row
 * says "selected" after the name. The visible checkbox stays clickable but is out of the tab order.
 *
 *   Down / j, Up / k   next / previous stop (day headings in All are stops too)
 *   Home / End         first / last stop
 *   Enter or Space     open the email  /  fold or unfold the day heading
 *   x                  tick or untick the focused row (rows only)
 *   Shift+x            tick (or untick) every row from the last one ticked to the focused one
 *
 * Pointer: Shift+click a row or its box ticks the run of rows from the last one ticked (as in Gmail). Dragging
 * from anywhere on the page (the margin, the list, the calendar) draws a selection box that ticks every row it
 * touches (as in Figma); see useMarquee. A drag that starts on the calendar picks days instead (OutboxCalendar).
 *   Escape             clear the selection; focus stays on the row
 *
 * Focus hand-offs:
 *   - Opening an email moves focus to its heading (the member's name) so the next Tab reaches Edit email,
 *     then Delete and Approve / Resend. Shift+Tab reaches "Back to calendar".
 *   - Back, Approve, Resend or Delete put focus back on the row that was open (or the row now in its place).
 *   - Clearing the selection from the bar puts focus back on the row you were on.
 *   - Dialogs and menus use Radix focus return to the control that opened them.
 * Never use a positive tabindex: the order is the DOM order plus this roving stop.
 */

import * as React from "react";
import { styled } from "next-yak";
import { Tabs, TabsContent } from "@/components/ui/Tabs";
import { isUpcoming, plural, type Send, type TemplateKey } from "../_data";
import { groupByDay, listSends, daysLabel, inDays } from "../_recipients";
import { useOutboxData } from "../_outboxData";
import type { BulkKind, PanelMode } from "../_types";
import { DayGroup, dayAnchorId } from "./DayGroup";
import { EmptyList } from "./EmptyList";
import { SkeletonRows } from "./OutboxStatePanel";
import { PanelHeader } from "./PanelHeader";
import { RecipientRow } from "./RecipientRow";
import { SelectionBar } from "./SelectionBar";
import { MarqueeOverlay } from "./MarqueeOverlay";
import { touches, useMarquee } from "./useMarquee";

/* A stacking context of its own, so the list's raised and sticky layers never compete with the page. */
const Panel = styled.section`
  /* Interactive text (rows, day headings, tabs, chips, the selection bar) isn't for selecting. */
  -webkit-user-select: none;
  user-select: none;

  /* Typing and selecting inside the search field still work. */
  & input,
  & textarea {
    -webkit-user-select: text;
    user-select: text;
  }
  position: sticky;
  top: 0;
  z-index: var(--z-raised);
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 480px;
  background: var(--color-bg);
  border-right: 1px solid var(--color-border);

  @media (max-width: 899px) {
    position: relative;
    height: auto;
    border-right: 0;
    border-bottom: 1px solid var(--color-border);
  }
`;

// The tabs wrap the header and the list; the root adds no box of its own so the panel stays one flex column.
const TabsRoot = styled(Tabs)`
  display: contents;
`;

/* The recipient list is the panel the tabs control. Isolated, so the selection bar floats above everything in it. */
const Scroll = styled(TabsContent)`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  isolation: isolate;
  padding: 0 0 var(--space-3);

  /* Never the container: the roving row (or day heading) shows the ring, and only for keyboard focus. */
  &:focus,
  &:focus-visible {
    outline: none;
    box-shadow: none;
  }
`;

/* One divider rule for the whole list: every day heading and every row draws a 1px line on its top edge, so any two neighbours
   share exactly one line, collapsed or not. This wrapper sits 1px above the scroller's top so the first line is clipped,
   and closes the list with one line at the bottom. */
const ListBody = styled.div`
  margin-top: -1px;
  border-bottom: 1px solid var(--color-border);
`;

const noHover = () => {};

const Rows = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

/* Room to scroll the last rows clear of the selection bar: its two rows of kit small buttons (32px, which is --space-6; the kit has no
   token for button height), the gap, padding, border and offset, plus a margin. */
const VisuallyHidden = styled.div`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

const BarSpace = styled.div`
  height: calc(var(--space-6) * 2 + var(--space-2) + var(--space-3) * 4 + 2px);
`;

interface RecipientsPanelProps {
  /** Every send still waiting or failed. */
  sends: Send[];
  mode: PanelMode;
  /** The tab whose list is loading (State lab Slow tab switch): skeleton rows replace the list. Null otherwise. */
  loadingTab?: string | null;
  onMode: (mode: PanelMode) => void;
  selected: Set<string>;
  onSelected: (ids: Set<string>) => void;
  /** The send whose email is open. */
  openId: string | null;
  onOpen: (id: string) => void;
  /** State lab: offline. Only emails whose content has loaded can be opened. */
  offline: boolean;
  /** Ids of the emails whose content has loaded. */
  loaded: Set<string>;
  /** The day the calendar picked: the All tab scrolls to it. */
  pickedDay: number | null;
  closedDays: Set<number>;
  onClosedDays: (days: Set<number>) => void;
  onHoverDay: (day: number | null) => void;
  onBulk: (kind: BulkKind, ids: string[]) => void;
  onResend: (ids: string[]) => void;
  /** The template filter lives on the page, so the calendar's entries can set it. */
  templates: Set<TemplateKey>;
  onTemplates: (templates: Set<TemplateKey>) => void;
  /** Days picked with a box on the calendar: the list shows only those days (empty: every day). */
  days: Set<number>;
  onDays: (days: Set<number>) => void;
  /** The committed search text (after Enter or a pause), kept on the page so its review order matches this list. */
  query: string;
  onQuery: (query: string) => void;
  /** A search is running; the list keeps the previous results until it settles. */
  searching: boolean;
  /** Emails approved a moment ago that are still in For review while they confirm and collapse out. */
  approved: ReadonlyMap<string, { send: Send; phase: "confirmed" | "leaving"; text: string }>;
  /** Emails an undo just brought back: they animate in at their place. */
  entering: ReadonlySet<string>;
}

export function RecipientsPanel({
  sends,
  mode,
  loadingTab = null,
  onMode,
  selected,
  onSelected,
  openId,
  onOpen,
  offline,
  loaded,
  pickedDay,
  closedDays,
  onClosedDays,
  onHoverDay,
  onBulk,
  onResend,
  templates,
  onTemplates,
  days,
  onDays,
  query,
  onQuery,
  searching,
  approved,
  entering,
}: RecipientsPanelProps) {
  const data = useOutboxData();
  const [searchText, setSearchText] = React.useState(query);
  const [lastPickedId, setLastPickedId] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  // The list's one tab stop: the stop that last had focus.
  const [activeKey, setActiveKey] = React.useState<string | null>(null);

  // An approved email counts as still to review until its row has finished confirming, so the count ticks down as the row goes.
  const confirming = [...approved.values()].filter((a) => a.phase === "confirmed").length;
  const counts = {
    review: sends.filter((s) => s.status === "review").length + confirming,
    failed: sends.filter((s) => s.status === "couldnt").length,
    all: sends.filter(isUpcoming).length,
  };

  const source = mode === "review" && approved.size > 0 ? [...sends, ...[...approved.values()].map((a) => a.send)] : sends;
  const shown = listSends(source, mode, templates, query, data).filter((s) => inDays(s, days));
  // All is grouped by day; For review and Couldn't send are one list each.
  const byDay = mode === "all";
  const groups = groupByDay(shown, byDay);
  const filtered = query.trim() !== "" || templates.size > 0 || days.size > 0;

  // A calendar pick opens that day in All and brings it to the top of the list.
  React.useEffect(() => {
    if (pickedDay == null || mode !== "all") return;
    requestAnimationFrame(() => {
      const el = document.getElementById(dayAnchorId(pickedDay));
      const list = scrollRef.current;
      if (el && list) list.scrollTop = el.offsetTop - list.offsetTop;
    });
  }, [pickedDay, mode]);

  // Every roving stop the list shows, in order: day headings and rows.
  const order: string[] = [];
  for (const { day, list } of groups) {
    if (byDay) order.push(`day:${day}`);
    if (byDay && closedDays.has(day)) continue;
    for (const s of list) if (!approved.has(s.id)) order.push(`row:${s.id}`);
  }
  const stopKey = activeKey && order.includes(activeKey) ? activeKey : (order[0] ?? null);

  const stopEl = (key: string) => scrollRef.current?.querySelector<HTMLElement>(`[data-roving="${CSS.escape(key)}"]`) ?? null;

  const prevOrder = React.useRef<string[]>(order);
  const prevSelectedCount = React.useRef(selected.size);
  const prevOpenId = React.useRef(openId);
  const lostFocus = () => !document.activeElement || document.activeElement === document.body;

  // When what held focus goes away (the bar after clearing or acting, or the email after Back, Approve,
  // Resend, Delete), focus lands on the row that was open, or the row that took its place, not on <body>.
  React.useEffect(() => {
    const cleared = prevSelectedCount.current > 0 && selected.size === 0;
    const closed = prevOpenId.current !== null && openId === null;
    const closedKey = closed ? `row:${prevOpenId.current}` : null;
    const before = prevOrder.current;
    prevSelectedCount.current = selected.size;
    prevOpenId.current = openId;
    if (!cleared && !closed) return;
    const timer = window.setTimeout(() => {
      // Radix may return focus to a trigger in the meantime; only act when focus was lost.
      if (!lostFocus()) return;
      const wanted = closedKey ?? stopKey;
      const at = wanted ? before.indexOf(wanted) : -1;
      const fallbacks = [wanted, ...(at >= 0 ? [order[Math.min(at, order.length - 1)]] : []), order[0]];
      for (const key of fallbacks) {
        const el = key ? stopEl(key) : null;
        if (el) {
          el.focus();
          return;
        }
      }
    }, 60);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected.size, openId]);

  React.useEffect(() => {
    prevOrder.current = order;
  });

  const onListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && selected.size > 0) {
      onSelected(new Set());
      return;
    }
    const target = e.target as HTMLElement;
    if (!target.dataset.roving || e.altKey || e.ctrlKey || e.metaKey) return;
    if ((e.key === "x" || e.key === "X") && target.dataset.sendId) {
      e.preventDefault();
      toggle(target.dataset.sendId, e.shiftKey);
      return;
    }
    const stops = Array.from(scrollRef.current?.querySelectorAll<HTMLElement>("[data-roving]") ?? []);
    const at = stops.indexOf(target);
    let next = -1;
    if (e.key === "ArrowDown" || e.key === "j") next = Math.min(at + 1, stops.length - 1);
    else if (e.key === "ArrowUp" || e.key === "k") next = Math.max(at - 1, 0);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = stops.length - 1;
    if (next < 0) return;
    e.preventDefault();
    stops[next]?.focus();
  };

  // After a search settles, say how many results there are (a polite live region; nothing is said while it runs).
  const [resultNote, setResultNote] = React.useState("");
  const wasSearching = React.useRef(false);
  React.useEffect(() => {
    if (wasSearching.current && !searching) setResultNote(plural(shown.length, "result", "results"));
    wasSearching.current = searching;
  }, [searching, shown.length]);

  const selectedSends = sends.filter((s) => selected.has(s.id));
  const lastPicked = selectedSends.find((s) => s.id === lastPickedId) ?? selectedSends[selectedSends.length - 1];

  // Where a Shift range starts: the last row ticked or unticked by hand.
  const anchor = React.useRef<string | null>(null);

  /**
   * Ticks or unticks one row. With `range`, every row shown between the anchor and this one takes this row's new
   * state (all ticked, or all unticked), in the order the list shows them; rows in folded days are left alone.
   */
  const toggle = (id: string, range = false) => {
    const next = new Set(selected);
    const on = !next.has(id);
    const visible = Array.from(scrollRef.current?.querySelectorAll<HTMLElement>("[data-send-id]") ?? [])
      .filter((el) => el.offsetParent !== null)
      .map((el) => el.dataset.sendId as string);
    const from = range && anchor.current ? visible.indexOf(anchor.current) : -1;
    const to = visible.indexOf(id);
    const ids = from >= 0 && to >= 0 ? visible.slice(Math.min(from, to), Math.max(from, to) + 1) : [id];
    for (const x of ids) {
      if (on) next.add(x);
      else next.delete(x);
    }
    if (on) setLastPickedId(id);
    anchor.current = id;
    onSelected(next);
  };

  // Drag a box (from anywhere but the calendar) to tick every row it touches. A plain drag replaces the
  // selection; Shift, Ctrl or Cmd adds to it.
  const boxBase = React.useRef<Set<string>>(new Set());
  const marqueeBox = useMarquee({
    enabled: !loadingTab && shown.length > 0,
    scrollRef,
    canStart: (target) => !target.closest("[data-cal-grid]"),
    onStart: (e) => {
      boxBase.current = e.shiftKey || e.ctrlKey || e.metaKey ? new Set(selected) : new Set();
    },
    onBox: (box) => {
      const ids = new Set(boxBase.current);
      for (const button of scrollRef.current?.querySelectorAll<HTMLElement>("[data-send-id]") ?? []) {
        const row = button.parentElement;
        if (row && row.offsetParent !== null && touches(row.getBoundingClientRect(), box) && button.dataset.sendId) ids.add(button.dataset.sendId);
      }
      if (ids.size !== selected.size || [...ids].some((id) => !selected.has(id))) onSelected(ids);
    },
  });
  const boxSelecting = marqueeBox !== null;
  // While a box is being dragged, rows passing under the pointer don't light up their days on the calendar:
  // you're picking rows, and the calendar flickering colour after colour is noise. It clears when the drag starts.
  React.useEffect(() => {
    if (boxSelecting) onHoverDay(null);
  }, [boxSelecting, onHoverDay]);
  const hoverDay = boxSelecting ? noHover : onHoverDay;

  const clearFilters = () => {
    setSearchText("");
    onQuery("");
    onTemplates(new Set());
    onDays(new Set());
  };

  return (
    <Panel aria-labelledby="outbox-title">
      <TabsRoot value={mode} activationMode="manual" onValueChange={(v) => onMode(v as PanelMode)}>
        <PanelHeader
          counts={counts}
          searchText={searchText}
          onSearchText={setSearchText}
          onSearch={onQuery}
          templates={templates}
          onTemplates={onTemplates}
          daysLabel={days.size > 0 ? daysLabel(days) : null}
          onClearDays={() => onDays(new Set())}
          searching={searching}
          loadingTab={loadingTab}
        />

        {/* tabIndex -1: the rows are the list's tab stop; a focusable scroll box in front of them would be a wasted stop. */}
        {/* The content stays on the selected tab (Radix only renders the active panel); its rows are the lagging list. */}
        <Scroll value={mode} aria-busy={!!loadingTab} ref={scrollRef} tabIndex={-1} onKeyDown={onListKeyDown}>
          {loadingTab && (
            <>
              <VisuallyHidden role="status">{`Loading ${loadingTab}`}</VisuallyHidden>
              <SkeletonRows />
            </>
          )}
          {!loadingTab && groups.length === 0 && <EmptyList mode={mode} filtered={filtered} nothingYet={counts.all + counts.review + counts.failed === 0} onClear={clearFilters} />}

          {!loadingTab && groups.length > 0 && (
          <ListBody>
          {groups.map(({ day, list }) => {
            const key = `${mode}-${day}`;
            const rows = (
              <Rows>
                {list.map((s) => (
                  <RecipientRow
                    key={s.id}
                    send={s}
                    mode={mode}
                    current={openId === s.id}
                    checked={selected.has(s.id)}
                    blocked={offline && !loaded.has(s.id)}
                    onToggle={(range) => toggle(s.id, range)}
                    onOpen={() => {
                      setActiveKey(`row:${s.id}`);
                      onOpen(s.id);
                    }}
                    onHoverDay={hoverDay}
                    boxSelecting={boxSelecting}
                    motion={approved.get(s.id)?.phase ?? (entering.has(s.id) ? "entering" : undefined)}
                    confirmText={approved.get(s.id)?.text}
                    rovingKey={`row:${s.id}`}
                    tabStop={stopKey === `row:${s.id}`}
                    onRovingFocus={setActiveKey}
                  />
                ))}
              </Rows>
            );
            if (!byDay) return <React.Fragment key={key}>{rows}</React.Fragment>;
            return (
              <DayGroup
                key={key}
                day={day}
                rovingKey={`day:${day}`}
                tabStop={stopKey === `day:${day}`}
                onRovingFocus={setActiveKey}
                onHoverDay={hoverDay}
                open={!closedDays.has(day)}
                onOpenChange={(open) => {
                  const next = new Set(closedDays);
                  if (open) next.delete(day);
                  else next.add(day);
                  onClosedDays(next);
                }}
              >
                {rows}
              </DayGroup>
            );
          })}
          </ListBody>
          )}
          {!loadingTab && selected.size > 0 && <BarSpace aria-hidden="true" />}
        </Scroll>
        <MarqueeOverlay box={marqueeBox} />
      </TabsRoot>
      <VisuallyHidden role="status">{resultNote}</VisuallyHidden>

      {selected.size > 0 && (
        <SelectionBar
          selected={selectedSends}
          shown={shown}
          lastPicked={lastPicked}
          byDay={byDay}
          onSelect={(ids) => onSelected(new Set(ids))}
          onClear={() => onSelected(new Set())}
          onBulk={onBulk}
          onResend={onResend}
        />
      )}
    </Panel>
  );
}
