"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { styled } from "next-yak";
import { Search as SearchIcon, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { SearchField } from "@/components/ui/SearchField";
import { Sheet, SheetContent } from "@/components/ui/Sheet";
import { Table } from "@/components/ui/Table";
import { Tabs, TabsContent, TabsCount, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { AppToastProvider } from "@/components/ui/Toast";
import type { CommunityCounts, Member, MemberPage, MemberTier } from "../_data/types";
import { communityCopy as copy } from "../_copy";
import { AddMembersDialog } from "./AddMembersDialog";
import { ExportDialog } from "./ExportDialog";
import { memberColumns } from "./MemberRows";
import { MemberSheetContent } from "./MemberSheetContent";

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

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
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

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
`;

const SearchWrap = styled.div`
  max-width: 280px;
  flex: 1;
  min-width: 200px;
`;

const ToolbarActions = styled.div`
  display: flex;
  gap: var(--space-2);
  flex-shrink: 0;
`;

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
  const router = useRouter();
  const pathname = usePathname();

  const [activeTab, setActiveTab] = React.useState<MemberTier>(tab);
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
  const [addOpen, setAddOpen] = React.useState(false);
  const [addKey, setAddKey] = React.useState(0);
  const [exportOpen, setExportOpen] = React.useState(false);
  const [exportKey, setExportKey] = React.useState(0);

  function syncUrl(next: { tab?: MemberTier; q?: string; page?: number }) {
    const nextTab = next.tab ?? activeTab;
    const nextQ = next.q ?? searchValue;
    const nextPage = next.page ?? memberPage.page;
    const params = new URLSearchParams();
    if (nextTab !== "general") params.set("tab", nextTab);
    if (nextQ) params.set("q", nextQ);
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function handleTabChange(value: string) {
    const next = normalizeTab(value);
    setActiveTab(next);
    syncUrl({ tab: next, page: 1 });
  }

  function handleSearchSubmit(value: string) {
    setSearchValue(value);
    syncUrl({ q: value, page: 1 });
  }

  function handleSearchClear() {
    setSearchValue("");
    syncUrl({ q: "", page: 1 });
  }

  function handlePageChange(page: number) {
    syncUrl({ page });
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
      <Page>
        <HeaderText>
          <Title>{copy.page.title}</Title>
          <Description>{copy.page.description}</Description>
        </HeaderText>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList aria-label={copy.tabs.ariaLabel}>
            <TabsTrigger value="general">
              {copy.tabs.general}
              <TabsCount>{copy.tabs.generalCount(counts.general, counts.unsubscribed)}</TabsCount>
            </TabsTrigger>
            <TabsTrigger value="paying">
              {copy.tabs.paying}
              <TabsCount>{copy.tabs.payingCount(counts.paying)}</TabsCount>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <TabContentBody>
              <Toolbar>
                <SearchWrap>
                  <SearchField
                    name="q"
                    aria-label={copy.toolbar.searchAriaLabel}
                    placeholder={copy.toolbar.searchPlaceholder}
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    onSubmit={handleSearchSubmit}
                    onClear={handleSearchClear}
                  />
                </SearchWrap>
                <ToolbarActions>
                  <Button type="button" $variant="ghost" onClick={openExport}>
                    {copy.toolbar.export}
                  </Button>
                  <Button type="button" $variant="secondary" onClick={openAdd}>
                    {copy.toolbar.addMembers}
                  </Button>
                </ToolbarActions>
              </Toolbar>

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
      </Page>
    </AppToastProvider>
  );
}
