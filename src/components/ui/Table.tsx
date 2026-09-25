"use client";

import * as React from "react";
import { styled } from "next-yak";

export interface TableColumn<T> {
  /** Unique key for the column; also used as the React key for its header/body cells. */
  key: string;
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
  align?: "left" | "right";
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
  "aria-label"?: string;
}

const Wrapper = styled.div`
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
 */
export function Table<T>({
  columns,
  rows,
  getRowId,
  onRowClick,
  sticky,
  empty,
  "aria-label": ariaLabel,
}: TableProps<T>) {
  if (rows.length === 0) return <>{empty}</>;

  return (
    <Wrapper>
      <StyledTable aria-label={ariaLabel}>
        <thead>
          <tr>
            {columns.map((col) => (
              <Th key={col.key} scope="col" $align={col.align} $sticky={sticky}>
                {col.header}
              </Th>
            ))}
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
