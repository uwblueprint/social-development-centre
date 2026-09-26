"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { styled } from "next-yak";
import { Archive, Building2, Search as SearchIcon, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { SearchField } from "@/components/ui/SearchField";
import { Sheet, SheetContent } from "@/components/ui/Sheet";
import { Table } from "@/components/ui/Table";
import { Tabs, TabsContent, TabsCount, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { AppToastProvider } from "@/components/ui/Toast";
import type { OrganizationOption, PartnerOrganization, PartnerPerson } from "../_data/types";
import { InviteDialog } from "./InviteDialog";
import { organizationColumns, personColumns, removedColumns } from "./PartnerRows";
import { PartnerSheetContent } from "./PartnerSheetContent";

export type PartnersTab = "organizations" | "people" | "removed";

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

const SearchWrap = styled.div`
  max-width: 360px;
`;

function normalizeTab(value: string): PartnersTab {
  return value === "people" || value === "removed" ? value : "organizations";
}

export function PartnersView({
  tab,
  q,
  organizations,
  removedOrganizations,
  people,
  organizationOptions,
}: {
  tab: PartnersTab;
  q: string;
  organizations: PartnerOrganization[];
  removedOrganizations: PartnerOrganization[];
  people: PartnerPerson[];
  organizationOptions: OrganizationOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [activeTab, setActiveTab] = React.useState<PartnersTab>(tab);
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

  const [panel, setPanel] = React.useState<{ orgId: string; highlightContactId?: string } | null>(null);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [invitePreset, setInvitePreset] = React.useState<{ id: string; name: string } | undefined>(undefined);
  const [inviteKey, setInviteKey] = React.useState(0);

  function syncUrl(next: { tab?: PartnersTab; q?: string }) {
    const nextTab = next.tab ?? activeTab;
    const nextQ = next.q ?? searchValue;
    const params = new URLSearchParams();
    if (nextTab !== "organizations") params.set("tab", nextTab);
    if (nextQ) params.set("q", nextQ);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function handleTabChange(value: string) {
    const next = normalizeTab(value);
    setActiveTab(next);
    syncUrl({ tab: next });
  }

  function handleSearchSubmit(value: string) {
    setSearchValue(value);
    syncUrl({ q: value });
  }

  function handleSearchClear() {
    setSearchValue("");
    syncUrl({ q: "" });
  }

  function openInvite(preset?: { id: string; name: string }) {
    setInvitePreset(preset);
    setInviteKey((k) => k + 1);
    setInviteOpen(true);
  }

  const selectedOrg =
    organizations.find((o) => o.id === panel?.orgId) ??
    removedOrganizations.find((o) => o.id === panel?.orgId);

  return (
    <AppToastProvider>
      <Page>
        <Header>
          <HeaderText>
            <Title>Partners</Title>
            <Description>
              Invite organizations, manage their contacts, and control their access to opportunities.
            </Description>
          </HeaderText>
          <Button onClick={() => openInvite()}>Invite partner</Button>
        </Header>

        <SearchWrap>
          <Field label="Search partners" hint="Matches organization name, contact name or email">
            {(p) => (
              <SearchField
                {...p}
                name="q"
                placeholder="Search partners"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onSubmit={handleSearchSubmit}
                onClear={handleSearchClear}
              />
            )}
          </Field>
        </SearchWrap>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList aria-label="Partner views">
            <TabsTrigger value="organizations">
              Organizations
              <TabsCount>({organizations.length})</TabsCount>
            </TabsTrigger>
            <TabsTrigger value="people">
              People
              <TabsCount>({people.length})</TabsCount>
            </TabsTrigger>
            <TabsTrigger value="removed">
              Removed
              <TabsCount>({removedOrganizations.length})</TabsCount>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="organizations">
            <Table
              columns={organizationColumns}
              rows={organizations}
              getRowId={(org) => org.id}
              onRowClick={(org) => setPanel({ orgId: org.id })}
              aria-label="Organizations"
              empty={
                q ? (
                  <EmptyState
                    icon={SearchIcon}
                    title={`No matches for "${q}"`}
                    description="Try a different organization name, contact name or email."
                  />
                ) : (
                  <EmptyState
                    icon={Building2}
                    title="No partners yet"
                    description="Invite an organization to give them access to their opportunities."
                    action={<Button onClick={() => openInvite()}>Invite partner</Button>}
                  />
                )
              }
            />
          </TabsContent>

          <TabsContent value="people">
            <Table
              columns={personColumns}
              rows={people}
              getRowId={(person) => person.id}
              onRowClick={(person) => setPanel({ orgId: person.organization.id, highlightContactId: person.id })}
              aria-label="People"
              empty={
                q ? (
                  <EmptyState
                    icon={SearchIcon}
                    title={`No matches for "${q}"`}
                    description="Try a different name, email or organization."
                  />
                ) : (
                  <EmptyState
                    icon={UserRound}
                    title="No people yet"
                    description="Invite a partner to add their first contact."
                    action={<Button onClick={() => openInvite()}>Invite partner</Button>}
                  />
                )
              }
            />
          </TabsContent>

          <TabsContent value="removed">
            <Table
              columns={removedColumns}
              rows={removedOrganizations}
              getRowId={(org) => org.id}
              onRowClick={(org) => setPanel({ orgId: org.id })}
              aria-label="Removed partners"
              empty={
                q ? (
                  <EmptyState
                    icon={SearchIcon}
                    title={`No matches for "${q}"`}
                    description="Try a different organization name, contact name or email."
                  />
                ) : (
                  <EmptyState icon={Archive} title="No removed partners" description="Partners whose access you remove appear here." />
                )
              }
            />
          </TabsContent>
        </Tabs>

        <Sheet open={panel !== null} onOpenChange={(open) => !open && setPanel(null)}>
          <SheetContent>
            {selectedOrg && (
              <PartnerSheetContent
                key={selectedOrg.id}
                org={selectedOrg}
                highlightContactId={panel?.highlightContactId}
                onAddPerson={() => openInvite({ id: selectedOrg.id, name: selectedOrg.name })}
              />
            )}
          </SheetContent>
        </Sheet>

        <InviteDialog
          key={inviteKey}
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          organizationOptions={organizationOptions}
          presetOrganization={invitePreset}
        />
      </Page>
    </AppToastProvider>
  );
}
