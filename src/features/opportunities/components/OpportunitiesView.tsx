"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { styled } from "next-yak";
import { Archive, ChevronDown, FilePen, Megaphone, Search as SearchIcon } from "lucide-react";
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
  OrganizationRef,
} from "../types";
import { KindIcon } from "./KindIcon";
import { opportunityColumns } from "./opportunityColumns";
import { OpportunitySheetContent } from "./OpportunitySheetContent";

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 960px;
  padding: var(--space-7) var(--space-6);

  @media (max-width: 767px) {
    padding: var(--space-5) var(--space-4);
  }
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
`;

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
  max-width: 60ch;
`;

const Title = styled.h1`
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  letter-spacing: var(--tracking-tight);
`;

const Description = styled.p`
  margin: 0;
  color: var(--color-text-muted);
  line-height: var(--leading-body);
`;

const MenuItemIcon = styled.span`
  display: inline-flex;
  color: var(--color-text-muted);
`;

const TabContentBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const Toolbar = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  flex-wrap: wrap;
`;

const SearchWrap = styled.div`
  flex: 1 1 240px;
  max-width: 320px;
  min-width: 0;
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
  /** Admin only: organizations for the Organization filter. */
  organizations?: OrganizationRef[];
  actions: OpportunityActions;
}

/** The Opportunities list shared by the admin and partner portals: status tabs, filters, table and side panel. */
export function OpportunitiesView({ scope, basePath, tab, filters, items, counts, organizations, actions }: OpportunitiesViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = React.useTransition();

  const q = filters.q ?? "";
  const [activeTab, setActiveTab] = React.useState<OpportunityTab>(tab);
  const [searchValue, setSearchValue] = React.useState(q);

  // Keeps local UI state in step with the URL (e.g. browser back/forward)
  // without an effect: derived at render time from the server-provided props.
  const [prevTab, setPrevTab] = React.useState(tab);
  if (tab !== prevTab) {
    setPrevTab(tab);
    setActiveTab(tab);
  }
  const [prevQ, setPrevQ] = React.useState(q);
  if (q !== prevQ) {
    setPrevQ(q);
    setSearchValue(q);
  }

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const selected = items.find((o) => o.id === selectedId);

  /** Sets or removes the given params and keeps every other one. */
  function syncUrl(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const qs = params.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  function handleTabChange(value: string) {
    const next = normalizeTab(value);
    setActiveTab(next);
    setSelectedId(null);
    syncUrl({ tab: next === "live" ? undefined : next });
  }

  function handleSearchSubmit(value: string) {
    setSearchValue(value);
    syncUrl({ q: value.trim() || undefined });
  }

  function clearFilters() {
    setSearchValue("");
    syncUrl({ q: undefined, kind: undefined, org: undefined });
  }

  const typeOptions = [
    { value: ALL, label: copy.toolbar.allTypes },
    ...KINDS.map((k) => ({ value: k, label: KIND_LABEL[k] })),
  ];
  const organizationOptions = [
    { value: ALL, label: copy.toolbar.allOrganizations },
    ...(organizations ?? []).map((o) => ({ value: o.id, label: o.name })),
  ];

  const filtered = !!(filters.q || filters.kind || (scope === "admin" && filters.organizationId));
  // Row content follows the server's tab (not the optimistic one) so it always matches `items`.
  const columns = opportunityColumns(scope, tab);

  return (
    <Page>
      <Header>
        <HeaderText>
          <Title>{copy.page.title}</Title>
          <Description>{scope === "admin" ? copy.page.adminDescription : copy.page.partnerDescription}</Description>
        </HeaderText>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button">
              {copy.page.newButton}
              <Icon icon={ChevronDown} size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{copy.page.newMenuLabel}</DropdownMenuLabel>
            {KINDS.map((kind: OpportunityKind) => (
              <DropdownMenuItem key={kind} asChild>
                <Link href={`${basePath}/new?kind=${kind}`}>
                  <MenuItemIcon>
                    <KindIcon kind={kind} />
                  </MenuItemIcon>
                  {KIND_LABEL[kind]}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </Header>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList aria-label={copy.page.title}>
          {TABS.map((t) => (
            <TabsTrigger key={t} value={t}>
              {copy.tabs[t]}
              <TabsCount>({counts[t]})</TabsCount>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab}>
          <TabContentBody>
            <Toolbar>
              <SearchWrap>
                <Field label={copy.toolbar.searchLabel}>
                  {(p) => (
                    <SearchField
                      {...p}
                      name="q"
                      placeholder={copy.toolbar.searchPlaceholder}
                      value={searchValue}
                      onChange={(event) => setSearchValue(event.target.value)}
                      onSubmit={handleSearchSubmit}
                      onClear={() => handleSearchSubmit("")}
                    />
                  )}
                </Field>
              </SearchWrap>
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
            </Toolbar>

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
    </Page>
  );
}
