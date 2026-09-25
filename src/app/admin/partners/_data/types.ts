/** Contract between the Partners UI and the backend. See docs/backend/partners.md. */

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
}

export interface PartnerOrganization {
  id: string;
  name: string;
  status: PartnerStatus;
  contacts: PartnerContact[];
  /** Current (non-expired) opportunities. */
  opportunityCount: number;
  createdAt: string;
  removedAt?: string;
}

export interface PartnerPerson extends PartnerContact {
  organization: Pick<PartnerOrganization, "id" | "name" | "status">;
}

export interface OrganizationOption {
  id: string;
  name: string;
}
