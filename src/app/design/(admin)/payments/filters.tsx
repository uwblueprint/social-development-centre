"use client";

/**
 * The filter pattern from the member directory (People): a search field with a row of outline filter buttons beside it.
 * Each button opens a popover with a staged checkbox list (Cancel / Apply, and a Clear filter on the left once it is on).
 * An applied filter gets a light green fill, a green outline and a count. Narrow screens give the search its own line and
 * let the buttons scroll sideways inside their row. Copied from src/app/design/member-directory/MemberDirectory.tsx on the
 * gaurav/member-directory-crm branch (FilterRow, FilterButton, CheckList, StagedActions), trimmed to what Payments needs.
 */
import * as React from "react";
import { styled } from "next-yak";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Icon } from "@/components/ui/Icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";

/* ---------- layout ---------- */

/* Search and filters in one row. Narrow: the search takes its own full-width line and the filters scroll beneath it. */
const ToolbarBox = styled.div`
  container-type: inline-size;
  min-width: 0;
`;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;

  @container (max-width: 640px) {
    flex-direction: column;
    flex-wrap: nowrap;
    align-items: stretch;
  }
`;

/* The search is the one thing that shrinks: the filter buttons keep their size. */
const SearchBox = styled.div`
  flex: 1 1 calc(var(--space-8) * 2);
  min-width: calc(var(--space-8) * 2);
  max-width: var(--search-width);

  @container (max-width: 640px) {
    flex: none;
    min-width: 0;
    max-width: none;
  }
`;

/* The filter row beside the search. On narrow screens it scrolls sideways inside itself, so the page never does.
   The small padding (cancelled by the margin) gives focus rings room inside the scroll box. */
const FilterRow = styled.div`
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: var(--space-2);
  flex: none;
  max-width: calc(100% + var(--space-2));
  margin: calc(var(--space-1) * -1);
  padding: var(--space-1);
  overflow-x: auto;
  scrollbar-width: thin;

  & > * {
    flex: none;
  }

  /* Under the search on narrow screens: the filters share the full width equally (two buttons, half each). */
  @container (max-width: 640px) {
    max-width: none;

    & > * {
      flex: 1 1 0;
      min-width: 0;
    }
  }
`;

/** Search plus filter buttons, laid out like the member directory's toolbar. */
export function FilterToolbar({ search, children }: { search: React.ReactNode; children?: React.ReactNode }) {
  return (
    <ToolbarBox>
      <Toolbar>
        <SearchBox>{search}</SearchBox>
        <FilterRow role="group" aria-label="Filters">
          {children}
        </FilterRow>
      </Toolbar>
    </ToolbarBox>
  );
}

/* ---------- button ---------- */

/* Same height as the search box, and the kit's body-size text. */
const FilterButton = styled(Button)`
  &&& {
    height: var(--control-height);
    padding: 0 var(--space-3);
    /* A light outline, as on every outline button in People. Darkens on hover. */
    border-color: var(--taupe-400);
  }
  &&&:hover:not(:disabled) {
    border-color: var(--color-border-strong);
  }
  /* Open: a light fill, so it's clear which filter the popover below belongs to. */
  &&&[data-state="open"] {
    background: var(--color-bg-hover);
    border-color: var(--color-border-strong);
  }
  /* Applied: a light green fill and a primary outline, so the page reads as filtered at a glance (the count says how much). */
  &&&[data-applied] {
    background: var(--color-primary-subtle);
    border-color: var(--color-primary);
  }
`;

/* How many values an applied filter has, in a small circle after its name. A number, so it isn't carried by the fill alone. */
const AppliedCount = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--space-4);
  height: var(--space-4);
  padding: 0 var(--space-1);
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-size: var(--text-xs);
  font-variant-numeric: tabular-nums;
  line-height: 1;
`;

/* ---------- popover contents ---------- */

/* Long labels need room: the popover is about 360px wide on desktop, the screen width minus the page gutters on phones. */
const WidePopover = styled(PopoverContent)`
  &&& {
    width: min(calc(var(--space-8) * 5.5), calc(100vw - var(--space-4) * 2));
    max-width: calc(100vw - var(--space-4) * 2);
  }
`;

const FilterEditor = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
`;

/* Lists in a filter popover sit like a kit menu: rows run edge to edge, scrolling inside the one popover. */
const OptionList = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0 calc(var(--space-3) * -1) calc(var(--space-3) * -1);
  max-height: calc(var(--menu-row-height) * 7.5);
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-strong) transparent;

  & > * {
    flex: none;
  }
  &[data-scrolls] {
    scrollbar-gutter: stable;
    padding-right: var(--space-1);
  }
`;

/* Rows grow with their text: long answers wrap, and the checkbox and the count stay level with the first line. */
const OptionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  min-height: var(--menu-row-height);
  padding: var(--space-1) var(--space-3);
  /* The whole row ticks its box (see toggleFromRow). Its hover fill runs edge to edge, square. */
  cursor: pointer;

  &:hover {
    background: var(--color-bg-hover);
  }
`;

const OptionCheck = styled.span`
  flex: 1 1 auto;
  min-width: 0;

  & > span {
    display: flex;
    align-items: center;
    max-width: 100%;
  }
  & > span > button {
    margin-top: 0;
  }
  & label {
    min-width: 0;
    overflow-wrap: anywhere;
  }
`;

/* Same size and line height as the label, so the count sits on the label's first line. */
const OptionCount = styled.span`
  flex: none;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
`;

/* Cancel and Apply at the foot of a staged filter, with the clear action on the left when there is something to clear. */
const FilterActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  /* A divider and a soft shadow cast up over the list, so the list reads as scrolling under the footer. */
  margin: 0 calc(var(--space-3) * -1);
  padding: var(--space-3) var(--space-3) 0;
  box-shadow: inset 0 1px 0 var(--color-border);

  &[data-over-scroll] {
    box-shadow:
      inset 0 1px 0 var(--color-border),
      var(--shadow-up);
  }
  clip-path: inset(calc(var(--space-3) * -1) 0 0 0);

  & > [data-reset] {
    margin-right: auto;
  }
`;

const Note = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text);
`;

/** Whether a list is taller than its box (so it scrolls): measured, since long labels wrap and a row count can't tell. */
function useScrolls<T extends HTMLElement>(): [(el: T | null) => (() => void) | undefined, boolean] {
  const [scrolls, setScrolls] = React.useState(false);
  const ref = React.useCallback((el: T | null) => {
    if (!el) return undefined;
    const check = () => setScrolls(el.scrollHeight > el.clientHeight + 1);
    check();
    const resize = new ResizeObserver(check);
    resize.observe(el);
    const rows = new MutationObserver(check);
    rows.observe(el, { childList: true, subtree: true });
    return () => {
      resize.disconnect();
      rows.disconnect();
    };
  }, []);
  return [ref, scrolls];
}

/** A click anywhere on an option row ticks its box. Clicks on the box or its label already do, so they're left alone. */
function toggleFromRow(e: React.MouseEvent<HTMLElement>) {
  const target = e.target as HTMLElement;
  if (target.closest("button, label")) return;
  e.currentTarget.querySelector<HTMLButtonElement>('button[role="checkbox"]')?.click();
}

function StagedActions({
  clear,
  onCancel,
  onApply,
  overScroll = false,
}: {
  clear?: { label: string; run: () => void };
  onCancel: () => void;
  onApply?: () => void;
  overScroll?: boolean;
}) {
  return (
    <FilterActions data-over-scroll={overScroll ? "" : undefined}>
      {clear && (
        <Button type="button" $variant="secondary" $size="sm" data-reset="" onClick={clear.run}>
          {clear.label}
        </Button>
      )}
      <Button type="button" $variant="secondary" $size="sm" onClick={onCancel}>
        {onApply ? "Cancel" : "Close"}
      </Button>
      {onApply && (
        <Button type="button" $size="sm" onClick={onApply}>
          Apply
        </Button>
      )}
    </FilterActions>
  );
}

/* ---------- filters ---------- */

export interface FilterOption {
  value: string;
  label: string;
  /** How many results this value would find alongside the search and the other filters. */
  count: number;
}

/** The button for one filter: its name, a count while applied, and a chevron. */
function Trigger({ label, count, summary }: { label: string; count: number; summary: string }) {
  const active = count > 0;
  return (
    <PopoverTrigger asChild>
      <FilterButton
        type="button"
        $variant="outline"
        data-applied={active ? "" : undefined}
        aria-label={active ? `${label}, applied: ${summary}` : undefined}
      >
        {label}
        {active && <AppliedCount aria-hidden="true">{count}</AppliedCount>}
        <Icon icon={ChevronDown} size={14} />
      </FilterButton>
    </PopoverTrigger>
  );
}

/** A checkbox filter. Ticking changes a draft; Apply commits it and closes, Cancel drops it. */
export function CheckFilter({
  label,
  options,
  value,
  onApply,
}: {
  label: string;
  options: FilterOption[];
  value: string[];
  onApply: (next: string[]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const summary = options.filter((o) => value.includes(o.value)).map((o) => o.label).join(", ");
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Trigger label={label} count={value.length} summary={summary} />
      <WidePopover side="bottom" align="start" sideOffset={4} collisionPadding={16} showClose={false} showArrow={false} aria-label={label}>
        <CheckList
          label={label}
          options={options}
          value={value}
          onApply={(next) => {
            onApply(next);
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      </WidePopover>
    </Popover>
  );
}

function CheckList({
  label,
  options,
  value,
  onApply,
  onCancel,
}: {
  label: string;
  options: FilterOption[];
  value: string[];
  onApply: (next: string[]) => void;
  onCancel: () => void;
}) {
  const [listRef, scrolls] = useScrolls<HTMLDivElement>();
  const [chosen, setChosen] = React.useState(value);
  return (
    <FilterEditor role="group" aria-label={label}>
      <OptionList ref={listRef} data-scrolls={scrolls ? "" : undefined}>
        {options.map((o) => (
          <OptionRow key={o.value} onClick={toggleFromRow}>
            <OptionCheck>
              <Checkbox
                label={o.label}
                checked={chosen.includes(o.value)}
                onCheckedChange={(on) => setChosen((cur) => (on === true ? [...cur.filter((v) => v !== o.value), o.value] : cur.filter((v) => v !== o.value)))}
              />
            </OptionCheck>
            <OptionCount>{o.count}</OptionCount>
          </OptionRow>
        ))}
      </OptionList>
      <StagedActions
        clear={value.length ? { label: "Clear filter", run: () => onApply([]) } : undefined}
        onCancel={onCancel}
        onApply={() => onApply(chosen)}
        overScroll={scrolls}
      />
    </FilterEditor>
  );
}

/**
 * The chart column Transactions is narrowed to ("Nov 14", "March 2026"), as a filter button that is always applied while it
 * is on. Its popover says what it is and offers Clear date; the column itself is picked from the chart on Overview.
 */
export function DateFilter({ title, unit, onClear }: { title: string; unit: "day" | "month" | "year"; onClear: () => void }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Trigger label="Date" count={1} summary={title} />
      <WidePopover side="bottom" align="start" sideOffset={4} collisionPadding={16} showClose={false} showArrow={false} aria-label="Date">
        <FilterEditor role="group" aria-label="Date">
          <Note>
            Showing payments {unit === "day" ? "on" : "in"} {title}
          </Note>
          <StagedActions
            clear={{
              label: "Clear date",
              run: () => {
                onClear();
                setOpen(false);
              },
            }}
            onCancel={() => setOpen(false)}
          />
        </FilterEditor>
      </WidePopover>
    </Popover>
  );
}

/** The one-line status for screen readers after the list changes. */
export const FilterStatus = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
`;

/** Search row and filters as one block. No line under it: the tabs' line above and the table's header line are enough. */
export const FilterArea = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;
