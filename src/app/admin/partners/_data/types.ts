/** Contract between the Partners UI and the backend. See docs/backend/partners.md. */

/** Longest organization description, in characters. */
export const ORGANIZATION_DESCRIPTION_MAX = 280;

export type ContactStatus = "pending" | "active";

/**
 * Derived: `removed` if the organization's access was removed; `active` once anyone at it has accepted;
 * otherwise `pending` (the UI says the organization is awaiting a response).
 */
export type PartnerStatus = "pending" | "active" | "removed";

/** The Status filter on Partners. */
export type PartnerStatusFilter = "active" | "removed";

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

export interface PartnerPerson extends PartnerContact {
  organization: Pick<PartnerOrganization, "id" | "name" | "status">;
  /**
   * On People → Removed only: `person` if they were removed from the organization, `organization` if the
   * whole organization's access was removed. `removedAt` is then the date either happened.
   */
  removal?: "person" | "organization";
}

export interface OrganizationOption {
  id: string;
  name: string;
}
