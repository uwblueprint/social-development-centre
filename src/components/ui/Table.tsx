"use client";

import * as React from "react";
import { keyframes, styled } from "next-yak";
import { ArrowDown, ArrowUp, ChevronsUpDown, ListFilter, LoaderCircle } from "lucide-react";
import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import { Icon } from "./Icon";
import { Popover, PopoverActions, PopoverContent, PopoverTrigger } from "./Popover";

export type SortDirection = "asc" | "desc";

export interface TableSort {
  /** A column's `sortKey`. */
  key: string;
  direction: SortDirection;
}

/**
 * Screen-reader text a sortable header adds after its label. The owner edits it here.
 * The header's accessible name reads "{label}, sorted ascending. Select to sort descending" or "{label}. Select to sort".
 */
export const tableSortCopy = {
  sorted: (direction: SortDirection, next: SortDirection) =>
    `, sorted ${direction === "asc" ? "ascending" : "descending"}. Select to sort ${next === "asc" ? "ascending" : "descending"}`,
  unsorted: ". Select to sort",
} as const;

/** Copy for column-header filters. The owner edits it here. */
export const tableFilterCopy = {
  trigger: (label: string, selected: number) => (selected > 0 ? `Filter ${label}, ${selected} selected` : `Filter ${label}`),
  legend: (label: string) => `Show ${label.toLowerCase()}`,
  clear: "Clear filter",
} as const;

/**
 * The sort after selecting `column`'s header: its default direction when it isn't the active column
 * (`asc` unless the column says otherwise), the reverse direction when it is.
 */
export function nextTableSort(current: TableSort | undefined, column: { sortKey: string; defaultSortDirection?: SortDirection }): TableSort {
  if (current?.key === column.sortKey) {
    return { key: column.sortKey, direction: current.direction === "asc" ? "desc" : "asc" };
  }
  return { key: column.sortKey, direction: column.defaultSortDirection ?? "asc" };
}

export interface TableColumn<T> {
  /** Unique key for the column; also used as the React key for its header/body cells. */
  key: string;
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
  align?: "left" | "right";
  /**
   * Makes the header a sort button (needs the table's `onSortChange`). The key the page sorts by,
   * usually the server's sort param value.
   */
  sortKey?: string;
  /** Direction on first select: `"asc"` (default) for text, `"desc"` for dates and "most first" numbers. */
  defaultSortDirection?: SortDirection;
  /**
   * A filter in the column header: a small filter icon next to the label opens a checkbox list.
   * Controlled: the page keeps `selected` (usually in the URL) and filters the rows itself.
   */
  filter?: TableColumnFilter;
  /**
   * Whether this row has nothing to show in the column (e.g. no tags). When every row is empty, the
   * column (header and cells) is hidden. A column with an active filter always shows.
   */
  isEmpty?: (row: T) => boolean;
}

export interface TableColumnFilter {
  /** The column's name in the filter's accessible name and heading, e.g. "Status". */
  label: string;
  /** `count` is how many records have that value; shown muted after the option label. */
  options: { value: string; label: string; count?: number }[];
  selected: string[];
  onChange: (values: string[]) => void;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  /** Stable React key per row. */
  getRowId: (row: T) => string;
  /** Makes the whole row open a detail view: focusable, and Enter activates it, same as a click. */
  onRowClick?: (row: T) => void;
  /** Keeps the header row visible while the body scrolls. Wrap the table in a container with its own `max-height` and `overflow-y: auto`. */
  sticky?: boolean;
  /** Rendered instead of the table when `rows` is empty (e.g. an `EmptyState`). */
  empty?: React.ReactNode;
  /** The active sort, controlled. The page does the sorting (usually on the server); `Table` only shows it. */
  sort?: TableSort;
  /** Called with the next sort when a sortable header is selected. Without it, headers render as plain text. */
  onSortChange?: (next: TableSort) => void;
  /**
   * The next rows are loading (a sort, search or page change in flight). The current rows stay in
   * place, dimmed; the active sort icon becomes a spinner, a thin line runs under the header, and the
   * table is `aria-busy`.
   */
  busy?: boolean;
  /**
   * Freezes the first N columns (header and cells) while the table scrolls sideways. Below 600px
   * wide, only the first column freezes, so frozen columns never fill a phone screen.
   */
  stickyColumns?: number;
  "aria-label"?: string;
}

const Wrapper = styled.div`
  /* Contains absolutely positioned cell content (e.g. visually hidden text) so it scrolls with the
     table instead of widening the page at 360px. */
  position: relative;
  width: 100%;
  overflow-x: auto;
`;

const StyledTable = styled.table`
  width: 100%;
  /* Below this, columns are squeezed unreadably; the wrapper scrolls
     horizontally instead (rule: a pointer/touch path at 360px). */
  min-width: 560px;
  border-collapse: collapse;
  font-size: var(--text-sm);

  /*
   * Frozen columns (stickyColumns): each cell sticks at the summed width of the frozen columns before
   * it (--frozen-left, measured). A solid background hides the cells scrolling under it; the last
   * frozen column draws a 1px divider. Below 600px only the first column stays frozen.
   */
  [data-frozen] {
    position: sticky;
    left: var(--frozen-left, 0);
    z-index: var(--z-raised);
    background: var(--color-bg);
  }

  thead [data-frozen] {
    z-index: calc(var(--z-sticky) + 1);
  }

  tbody tr:hover > [data-frozen] {
    background: var(--color-bg-hover);
  }

  [data-frozen-edge]::after {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 1px;
    background: var(--color-border);
    pointer-events: none;
  }

  @media (min-width: 600px) {
    [data-frozen-edge="narrow"]::after {
      display: none;
    }
  }

  /* Narrow screens: later frozen columns scroll normally (left: auto keeps a sticky header's top). */
  @media (max-width: 599px) {
    [data-frozen-rest] {
      left: auto;
      z-index: auto;
    }

    thead [data-frozen-rest] {
      z-index: var(--z-sticky);
    }

    [data-frozen-edge="wide"]::after {
      display: none;
    }
  }
`;

const Th = styled.th<{ $align?: "left" | "right"; $sticky?: boolean }>`
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-text-muted);
  text-align: ${({ $align }) => $align ?? "left"};
  white-space: nowrap;

  ${({ $sticky }) =>
    $sticky &&
    `
    position: sticky;
    top: 0;
    z-index: var(--z-sticky);
    background: var(--color-bg);
  `}
`;

/* A header with a filter: the (sortable) label, then the filter button. */
const HeaderInner = styled.span<{ $align?: "left" | "right" }>`
  display: flex;
  align-items: center;
  justify-content: ${({ $align }) => ($align === "right" ? "flex-end" : "flex-start")};
  gap: var(--space-2);
`;

/* Like SortButton, it sits in the header's padding (negative margin) so the row height doesn't change. */
const FilterButton = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: calc(var(--space-1) / 2);
  margin: calc(var(--space-1) * -1) 0;
  padding: var(--space-1);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  font: inherit;
  line-height: var(--leading-none);
  color: ${({ $active }) => ($active ? "var(--color-text)" : "var(--color-text-subtle)")};
  cursor: pointer;
  transition:
    background-color var(--duration) var(--ease),
    color var(--duration) var(--ease);

  &:hover,
  &[data-state="open"] {
    background: var(--color-bg-hover);
    color: var(--color-text);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

const FilterCount = styled.span`
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  font-variant-numeric: tabular-nums;
`;

const FilterFieldset = styled.fieldset`
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
`;

const FilterLegend = styled.legend`
  padding: 0;
  margin-bottom: var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-text-muted);
`;

const FilterOptions = styled.ul`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
  padding: var(--space-1);
  list-style: none;
  /* Long lists scroll inside the popover; the padding keeps focus rings from being clipped. */
  max-height: calc(var(--space-8) * 4);
  overflow-y: auto;
`;

const OptionLabel = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-2);
`;

const OptionCount = styled.span`
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
`;

function ColumnFilter({ filter }: { filter: TableColumnFilter }) {
  const { label, options, selected, onChange } = filter;
  const count = selected.length;
  const toggle = (value: string, checked: boolean) =>
    onChange(checked ? [...selected, value] : selected.filter((v) => v !== value));
  return (
    <Popover>
      <PopoverTrigger asChild>
        <FilterButton type="button" aria-label={tableFilterCopy.trigger(label, count)} $active={count > 0}>
          <Icon icon={ListFilter} size={SORT_ICON_SIZE} />
          {count > 0 && <FilterCount aria-hidden="true">{count}</FilterCount>}
        </FilterButton>
      </PopoverTrigger>
      <PopoverContent align="start" showClose={false}>
        <FilterFieldset>
          <FilterLegend>{tableFilterCopy.legend(label)}</FilterLegend>
          <FilterOptions>
            {options.map((option) => (
              <li key={option.value}>
                <Checkbox
                  checked={selected.includes(option.value)}
                  onCheckedChange={(checked) => toggle(option.value, checked === true)}
                  label={
                    <OptionLabel>
                      {option.label}
                      {option.count !== undefined && <OptionCount>{option.count}</OptionCount>}
                    </OptionLabel>
                  }
                />
              </li>
            ))}
          </FilterOptions>
        </FilterFieldset>
        <PopoverActions>
          <Button type="button" $variant="ghost" $size="sm" onClick={() => onChange([])}>
            {tableFilterCopy.clear}
          </Button>
        </PopoverActions>
      </PopoverContent>
    </Popover>
  );
}

/* Inactive columns: a muted up/down hint, shown only on hover or focus so the header stays quiet. */
const SortHint = styled.span`
  display: inline-flex;
  flex: none;
  color: var(--color-text-subtle);
  opacity: 0;
  transition: opacity var(--duration) var(--ease);
`;

/*
 * Sits in the header cell's padding: its own padding is cancelled by an equal negative margin, so the
 * label lines up with the cells below and the row height doesn't change. The icon slot is always
 * reserved, so selecting or hovering never shifts the label.
 */
const SortButton = styled.button<{ $align?: "left" | "right"; $active?: boolean }>`
  display: inline-flex;
  flex-direction: ${({ $align }) => ($align === "right" ? "row-reverse" : "row")};
  align-items: center;
  gap: var(--space-1);
  margin: calc(var(--space-1) * -1);
  padding: var(--space-1);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  font: inherit;
  line-height: var(--leading-ui);
  color: ${({ $active }) => ($active ? "var(--color-text)" : "inherit")};
  cursor: pointer;
  transition:
    background-color var(--duration) var(--ease),
    color var(--duration) var(--ease);

  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  &:hover ${SortHint},
  &:focus-visible ${SortHint} {
    opacity: 1;
  }
`;

const SortIndicator = styled.span`
  display: inline-flex;
  flex: none;
`;

/* Fallback for a non-string `header`: its sort text is read after the label (possibly with a space before it). */
const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
`;

const SORT_ICON_SIZE = 14;

function SortableHeader<T>({
  column,
  sort,
  onSortChange,
  busy,
}: {
  column: TableColumn<T> & { sortKey: string };
  sort?: TableSort;
  onSortChange: (next: TableSort) => void;
  busy?: boolean;
}) {
  const active = sort?.key === column.sortKey ? sort.direction : undefined;
  const next = nextTableSort(sort, column);
  const suffix = active ? tableSortCopy.sorted(active, next.direction) : tableSortCopy.unsorted;
  // A string header names the button exactly ("Name, sorted ascending. …"); browsers would add a
  // space before visually hidden text that isn't part of the label's inline flow.
  const label = typeof column.header === "string" ? column.header + suffix : undefined;
  return (
    <SortButton
      type="button"
      aria-label={label}
      $align={column.align}
      $active={!!active}
      onClick={() => onSortChange(next)}
    >
      <span>{column.header}</span>
      {active ? (
        <SortIndicator>
          {busy ? (
            <Spinner>
              <Icon icon={LoaderCircle} size={SORT_ICON_SIZE} />
            </Spinner>
          ) : (
            <Icon icon={active === "asc" ? ArrowUp : ArrowDown} size={SORT_ICON_SIZE} />
          )}
        </SortIndicator>
      ) : (
        <SortHint>
          <Icon icon={ChevronsUpDown} size={SORT_ICON_SIZE} />
        </SortHint>
      )}
      {label === undefined && <VisuallyHidden>{suffix}</VisuallyHidden>}
    </SortButton>
  );
}

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const indeterminate = keyframes`
  from { transform: translateX(-100%); }
  to { transform: translateX(340%); }
`;

const Spinner = styled.span`
  display: inline-flex;
  animation: ${spin} calc(var(--duration-slow) * 3) linear infinite;
`;

/*
 * The loading line sits in a zero-height row right under the header, so it spans every column and
 * never shifts the layout. It overlaps the header's bottom border.
 */
const ProgressRow = styled.tr`
  height: 0;
`;

const ProgressCell = styled.td`
  position: relative;
  height: 0;
  padding: 0;
  border: 0;
`;

const ProgressTrack = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: -1px;
  height: calc(var(--space-1) / 2);
  overflow: hidden;
  pointer-events: none;

  &::after {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 30%;
    background: var(--color-primary);
    animation: ${indeterminate} calc(var(--duration-slow) * 5) var(--ease) infinite;
  }
`;

/* Stale rows while the next ones load: dimmed in place (no layout shift) and not clickable twice. */
const Body = styled.tbody<{ $busy?: boolean }>`
  transition: opacity var(--duration) var(--ease);
  opacity: ${({ $busy }) => ($busy ? 0.6 : 1)};
`;

const Td = styled.td<{ $align?: "left" | "right" }>`
  padding: var(--space-2) var(--space-3);
  color: var(--color-text);
  text-align: ${({ $align }) => $align ?? "left"};
  vertical-align: middle;
`;

const Row = styled.tr<{ $clickable?: boolean }>`
  transition: background-color var(--duration) var(--ease);

  &:not(:first-child) {
    border-top: 1px solid var(--color-border);
  }

  &:hover {
    background: var(--color-bg-hover);
  }

  ${({ $clickable }) => $clickable && `cursor: pointer;`}

  /*
   * The focus ring is drawn inside the cells, so the scroll container never clips it and frozen
   * cells (which paint their own background) show it too.
   */
  &:focus-visible {
    outline: none;
  }

  &:focus-visible > td {
    box-shadow:
      inset 0 2px 0 var(--color-focus),
      inset 0 -2px 0 var(--color-focus);
  }

  &:focus-visible > td:first-child {
    box-shadow:
      inset 2px 0 0 var(--color-focus),
      inset 0 2px 0 var(--color-focus),
      inset 0 -2px 0 var(--color-focus);
  }

  &:focus-visible > td:last-child {
    box-shadow:
      inset -2px 0 0 var(--color-focus),
      inset 0 2px 0 var(--color-focus),
      inset 0 -2px 0 var(--color-focus);
  }

  &:focus-visible > td:first-child:last-child {
    box-shadow: inset 0 0 0 2px var(--color-focus);
  }
`;

/** Data attributes and the measured left offset for a frozen column's cells. */
function frozenProps(index: number, frozen: number, offsets: number[]) {
  if (index >= frozen) return {};
  const last = index === frozen - 1;
  const edge = index === 0 ? (last ? "all" : "narrow") : last ? "wide" : undefined;
  return {
    "data-frozen": "",
    "data-frozen-rest": index > 0 ? "" : undefined,
    "data-frozen-edge": edge,
    style: { "--frozen-left": `${offsets[index] ?? 0}px` } as React.CSSProperties,
  };
}

/**
 * A semantic data table: muted `text-xs` header, hairline row dividers, and a
 * `--color-bg-hover` row hover. Pass `onRowClick` to make the whole row open
 * a detail view; rows without it render as plain, non-interactive rows.
 * Renders `empty` in place of the table when `rows` is empty — paginate
 * below the table, outside this component.
 *
 * Sorting is controlled: give columns a `sortKey`, pass `sort` and `onSortChange`, and sort the rows
 * yourself (usually on the server). Sortable headers become buttons and the `th` gets `aria-sort`.
 */
export function Table<T>({
  columns,
  rows,
  getRowId,
  onRowClick,
  sticky,
  empty,
  sort,
  onSortChange,
  busy = false,
  stickyColumns = 0,
  "aria-label": ariaLabel,
}: TableProps<T>) {
  const visibleColumns = columns.filter(
    (col) => !col.isEmpty || (col.filter?.selected.length ?? 0) > 0 || !rows.every(col.isEmpty),
  );
  const frozen = Math.max(0, Math.min(stickyColumns, visibleColumns.length));
  const tableRef = React.useRef<HTMLTableElement>(null);
  const [offsets, setOffsets] = React.useState<number[]>([]);
  const columnKeys = visibleColumns.map((col) => col.key).join("|");

  // Frozen columns stick at the summed width of the frozen columns before them; widths follow content, so measure.
  React.useLayoutEffect(() => {
    const cells = tableRef.current?.tHead?.rows[0]?.cells;
    if (frozen < 2 || !cells) return;
    const measure = () => {
      const next: number[] = [];
      let left = 0;
      for (let i = 0; i < frozen && i < cells.length; i++) {
        next.push(left);
        left += cells[i].getBoundingClientRect().width;
      }
      setOffsets((prev) => (prev.length === next.length && prev.every((v, i) => v === next[i]) ? prev : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    for (let i = 0; i < frozen - 1 && i < cells.length; i++) observer.observe(cells[i]);
    return () => observer.disconnect();
  }, [frozen, columnKeys, rows.length]);

  if (rows.length === 0) return <>{empty}</>;

  return (
    <Wrapper>
      <StyledTable ref={tableRef} aria-label={ariaLabel} aria-busy={busy || undefined}>
        <thead>
          <tr>
            {visibleColumns.map((col, index) => {
              const sortKey = onSortChange ? col.sortKey : undefined;
              const ariaSort =
                sortKey === undefined
                  ? undefined
                  : sort?.key === sortKey
                    ? sort.direction === "asc"
                      ? "ascending"
                      : "descending"
                    : "none";
              const label =
                sortKey !== undefined && onSortChange ? (
                  <SortableHeader column={{ ...col, sortKey }} sort={sort} onSortChange={onSortChange} busy={busy} />
                ) : (
                  col.header
                );
              return (
                <Th
                  key={col.key}
                  scope="col"
                  aria-sort={ariaSort}
                  $align={col.align}
                  $sticky={sticky}
                  {...frozenProps(index, frozen, offsets)}
                >
                  {col.filter ? (
                    <HeaderInner $align={col.align}>
                      {label}
                      <ColumnFilter filter={col.filter} />
                    </HeaderInner>
                  ) : (
                    label
                  )}
                </Th>
              );
            })}
          </tr>
          {busy && (
            <ProgressRow aria-hidden="true">
              <ProgressCell colSpan={visibleColumns.length}>
                <ProgressTrack />
              </ProgressCell>
            </ProgressRow>
          )}
        </thead>
        <Body $busy={busy}>
          {rows.map((row) => {
            const id = getRowId(row);
            const clickable = !!onRowClick;
            return (
              <Row
                key={id}
                $clickable={clickable}
                tabIndex={clickable ? 0 : undefined}
                onClick={clickable ? () => onRowClick(row) : undefined}
                onKeyDown={
                  clickable
                    ? (event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
              >
                {visibleColumns.map((col, index) => (
                  <Td key={col.key} $align={col.align} {...frozenProps(index, frozen, offsets)}>
                    {col.render(row)}
                  </Td>
                ))}
              </Row>
            );
          })}
        </Body>
      </StyledTable>
    </Wrapper>
  );
}
