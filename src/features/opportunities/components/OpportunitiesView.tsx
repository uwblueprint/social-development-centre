"use client";

import * as React from "react";
import Link from "next/link";
import { styled } from "next-yak";
import { Archive, ChevronDown, FilePen, FilterX, Megaphone, Plus, Search as SearchIcon } from "lucide-react";
import { ListPage, ListPageHeader, ListPageToolbar, useListParams, useListSearch } from "@/components/patterns/ListPage";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { SearchField } from "@/components/ui/SearchField";
import { Select } from "@/components/ui/Select";
import { Sheet, SheetContent } from "@/components/ui/Sheet";
import { Table } from "@/components/ui/Table";
import { Tabs, TabsContent, TabsCount, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { KIND_LABEL, KINDS } from "../catalog";
import { copy } from "../copy";
import type {
  Opportunity,
  OpportunityActions,
  OpportunityCounts,
  OpportunityFilters,
  OpportunityKind,
  OpportunityTab,
  OrganizationFilterOption,
} from "../types";
import { KindIcon } from "./KindIcon";
import { opportunityColumns } from "./opportunityColumns";
import { OpportunitySheetContent } from "./OpportunitySheetContent";

const TabContentBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const Filters = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  flex-wrap: wrap;
`;

const FilterWrap = styled.div`
  flex: 0 1 200px;
  min-width: 160px;
`;

const ALL = "all";
const TABS: OpportunityTab[] = ["live", "drafts", "closed"];
const EMPTY_ICON = { live: Megaphone, drafts: FilePen, closed: Archive } as const;

function normalizeTab(value: string): OpportunityTab {
  return value === "drafts" || value === "closed" ? value : "live";
}

export interface OpportunitiesViewProps {
  scope: "admin" | "partner";
  /** Where this portal's list lives, e.g. "/admin/opportunities". New and edit pages hang off it. */
  basePath: string;
  tab: OpportunityTab;
  filters: Omit<OpportunityFilters, "tab">;
  items: Opportunity[];
  counts: OpportunityCounts;
  /** Admin only: organizations for the Organization filter (listOrganizationFilterOptions). */
  organizations?: OrganizationFilterOption[];
  actions: OpportunityActions;
}

/** The Opportunities list shared by the admin and partner portals: status tabs, filters, table and side panel. */
export function OpportunitiesView({ scope, basePath, tab, filters, items, counts, organizations, actions }: OpportunitiesViewProps) {
  const { setParams: syncUrl } = useListParams();
  const searchState = useListSearch(filters.q ?? "");

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
    syncUrl({ tab: next === "live" ? undefined : next });
  }

  function clearFilters() {
    searchState.setValue("");
    syncUrl({ q: undefined, kind: undefined, org: undefined });
  }

  const typeOptions = [
    { value: ALL, label: copy.toolbar.allTypes },
    ...KINDS.map((k) => ({ value: k, label: KIND_LABEL[k] })),
  ];
  const organizationOptions = [
    { value: ALL, label: copy.toolbar.allOrganizations },
    ...(organizations ?? []).map((o) => ({
      value: o.id,
      label: o.removed ? copy.removedPartner.filterOption(o.name) : o.name,
    })),
  ];

  const filtered = !!(filters.q || filters.kind || (scope === "admin" && filters.organizationId));
  // Row content follows the server's tab (not the optimistic one) so it always matches `items`.
  const columns = opportunityColumns(scope, tab);

  return (
    <ListPage>
      <ListPageHeader
        title={copy.page.title}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button">
                <Icon icon={Plus} size={16} />
                {copy.page.newButton}
                <Icon icon={ChevronDown} size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{copy.page.newMenuLabel}</DropdownMenuLabel>
              {KINDS.map((kind: OpportunityKind) => (
                <DropdownMenuItem key={kind} asChild>
                  <Link href={`${basePath}/new?kind=${kind}`}>
                    <KindIcon kind={kind} />
                    {KIND_LABEL[kind]}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
            <Filters>
              <FilterWrap>
                <Field label={copy.toolbar.typeLabel}>
                  {(p) => (
                    <Select
                      {...p}
                      options={typeOptions}
                      value={filters.kind ?? ALL}
                      onValueChange={(value) => syncUrl({ kind: value === ALL ? undefined : value })}
                    />
                  )}
                </Field>
              </FilterWrap>
              {scope === "admin" && (
                <FilterWrap>
                  <Field label={copy.toolbar.organizationLabel}>
                    {(p) => (
                      <Select
                        {...p}
                        options={organizationOptions}
                        value={filters.organizationId ?? ALL}
                        onValueChange={(value) => syncUrl({ org: value === ALL ? undefined : value })}
                      />
                    )}
                  </Field>
                </FilterWrap>
              )}
            </Filters>

            <Table
              columns={columns}
              rows={items}
              getRowId={(o) => o.id}
              onRowClick={(o) => setSelectedId(o.id)}
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
