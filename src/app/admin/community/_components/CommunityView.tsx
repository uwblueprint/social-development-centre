"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Download, Search as SearchIcon, UserPlus, UsersRound } from "lucide-react";
import { ListPage, ListPageHeader, ListPageToolbar, useListParams, useListSearch } from "@/components/patterns/ListPage";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { SearchField } from "@/components/ui/SearchField";
import { Sheet, SheetContent } from "@/components/ui/Sheet";
import { Table } from "@/components/ui/Table";
import { Tabs, TabsContent, TabsCount, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { AppToastProvider } from "@/components/ui/Toast";
import { Tooltip } from "@/components/ui/Tooltip";
import type { CommunityCounts, Member, MemberPage, MemberTier } from "../_data/types";
import { communityCopy as copy } from "../_copy";
import { AddMembersDialog } from "./AddMembersDialog";
import { ExportDialog } from "./ExportDialog";
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
  memberPage,
  counts,
  pageSize,
}: {
  tab: MemberTier;
  q: string;
  memberPage: MemberPage;
  counts: CommunityCounts;
  pageSize: number;
}) {
  const { setParams } = useListParams();
  const searchState = useListSearch(q);

  const [activeTab, setActiveTab] = React.useState<MemberTier>(tab);

  // Keeps local UI state in step with the URL (e.g. browser back/forward)
  // without an effect: derived at render time from the server-provided props.
  const [prevTab, setPrevTab] = React.useState(tab);
  if (tab !== prevTab) {
    setPrevTab(tab);
    setActiveTab(tab);
  }

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [addKey, setAddKey] = React.useState(0);
  const [exportOpen, setExportOpen] = React.useState(false);
  const [exportKey, setExportKey] = React.useState(0);

  function handleTabChange(value: string) {
    const next = normalizeTab(value);
    setActiveTab(next);
    setParams({ tab: next === "general" ? undefined : next, page: undefined });
  }

  function handlePageChange(page: number) {
    setParams({ page: page > 1 ? String(page) : undefined });
  }

  function openAdd() {
    setAddKey((k) => k + 1);
    setAddOpen(true);
  }

  function openExport() {
    setExportKey((k) => k + 1);
    setExportOpen(true);
  }

  const selectedMember: Member | undefined = memberPage.rows.find((m) => m.id === selectedId);

  return (
    <AppToastProvider>
      <ListPage>
        <ListPageHeader
          title={copy.page.title}
          actions={
            <>
              <Button type="button" $variant="secondary" onClick={openExport}>
                <Icon icon={Download} size={16} />
                {copy.toolbar.export}
              </Button>
              <Button type="button" onClick={openAdd}>
                <Icon icon={UserPlus} size={16} />
                {copy.toolbar.addMembers}
              </Button>
            </>
          }
        />

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <ListPageToolbar
            tabs={
              <TabsList aria-label={copy.tabs.ariaLabel}>
                <Tooltip content={copy.tabs.generalTabTooltip} delayDuration={600} pinOnClick={false}>
                  <TabsTrigger value="general">
                    {copy.tabs.general}
                    <TabsCount>{copy.tabs.generalCount(counts.general)}</TabsCount>
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
                name="q"
                aria-label={copy.toolbar.searchPlaceholder}
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
                columns={memberColumns}
                rows={memberPage.rows}
                getRowId={(m) => m.id}
                onRowClick={(m) => setSelectedId(m.id)}
                aria-label={activeTab === "paying" ? copy.tabs.paying : copy.tabs.general}
                empty={
                  q ? (
                    <EmptyState icon={SearchIcon} title={copy.empty.searchTitle(q)} description={copy.empty.searchDescription} />
                  ) : (
                    <EmptyState
                      icon={UsersRound}
                      title={activeTab === "paying" ? copy.empty.payingTitle : copy.empty.generalTitle}
                      description={activeTab === "paying" ? copy.empty.payingDescription : copy.empty.generalDescription}
                      action={
                        <Button type="button" onClick={openAdd}>
                          <Icon icon={UserPlus} size={16} />
                          {copy.toolbar.addMembers}
                        </Button>
                      }
                    />
                  )
                }
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

        <Sheet open={selectedMember !== undefined} onOpenChange={(open) => !open && setSelectedId(null)}>
          <SheetContent>
            {selectedMember && (
              <MemberSheetContent key={selectedMember.id} member={selectedMember} onClose={() => setSelectedId(null)} />
            )}
          </SheetContent>
        </Sheet>

        <AddMembersDialog key={`add-${addKey}`} open={addOpen} onOpenChange={setAddOpen} tab={activeTab} />
        <ExportDialog key={`export-${exportKey}`} open={exportOpen} onOpenChange={setExportOpen} tab={activeTab} />
      </ListPage>
    </AppToastProvider>
  );
}
