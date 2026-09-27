"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Download, FunnelX, SearchX, UserPlus, UsersRound } from "lucide-react";
import {
  ListEmptyState,
  listEmptyCopy,
  ListPage,
  ListPageHeader,
  ListPageToolbar,
  useListParams,
  useListSearch,
  useListSort,
} from "@/components/patterns/ListPage";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Pagination } from "@/components/ui/Pagination";
import { SearchField } from "@/components/ui/SearchField";
import { Sheet, SheetContent } from "@/components/ui/Sheet";
import { Table, type TableColumnFilter } from "@/components/ui/Table";
import {
  Tabs,
  TabsContent,
  TabsCount,
  TabsList,
  TabsTrigger,
} from "@/components/ui/Tabs";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  DEFAULT_MEMBER_SORT,
  MEMBER_SORT_KEYS,
  MEMBER_STATUSES,
} from "../_data/types";
import type {
  CommunityCounts,
  Member,
  MemberPage,
  MemberStatus,
  MemberTier,
} from "../_data/types";
import { communityCopy as copy } from "../_copy";
import { statusParam } from "../_lib/statusParam";
import { AddMembersDialog } from "./AddMembersDialog";
import { ExportDialog } from "./ExportDialog";
import { KioskLauncher } from "./KioskLauncher";
import { memberColumns } from "./MemberRows";
import { MemberSheetContent } from "./MemberSheetContent";

const TabContentBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

function normalizeTab(value: string): MemberTier {
  return value === "paying" ? "paying" : "general";
}

export function CommunityView({
  tab,
  q,
  statuses,
  memberPage,
  counts,
  pageSize,
  now,
}: {
  tab: MemberTier;
  q: string;
  /** The Status filter, from the URL (default: every status but Unsubscribed). */
  statuses: MemberStatus[];
  memberPage: MemberPage;
  counts: CommunityCounts;
  pageSize: number;
  /** The server's render time (ISO), for relative dates that match on server and client. */
  now: string;
}) {
  const { setParams, pending: paramsPending } = useListParams();
  const searchState = useListSearch(q);
  const {
    sort: requestedSort,
    setSort,
    pending: sortPending,
  } = useListSort(DEFAULT_MEMBER_SORT);
  // The server ignores unknown sort keys and uses the default; show the same.
  const sort =
    requestedSort &&
    (MEMBER_SORT_KEYS as readonly string[]).includes(requestedSort.key)
      ? requestedSort
      : DEFAULT_MEMBER_SORT;
  // Page, tab, filter, search and sort changes keep the current rows on screen, dimmed, until the next ones arrive.
  const busy = paramsPending || sortPending || searchState.pending;
  const searchRef = React.useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = React.useState<MemberTier>(tab);

  // Keeps local UI state in step with the URL (e.g. browser back/forward)
  // without an effect: derived at render time from the server-provided props.
  const [prevTab, setPrevTab] = React.useState(tab);
  if (tab !== prevTab) {
    setPrevTab(tab);
    setActiveTab(tab);
  }

  // The filter shows the new selection at once; the rows follow when the server responds.
  const [selectedStatuses, setOptimisticStatuses] =
    React.useOptimistic<string[]>(statuses);

  // The open panel's person. Kept as a snapshot so the panel stays open when an action moves them
  // out of the current list (e.g. converted to paying, or unsubscribed and hidden by the filter).
  const [selected, setSelected] = React.useState<Member | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [addKey, setAddKey] = React.useState(0);
  const [exportOpen, setExportOpen] = React.useState(false);
  const [exportKey, setExportKey] = React.useState(0);

  function handleTabChange(value: string) {
    const next = normalizeTab(value);
    setActiveTab(next);
    setParams({ tab: next === "general" ? undefined : next, page: undefined });
  }

  function setStatuses(
    values: string[],
    extra: Record<string, string | undefined> = {},
  ) {
    setParams({ status: statusParam(values), page: undefined, ...extra }, () =>
      setOptimisticStatuses(values),
    );
  }

  const showAllStatuses = () => setStatuses([...MEMBER_STATUSES]);

  /** From the empty state: the button disappears with it, so focus goes back to the search field. */
  function clearSearch() {
    searchState.setValue("");
    setParams({ q: undefined, page: undefined });
    searchRef.current?.focus();
  }

  function showInOtherTab(next: MemberTier, allStatuses = false) {
    setActiveTab(next);
    const tabParam = { tab: next === "general" ? undefined : next };
    if (allStatuses) setStatuses([...MEMBER_STATUSES], tabParam);
    else setParams({ ...tabParam, page: undefined });
    searchRef.current?.focus();
  }

  function handlePageChange(page: number) {
    setParams({ page: page > 1 ? String(page) : undefined });
  }

  // A fresh dialog each time; the key changes on open so it keeps its content while it animates closed.
  function openAdd() {
    setAddKey((k) => k + 1);
    setAddOpen(true);
  }

  function openExport() {
    setExportKey((k) => k + 1);
    setExportOpen(true);
  }

  const statusFilter: TableColumnFilter = {
    label: copy.table.headerStatus,
    options: MEMBER_STATUSES.map((s) => ({
      value: s,
      label: copy.status[s],
      count: counts.byStatus[s],
    })),
    selected: selectedStatuses,
    onChange: (values) => setStatuses(values),
  };
  const columns = memberColumns(now, statusFilter);

  const selectedMember = selected
    ? (memberPage.rows.find((m) => m.id === selected.id) ?? selected)
    : undefined;

  const items =
    activeTab === "paying" ? copy.empty.payingItems : copy.empty.generalItems;
  const otherTab: MemberTier = activeTab === "general" ? "paying" : "general";
  const otherScope =
    otherTab === "paying" ? copy.tabs.paying : copy.tabs.general;
  const hiddenHere = counts.hidden[activeTab];
  const hiddenThere = counts.hidden[otherTab];

  // Why the list is empty, in order: a search whose matches here are hidden by the Status filter;
  // then matches in the other tab (shown, or hidden by the filter); then no matches; then the filter
  // hiding everything; then truly empty.
  const empty =
    q && counts[otherTab] === 0 && hiddenHere > 0 ? (
      <EmptyState
        icon={SearchX}
        title={listEmptyCopy.searchTitle(items, q)}
        description={copy.empty.hiddenByFilter(hiddenHere)}
        action={
          <Button type="button" $variant="secondary" onClick={showAllStatuses}>
            <Icon icon={FunnelX} size={16} />
            {copy.empty.showAllStatuses}
          </Button>
        }
      />
    ) : (
      <ListEmptyState
        items={items}
        query={q}
        searchedFields={copy.empty.searchedFields}
        onClearSearch={clearSearch}
        // The tabs are exclusive: an empty search can match in the other tab.
        elsewhere={
          counts[otherTab] > 0
            ? {
                count: counts[otherTab],
                scope: otherScope,
                onShow: () => showInOtherTab(otherTab),
              }
            : {
                count: hiddenThere,
                scope: otherScope,
                onShow: () => showInOtherTab(otherTab, true),
                body: copy.empty.hiddenElsewhere(hiddenThere, otherScope),
              }
        }
        filtered={!q && hiddenHere > 0 ? copy.empty.filtered(items) : undefined}
        onClearFilters={showAllStatuses}
        empty={{
          icon: UsersRound,
          title:
            activeTab === "paying"
              ? copy.empty.payingTitle
              : copy.empty.generalTitle,
          description:
            activeTab === "paying"
              ? copy.empty.payingDescription
              : copy.empty.generalDescription,
          action: (
            <Button type="button" onClick={openAdd}>
              <Icon icon={UserPlus} size={16} />
              {copy.toolbar.addMembers}
            </Button>
          ),
        }}
      />
    );

  // Toasts come from the admin shell's provider; a page-level one would trap them under the panel.
  return (
    <ListPage>
      <ListPageHeader
        title={copy.page.title}
        actions={
          <>
            <KioskLauncher />
            <Button type="button" $variant="secondary" onClick={openAdd}>
              <Icon icon={UserPlus} size={16} />
              {copy.toolbar.addMembers}
            </Button>
            <Button type="button" onClick={openExport}>
              <Icon icon={Download} size={16} />
              {copy.toolbar.export}
            </Button>
          </>
        }
      />

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <ListPageToolbar
          tabs={
            <TabsList aria-label={copy.tabs.ariaLabel}>
              <Tooltip
                content={copy.tabs.generalTabTooltip}
                delayDuration={600}
                pinOnClick={false}
              >
                <TabsTrigger value="general">
                  {copy.tabs.general}
                  <TabsCount>
                    {copy.tabs.generalCount(counts.general)}
                  </TabsCount>
                </TabsTrigger>
              </Tooltip>
              <TabsTrigger value="paying">
                {copy.tabs.paying}
                <TabsCount>{copy.tabs.payingCount(counts.paying)}</TabsCount>
              </TabsTrigger>
            </TabsList>
          }
          search={
            <SearchField
              ref={searchRef}
              name="q"
              aria-label={copy.toolbar.searchPlaceholder}
              placeholder={copy.toolbar.searchPlaceholder}
              value={searchState.value}
              onChange={(event) => searchState.setValue(event.target.value)}
              onSearch={searchState.search}
              pending={searchState.pending}
            />
          }
          results={{
            query: q,
            count: memberPage.total,
            pending: searchState.pending,
          }}
        />

        <TabsContent value={activeTab}>
          <TabContentBody>
            <Table
              columns={columns}
              rows={memberPage.rows}
              getRowId={(m) => m.id}
              onRowClick={setSelected}
              sort={sort}
              onSortChange={setSort}
              busy={busy}
              stickyColumns={2}
              aria-label={
                activeTab === "paying" ? copy.tabs.paying : copy.tabs.general
              }
              empty={empty}
            />
            {memberPage.rows.length > 0 && (
              <Pagination
                page={memberPage.page}
                pageCount={memberPage.pageCount}
                pageSize={pageSize}
                total={memberPage.total}
                onPageChange={handlePageChange}
              />
            )}
          </TabContentBody>
        </TabsContent>
      </Tabs>

      <Sheet
        open={selectedMember !== undefined}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <SheetContent size="wide">
          {selectedMember && (
            <MemberSheetContent
              key={selectedMember.id}
              member={selectedMember}
              now={now}
              onChange={setSelected}
            />
          )}
        </SheetContent>
      </Sheet>

      <AddMembersDialog
        key={`add-${addKey}`}
        open={addOpen}
        onOpenChange={setAddOpen}
      />
      <ExportDialog
        key={`export-${exportKey}`}
        open={exportOpen}
        onOpenChange={setExportOpen}
        tab={activeTab}
      />
    </ListPage>
  );
}
