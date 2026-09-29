import { labWrite } from "@/dev/state-lab/write"; // STATE LAB (disposable)
import type { AdminUser } from "./types";

/**
 * Backend: return the signed-in admin, or null if the user isn't an SDC admin
 * (the layout then redirects to /login). Must check the admin role, not just sign-in.
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("getCurrentAdmin is not implemented: add the admin role check before shipping.");
  }
  if ((await labWrite()) === "signed-out") return null; // STATE LAB (disposable)
  return { name: "Admin User", email: "admin@sdc.example" };
}

