export type PartnerSection = "opportunities" | "organization";

export interface PartnerUser {
  name: string;
  email: string;
  initials: string;
  avatarUrl?: string;
  organization: { id: string; name: string };
}
