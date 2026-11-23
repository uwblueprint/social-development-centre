/** One key per sidebar section (the route under /admin). */
export type AdminSection = "members" | "admins" | "settings";

export interface AdminUser {
  name: string;
  email: string;
}
