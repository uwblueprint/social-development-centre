"use client";

import * as React from "react";
import { Archive, Building2, Search as SearchIcon, UserPlus, UserRound } from "lucide-react";
import { ListPage, ListPageHeader, ListPageToolbar, useListParams, useListSearch } from "@/components/patterns/ListPage";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
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

const SEARCH_LABEL = "Search by name or email";

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
  const { setParams } = useListParams();
  const searchState = useListSearch(q);

  const [activeTab, setActiveTab] = React.useState<PartnersTab>(tab);

  // Keeps local UI state in step with the URL (e.g. browser back/forward)
  // without an effect: derived at render time from the server-provided props.
  const [prevTab, setPrevTab] = React.useState(tab);
  if (tab !== prevTab) {
    setPrevTab(tab);
    setActiveTab(tab);
  }

  const [panel, setPanel] = React.useState<{ orgId: string; highlightContactId?: string } | null>(null);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [invitePreset, setInvitePreset] = React.useState<{ id: string; name: string } | undefined>(undefined);
  const [inviteKey, setInviteKey] = React.useState(0);

  function handleTabChange(value: string) {
    const next = normalizeTab(value);
    setActiveTab(next);
    setParams({ tab: next === "organizations" ? undefined : next });
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
      <ListPage>
        <ListPageHeader
          title="Partners"
          actions={
            <Button type="button" onClick={() => openInvite()}>
              <Icon icon={UserPlus} size={16} />
              Invite partner
            </Button>
          }
        />

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <ListPageToolbar
            tabs={
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
            }
            search={
              <SearchField
                name="q"
                aria-label={SEARCH_LABEL}
                placeholder={SEARCH_LABEL}
                value={searchState.value}
                onChange={(event) => searchState.setValue(event.target.value)}
                onSearch={searchState.search}
                pending={searchState.pending}
              />
            }
          />

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
                    action={
                      <Button type="button" onClick={() => openInvite()}>
                        <Icon icon={UserPlus} size={16} />
                        Invite partner
                      </Button>
                    }
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
                    action={
                      <Button type="button" onClick={() => openInvite()}>
                        <Icon icon={UserPlus} size={16} />
                        Invite partner
                      </Button>
                    }
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
      </ListPage>
    </AppToastProvider>
  );
}
