"use client";

import * as React from "react";
import { Archive, Building2, MailCheck, Search as SearchIcon, UserPlus, UserRound } from "lucide-react";
import { ListPage, ListPageHeader, ListPageToolbar, useListParams, useListSearch } from "@/components/patterns/ListPage";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { SearchField } from "@/components/ui/SearchField";
import { Sheet, SheetContent } from "@/components/ui/Sheet";
import { Table } from "@/components/ui/Table";
import { Tabs, TabsContent, TabsCount, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { AppToastProvider } from "@/components/ui/Toast";
import { partnersCopy as copy } from "../_copy";
import type { OrganizationOption, PartnerOrganization, PartnerPerson, PendingInvitation } from "../_data/types";
import { InviteDialog } from "./InviteDialog";
import { invitationColumns, organizationColumns, personColumns, removedColumns } from "./PartnerRows";
import { PartnerSheetContent } from "./PartnerSheetContent";

export type PartnersTab = "organizations" | "people" | "invitations" | "removed";

function normalizeTab(value: string): PartnersTab {
  return value === "people" || value === "invitations" || value === "removed" ? value : "organizations";
}

export function PartnersView({
  tab,
  q,
  organizations,
  removedOrganizations,
  people,
  invitations,
  organizationOptions,
}: {
  tab: PartnersTab;
  q: string;
  organizations: PartnerOrganization[];
  removedOrganizations: PartnerOrganization[];
  people: PartnerPerson[];
  invitations: PendingInvitation[];
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

  const noMatches = (
    <EmptyState icon={SearchIcon} title={copy.search.noMatchesTitle(q)} description={copy.search.noMatchesDescription} />
  );

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
              <TabsList aria-label={copy.tabs.ariaLabel}>
                <TabsTrigger value="organizations">
                  {copy.tabs.organizations}
                  <TabsCount>{copy.tabs.count(organizations.length)}</TabsCount>
                </TabsTrigger>
                <TabsTrigger value="people">
                  {copy.tabs.people}
                  <TabsCount>{copy.tabs.count(people.length)}</TabsCount>
                </TabsTrigger>
                <TabsTrigger value="invitations">
                  {copy.tabs.invitations}
                  <TabsCount>{copy.tabs.count(invitations.length)}</TabsCount>
                </TabsTrigger>
                <TabsTrigger value="removed">
                  {copy.tabs.removed}
                  <TabsCount>{copy.tabs.count(removedOrganizations.length)}</TabsCount>
                </TabsTrigger>
              </TabsList>
            }
            search={
              <SearchField
                name="q"
                aria-label={copy.search.placeholder}
                placeholder={copy.search.placeholder}
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
                  noMatches
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
                  noMatches
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

          <TabsContent value="invitations">
            <Table
              columns={invitationColumns}
              rows={invitations}
              getRowId={(invitation) => invitation.id}
              onRowClick={(invitation) =>
                setPanel({ orgId: invitation.organization.id, highlightContactId: invitation.id })
              }
              aria-label={copy.tabs.invitations}
              empty={
                q ? (
                  noMatches
                ) : (
                  <EmptyState
                    icon={MailCheck}
                    title={copy.empty.invitationsTitle}
                    description={copy.empty.invitationsDescription}
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
                  noMatches
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
