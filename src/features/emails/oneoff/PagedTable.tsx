"use client";

import { useState, type ReactNode } from "react";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { SearchField } from "@/components/ui/SearchField";
import { Table, type TableColumn } from "@/components/ui/Table";
import { PAGE_SIZE } from "./copy";
import { Stack } from "./parts";

/**
 * A client-paged table with a filter box once it is longer than one page, so one row and hundreds both work.
 * Real lists are paged by the server; this prototype pages in memory.
 */
export function PagedTable<T>({
  rows,
  columns,
  getRowId,
  ariaLabel,
  searchText,
  filterLabel,
  empty,
  onRowClick,
}: {
  rows: T[];
  columns: TableColumn<T>[];
  getRowId: (row: T) => string;
  ariaLabel: string;
  searchText: (row: T) => string;
  filterLabel?: string;
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
}) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const query = q.trim().toLowerCase();
  const filtered = query
    ? rows.filter((r) => searchText(r).toLowerCase().includes(query))
    : rows;
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const slice = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <Stack>
      {filterLabel && rows.length > PAGE_SIZE && (
        <SearchField
          aria-label={filterLabel}
          placeholder={filterLabel}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          onSearch={() => {}}
        />
      )}
      <Table
        aria-label={ariaLabel}
        columns={columns}
        rows={slice}
        getRowId={getRowId}
        onRowClick={onRowClick}
        empty={
          query ? (
            <EmptyState icon={SearchX} title={`No match for “${q.trim()}”`} />
          ) : (
            empty
          )
        }
      />
      {pageCount > 1 && (
        <Pagination
          page={current}
          pageCount={pageCount}
          pageSize={PAGE_SIZE}
          total={filtered.length}
          onPageChange={setPage}
        />
      )}
    </Stack>
  );
}
