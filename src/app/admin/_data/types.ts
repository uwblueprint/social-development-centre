/** One key per sidebar section (the route under /admin). */
export type AdminSection = "members" | "signup-links" | "admins";

export interface AdminUser {
  name: string;
  email: string;
}
