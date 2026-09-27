/** Contract between the Partners UI and the backend. See docs/backend/partners.md. */

/** Longest organization description, in characters. */
export const ORGANIZATION_DESCRIPTION_MAX = 280;

export type ContactStatus = "pending" | "active";

/**
 * Derived: `removed` if the organization's access was removed; `active` once anyone at it has accepted;
 * otherwise `pending` (the UI says the organization is awaiting a response).
 */
export type PartnerStatus = "pending" | "active" | "removed";

/** The Organization column's Status filter on Partners. */
export type PartnerStatusFilter = "active" | "removed";
export const PARTNER_STATUSES = ["active", "removed"] as const satisfies readonly PartnerStatusFilter[];

/**
 * One health tag per organization with access, derived on the server (_data/health.ts). First match wins,
 * in this order; no match means no tag. Removed organizations have none. Rules: docs/backend/partners.md.
 */
/** No post for this many days, since joining or since the last post: No recent posts. */
export const NO_RECENT_POSTS_DAYS = 60;
/** A published opportunity should be in an email within this many days of posting: Not emailed. */
export const EMAIL_WITHIN_DAYS = 14;

export const PARTNER_HEALTH = ["notOnboarded", "noRecentPosts", "notEmailed", "noClicks"] as const;
export type PartnerHealth = (typeof PARTNER_HEALTH)[number];

/** `noRecentPosts` is measured from the last post, or from joining when there's none. */
export interface PartnerHealthTag {
  tag: PartnerHealth;
  since?: "joined" | "lastPost";
}

/** SDC's internal notes on an organization. Admin only: never returned to the partner portal. */
export interface OrganizationNotes {
  text: string;
  editedBy: string;
  editedAt: string;
}

/** Longest SDC notes, in characters. */
export const ORGANIZATION_NOTES_MAX = 2000;

/**
 * The invitation a pending person holds. `sentAt` and `expiresAt` describe the link that was last
 * delivered; both are absent until a send succeeds. A failed send never changes them, so a still-valid
 * earlier link stays valid. Delivery errors are logged for SDC, never stored for display.
 */
export interface Invitation {
  sentAt?: string;
  expiresAt?: string;
}

/**
 * Mutually exclusive invitation states (derived at read time by `invitationStateOf` in _data/contacts.ts):
 * - `pending`: an email was delivered and the link hasn't expired.
 * - `notSent`: no invitation email has ever been delivered.
 * - `expired`: the delivered link's 7 days have passed.
 */
export type InvitationState = "pending" | "notSent" | "expired";

export interface PartnerContact {
  id: string;
  name: string;
  email: string;
  status: ContactStatus;
  /** Present while an invitation is outstanding, including an email change on an active person. */
  invitation?: Invitation;
  /** Present only for pending people. */
  invitationState?: InvitationState;
  /** Set when the person was removed from this organization; kept for history. */
  removedAt?: string;
}

export interface PartnerOrganization {
  id: string;
  name: string;
  /** The organization's own site, stored normalized to https:// (people can type "sdckw.ca"). */
  website?: string;
  /** Short public description, up to ORGANIZATION_DESCRIPTION_MAX characters. */
  description?: string;
  status: PartnerStatus;
  /** Current people (active or invited); people removed from the organization are listed on People → Removed. */
  contacts: PartnerContact[];
  /** Published (not ended or closed) opportunities; derived from Opportunities (countPublishedOpportunities). */
  opportunityCount: number;
  createdAt: string;
  removedAt?: string;
}

/** An organization as admins see it on Partners: the partner's record plus SDC-only fields. */
export interface AdminPartnerOrganization extends PartnerOrganization {
  health?: PartnerHealthTag;
  /** When the first person accepted an invitation (absent until then). */
  joinedAt?: string;
  /** The latest `publishedAt` of any of its opportunities, including closed ones. */
  lastPostedAt?: string;
  /** Clicks on its opportunities in SDC's emails, all time. */
  totalClicks: number;
  notes?: OrganizationNotes;
}

/** The single tag on a People row: an invitation state, or Removed. None once they have access. */
export type PersonTag = InvitationState | "removed";
/** People's Tags filter values: every tag, plus `access` for people with no tag. */
export const PERSON_TAG_FILTERS = ["access", "pending", "notSent", "expired", "removed"] as const;
export type PersonTagFilter = (typeof PERSON_TAG_FILTERS)[number];
/** People's Tags filter default: everyone except Removed. */
export const DEFAULT_PERSON_TAGS: PersonTagFilter[] = PERSON_TAG_FILTERS.filter((t) => t !== "removed");

export interface PartnerPerson extends PartnerContact {
  organization: Pick<PartnerOrganization, "id" | "name" | "status">;
  /**
   * On People → Removed only: `person` if they were removed from the organization, `organization` if the
   * whole organization's access was removed. `removedAt` is then the date either happened.
   */
  removal?: "person" | "organization";
  tag?: PersonTag;
}

/** Sortable columns (server-side, `sort` and `dir` URL params). */
export const ORGANIZATION_SORT_KEYS = ["name", "health", "people", "published", "lastPosted"] as const;
export type OrganizationSortKey = (typeof ORGANIZATION_SORT_KEYS)[number];
export const PERSON_SORT_KEYS = ["name", "email", "organization", "tags"] as const;
export type PersonSortKey = (typeof PERSON_SORT_KEYS)[number];
export const DEFAULT_ORGANIZATION_SORT: ListSort<OrganizationSortKey> = { key: "name", direction: "asc" };
export const DEFAULT_PERSON_SORT: ListSort<PersonSortKey> = { key: "name", direction: "asc" };
export interface ListSort<K extends string> {
  key: K;
  direction: "asc" | "desc";
}

/** An option in a header filter, with how many rows choosing it would show (search and the other filters applied). */
export interface FacetOption<V extends string = string> {
  value: V;
  count: number;
}

export interface OrganizationOption {
  id: string;
  name: string;
}
