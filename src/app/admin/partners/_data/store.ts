import { countLiveOpportunities } from "@/features/opportunities/queries";
import type { Invitation, PartnerContact, PartnerOrganization, PartnerStatus } from "./types";

/*
 * In-memory stand-in for the backend so the UI works end to end in development.
 * Resets on server restart. Backend: replace queries.ts and actions.ts; delete this file.
 */

export type StoredContact = Omit<PartnerContact, "invitationState">;

export interface StoredOrg extends Omit<PartnerOrganization, "status" | "opportunityCount" | "contacts"> {
  contacts: StoredContact[];
  everActive: boolean;
}

const DAY = 86_400_000;
const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY).toISOString();
/** A freshly delivered link: single use, expires after 7 days. */
export const newInvitation = (): Invitation => ({ sentAt: iso(0), expiresAt: iso(7) });

let seq = 100;
export const nextId = (prefix: string) => `${prefix}_${++seq}`;

const contact = (
  id: string,
  name: string,
  email: string,
  status: PartnerContact["status"],
  extra: Partial<StoredContact> = {},
): StoredContact => ({ id, name, email, status, ...extra });

function seed(): StoredOrg[] {
  return [
    { id: "org_1", name: "Northside Food Bank", website: "https://northsidefood.org", description: "Free groceries and hot meals for Northside families, run by neighbours and volunteers since 1998.", createdAt: iso(-120), everActive: true, contacts: [
      contact("c_1", "Amara Okafor", "amara@northsidefood.org", "active"),
      contact("c_2", "Luis Romero", "luis@northsidefood.org", "active"),
    ] },
    { id: "org_2", name: "Riverbend Youth Collective", website: "https://riverbendyouth.ca", createdAt: iso(-60), everActive: true, contacts: [
      contact("c_3", "Priya Nair", "priya@riverbendyouth.ca", "active"),
      contact("c_4", "Sam Chen", "sam@riverbendyouth.ca", "pending", { invitation: { sentAt: iso(-2), expiresAt: iso(5) } }),
    ] },
    { id: "org_3", name: "Maple Literacy Project", createdAt: iso(-3), everActive: false, contacts: [
      contact("c_5", "Hannah Lee", "hannah@mapleliteracy.org", "pending", { invitation: { sentAt: iso(-3), expiresAt: iso(4) } }),
    ] },
    { id: "org_4", name: "Eastside Newcomer Services", website: "https://eastsidenewcomers.ca", description: "Settlement support, language circles and job help for newcomers to the region.", createdAt: iso(-300), everActive: true, contacts: [
      contact("c_6", "Omar Haddad", "omar@eastsidenewcomers.ca", "active"),
      contact("c_7", "Julia Novak", "julia@eastsidenewcomers.ca", "active"),
      contact("c_8", "Tom Becker", "tom@eastsidenewcomers.ca", "active"),
      contact("c_11", "Rosa Diaz", "rosa@eastsidenewcomers.ca", "pending", { invitation: { sentAt: iso(-10), expiresAt: iso(-3) } }),
      contact("c_12", "Mark Ellis", "mark@eastsidenewcomers.ca", "active", { removedAt: iso(-15) }),
    ] },
    { id: "org_5", name: "Harbour Seniors Network", createdAt: iso(-10), everActive: false, contacts: [
      // Never delivered: the invitation shows as not sent.
      contact("c_9", "Grace Wu", "grace@harbourseniors", "pending", { invitation: {} }),
    ] },
    { id: "org_6", name: "Greenway Community Gardens", createdAt: iso(-400), removedAt: iso(-20), everActive: true, contacts: [
      contact("c_10", "Ben Adeyemi", "ben@greenwaygardens.org", "active"),
    ] },
  ];
}

const globalStore = globalThis as unknown as { __partnersStoreV2?: StoredOrg[] };
export const orgs = (): StoredOrg[] => (globalStore.__partnersStoreV2 ??= seed());

export function statusOf(org: StoredOrg): PartnerStatus {
  if (org.removedAt) return "removed";
  return currentContacts(org).some((c) => c.status === "active") ? "active" : "pending";
}

/** People still at the organization (removed people are kept for history, with `removedAt`). */
export const currentContacts = (org: Pick<StoredOrg, "contacts">) => org.contacts.filter((c) => !c.removedAt);

/** The organization without its people; queries.ts adds them with their derived invitation states. */
export function toPublic(org: StoredOrg): Omit<PartnerOrganization, "contacts"> {
  return {
    id: org.id,
    name: org.name,
    website: org.website,
    description: org.description,
    opportunityCount: countLiveOpportunities(org.id),
    createdAt: org.createdAt,
    removedAt: org.removedAt,
    status: statusOf(org),
  };
}
