export type PartnerSection = "opportunities" | "insights" | "organization";

export interface PartnerUser {
  /** The signed-in person's contact ID in their organization (PartnerContact.id). */
  contactId: string;
  name: string;
  email: string;
  organization: { id: string; name: string };
}
