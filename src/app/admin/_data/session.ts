import { withDevAccount } from "@/features/account/devAccount";
import type { AdminUser } from "./types";

/**
 * Backend: return the signed-in admin, or null if the user isn't an SDC admin
 * (the layout then redirects to /login). Must check the admin role, not just sign-in.
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("getCurrentAdmin is not implemented: add the admin role check before shipping.");
  }
  // Dev: name and picture changes from My account apply on top (in memory).
  return withDevAccount({ name: "Admin User", email: "admin@sdc.example", initials: "AU" });
}

