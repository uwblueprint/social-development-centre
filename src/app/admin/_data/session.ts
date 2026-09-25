import type { AdminSection, AdminUser } from "./types";

/**
 * Backend: return the signed-in admin, or null if the user isn't an SDC admin
 * (the layout then redirects to /login). Must check the admin role, not just sign-in.
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("getCurrentAdmin is not implemented: add the admin role check before shipping.");
  }
  return { name: "Admin User", email: "admin@sdc.example", initials: "AU" };
}

/** Backend: counts that need an admin's attention, shown as badges in the sidebar. Omit a key to hide its badge. */
export async function getAdminNavCounts(): Promise<Partial<Record<AdminSection, number>>> {
  return {};
}
