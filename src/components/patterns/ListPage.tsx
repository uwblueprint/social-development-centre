"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { styled } from "next-yak";

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
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
`;

/** One compact row: the page's h1 on the left, its actions (buttons with icons) on the right. No description. */
export function ListPageHeader({ title, actions }: { title: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <Header>
      <Title>{title}</Title>
      {actions && <Actions>{actions}</Actions>}
    </Header>
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
 */
export function ListPageToolbar({ tabs, search }: { tabs: React.ReactNode; search?: React.ReactNode }) {
  return (
    <ToolbarContainer>
      <ToolbarRow>
        <ToolbarTabs>{tabs}</ToolbarTabs>
        {search && <ToolbarSearch>{search}</ToolbarSearch>}
      </ToolbarRow>
    </ToolbarContainer>
  );
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
