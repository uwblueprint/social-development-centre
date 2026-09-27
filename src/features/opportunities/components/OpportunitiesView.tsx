"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { styled } from "next-yak";
import { Archive, FilePen, FilterX, Megaphone, Plus, Search as SearchIcon } from "lucide-react";
import { ListPage, ListPageHeader, ListPageToolbar, useListParams, useListSearch, useListSort } from "@/components/patterns/ListPage";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { SearchField } from "@/components/ui/SearchField";
import { Sheet, SheetContent } from "@/components/ui/Sheet";
import { Table, type TableColumnFilter } from "@/components/ui/Table";
import { Tabs, TabsContent, TabsCount, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { KIND_LABEL, KINDS } from "../catalog";
import { copy } from "../copy";
import type {
  Opportunity,
  OpportunityActions,
  OpportunityCounts,
  OpportunityFilterCounts,
  OpportunityFilters,
  OpportunityTab,
  OrganizationFilterOption,
} from "../types";
import { defaultSort } from "./listParams";
import { opportunityColumns } from "./opportunityColumns";
import { OpportunitySheetContent } from "./OpportunitySheetContent";

const TabContentBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const TABS: OpportunityTab[] = ["published", "drafts", "closed"];
const EMPTY_ICON = { published: Megaphone, drafts: FilePen, closed: Archive } as const;

function normalizeTab(value: string): OpportunityTab {
  return value === "drafts" || value === "closed" ? value : "published";
}

export interface OpportunitiesViewProps {
  scope: "admin" | "partner";
  /** Where this portal's list lives, e.g. "/admin/opportunities". New and edit pages hang off it. */
  basePath: string;
  tab: OpportunityTab;
  filters: Omit<OpportunityFilters, "tab">;
  items: Opportunity[];
  counts: OpportunityCounts;
  /** Per-value counts for the Type and Organization column filters (getFilterCounts). */
  filterCounts: OpportunityFilterCounts;
  /** Admin only: organizations for the Organization filter (listOrganizationFilterOptions). */
  organizations?: OrganizationFilterOption[];
  actions: OpportunityActions;
}

/** The Opportunities list shared by the admin and partner portals: status tabs, filters, table and side panel. */
export function OpportunitiesView({
  scope,
  basePath,
  tab,
  filters,
  items,
  counts,
  filterCounts,
  organizations,
  actions,
}: OpportunitiesViewProps) {
  const router = useRouter();
  const { setParams: syncUrl, pending: paramsPending } = useListParams();
  const searchState = useListSearch(filters.q ?? "");
  // Sorting is server-side through ?sort and ?dir; without them each tab keeps its default order.
  const { sort, setSort, pending: sortPending } = useListSort(defaultSort(tab));

  const [activeTab, setActiveTab] = React.useState<OpportunityTab>(tab);

  // Keeps local UI state in step with the URL (e.g. browser back/forward)
  // without an effect: derived at render time from the server-provided props.
  const [prevTab, setPrevTab] = React.useState(tab);
  if (tab !== prevTab) {
    setPrevTab(tab);
    setActiveTab(tab);
  }

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const selected = items.find((o) => o.id === selectedId);

  function handleTabChange(value: string) {
    const next = normalizeTab(value);
    setActiveTab(next);
    setSelectedId(null);
    syncUrl({ tab: next === "published" ? undefined : next });
  }

  function clearFilters() {
    searchState.setValue("");
    syncUrl({ q: undefined, kind: undefined, org: undefined });
  }

  const kinds = filters.kinds ?? [];
  const organizationIds = filters.organizationIds ?? [];
  // Options list values with listings in this tab, plus anything already selected so it can be cleared.
  const typeFilter: TableColumnFilter = {
    label: copy.toolbar.typeLabel,
    options: KINDS.filter((k) => filterCounts.kinds[k] || kinds.includes(k)).map((k) => ({
      value: k,
      label: KIND_LABEL[k],
      count: filterCounts.kinds[k] ?? 0,
    })),
    selected: kinds,
    onChange: (values) => syncUrl({ kind: values.join(",") || undefined }),
  };
  const organizationFilter: TableColumnFilter | undefined =
    scope === "admin"
      ? {
          label: copy.toolbar.organizationLabel,
          options: (organizations ?? [])
            .filter((o) => filterCounts.organizations[o.id] || organizationIds.includes(o.id))
            .map((o) => ({
              value: o.id,
              label: o.removed ? copy.removedPartnerFilterOption(o.name) : o.name,
              count: filterCounts.organizations[o.id] ?? 0,
            })),
          selected: organizationIds,
          onChange: (values) => syncUrl({ org: values.join(",") || undefined }),
        }
      : undefined;

  const filtered = !!(filters.q || kinds.length > 0 || (scope === "admin" && organizationIds.length > 0));
  // Row content follows the server's tab (not the optimistic one) so it always matches `items`.
  const columns = opportunityColumns(scope, tab, { type: typeFilter, organization: organizationFilter });

  return (
    <ListPage>
      <ListPageHeader
        title={copy.page.title}
        actions={
          <Button type="button" onClick={() => router.push(`${basePath}/new`)}>
            <Icon icon={Plus} size={16} />
            {copy.page.newButton}
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <ListPageToolbar
          tabs={
            <TabsList aria-label={copy.page.title}>
              {TABS.map((t) => (
                <TabsTrigger key={t} value={t}>
                  {copy.tabs[t]}
                  <TabsCount>({counts[t]})</TabsCount>
                </TabsTrigger>
              ))}
            </TabsList>
          }
          search={
            <SearchField
              name="q"
              aria-label={copy.toolbar.searchLabel}
              placeholder={copy.toolbar.searchPlaceholder}
              value={searchState.value}
              onChange={(event) => searchState.setValue(event.target.value)}
              onSearch={searchState.search}
              pending={searchState.pending}
            />
          }
        />

        <TabsContent value={activeTab}>
          <TabContentBody>
            <Table
              columns={columns}
              rows={items}
              getRowId={(o) => o.id}
              onRowClick={(o) => setSelectedId(o.id)}
              sort={sort}
              onSortChange={setSort}
              busy={paramsPending || sortPending || searchState.pending}
              aria-label={copy.tabs[tab]}
              empty={
                filtered ? (
                  <EmptyState
                    icon={SearchIcon}
                    title={copy.empty.noResults.title}
                    description={copy.empty.noResults.body}
                    action={
                      <Button type="button" $variant="secondary" onClick={clearFilters}>
                        <Icon icon={FilterX} size={16} />
                        {copy.empty.noResults.clear}
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState icon={EMPTY_ICON[tab]} title={copy.empty[tab].title} description={copy.empty[tab].body} />
                )
              }
            />
          </TabContentBody>
        </TabsContent>
      </Tabs>

      <Sheet open={selected !== undefined} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent aria-describedby={undefined}>
          {selected && (
            <OpportunitySheetContent
              key={selected.id}
              opportunity={selected}
              basePath={basePath}
              actions={actions}
              onDeleted={() => setSelectedId(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </ListPage>
  );
}
