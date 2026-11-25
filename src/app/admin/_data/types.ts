/** One key per sidebar section (the route under /admin). */
export type AdminSection = "members" | "outbox" | "automatic-emails" | "admins" | "settings";

export interface AdminUser {
  name: string;
  email: string;
}
