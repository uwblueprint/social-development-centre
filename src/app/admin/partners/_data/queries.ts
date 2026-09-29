import { labList, labLong, labRead } from "@/dev/state-lab/state"; // STATE LAB (disposable)
import { withInvitationState } from "./contacts";
import { activityOf } from "./health";
import { currentContacts, orgs, statusOf, toPublic, type StoredOrg } from "./store";
import {
  PARTNER_HEALTH,
  PARTNER_STATUSES,
  PERSON_TAG_FILTERS,
  type AdminPartnerOrganization,
  type FacetOption,
  type ListSort,
  type OrganizationOption,
  type OrganizationSortKey,
  type PartnerHealth,
  type PartnerOrganization,
  type PartnerPerson,
  type PartnerStatusFilter,
  type PersonSortKey,
  type PersonTagFilter,
} from "./types";

/** Backend: replace these with real queries; keep the signatures. */

const matches = (q: string | undefined, ...fields: string[]) =>
  !q || fields.some((f) => f.toLowerCase().includes(q.trim().toLowerCase()));

const statusFilterOf = (org: StoredOrg): PartnerStatusFilter => (statusOf(org) === "removed" ? "removed" : "active");

/** The partner's own view of its organization (partner portal): no SDC-only fields. */
function publicOrganization(org: StoredOrg): PartnerOrganization {
  return { ...toPublic(org), contacts: currentContacts(org).map(withInvitationState) };
}

function adminOrganization(org: StoredOrg): AdminPartnerOrganization {
  return { ...publicOrganization(org), ...activityOf(org), joinedAt: org.joinedAt, notes: org.notes };
}

/** Compares with empty values (undefined) last in either direction, then by name. */
function compareBy<T>(value: (row: T) => string | number | undefined, name: (row: T) => string, direction: "asc" | "desc") {
  return (a: T, b: T) => {
    const va = value(a);
    const vb = value(b);
    if (va === undefined || vb === undefined) {
      if (va !== vb) return va === undefined ? 1 : -1;
    } else if (va !== vb) {
      const order = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
      return direction === "asc" ? order : -order;
    }
    return name(a).localeCompare(name(b));
  };
}

/** `selected` empty means the filter is off. */
const passes = <V extends string>(selected: readonly V[], value: V) => selected.length === 0 || selected.includes(value);

function facet<V extends string, R>(values: readonly V[], rows: R[], valueOf: (row: R) => V | undefined): FacetOption<V>[] {
  return values.map((value) => ({ value, count: rows.filter((r) => valueOf(r) === value).length }));
}

export interface OrganizationQuery {
  q?: string;
  /** Organization column → Status. Default: active only. */
  status: PartnerStatusFilter[];
  health: PartnerHealth[];
  sort: ListSort<OrganizationSortKey>;
}

/**
 * Organizations view. Search matches the organization's name and its current people's names and emails
 * (returns the organization when one of its people matches). Each header filter's counts apply the search
 * and the other filter, so they say what choosing that option would show.
 */
export async function listPartners(query: OrganizationQuery): Promise<{
  rows: AdminPartnerOrganization[];
  facets: { status: FacetOption<PartnerStatusFilter>[]; health: FacetOption<PartnerHealth>[] };
}> {
  await labRead(); // STATE LAB (disposable)
  const searched = labList(orgs(), (o) => ({ ...o, name: labLong(o.name) })) // STATE LAB (disposable)
    .filter((o) => matches(query.q, o.name, ...currentContacts(o).flatMap((c) => [c.name, c.email])))
    .map((o) => ({ org: adminOrganization(o), status: statusFilterOf(o) }));

  const healthOf = (r: (typeof searched)[number]) => r.org.health?.tag;
  const byStatus = searched.filter((r) => passes(query.status, r.status));
  const byHealth = searched.filter((r) => query.health.length === 0 || (healthOf(r) && query.health.includes(healthOf(r)!)));
  const rows = byStatus.filter((r) => byHealth.includes(r)).map((r) => r.org);

  const { key, direction } = query.sort;
  const value: Record<OrganizationSortKey, (o: AdminPartnerOrganization) => string | number | undefined> = {
    name: (o) => o.name,
    health: (o) => (o.health ? PARTNER_HEALTH.indexOf(o.health.tag) : undefined),
    people: (o) => o.contacts.length,
    published: (o) => o.opportunityCount,
    lastPosted: (o) => o.lastPostedAt,
  };
  rows.sort(compareBy(value[key], (o) => o.name, direction));

  return {
    rows,
    facets: {
      status: facet(PARTNER_STATUSES, byHealth, (r) => r.status),
      health: facet(PARTNER_HEALTH, byStatus, healthOf),
    },
  };
}

/** Organizations with access that have a health tag (the "might need support" callout). Ignores search and filters. */
export async function countPartnersNeedingSupport(): Promise<number> {
  return orgs().filter((o) => statusOf(o) !== "removed" && activityOf(o).health).length;
}

/**
 * Everyone on People, one row each:
 * - people at organizations with access, tagged with their invitation state if they haven't accepted;
 * - people removed from their organization (`removal: "person"`) and people at organizations whose
 *   access was removed (`removal: "organization"`, `removedAt` = the organization's), tagged Removed.
 * Either removed kind can be restored by inviting them again.
 */
function allPeople(): PartnerPerson[] {
  return orgs().flatMap((o): PartnerPerson[] => {
    const organization = { id: o.id, name: o.name, status: statusOf(o) };
    const removedPeople = o.contacts
      .filter((c) => c.removedAt)
      .map((c) => ({ ...withInvitationState(c), invitationState: undefined, organization, removal: "person" as const, tag: "removed" as const }));
    if (organization.status === "removed") {
      const atRemovedOrganization = currentContacts(o).map((c) => ({
        ...withInvitationState(c),
        invitationState: undefined,
        removedAt: o.removedAt,
        organization,
        removal: "organization" as const,
        tag: "removed" as const,
      }));
      return [...removedPeople, ...atRemovedOrganization];
    }
    const current = currentContacts(o).map((c) => {
      const person = withInvitationState(c);
      return { ...person, organization, tag: person.invitationState };
    });
    return [...current, ...removedPeople];
  });
}

const tagFilterOf = (p: PartnerPerson): PersonTagFilter => p.tag ?? "access";

export interface PeopleQuery {
  q?: string;
  /** Organization ids; empty = every organization. */
  organizations: string[];
  /** Default: DEFAULT_PERSON_TAGS in types.ts (Removed hidden). Empty = every tag. */
  tags: PersonTagFilter[];
  sort: ListSort<PersonSortKey>;
}

/** Tag sort order: the labels A–Z (Invitation expired, not sent, pending, Removed); people with access last. */
const TAG_ORDER = ["expired", "notSent", "pending", "removed"] as const;

/** People view. Search matches name, email and organization name. Facet counts as in listPartners. */
export async function listPartnerPeople(query: PeopleQuery): Promise<{
  rows: PartnerPerson[];
  facets: { organizations: (FacetOption & { label: string })[]; tags: FacetOption<PersonTagFilter>[] };
}> {
  const searched = allPeople().filter((p) => matches(query.q, p.name, p.email, p.organization.name));
  const byOrganization = searched.filter((p) => passes(query.organizations, p.organization.id));
  const byTags = searched.filter((p) => passes(query.tags, tagFilterOf(p)));
  const rows = byOrganization.filter((p) => byTags.includes(p));

  const { key, direction } = query.sort;
  const value: Record<PersonSortKey, (p: PartnerPerson) => string | number | undefined> = {
    name: (p) => p.name,
    email: (p) => p.email.toLowerCase(),
    organization: (p) => p.organization.name,
    tags: (p) => (p.tag ? TAG_ORDER.indexOf(p.tag) : undefined),
  };
  rows.sort(compareBy(value[key], (p) => p.name, direction));

  const organizations = orgs()
    .map((o) => ({ value: o.id, label: o.name, count: byTags.filter((p) => p.organization.id === o.id).length }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return { rows, facets: { organizations, tags: facet(PERSON_TAG_FILTERS, byOrganization, tagFilterOf) } };
}

/** Every organization and person, unfiltered, so an open panel survives its row being filtered out. */
export async function listPartnerDirectory(): Promise<{ organizations: AdminPartnerOrganization[]; people: PartnerPerson[] }> {
  return { organizations: orgs().map(adminOrganization), people: allPeople() };
}

/** Copy all emails: everyone who isn't removed (people at organizations with access, invited or not), A–Z, no duplicates. */
export async function listActivePartnerEmails(): Promise<string[]> {
  const emails = orgs()
    .filter((o) => statusOf(o) !== "removed")
    .flatMap((o) => currentContacts(o).map((c) => c.email));
  return [...new Set(emails)].sort((a, b) => a.localeCompare(b));
}

/** The partner portal's view of one organization. Never includes SDC notes or health. */
export async function getPartner(id: string): Promise<PartnerOrganization | null> {
  const org = orgs().find((o) => o.id === id);
  return org ? publicOrganization(org) : null;
}

/**
 * Organizations a person can be invited to. Removed ones are included: inviting someone to a removed
 * organization is how it's reinvited (access returns when they accept).
 */
export async function listOrganizationOptions(): Promise<OrganizationOption[]> {
  return orgs()
    .map((o) => ({ id: o.id, name: o.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
