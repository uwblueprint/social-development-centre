import type { OrganizationOption, PartnerOrganization, PartnerPerson, PendingInvitation } from "./types";
import { currentContacts, orgs, statusOf, toPublic } from "./store";

/** Backend: replace these with real queries; keep the signatures. */

const matches = (q: string | undefined, ...fields: string[]) =>
  !q || fields.some((f) => f.toLowerCase().includes(q.trim().toLowerCase()));

export async function listPartners(view: "current" | "removed", q?: string): Promise<PartnerOrganization[]> {
  return orgs()
    .filter((o) => (view === "removed" ? statusOf(o) === "removed" : statusOf(o) !== "removed"))
    .filter((o) => matches(q, o.name, ...currentContacts(o).flatMap((c) => [c.name, c.email])))
    .map(toPublic)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Active contacts at current organizations (People tab). Pending contacts are listed by listPendingInvitations. */
export async function listPartnerPeople(q?: string): Promise<PartnerPerson[]> {
  return orgs()
    .filter((o) => statusOf(o) !== "removed")
    .flatMap((o) =>
      currentContacts(o)
        .filter((c) => c.status === "active")
        .map((c) => ({ ...c, organization: { id: o.id, name: o.name, status: statusOf(o) } })),
    )
    .filter((p) => matches(q, p.name, p.email, p.organization.name))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Every pending invitation at current organizations (Invitations tab), including contacts at
 * organizations nobody has joined yet. Soonest to expire first, so expired ones lead.
 */
export async function listPendingInvitations(q?: string): Promise<PendingInvitation[]> {
  const now = Date.now();
  return orgs()
    .filter((o) => statusOf(o) !== "removed")
    .flatMap((o) =>
      currentContacts(o).flatMap((c) =>
        c.status === "pending" && c.invitation
          ? [
              {
                ...c,
                invitation: c.invitation,
                expired: new Date(c.invitation.expiresAt).getTime() < now,
                organization: { id: o.id, name: o.name, status: statusOf(o) },
              },
            ]
          : [],
      ),
    )
    .filter((p) => matches(q, p.name, p.email, p.organization.name))
    .sort((a, b) => a.invitation.expiresAt.localeCompare(b.invitation.expiresAt) || a.name.localeCompare(b.name));
}

export async function getPartner(id: string): Promise<PartnerOrganization | null> {
  const org = orgs().find((o) => o.id === id);
  return org ? toPublic(org) : null;
}

/** Organizations a new person can be invited to (removed ones must be reinvited instead). */
export async function listOrganizationOptions(): Promise<OrganizationOption[]> {
  return orgs()
    .filter((o) => statusOf(o) !== "removed")
    .map((o) => ({ id: o.id, name: o.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
