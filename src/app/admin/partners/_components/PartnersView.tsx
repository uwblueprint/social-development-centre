"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Archive, Building2, Search as SearchIcon, UserPlus, UserRound, UserX } from "lucide-react";
import { ListPage, ListPageHeader, ListPageToolbar, useListParams, useListSearch } from "@/components/patterns/ListPage";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Label } from "@/components/ui/Label";
import { SearchField } from "@/components/ui/SearchField";
import { Select } from "@/components/ui/Select";
import { Sheet, SheetContent } from "@/components/ui/Sheet";
import { Table } from "@/components/ui/Table";
import { Tabs, TabsContent, TabsCount, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { AppToastProvider } from "@/components/ui/Toast";
import { partnersCopy as copy } from "../_copy";
import type { OrganizationOption, PartnerOrganization, PartnerPerson, PartnerStatusFilter } from "../_data/types";
import { InviteDialog, type InvitePreset } from "./InviteDialog";
import { organizationColumns, personColumns, removedOrganizationColumns, removedPersonColumns } from "./PartnerRows";
import { PartnerSheetContent } from "./PartnerSheetContent";
import { PersonSheetContent } from "./PersonSheetContent";

export type PartnersViewName = "organizations" | "people";

type Panel = { kind: "organization"; id: string } | { kind: "person"; id: string };

const TabsAndFilter = styled.div`
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-5);
`;

const StatusFilter = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);

  & > label {
    margin: 0;
  }
`;

const StatusSelect = styled.div`
  width: 140px;
`;

export function PartnersView({
  view,
  status,
  q,
  organizations,
  removedOrganizations,
  people,
  removedPeople,
  organizationOptions,
}: {
  view: PartnersViewName;
  status: PartnerStatusFilter;
  q: string;
  organizations: PartnerOrganization[];
  removedOrganizations: PartnerOrganization[];
  people: PartnerPerson[];
  removedPeople: PartnerPerson[];
  organizationOptions: OrganizationOption[];
}) {
  const { setParams } = useListParams();
  const searchState = useListSearch(q);
  const statusId = React.useId();

  const [activeView, setActiveView] = React.useState<PartnersViewName>(view);
  const [activeStatus, setActiveStatus] = React.useState<PartnerStatusFilter>(status);
  // Keeps local UI state in step with the URL (e.g. back/forward), derived at render time.
  const [prev, setPrev] = React.useState({ view, status });
  if (view !== prev.view || status !== prev.status) {
    setPrev({ view, status });
    setActiveView(view);
    setActiveStatus(status);
  }

  const [panel, setPanel] = React.useState<Panel | null>(null);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [invitePreset, setInvitePreset] = React.useState<InvitePreset | undefined>(undefined);
  const [inviteKey, setInviteKey] = React.useState(0);

  function handleViewChange(value: string) {
    const next: PartnersViewName = value === "people" ? "people" : "organizations";
    setActiveView(next);
    setParams({ view: next === "organizations" ? undefined : next });
  }

  function handleStatusChange(value: string) {
    const next: PartnerStatusFilter = value === "removed" ? "removed" : "active";
    setActiveStatus(next);
    setParams({ status: next === "active" ? undefined : next });
  }

  function openInvite(preset?: InvitePreset) {
    setInvitePreset(preset);
    setInviteKey((k) => k + 1);
    setInviteOpen(true);
  }

  const removed = activeStatus === "removed";
  const orgRows = removed ? removedOrganizations : organizations;
  const personRows = removed ? removedPeople : people;

  const allOrganizations = [...organizations, ...removedOrganizations];
  const selectedOrg = panel?.kind === "organization" ? allOrganizations.find((o) => o.id === panel.id) : undefined;
  const selectedPerson =
    panel?.kind === "person" ? (people.find((p) => p.id === panel.id) ?? removedPeople.find((p) => p.id === panel.id)) : undefined;
  const personOrg = selectedPerson && allOrganizations.find((o) => o.id === selectedPerson.organization.id);
  const lastWithAccess =
    !!selectedPerson &&
    selectedPerson.status === "active" &&
    (personOrg?.contacts.filter((c) => c.status === "active").length ?? 0) <= 1;

  const inviteButton = (
    <Button type="button" onClick={() => openInvite()}>
      <Icon icon={UserPlus} size={16} />
      {copy.invite.button}
    </Button>
  );

  const noMatches = <EmptyState icon={SearchIcon} title={copy.search.noMatchesTitle} description={copy.search.noMatchesDescription} />;

  const organizationsEmpty = q ? (
    noMatches
  ) : removed ? (
    <EmptyState icon={Archive} title={copy.empty.removedOrganizationsTitle} description={copy.empty.removedOrganizationsDescription} />
  ) : (
    <EmptyState icon={Building2} title={copy.empty.organizationsTitle} description={copy.empty.organizationsDescription} action={inviteButton} />
  );

  const peopleEmpty = q ? (
    noMatches
  ) : removed ? (
    <EmptyState icon={UserX} title={copy.empty.removedPeopleTitle} description={copy.empty.removedPeopleDescription} />
  ) : (
    <EmptyState icon={UserRound} title={copy.empty.peopleTitle} description={copy.empty.peopleDescription} action={inviteButton} />
  );

  const panelOpen = !!(selectedOrg || selectedPerson);

  return (
    <AppToastProvider>
      <ListPage>
        <ListPageHeader title={copy.title} actions={inviteButton} />

        <Tabs value={activeView} onValueChange={handleViewChange}>
          <ListPageToolbar
            tabs={
              <TabsAndFilter>
                <TabsList aria-label={copy.views.ariaLabel}>
                  <TabsTrigger value="organizations">
                    {copy.views.organizations}
                    <TabsCount>{copy.views.count(orgRows.length)}</TabsCount>
                  </TabsTrigger>
                  <TabsTrigger value="people">
                    {copy.views.people}
                    <TabsCount>{copy.views.count(personRows.length)}</TabsCount>
                  </TabsTrigger>
                </TabsList>
                <StatusFilter>
                  <Label htmlFor={statusId}>{copy.status.label}</Label>
                  <StatusSelect>
                    <Select
                      id={statusId}
                      value={activeStatus}
                      onValueChange={handleStatusChange}
                      options={[
                        { value: "active", label: copy.status.active },
                        { value: "removed", label: copy.status.removed },
                      ]}
                    />
                  </StatusSelect>
                </StatusFilter>
              </TabsAndFilter>
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
              columns={removed ? removedOrganizationColumns : organizationColumns}
              rows={orgRows}
              getRowId={(org) => org.id}
              onRowClick={(org) => setPanel({ kind: "organization", id: org.id })}
              aria-label={copy.views.organizations}
              empty={organizationsEmpty}
            />
          </TabsContent>

          <TabsContent value="people">
            <Table
              columns={removed ? removedPersonColumns : personColumns}
              rows={personRows}
              getRowId={(person) => `${person.id}-${person.organization.id}`}
              onRowClick={(person) => setPanel({ kind: "person", id: person.id })}
              aria-label={copy.views.people}
              empty={peopleEmpty}
            />
          </TabsContent>
        </Tabs>

        <Sheet open={panelOpen} onOpenChange={(open) => !open && setPanel(null)}>
          <SheetContent>
            {selectedOrg && (
              <PartnerSheetContent
                key={selectedOrg.id}
                org={selectedOrg}
                onAddPerson={() => openInvite({ organization: { id: selectedOrg.id, name: selectedOrg.name } })}
              />
            )}
            {selectedPerson && (
              <PersonSheetContent
                key={selectedPerson.id}
                person={selectedPerson}
                lastWithAccess={lastWithAccess}
                onOpenOrganization={() => setPanel({ kind: "organization", id: selectedPerson.organization.id })}
                onInviteAgain={() =>
                  openInvite({
                    name: selectedPerson.name,
                    email: selectedPerson.email,
                    organization: { id: selectedPerson.organization.id, name: selectedPerson.organization.name },
                  })
                }
              />
            )}
          </SheetContent>
        </Sheet>

        <InviteDialog
          key={inviteKey}
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          organizationOptions={organizationOptions}
          preset={invitePreset}
        />
      </ListPage>
    </AppToastProvider>
  );
}
