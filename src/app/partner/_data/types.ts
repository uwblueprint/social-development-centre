export type PartnerSection = "opportunities" | "organization";

export interface PartnerUser {
  /** The signed-in person's contact ID in their organization (PartnerContact.id). */
  contactId: string;
  name: string;
  email: string;
  initials: string;
  avatarUrl?: string;
  organization: { id: string; name: string };
}
