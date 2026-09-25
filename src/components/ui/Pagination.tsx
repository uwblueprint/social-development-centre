"use client";

import { styled } from "next-yak";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";
import { Icon } from "./Icon";

const Wrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
`;

const Summary = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-1);
`;

const PageButton = styled.button<{ $active?: boolean }>`
  all: unset;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--color-text);
  cursor: pointer;
  transition: background-color var(--duration) var(--ease), color var(--duration) var(--ease);

  &:hover {
    background: var(--color-bg-hover);
  }
  &:focus-visible {
    box-shadow: var(--focus-ring);
  }

  ${({ $active }) =>
    $active &&
    `
    background: var(--color-primary);
    color: var(--color-on-primary);
  `}
`;

const Ellipsis = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
`;

/** First, last, current ±1, with a single ellipsis on either side when pages are skipped. */
function pageWindow(page: number, pageCount: number): (number | "ellipsis")[] {
  const out: (number | "ellipsis")[] = [1];
  const left = Math.max(2, page - 1);
  const right = Math.min(pageCount - 1, page + 1);
  if (left > 2) out.push("ellipsis");
  for (let i = left; i <= right; i++) out.push(i);
  if (right < pageCount - 1) out.push("ellipsis");
  if (pageCount > 1) out.push(pageCount);
  return out;
}

export interface PaginationProps {
  /** Current 1-based page. */
  page: number;
  pageCount: number;
  /** Rows per page, used for the "Showing X–Y of Z" summary. */
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

/**
 * Page summary ("Showing 51–100 of 962") plus Previous/Next and numbered page
 * controls. Presentational only — the caller owns the URL or state that
 * `page` reflects and applies `onPageChange`. Renders nothing when there's
 * only one page.
 */
export function Pagination({ page, pageCount, pageSize, total, onPageChange }: PaginationProps) {
  if (pageCount <= 1) return null;

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <Wrap>
      <Summary>
        Showing {start}–{end} of {total}
      </Summary>
      <Controls role="navigation" aria-label="Pagination">
        <Button
          type="button"
          $variant="secondary"
          $size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <Icon icon={ChevronLeft} size={14} />
          Previous
        </Button>
        {pageWindow(page, pageCount).map((p, i) =>
          p === "ellipsis" ? (
            <Ellipsis key={`ellipsis-${i}`} aria-hidden="true">
              …
            </Ellipsis>
          ) : (
            <PageButton
              key={p}
              type="button"
              $active={p === page}
              aria-current={p === page ? "page" : undefined}
              aria-label={`Page ${p}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </PageButton>
          ),
        )}
        <Button
          type="button"
          $variant="secondary"
          $size="sm"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <Icon icon={ChevronRight} size={14} />
        </Button>
      </Controls>
    </Wrap>
  );
}
