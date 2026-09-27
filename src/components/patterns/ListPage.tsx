"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { styled } from "next-yak";
import { ArrowRight, FunnelX, SearchX, X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import type { TableSort } from "@/components/ui/Table";

/**
 * Every string the list pattern writes itself (not the caller's nouns, scopes or filter names).
 * The owner edits them here. See docs/ux/portal.md, "Empty and error states".
 */
export const listEmptyCopy = {
  /** "No paying members match “ada”", or with filters: "No closed jobs from Northside Food Bank match “ada”". */
  searchTitle: (items: string, query: string) => `No ${items} match “${query}”`,
  /** Search finds nothing here but matches in another tab or view. */
  elsewhere: (count: number, scope: string) => `${count} ${count === 1 ? "match" : "matches"} in ${scope}`,
  showIn: (scope: string) => `Show in ${scope}`,
  /** Search finds nothing anywhere. */
  searched: (fields: string) => `Searched ${fields}. Check the spelling, or clear the search.`,
  clearSearch: "Clear search",
  /** Filters hide everything: the title is "No " + the caller's description of the filtered items. */
  filtersTitle: (filtered: string) => `No ${filtered}`,
  filtersBody: "Nothing matches these filters.",
  clearFilters: "Clear filters",
  /** Search plus filters. */
  searchAndFiltersBody: (fields: string) => `Searched ${fields} with these filters on. Check the spelling, or clear the search and filters.`,
  clearSearchAndFilters: "Clear search and filters",
  /** Screen-reader announcement after search results settle (ListPageToolbar's `results`). */
  results: (count: number) => `${count} ${count === 1 ? "result" : "results"}`,
  noResults: "No results",
} as const;

/** Page body for a list page: fills the available width (no max-width), so tables use wide monitors. */
export const ListPage = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  min-width: 0;
  padding: var(--space-5) var(--space-6);

  @media (max-width: 767px) {
    gap: var(--space-4);
    padding: var(--space-4);
  }
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
  min-height: 36px;
`;

const Title = styled.h1`
  margin: 0;
  min-width: 0;
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  letter-spacing: var(--tracking-tight);

  /* Focused by script only (after choosing a section in the mobile drawer); it isn't a control. */
  &:focus {
    outline: none;
  }
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
`;

/**
 * One compact row: the page's h1 on the left, its actions (buttons with icons) on the right. No description.
 * The h1 takes focus (tabIndex -1) when the person arrives from the mobile navigation drawer.
 */
export function ListPageHeader({ title, actions }: { title: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <Header>
      <Title tabIndex={-1}>{title}</Title>
      {actions && <Actions>{actions}</Actions>}
    </Header>
  );
}

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

/**
 * Politely announces "{n} results" or "No results" once a search settles (not on first load, and not
 * while the next results are still loading). Each message is a new node, so the same text is still
 * announced for a new search.
 */
function SearchAnnouncer({ query, count, pending }: { query: string; count: number; pending: boolean }) {
  const key = `${query}\u0000${count}`;
  const [announced, setAnnounced] = React.useState(key);
  const [message, setMessage] = React.useState({ id: 0, text: "" });
  if (!pending && key !== announced) {
    setAnnounced(key);
    setMessage((prev) => ({
      id: prev.id + 1,
      text: query ? (count === 0 ? listEmptyCopy.noResults : listEmptyCopy.results(count)) : "",
    }));
  }
  return (
    <VisuallyHidden aria-live="polite" aria-atomic="true">
      <span key={message.id}>{message.text}</span>
    </VisuallyHidden>
  );
}

const ToolbarContainer = styled.div`
  container-type: inline-size;
  min-width: 0;
`;

/*
 * The tab list sits flush with the bottom edge, so its own 1px line and the toolbar's line coincide
 * and read as one line running under the search field too.
 */
const ToolbarRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-2) var(--space-4);
  box-shadow: inset 0 -1px 0 var(--color-border);

  /* Narrow (360px phones, or a crowded tab list): search wraps to its own full-width row under the
     tabs, keeping visual order = focus order. The tab list's own line then ends the tab row. */
  @container (max-width: 560px) {
    flex-direction: column;
    align-items: stretch;
    box-shadow: none;
  }
`;

const ToolbarTabs = styled.div`
  flex: 0 1 auto;
  min-width: 0;
`;

const ToolbarSearch = styled.div`
  flex: 0 1 280px;
  min-width: 200px;
  margin-bottom: var(--space-2);

  @container (max-width: 560px) {
    flex-basis: auto;
    min-width: 0;
    margin: var(--space-2) 0 0;
  }
`;

/**
 * Tabs on the left, search on the right, in one row (search wraps under the tabs when narrow).
 * Render it inside `<Tabs>` and pass the `TabsList` as `tabs` and a `SearchField` as `search`.
 * `results` drives a polite screen-reader announcement ("{n} results" / "No results") once a search
 * settles: pass the server's current `q`, the number of rows it matched in this view, and the search's `pending`.
 */
export function ListPageToolbar({
  tabs,
  search,
  results,
}: {
  tabs: React.ReactNode;
  search?: React.ReactNode;
  results?: { query: string; count: number; pending: boolean };
}) {
  return (
    <ToolbarContainer>
      <ToolbarRow>
        <ToolbarTabs>{tabs}</ToolbarTabs>
        {search && <ToolbarSearch>{search}</ToolbarSearch>}
      </ToolbarRow>
      {results && <SearchAnnouncer {...results} />}
    </ToolbarContainer>
  );
}

export interface ListEmptyStateProps {
  /** What the list holds, plural and lowercase as it reads mid-sentence: "members", "paying members". */
  items: string;
  /** The server's current search (`q`), trimmed; "" or omitted when not searching. */
  query?: string;
  /** What the search looks in, for "Searched {fields}.": "names and emails". */
  searchedFields?: string;
  /** Clears the search (Clear search). Needed whenever `query` can be set. */
  onClearSearch?: () => void;
  /**
   * The same search's matches in another tab or view. When `count` > 0 and nothing matches here, the
   * state says so and offers a button to switch there. Use the per-tab counts computed with the search.
   * `body` replaces the default "{n} matches in {scope}" when the page knows more (e.g. the matches are unsubscribed).
   */
  elsewhere?: { count: number; scope: string; onShow: () => void; body?: string };
  /**
   * The active filters (beyond search), described as the items they'd show, e.g. "closed jobs from
   * Northside Food Bank". Omit when no filter is on.
   */
  filtered?: string;
  /** Resets the filters (Clear filters). Needed whenever `filtered` can be set. */
  onClearFilters?: () => void;
  /** Clears the search and resets the filters in one URL update (Clear search and filters). */
  onClearSearchAndFilters?: () => void;
  /** The truly empty state (no search, no filters): the caller's own title, body and optional action. */
  empty: { icon: LucideIcon; title: string; description?: string; action?: React.ReactNode };
}

/**
 * A list's empty state, tailored to why it's empty. It picks one of five variants from its props:
 * search matches elsewhere, search matches nothing, filters hide everything, search plus filters, or
 * truly empty. Each says what's empty, why, and offers the one action that fixes it.
 * Render it as the `Table`'s `empty`.
 */
export function ListEmptyState({
  items,
  query = "",
  searchedFields = "",
  onClearSearch,
  elsewhere,
  filtered,
  onClearFilters,
  onClearSearchAndFilters,
  empty,
}: ListEmptyStateProps) {
  const c = listEmptyCopy;

  if (query && elsewhere && elsewhere.count > 0) {
    return (
      <EmptyState
        icon={SearchX}
        title={c.searchTitle(filtered ?? items, query)}
        description={elsewhere.body ?? c.elsewhere(elsewhere.count, elsewhere.scope)}
        action={
          <Button type="button" $variant="secondary" onClick={elsewhere.onShow}>
            {c.showIn(elsewhere.scope)}
            <Icon icon={ArrowRight} size={16} />
          </Button>
        }
      />
    );
  }

  if (query && filtered) {
    return (
      <EmptyState
        icon={SearchX}
        title={c.searchTitle(filtered, query)}
        description={c.searchAndFiltersBody(searchedFields)}
        action={
          onClearSearchAndFilters && (
            <Button type="button" $variant="secondary" onClick={onClearSearchAndFilters}>
              <Icon icon={X} size={16} />
              {c.clearSearchAndFilters}
            </Button>
          )
        }
      />
    );
  }

  if (query) {
    return (
      <EmptyState
        icon={SearchX}
        title={c.searchTitle(items, query)}
        description={c.searched(searchedFields)}
        action={
          onClearSearch && (
            <Button type="button" $variant="secondary" onClick={onClearSearch}>
              <Icon icon={X} size={16} />
              {c.clearSearch}
            </Button>
          )
        }
      />
    );
  }

  if (filtered) {
    return (
      <EmptyState
        icon={FunnelX}
        title={c.filtersTitle(filtered)}
        description={c.filtersBody}
        action={
          onClearFilters && (
            <Button type="button" $variant="secondary" onClick={onClearFilters}>
              <Icon icon={FunnelX} size={16} />
              {c.clearFilters}
            </Button>
          )
        }
      />
    );
  }

  return <EmptyState icon={empty.icon} title={empty.title} description={empty.description} action={empty.action} />;
}

/**
 * Updates the list's URL params with `router.replace` (no history entry per keystroke), keeping every
 * param it isn't told to change. `undefined` or "" removes a param. `pending` is true until the new
 * page has rendered.
 */
export function useListParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = React.useTransition();

  const setParams = React.useCallback(
    (next: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(next)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      const qs = params.toString();
      startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [router, pathname, searchParams],
  );

  return { setParams, pending };
}

/**
 * State for a list page's `SearchField`, backed by the `q` URL param. `search` writes `q`, resets to
 * page 1 and keeps the other params; `pending` drives the field's spinner. `q` is the server's current
 * value: when it changes from outside (back/forward, "Clear filters"), the field follows it, but a
 * response for an older search never overwrites what the person has typed since.
 */
export function useListSearch(q: string) {
  const { setParams, pending } = useListParams();
  const [value, setValue] = React.useState(q);
  const [requested, setRequested] = React.useState(q);
  const [prevQ, setPrevQ] = React.useState(q);
  if (q !== prevQ) {
    setPrevQ(q);
    if (q !== requested) {
      setRequested(q);
      setValue(q);
    }
  }

  function search(text: string) {
    const next = text.trim();
    if (next === requested) return;
    setRequested(next);
    setParams({ q: next || undefined, page: undefined });
  }

  return { value, setValue, search, pending };
}

/**
 * Sort state for a list page's `Table`, backed by the `sort` (a column's `sortKey`) and `dir`
 * (`asc` | `desc`) URL params. Pass `sort` and `setSort` to the table as `sort` and `onSortChange`.
 * `setSort` writes both params with `router.replace`, resets to page 1 and keeps the rest. `fallback`
 * is the server's default order: it shows as the active column when the URL has no sort, and choosing
 * it removes the params. The server validates `sort` against its own list of sortable columns.
 */
export function useListSort(fallback?: TableSort) {
  const searchParams = useSearchParams();
  const { setParams, pending } = useListParams();
  const key = searchParams.get("sort");
  const dir = searchParams.get("dir");
  const sort: TableSort | undefined = key
    ? { key, direction: dir === "desc" ? "desc" : "asc" }
    : fallback;

  const fallbackKey = fallback?.key;
  const fallbackDirection = fallback?.direction;
  const setSort = React.useCallback(
    (next: TableSort) => {
      const isFallback = next.key === fallbackKey && next.direction === fallbackDirection;
      setParams({
        sort: isFallback ? undefined : next.key,
        dir: isFallback ? undefined : next.direction,
        page: undefined,
      });
    },
    [setParams, fallbackKey, fallbackDirection],
  );

  return { sort, setSort, pending };
}
