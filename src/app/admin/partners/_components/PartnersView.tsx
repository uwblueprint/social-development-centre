"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Building2, Copy, LifeBuoy, UserPlus, UserRound } from "lucide-react";
import {
  ListEmptyState,
  ListPage,
  ListPageHeader,
  ListPageToolbar,
  useListParams,
  useListSearch,
  useListSort,
} from "@/components/patterns/ListPage";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SearchField } from "@/components/ui/SearchField";
import { Sheet, SheetContent } from "@/components/ui/Sheet";
import { Table, type TableSort } from "@/components/ui/Table";
import { Tabs, TabsContent, TabsCount, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { useReturnFocus } from "@/lib/useReturnFocus";
import { partnersCopy as copy } from "../_copy";
import {
  DEFAULT_ORGANIZATION_SORT,
  DEFAULT_PERSON_SORT,
  DEFAULT_PERSON_TAGS,
  ORGANIZATION_SORT_KEYS,
  PARTNER_HEALTH,
  PERSON_SORT_KEYS,
  type AdminPartnerOrganization,
  type FacetOption,
  type ListSort,
  type OrganizationOption,
  type OrganizationSortKey,
  type PartnerHealth,
  type PartnerPerson,
  type PartnerStatusFilter,
  type PersonSortKey,
  type PersonTagFilter,
} from "../_data/types";
import { filterParam } from "../_lib/params";
import { copyEmails } from "./CopyableEmail";
import { InviteDialog, type InvitePreset } from "./InviteDialog";
import { organizationColumns, personColumns, type HeaderFilter } from "./PartnerRows";
import { PartnerSheetContent } from "./PartnerSheetContent";
import { PersonRowActions } from "./PersonRowActions";

export type PartnersViewName = "organizations" | "people";

export interface PartnersFilters {
  status: PartnerStatusFilter[];
  health: PartnerHealth[];
  organizations: string[];
  tags: PersonTagFilter[];
}

/* A calm, informational note above the table: text and an icon, not colour alone. */
const SupportCallout = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-3);
  margin-bottom: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-info-border);
  border-radius: var(--radius-md);
  background: var(--color-info-subtle);
  font-size: var(--text-sm);
  color: var(--color-text);
`;

const CalloutIcon = styled.span`
  display: inline-flex;
  color: var(--color-info);
`;

const CalloutText = styled.p`
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
`;

const sameSet = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((v) => b.includes(v));

export interface PartnersViewProps {
  view: PartnersViewName;
  q: string;
  /** The organization whose panel is open (`org` URL param), so the panel can be shared by link. */
  openOrganizationId?: string;
  organizations: {
    rows: AdminPartnerOrganization[];
    facets: { status: FacetOption<PartnerStatusFilter>[]; health: FacetOption<PartnerHealth>[] };
  };
  people: {
    rows: PartnerPerson[];
    facets: { organizations: (FacetOption & { label: string })[]; tags: FacetOption<PersonTagFilter>[] };
  };
  filters: PartnersFilters;
  sorts: { organizations: ListSort<OrganizationSortKey>; people: ListSort<PersonSortKey> };
  directory: { organizations: AdminPartnerOrganization[]; people: PartnerPerson[] };
  needSupport: number;
  activeEmails: string[];
  organizationOptions: OrganizationOption[];
  /** The server's render time (ISO), so relative times match between server and client. */
  now: string;
}

/** Partners. Toasts come from the admin shell's provider (no page-level provider, so none end up under a sheet). */
export function PartnersView({
  view,
  q,
  openOrganizationId,
  organizations,
  people,
  filters,
  sorts,
  directory,
  needSupport,
  activeEmails,
  organizationOptions,
  now,
}: PartnersViewProps) {
  const { toast } = useToast();
  const { setParams, pending: paramsPending } = useListParams();
  // A separate instance, so opening or closing a panel doesn't dim the table as busy.
  const { setParams: setPanelParams } = useListParams();
  const searchState = useListSearch(q);
  const serverSort = view === "organizations" ? sorts.organizations : sorts.people;
  const { sort: requestedSort, setSort, pending: sortPending } = useListSort(
    view === "organizations" ? DEFAULT_ORGANIZATION_SORT : DEFAULT_PERSON_SORT,
  );
  const validKeys: readonly string[] = view === "organizations" ? ORGANIZATION_SORT_KEYS : PERSON_SORT_KEYS;
  // The server ignores sort keys that aren't this view's and uses its default; show the same.
  const sort: TableSort = requestedSort && validKeys.includes(requestedSort.key) ? requestedSort : serverSort;
  const busy = paramsPending || sortPending || searchState.pending;

  const [activeView, setActiveView] = React.useState<PartnersViewName>(view);
  // Keeps the tab in step with the URL (e.g. back/forward), derived at render time.
  const [prevView, setPrevView] = React.useState(view);
  if (view !== prevView) {
    setPrevView(view);
    setActiveView(view);
  }

  // The open organization panel, mirrored in the URL (`?view=organizations&org=<id>`) with router.replace.
  const [openOrgId, setOpenOrgId] = React.useState<string | undefined>(openOrganizationId);
  const [prevOpenOrgId, setPrevOpenOrgId] = React.useState(openOrganizationId);
  if (openOrganizationId !== prevOpenOrgId) {
    setPrevOpenOrgId(openOrganizationId);
    setOpenOrgId(openOrganizationId);
  }
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [invitePreset, setInvitePreset] = React.useState<InvitePreset | undefined>(undefined);
  const [inviteKey, setInviteKey] = React.useState(0);

  // Neither overlay opens through a Radix Trigger (a row, a menu item, one of several buttons opens
  // each), so Radix has nothing reliable to return focus to on close; we capture and restore it ourselves.
  // The panel's fallback is the Organizations tab, since showOrganization can switch tabs out from under
  // the row that opened it.
  const organizationsTabRef = React.useRef<HTMLButtonElement>(null);
  const { capture: capturePanelFocus, restore: restorePanelFocus } = useReturnFocus(() =>
    organizationsTabRef.current?.focus(),
  );
  const { capture: captureInviteFocus, restore: restoreInviteFocus } = useReturnFocus();

  function handleViewChange(value: string) {
    const next: PartnersViewName = value === "people" ? "people" : "organizations";
    setActiveView(next);
    setOpenOrgId(undefined);
    // Sorts are per view.
    setParams({ view: next === "organizations" ? undefined : next, sort: undefined, dir: undefined, org: undefined });
  }

  function openOrganization(id: string) {
    capturePanelFocus();
    setOpenOrgId(id);
    setPanelParams({ view: "organizations", org: id });
  }

  /** From a People row: switch to Organizations with that organization's panel open. */
  function showOrganization(id: string) {
    capturePanelFocus();
    setActiveView("organizations");
    setOpenOrgId(id);
    setPanelParams({ view: "organizations", org: id, sort: undefined, dir: undefined });
  }

  function closePanel() {
    setOpenOrgId(undefined);
    setPanelParams({ org: undefined });
  }

  function openInvite(preset?: InvitePreset) {
    captureInviteFocus();
    setInvitePreset(preset);
    setInviteKey((k) => k + 1);
    setInviteOpen(true);
  }

  async function handleCopyAll() {
    toast({ title: await copyEmails(activeEmails) });
  }

  const clearSearch = () => {
    searchState.setValue("");
    setParams({ q: undefined });
  };
  const orgFilterParams = { status: undefined, health: undefined };
  const personFilterParams = { orgs: undefined, tags: undefined };

  // Header filters.
  const statusFilter: HeaderFilter = {
    label: copy.status.label,
    options: organizations.facets.status.map((f) => ({ value: f.value, label: copy.status[f.value], count: f.count })),
    selected: filters.status,
    defaultSelected: ["active"],
    onChange: (selected) => setParams({ status: filterParam(selected, ["active"]) }),
  };
  const healthFilter: HeaderFilter = {
    label: copy.health.label,
    options: organizations.facets.health.map((f) => ({ value: f.value, label: copy.health.tags[f.value], count: f.count })),
    selected: filters.health,
    onChange: (selected) => setParams({ health: filterParam(selected, []) }),
  };
  const organizationFilter: HeaderFilter = {
    label: copy.table.headerOrganization,
    options: people.facets.organizations.map((f) => ({ value: f.value, label: f.label, count: f.count })),
    selected: filters.organizations,
    onChange: (selected) => setParams({ orgs: selected.length ? selected.join(",") : undefined }),
  };
  const tagsFilter: HeaderFilter = {
    label: copy.tags.label,
    options: people.facets.tags.map((f) => ({ value: f.value, label: copy.tags.options[f.value], count: f.count })),
    selected: filters.tags,
    defaultSelected: DEFAULT_PERSON_TAGS,
    onChange: (selected) => setParams({ tags: filterParam(selected, DEFAULT_PERSON_TAGS) }),
  };

  const orgsFiltered = !sameSet(filters.status, ["active"]) || filters.health.length > 0;
  const peopleFiltered = filters.organizations.length > 0 || !sameSet(filters.tags, DEFAULT_PERSON_TAGS);
  const showSupport = needSupport > 0 && filters.health.length === 0;

  const selectedOrg = openOrgId ? directory.organizations.find((o) => o.id === openOrgId) : undefined;
  const activeCounts = new Map(
    directory.organizations.map((o) => [o.id, o.contacts.filter((c) => c.status === "active").length]),
  );
  const isLastWithAccess = (person: PartnerPerson) =>
    person.status === "active" && !person.removal && (activeCounts.get(person.organization.id) ?? 0) <= 1;

  const inviteButton = (
    <Button type="button" onClick={() => openInvite()}>
      <Icon icon={UserPlus} size={16} />
      {copy.invite.button}
    </Button>
  );

  const headerActions = (
    <>
      {activeEmails.length > 0 && (
        <Button type="button" $variant="secondary" onClick={() => void handleCopyAll()}>
          <Icon icon={Copy} size={16} />
          {copy.emails.copyAll}
        </Button>
      )}
      {inviteButton}
    </>
  );

  return (
    <ListPage>
      <ListPageHeader
        title={copy.title}
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
        actions={headerActions}
        results={{
          query: q,
          count: activeView === "organizations" ? organizations.rows.length : people.rows.length,
          pending: searchState.pending,
        }}
      />

      <Tabs value={activeView} onValueChange={handleViewChange}>
        <ListPageToolbar
          tabs={
            <TabsList aria-label={copy.views.ariaLabel}>
              <TabsTrigger ref={organizationsTabRef} value="organizations">
                {copy.views.organizations}
                <TabsCount>{copy.views.count(organizations.rows.length)}</TabsCount>
              </TabsTrigger>
              <TabsTrigger value="people">
                {copy.views.people}
                <TabsCount>{copy.views.count(people.rows.length)}</TabsCount>
              </TabsTrigger>
            </TabsList>
          }
        />

        <TabsContent value="organizations">
          {showSupport && (
            <SupportCallout>
              <CalloutIcon aria-hidden="true">
                <Icon icon={LifeBuoy} size={16} />
              </CalloutIcon>
              <CalloutText>{copy.health.callout(needSupport)}</CalloutText>
              <Button
                type="button"
                $variant="outline"
                $size="sm"
                onClick={() => setParams({ health: PARTNER_HEALTH.join(","), status: undefined })}
              >
                {copy.health.showThem}
              </Button>
            </SupportCallout>
          )}
          <Table
            columns={organizationColumns({ status: statusFilter, health: healthFilter }, now)}
            rows={organizations.rows}
            getRowId={(org) => org.id}
            onRowClick={(org) => openOrganization(org.id)}
            aria-label={copy.views.organizations}
            sort={view === "organizations" ? sort : sorts.organizations}
            onSortChange={setSort}
            busy={busy}
            empty={
              <ListEmptyState
                items={copy.empty.organizationItems}
                query={q}
                searchedFields={copy.empty.searchedOrganizations}
                onClearSearch={clearSearch}
                filtered={orgsFiltered ? copy.empty.filteredOrganizations : undefined}
                onClearFilters={() => setParams(orgFilterParams)}
                onClearSearchAndFilters={() => {
                  searchState.setValue("");
                  setParams({ q: undefined, ...orgFilterParams });
                }}
                empty={{
                  icon: Building2,
                  title: copy.empty.organizationsTitle,
                  description: copy.empty.organizationsDescription,
                  action: inviteButton,
                }}
              />
            }
          />
        </TabsContent>

        <TabsContent value="people">
          <Table
            columns={personColumns(
              { organization: organizationFilter, tags: tagsFilter },
              {
                now,
                onOpenOrganization: showOrganization,
                renderActions: (person) => (
                  <PersonRowActions
                    person={person}
                    lastWithAccess={isLastWithAccess(person)}
                    onInviteAgain={() =>
                      openInvite({
                        name: person.name,
                        email: person.email,
                        organization: { id: person.organization.id, name: person.organization.name },
                      })
                    }
                  />
                ),
              },
            )}
            rows={people.rows}
            getRowId={(person) => `${person.id}-${person.organization.id}`}
            aria-label={copy.views.people}
            stickyColumns={1}
            sort={view === "people" ? sort : sorts.people}
            onSortChange={setSort}
            busy={busy}
            empty={
              <ListEmptyState
                items={copy.empty.peopleItems}
                query={q}
                searchedFields={copy.empty.searchedPeople}
                onClearSearch={clearSearch}
                filtered={peopleFiltered ? copy.empty.filteredPeople : undefined}
                onClearFilters={() => setParams(personFilterParams)}
                onClearSearchAndFilters={() => {
                  searchState.setValue("");
                  setParams({ q: undefined, ...personFilterParams });
                }}
                empty={{
                  icon: UserRound,
                  title: copy.empty.peopleTitle,
                  description: copy.empty.peopleDescription,
                  action: inviteButton,
                }}
              />
            }
          />
        </TabsContent>
      </Tabs>

      <Sheet open={!!selectedOrg} onOpenChange={(open) => !open && closePanel()}>
        <SheetContent onCloseAutoFocus={restorePanelFocus}>
          {selectedOrg && (
            <PartnerSheetContent
              key={selectedOrg.id}
              org={selectedOrg}
              now={now}
              onAddPerson={() => openInvite({ organization: { id: selectedOrg.id, name: selectedOrg.name } })}
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
        onCloseAutoFocus={restoreInviteFocus}
      />
    </ListPage>
  );
}
