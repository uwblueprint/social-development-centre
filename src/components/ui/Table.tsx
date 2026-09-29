"use client";

import * as React from "react";
import { keyframes, styled } from "next-yak";
import { ArrowDown, ArrowUp, ChevronsUpDown, LoaderCircle } from "lucide-react";
import { Icon } from "./Icon";
import { ColumnFilter, isFilterActive, tableFilterCopy, type TableColumnFilter } from "./TableColumnFilter";

export { tableFilterCopy, type TableColumnFilter };

export type SortDirection = "asc" | "desc";

export interface TableSort {
  /** A column's `sortKey`. */
  key: string;
  direction: SortDirection;
}

/**
 * Screen-reader text a sortable header adds after its label.
 * The header's accessible name reads "{label}, sorted ascending. Select to sort descending" or "{label}. Select to sort".
 */
export const tableSortCopy = {
  sorted: (direction: SortDirection, next: SortDirection) =>
    `, sorted ${direction === "asc" ? "ascending" : "descending"}. Select to sort ${next === "asc" ? "ascending" : "descending"}`,
  unsorted: ". Select to sort",
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
  /**
   * A fixed CSS width, e.g. `"240px"` (including the cell padding). The column is exactly this wide and
   * clips content that doesn't fit (use `TruncatedText` or `TruncatedEmail` in the cell for an
   * ellipsis). Columns without a width size to their content; when every column has one, the table
   * uses `table-layout: fixed`.
   */
  width?: string;
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
   * The next rows are loading (a search, filter or page change in flight). The current rows stay in
   * place, dimmed, a thin line runs under the header, and the table is `aria-busy`.
   */
  busy?: boolean;
  /**
   * A sort change is in flight: the active sort icon becomes a spinner. Separate from `busy`; pass
   * both while a sort loads (usually `useListSort().pending`) to dim the rows too.
   */
  sortPending?: boolean;
  /**
   * Freezes the first N columns (header and cells) while the table scrolls sideways; only when the
   * table is wider than its container. The last frozen column shows a divider and a soft shadow while
   * the table is scrolled. Below 600px wide, only the first column freezes, so frozen columns never
   * fill a phone screen.
   */
  stickyColumns?: number;
  "aria-label"?: string;
}

/*
 * Frozen columns (stickyColumns) live in the wrapper's CSS because they depend on its state:
 * - data-overflowing (set when the table is wider than the wrapper): only then do frozen cells stick,
 *   each at the summed width of the frozen columns before it (--frozen-left, measured). A solid
 *   background hides the cells scrolling under it.
 * - data-scrolled (set on scroll while scrollLeft > 0): only then does the last frozen column draw
 *   its 1px divider and a soft shadow.
 * Below 600px only the first column stays frozen.
 */
const Wrapper = styled.div`
  /* Contains absolutely positioned cell content (e.g. visually hidden text) so it scrolls with the
     table instead of widening the page at 360px. */
  position: relative;
  width: 100%;
  overflow-x: auto;

  &[data-overflowing] [data-frozen] {
    position: sticky;
    left: var(--frozen-left, 0);
    z-index: var(--z-raised);
  }

  &[data-overflowing] thead [data-frozen] {
    z-index: calc(var(--z-sticky) + 1);
  }

  [data-frozen-edge]::after {
    content: "";
    display: none;
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 1px;
    background: var(--color-border);
    box-shadow: var(--shadow-edge);
    pointer-events: none;
  }

  &[data-scrolled] [data-frozen-edge]::after {
    display: block;
  }

  @media (min-width: 600px) {
    &[data-scrolled] [data-frozen-edge="narrow"]::after {
      display: none;
    }
  }

  /* Narrow screens: later frozen columns scroll normally (left: auto keeps a sticky header's top). */
  @media (max-width: 599px) {
    &[data-overflowing] [data-frozen-rest] {
      left: auto;
      z-index: auto;
    }

    &[data-overflowing] thead [data-frozen-rest] {
      z-index: var(--z-sticky);
    }

    &[data-scrolled] [data-frozen-edge="wide"]::after {
      display: none;
    }
  }
`;

const StyledTable = styled.table`
  width: 100%;
  /* Below this, columns are squeezed unreadably; the wrapper scrolls
     horizontally instead (rule: a pointer/touch path at 360px). */
  min-width: 560px;
  border-collapse: collapse;
  font-size: var(--text-sm);

  /* When every column has a fixed width, the table uses fixed layout (data-fixed). */
  &[data-fixed] {
    table-layout: fixed;
  }

  /* Frozen cells paint their own background so scrolled cells don't show through. */
  [data-frozen] {
    background: var(--color-bg);
  }

  /*
   * Row hover is pure CSS on every cell (frozen ones too), with no transition, so the whole row
   * highlights in the same frame.
   */
  tbody tr:hover > td {
    background: var(--color-bg-hover);
  }

`;

/*
 * A fixed-width column's content box: exactly the column's width minus the cell padding, clipping
 * what doesn't fit (TruncatedText/TruncatedEmail inside add the ellipsis). Works in auto layout too,
 * where the column then sizes to exactly this box.
 */
/*
 * Clips a fixed-width cell. The clip box reaches 4px past the text on each side and 2px above and
 * below (padding, cancelled by an equal negative margin), so a control's hover fill, focus ring and
 * descenders aren't cut off while the text stays exactly where it was.
 */
const CellBox = styled.div`
  width: calc(var(--column-width) - 2 * var(--space-3) + 2 * var(--space-1));
  margin: -2px calc(var(--space-1) * -1);
  padding: 2px var(--space-1);
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Th = styled.th<{ $align?: "left" | "right"; $sticky?: boolean }>`
  height: var(--row-height);
  padding: 0 var(--space-3);
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
  pending,
}: {
  column: TableColumn<T> & { sortKey: string };
  sort?: TableSort;
  onSortChange: (next: TableSort) => void;
  pending?: boolean;
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
          {pending ? (
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

/* Stale rows while the next ones load, semantically only: the visible dimming lives on Td (below). */
const Body = styled.tbody``;

/*
 * Every cell is single-line, so every row is exactly --row-height. While busy, plain cell text fades
 * toward the background instead of using `opacity`: opacity would fade a status badge's fill and text
 * together and, doing the same to both, still leaves too little contrast between them (measured 2.37:1
 * for the Status column's info badge at 0.6 opacity, short of the 4.5:1 WCAG 1.4.3 needs). `color-mix`
 * only touches text that inherits this color — Badge and the other status/danger colors set their own,
 * so they stay fully legible — and 78% keeps even the palette's most muted table text at 4.5:1+.
 */
const Td = styled.td<{ $align?: "left" | "right"; $busy?: boolean }>`
  height: var(--row-height);
  padding: 0 var(--space-3);
  white-space: nowrap;
  color: var(--color-text);
  text-align: ${({ $align }) => $align ?? "left"};
  vertical-align: middle;
  transition: color var(--duration) var(--ease);

  ${({ $busy }) =>
    $busy &&
    `color: color-mix(in srgb, var(--color-text) 78%, var(--color-bg));`}
`;

const Row = styled.tr<{ $clickable?: boolean }>`
  &:not(:first-child) {
    border-top: 1px solid var(--color-border);
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

/** Data attributes and the measured left offset for a frozen column's cells; the header also carries the column's fixed width. */
function frozenProps(index: number, frozen: number, offsets: number[], width?: string) {
  if (index >= frozen) return width ? { style: { width } } : {};
  const last = index === frozen - 1;
  const edge = index === 0 ? (last ? "all" : "narrow") : last ? "wide" : undefined;
  return {
    "data-frozen": "",
    "data-frozen-rest": index > 0 ? "" : undefined,
    "data-frozen-edge": edge,
    style: { "--frozen-left": `${offsets[index] ?? 0}px`, width } as React.CSSProperties,
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
  sortPending = false,
  stickyColumns = 0,
  "aria-label": ariaLabel,
}: TableProps<T>) {
  const visibleColumns = columns.filter(
    (col) => !col.isEmpty || isFilterActive(col.filter) || !rows.every(col.isEmpty),
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

  // Frozen columns only stick when the table is wider than its container (data-overflowing), and the
  // edge divider and shadow only show while scrolled sideways (data-scrolled). Both are set on the DOM
  // directly, so scrolling never re-renders the table.
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const hasRows = rows.length > 0;
  React.useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const table = tableRef.current;
    if (frozen < 1 || !wrapper || !table) return;
    const update = () => {
      const overflowing = wrapper.scrollWidth > wrapper.clientWidth + 1;
      wrapper.toggleAttribute("data-overflowing", overflowing);
      wrapper.toggleAttribute("data-scrolled", overflowing && wrapper.scrollLeft > 0);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(wrapper);
    observer.observe(table);
    wrapper.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      wrapper.removeEventListener("scroll", update);
    };
  }, [frozen, hasRows]);

  if (!hasRows) return <>{empty}</>;

  const fixed = visibleColumns.every((col) => col.width);

  return (
    <Wrapper ref={wrapperRef}>
      <StyledTable
        ref={tableRef}
        aria-label={ariaLabel}
        aria-busy={busy || sortPending || undefined}
        data-fixed={fixed ? "" : undefined}
      >
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
                  <SortableHeader column={{ ...col, sortKey }} sort={sort} onSortChange={onSortChange} pending={sortPending} />
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
                  {...frozenProps(index, frozen, offsets, col.width)}
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
        <Body>
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
                  <Td key={col.key} $align={col.align} $busy={busy} {...frozenProps(index, frozen, offsets)}>
                    {col.width ? (
                      <CellBox style={{ "--column-width": col.width } as React.CSSProperties}>{col.render(row)}</CellBox>
                    ) : (
                      col.render(row)
                    )}
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
