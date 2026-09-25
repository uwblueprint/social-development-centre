import type { Invitation, PartnerContact, PartnerOrganization, PartnerStatus } from "./types";

/*
 * In-memory stand-in for the backend so the UI works end to end in development.
 * Resets on server restart. Backend: replace queries.ts and actions.ts; delete this file.
 */

interface StoredOrg extends Omit<PartnerOrganization, "status"> {
  everActive: boolean;
}

const DAY = 86_400_000;
const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY).toISOString();
export const newInvitation = (): Invitation => ({ sentAt: iso(0), expiresAt: iso(7) });

let seq = 100;
export const nextId = (prefix: string) => `${prefix}_${++seq}`;

const contact = (id: string, name: string, email: string, status: PartnerContact["status"], invitation?: Invitation): PartnerContact => ({
  id,
  name,
  email,
  status,
  invitation,
});

function seed(): StoredOrg[] {
  return [
    { id: "org_1", name: "Northside Food Bank", opportunityCount: 6, createdAt: iso(-120), everActive: true, contacts: [
      contact("c_1", "Amara Okafor", "amara@northsidefood.org", "active"),
      contact("c_2", "Luis Romero", "luis@northsidefood.org", "active"),
    ] },
    { id: "org_2", name: "Riverbend Youth Collective", opportunityCount: 3, createdAt: iso(-60), everActive: true, contacts: [
      contact("c_3", "Priya Nair", "priya@riverbendyouth.ca", "active"),
      contact("c_4", "Sam Chen", "sam@riverbendyouth.ca", "pending", { sentAt: iso(-2), expiresAt: iso(5) }),
    ] },
    { id: "org_3", name: "Maple Literacy Project", opportunityCount: 0, createdAt: iso(-3), everActive: false, contacts: [
      contact("c_5", "Hannah Lee", "hannah@mapleliteracy.org", "pending", { sentAt: iso(-3), expiresAt: iso(4) }),
    ] },
    { id: "org_4", name: "Eastside Newcomer Services", opportunityCount: 11, createdAt: iso(-300), everActive: true, contacts: [
      contact("c_6", "Omar Haddad", "omar@eastsidenewcomers.ca", "active"),
      contact("c_7", "Julia Novak", "julia@eastsidenewcomers.ca", "active"),
      contact("c_8", "Tom Becker", "tom@eastsidenewcomers.ca", "active"),
    ] },
    { id: "org_5", name: "Harbour Seniors Network", opportunityCount: 0, createdAt: iso(-10), everActive: false, contacts: [
      contact("c_9", "Grace Wu", "grace@harbourseniors", "pending", { sentAt: iso(-10), expiresAt: iso(-3), sendError: "The email address was rejected by the recipient's server." }),
    ] },
    { id: "org_6", name: "Greenway Community Gardens", opportunityCount: 2, createdAt: iso(-400), removedAt: iso(-20), everActive: true, contacts: [
      contact("c_10", "Ben Adeyemi", "ben@greenwaygardens.org", "active"),
    ] },
  ];
}

const globalStore = globalThis as unknown as { __partnersStore?: StoredOrg[] };
export const orgs = (): StoredOrg[] => (globalStore.__partnersStore ??= seed());

export function statusOf(org: StoredOrg): PartnerStatus {
  if (org.removedAt) return "removed";
  return currentContacts(org).some((c) => c.status === "active") ? "active" : "pending";
}

export const currentContacts = (org: Pick<StoredOrg, "contacts">) => org.contacts.filter((c) => !c.removedAt);

export function toPublic(org: StoredOrg): PartnerOrganization {
  return {
    id: org.id,
    name: org.name,
    contacts: currentContacts(org),
    opportunityCount: org.opportunityCount,
    createdAt: org.createdAt,
    removedAt: org.removedAt,
    status: statusOf(org),
  };
}
