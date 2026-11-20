/** One key per sidebar section (the route under /admin). */
export type AdminSection = "members" | "payments" | "automatic-emails" | "admins" | "settings";

export interface AdminUser {
  name: string;
  email: string;
}
