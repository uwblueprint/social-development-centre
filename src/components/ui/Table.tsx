"use client";

import * as React from "react";
import { styled } from "next-yak";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { Icon } from "./Icon";

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
    z-index: 1;
    background: var(--color-bg);
  `}
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
}: {
  column: TableColumn<T> & { sortKey: string };
  sort?: TableSort;
  onSortChange: (next: TableSort) => void;
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
          <Icon icon={active === "asc" ? ArrowUp : ArrowDown} size={SORT_ICON_SIZE} />
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

  &:focus-visible {
    position: relative;
    z-index: 1;
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

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
  "aria-label": ariaLabel,
}: TableProps<T>) {
  if (rows.length === 0) return <>{empty}</>;

  return (
    <Wrapper>
      <StyledTable aria-label={ariaLabel}>
        <thead>
          <tr>
            {columns.map((col) => {
              const sortKey = onSortChange ? col.sortKey : undefined;
              const ariaSort =
                sortKey === undefined
                  ? undefined
                  : sort?.key === sortKey
                    ? sort.direction === "asc"
                      ? "ascending"
                      : "descending"
                    : "none";
              return (
                <Th key={col.key} scope="col" aria-sort={ariaSort} $align={col.align} $sticky={sticky}>
                  {sortKey !== undefined && onSortChange ? (
                    <SortableHeader column={{ ...col, sortKey }} sort={sort} onSortChange={onSortChange} />
                  ) : (
                    col.header
                  )}
                </Th>
              );
            })}
          </tr>
        </thead>
        <tbody>
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
                {columns.map((col) => (
                  <Td key={col.key} $align={col.align}>
                    {col.render(row)}
                  </Td>
                ))}
              </Row>
            );
          })}
        </tbody>
      </StyledTable>
    </Wrapper>
  );
}
