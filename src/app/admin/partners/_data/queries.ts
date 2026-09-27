import type { OrganizationOption, PartnerOrganization, PartnerPerson, PartnerStatusFilter } from "./types";
import { withInvitationState } from "./contacts";
import { currentContacts, orgs, statusOf, toPublic, type StoredOrg } from "./store";

/** Backend: replace these with real queries; keep the signatures. */

const matches = (q: string | undefined, ...fields: string[]) =>
  !q || fields.some((f) => f.toLowerCase().includes(q.trim().toLowerCase()));

const isInFilter = (org: StoredOrg, status: PartnerStatusFilter) =>
  status === "removed" ? statusOf(org) === "removed" : statusOf(org) !== "removed";

function publicOrganization(org: StoredOrg): PartnerOrganization {
  return { ...toPublic(org), contacts: currentContacts(org).map(withInvitationState) };
}

/**
 * Organizations view. Matches the organization's name and its current people's names and emails, and
 * returns the organization when one of its people matches.
 */
export async function listPartners(status: PartnerStatusFilter, q?: string): Promise<PartnerOrganization[]> {
  return orgs()
    .filter((o) => isInFilter(o, status))
    .filter((o) => matches(q, o.name, ...currentContacts(o).flatMap((c) => [c.name, c.email])))
    .map(publicOrganization)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * People view. Matches name, email and organization name.
 * - `active`: everyone at current organizations, with their invitation state if they haven't accepted.
 * - `removed`: people removed from their organization, and people at organizations whose access was removed.
 *   Either can be restored by inviting them again.
 */
export async function listPartnerPeople(status: PartnerStatusFilter, q?: string): Promise<PartnerPerson[]> {
  return orgs()
    .flatMap((o): PartnerPerson[] => {
      const organization = { id: o.id, name: o.name, status: statusOf(o) };
      if (status === "active") {
        if (organization.status === "removed") return [];
        return currentContacts(o).map((c) => ({ ...withInvitationState(c), organization }));
      }
      const removedPeople = o.contacts
        .filter((c) => c.removedAt)
        .map((c) => ({ ...withInvitationState(c), organization, removal: "person" as const }));
      const atRemovedOrganization =
        organization.status === "removed"
          ? currentContacts(o).map((c) => ({
              ...withInvitationState(c),
              invitationState: undefined,
              removedAt: o.removedAt,
              organization,
              removal: "organization" as const,
            }))
          : [];
      return [...removedPeople, ...atRemovedOrganization];
    })
    .filter((p) => matches(q, p.name, p.email, p.organization.name))
    .sort((a, b) => a.name.localeCompare(b.name));
}

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
