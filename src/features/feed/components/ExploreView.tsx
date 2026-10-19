"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { keyframes, styled } from "next-yak";
import { Search, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { SearchField } from "@/components/ui/SearchField";
import { Select } from "@/components/ui/Select";
import { RemovableTag, SelectableTag } from "@/components/ui/Tag";
import { ACCESSIBILITY_LABEL, AREA_LABEL, KINDS, TOPIC_LABEL } from "@/features/opportunities/catalog";
import type { Opportunity, OpportunityKind } from "@/features/opportunities/types";
import { feedCopy } from "../copy";
import { applyFilters, EMPTY_FILTERS, filtersToQuery, hasAnyFilter, kindCounts, matchedTopics, sheetFilterCount } from "../matching";
import type { ExploreFilters, SortKey } from "../types";
import { CardGrid, FeedHeader, FeedLead, FeedPage, FeedTitle } from "./FeedPage";
import { FeedCard } from "./FeedCard";
import { FilterSheet } from "./FilterSheet";
import { useMember } from "./MemberProvider";

const PAGE_SIZE = 12;

const KIND_CHIP: Record<OpportunityKind, string> = {
  event: "Events",
  petition: "Petitions",
  volunteer: "Volunteering",
  job: "Jobs",
  other: "Other",
};

/*
 * The search and filter bar sticks under the top bar, so it's there whenever the list is. On a phone its chips
 * scroll sideways to the screen edge.
 */
const Toolbar = styled.div`
  position: sticky;
  top: var(--header-height);
  z-index: var(--z-sticky);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: 0 calc(var(--gutter) * -1);
  padding: var(--space-3) var(--gutter);
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
`;

const SearchRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`;

const SearchWrap = styled.div`
  flex: 1;
  min-width: 0;
  max-width: calc(var(--space-8) * 7);
`;

const SortWrap = styled.div`
  margin-left: auto;
  width: calc(var(--space-8) * 2.5);

  @media (max-width: 767px) {
    display: none;
  }
`;

const Chips = styled.div`
  display: flex;
  gap: var(--space-2);
  margin: 0 calc(var(--gutter) * -1);
  padding: var(--space-1) var(--gutter);
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
  & > * {
    flex-shrink: 0;
  }
`;

const pop = keyframes`
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
`;

const Applied = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);

  & > span {
    animation: ${pop} var(--duration) var(--ease) both;
  }
`;

const ResultsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
`;

const Results = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
`;

const PhoneSort = styled.div`
  width: calc(var(--space-8) * 2.5);

  @media (min-width: 768px) {
    display: none;
  }
`;

const More = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
`;

const Progress = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

/*
 * Everything open right now, with filters. Filtering and sorting run in the browser, so every tap answers
 * instantly; the URL follows along (without adding history entries) so a filtered view can be shared or reloaded.
 */
export function ExploreView({ items, initialFilters }: { items: Opportunity[]; initialFilters: ExploreFilters }) {
  const { interests, now } = useMember();
  const pathname = usePathname();
  const [filters, setFilters] = React.useState(initialFilters);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [shown, setShown] = React.useState(PAGE_SIZE);
  const t = feedCopy.explore;

  const update = React.useCallback((next: ExploreFilters) => {
    setFilters(next);
    setShown(PAGE_SIZE);
  }, []);

  React.useEffect(() => {
    const query = filtersToQuery(filters);
    window.history.replaceState(window.history.state, "", query ? `${pathname}?${query}` : pathname);
  }, [filters, pathname]);

  const results = React.useMemo(() => applyFilters(items, filters, interests, now), [items, filters, interests, now]);
  const counts = React.useMemo(() => kindCounts(items, filters, now), [items, filters, now]);
  const sheetCount = sheetFilterCount(filters);
  const visible = results.slice(0, shown);

  const toggleKind = (kind: OpportunityKind) =>
    update({ ...filters, kinds: filters.kinds.includes(kind) ? filters.kinds.filter((k) => k !== kind) : [...filters.kinds, kind] });

  const sortSelect = (
    <Select
      aria-label={t.sortLabel}
      value={filters.sort}
      onValueChange={(sort) => update({ ...filters, sort: sort as SortKey })}
      options={(Object.keys(t.sort) as SortKey[]).map((value) => ({ value, label: t.sort[value] }))}
    />
  );

  const applied: { key: string; label: string; remove: () => void }[] = [
    ...filters.topics.map((id) => ({ key: `t-${id}`, label: TOPIC_LABEL[id], remove: () => update({ ...filters, topics: filters.topics.filter((x) => x !== id) }) })),
    ...(filters.when !== "any" ? [{ key: "when", label: t.whenTag[filters.when], remove: () => update({ ...filters, when: "any" as const }) }] : []),
    ...filters.areas.map((id) => ({ key: `a-${id}`, label: AREA_LABEL[id], remove: () => update({ ...filters, areas: filters.areas.filter((x) => x !== id) }) })),
    ...(filters.freeOnly ? [{ key: "free", label: t.freeTag, remove: () => update({ ...filters, freeOnly: false }) }] : []),
    ...filters.accessibility.map((id) => ({ key: `x-${id}`, label: ACCESSIBILITY_LABEL[id], remove: () => update({ ...filters, accessibility: filters.accessibility.filter((x) => x !== id) }) })),
  ];

  return (
    <FeedPage>
      <FeedHeader>
        <div>
          <FeedTitle>{t.title}</FeedTitle>
          <FeedLead>{t.lead}</FeedLead>
        </div>
      </FeedHeader>

      <Toolbar>
        <SearchRow>
          <SearchWrap>
            <SearchField
              aria-label={t.searchLabel}
              placeholder={t.searchPlaceholder}
              defaultValue={filters.q}
              onSearch={(q) => update({ ...filters, q })}
            />
          </SearchWrap>
          <Button type="button" $variant="outline" aria-label={sheetCount ? t.filtersCount(sheetCount) : undefined} onClick={() => setSheetOpen(true)}>
            <Icon icon={SlidersHorizontal} size={16} />
            {t.filters}
            {sheetCount > 0 && <Badge $variant="primary">{sheetCount}</Badge>}
          </Button>
          <SortWrap>{sortSelect}</SortWrap>
        </SearchRow>
        <Chips role="group" aria-label={t.typesLabel}>
          <SelectableTag selected={filters.kinds.length === 0} onClick={() => update({ ...filters, kinds: [] })}>
            {t.allTypes}
          </SelectableTag>
          {KINDS.map((kind) => (
            <SelectableTag key={kind} selected={filters.kinds.includes(kind)} onClick={() => toggleKind(kind)}>
              {KIND_CHIP[kind]} · {counts[kind] ?? 0}
            </SelectableTag>
          ))}
        </Chips>
      </Toolbar>

      {applied.length > 0 && (
        <Applied role="group" aria-label={t.activeLabel}>
          {applied.map((a) => (
            <RemovableTag key={a.key} onRemove={a.remove}>
              {a.label}
            </RemovableTag>
          ))}
          <Button type="button" $variant="ghost" $size="sm" onClick={() => update({ ...EMPTY_FILTERS, q: filters.q, kinds: filters.kinds, sort: filters.sort })}>
            {t.clearAll}
          </Button>
        </Applied>
      )}

      {items.length === 0 ? (
        <EmptyState icon={Search} title={t.empty.none.title} description={t.empty.none.body} />
      ) : (
        <>
          <ResultsRow>
            <Results role="status">{t.results(results.length)}</Results>
            <PhoneSort>{sortSelect}</PhoneSort>
          </ResultsRow>
          {results.length === 0 ? (
            <EmptyState
              icon={Search}
              title={t.empty.noMatches.title}
              description={t.empty.noMatches.body}
              action={
                hasAnyFilter(filters) && (
                  <Button type="button" $variant="outline" onClick={() => update({ ...EMPTY_FILTERS, sort: filters.sort })}>
                    {t.empty.noMatches.action}
                  </Button>
                )
              }
            />
          ) : (
            <>
              <CardGrid aria-label={t.title}>
                {visible.map((o, i) => (
                  <li key={o.id}>
                    <FeedCard opportunity={o} because={matchedTopics(o, interests)[0]} index={i % PAGE_SIZE} />
                  </li>
                ))}
              </CardGrid>
              {results.length > shown && (
                <More>
                  <Progress>{t.showingOf(visible.length, results.length)}</Progress>
                  <Button type="button" $variant="outline" onClick={() => setShown((n) => n + PAGE_SIZE)}>
                    {t.showMore}
                  </Button>
                </More>
              )}
            </>
          )}
        </>
      )}

      <FilterSheet open={sheetOpen} onOpenChange={setSheetOpen} filters={filters} onChange={update} resultCount={results.length} />
    </FeedPage>
  );
}
