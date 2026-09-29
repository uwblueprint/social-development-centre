import { countPublishedOpportunities } from "@/features/opportunities/queries";
import type { Invitation, OrganizationNotes, PartnerContact, PartnerOrganization, PartnerStatus } from "./types";

/*
 * In-memory stand-in for the backend so the UI works end to end in development.
 * Resets on server restart. Backend: replace queries.ts and actions.ts; delete this file.
 */

export type StoredContact = Omit<PartnerContact, "invitationState">;

export interface StoredOrg extends Omit<PartnerOrganization, "status" | "opportunityCount" | "contacts"> {
  contacts: StoredContact[];
  everActive: boolean;
  /** When the first person accepted an invitation. */
  joinedAt?: string;
  /** SDC-only; never sent to the partner portal. */
  notes?: OrganizationNotes;
  /** An admin dismissed this health tag; it stays hidden while the organization's tag is still this one. */
  healthDismissed?: string;
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
    { id: "org_1", name: "Northside Food Bank", website: "https://northsidefood.org", description: "Free groceries and hot meals for Northside families, run by neighbours and volunteers since 1998.", createdAt: iso(-120), joinedAt: iso(-118), everActive: true, contacts: [
      contact("c_1", "Amara Okafor", "amara@northsidefood.org", "active"),
      contact("c_2", "Luis Romero", "luis@northsidefood.org", "active"),
    ] },
    { id: "org_2", name: "Riverbend Youth Collective", website: "https://riverbendyouth.ca", createdAt: iso(-60), joinedAt: iso(-58), everActive: true, contacts: [
      contact("c_3", "Priya Nair", "priya@riverbendyouth.ca", "active"),
      contact("c_4", "Sam Chen", "sam@riverbendyouth.ca", "pending", { invitation: { sentAt: iso(-2), expiresAt: iso(5) } }),
    ] },
    { id: "org_3", name: "Maple Literacy Project", createdAt: iso(-3), everActive: false, contacts: [
      contact("c_5", "Hannah Lee", "hannah@mapleliteracy.org", "pending", { invitation: { sentAt: iso(-3), expiresAt: iso(4) } }),
    ] },
    { id: "org_4", name: "Eastside Newcomer Services", website: "https://eastsidenewcomers.ca", description: "Settlement support, language circles and job help for newcomers to the region.", createdAt: iso(-300), joinedAt: iso(-298), everActive: true, notes: { text: "Omar prefers a phone call to email. Their summer program runs June to August, so expect fewer posts in the spring.", editedBy: "Admin User", editedAt: iso(-4) }, contacts: [
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
    { id: "org_6", name: "Greenway Community Gardens", createdAt: iso(-400), joinedAt: iso(-398), removedAt: iso(-20), everActive: true, contacts: [
      contact("c_10", "Ben Adeyemi", "ben@greenwaygardens.org", "active"),
    ] },
    // Joined 5 months ago and has never posted: No recent posts.
    { id: "org_7", name: "Lakeview Tenants Association", website: "https://lakeviewtenants.ca", createdAt: iso(-155), joinedAt: iso(-150), everActive: true, contacts: [
      contact("c_13", "Nadia Petrova", "nadia@lakeviewtenants.ca", "active"),
    ] },
    // Joined 3 weeks ago, no posts yet: still inside the 60 days, so no tag.
    { id: "org_8", name: "Westmount Arts Circle", createdAt: iso(-22), joinedAt: iso(-20), everActive: true, contacts: [
      contact("c_14", "Kofi Mensah", "kofi@westmountarts.org", "active"),
      contact("c_15", "Elena Rossi", "elena@westmountarts.org", "active"),
    ] },
    ...sampleOrgs(),
  ];
}

/**
 * 42 more organizations so lists and filters run at SDC's real scale (about 50 partners). Stable ids
 * `org_101`…; everyone active, one contact each (every fifth has a pending second invite).
 * `SAMPLE_ORG_NAMES` is shared with the opportunities seed, which gives most of them listings.
 */
export const SAMPLE_ORG_NAMES = [
  "Kitchener Pride Collective", "Waterloo Region Food Rescue", "Cambridge Shelter Coalition", "Grand River Climate Action",
  "Bridgeport Neighbourhood Association", "Victoria Hills Community Centre", "Mill-Courtland Seniors Club", "Downtown Kitchener BIA Volunteers",
  "Laurel Creek Nature Stewards", "Chicopee Youth Soccer", "Forest Heights Tenants Union", "KW Multicultural Kitchen",
  "Galt Literacy Circle", "Hespeler Heritage Society", "Preston Community Pantry", "Elmira Refugee Sponsors",
  "St. Jacobs Makers Guild", "Uptown Waterloo Jazz Society", "Iron Horse Trail Friends", "Region of Waterloo Arts Fund Volunteers",
  "Doon Pioneer Tenants", "Stanley Park Parents Network", "Kingsdale Community Hub", "Mount Hope Breithaupt Park Residents",
  "KW Accessibility Advocates", "Grand River Indigenous Land Collective", "Waterloo Bike Kitchen", "Ayr Community Garden",
  "New Hamburg Youth Council", "KW Disability Justice Network", "Cambridge Black Community Circle", "Waterloo Region Housing Coalition",
  "Kitchener Public Library Friends", "Sunnydale Homework Club", "Lincoln Heights Walking Group", "Region Newcomer Women's Circle",
  "KW Tool Library", "Wilmot Food Security Team", "Cedar Hill Community Group", "Grand River Mutual Aid",
  "Waterloo Region Climate Kids", "Southwest Kitchener Seniors Hub",
];

function sampleOrgs(): StoredOrg[] {
  return SAMPLE_ORG_NAMES.map((name, i) => {
    const n = 101 + i;
    const domain = name.toLowerCase().replace(/[^a-z]+/g, "").slice(0, 18) + ".ca";
    const [first, last] = [["Ava", "Noah", "Mei", "Ravi", "Zara", "Leo", "Ines", "Tariq", "Hana", "Owen"][i % 10], ["Patel", "Nguyen", "Silva", "Kaur", "Martin", "Ali", "Fraser", "Osei"][i % 8]];
    const contacts = [contact(`c_${n}`, `${first} ${last}`, `${first.toLowerCase()}@${domain}`, "active")];
    if (i % 5 === 0) contacts.push(contact(`c_${n}b`, `Jordan ${last}`, `jordan@${domain}`, "pending", { invitation: newInvitation() }));
    return { id: `org_${n}`, name, website: `https://${domain}`, createdAt: iso(-(30 + i * 7)), joinedAt: iso(-(28 + i * 7)), everActive: true, contacts };
  });
}

// Bump the key when the seed or shape changes, so a running dev server picks up the new seed.
const globalStore = globalThis as unknown as { __partnersStoreV7?: StoredOrg[] };
export const orgs = (): StoredOrg[] => (globalStore.__partnersStoreV7 ??= seed());

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
    opportunityCount: countPublishedOpportunities(org.id),
    createdAt: org.createdAt,
    removedAt: org.removedAt,
    status: statusOf(org),
  };
}
