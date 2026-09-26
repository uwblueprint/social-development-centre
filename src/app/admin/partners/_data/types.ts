/** Contract between the Partners UI and the backend. See docs/backend/partners.md. */

/** Longest organization description, in characters. */
export const ORGANIZATION_DESCRIPTION_MAX = 280;

export type ContactStatus = "pending" | "active";

/** Derived: removed if the organization's access was removed; pending until any contact accepts. */
export type PartnerStatus = "pending" | "active" | "removed";

export interface Invitation {
  sentAt: string;
  expiresAt: string;
  /** Present when the last send attempt failed; the UI offers a retry. */
  sendError?: string;
}

export interface PartnerContact {
  id: string;
  name: string;
  email: string;
  status: ContactStatus;
  /** Present while an invitation is outstanding, including an email change on an active contact. */
  invitation?: Invitation;
  /** Set when the person was removed from this organization; kept for history, hidden from lists. */
  removedAt?: string;
}

export interface PartnerOrganization {
  id: string;
  name: string;
  /** The organization's own site, https:// only. */
  website?: string;
  /** Short public description, up to ORGANIZATION_DESCRIPTION_MAX characters. */
  description?: string;
  status: PartnerStatus;
  contacts: PartnerContact[];
  /** Live (published, not ended or closed) opportunities; derived from Opportunities. */
  opportunityCount: number;
  createdAt: string;
  removedAt?: string;
}

export interface PartnerPerson extends PartnerContact {
  organization: Pick<PartnerOrganization, "id" | "name" | "status">;
}

/** A contact who hasn't accepted yet, as listed on the Invitations tab. */
export interface PendingInvitation extends PartnerPerson {
  invitation: Invitation;
  /** True once `invitation.expiresAt` has passed and the link no longer works. */
  expired: boolean;
}

export interface OrganizationOption {
  id: string;
  name: string;
}
