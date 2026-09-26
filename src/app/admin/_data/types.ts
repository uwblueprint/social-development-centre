export type AdminSection = "opportunities" | "partners" | "community" | "insights";

export interface AdminUser {
  name: string;
  email: string;
  initials: string;
  avatarUrl?: string;
}
