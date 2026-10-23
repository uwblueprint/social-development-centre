import "server-only";
import { getSignedInPerson } from "@/features/auth/session";
import type { AdminUser } from "./types";

/**
 * The signed-in admin, or null if they aren't signed in or aren't an SDC admin (callers then redirect to
 * the admin sign-in page). Checks the admin role on every call, so removing an admin takes effect on their
 * next click.
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  // Lets people work on UI locally without Supabase credentials, like src/lib/supabase/proxy.ts.
  if (process.env.NODE_ENV !== "production" && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { name: "Admin User", email: "admin@sdc.example" };
  }
  const person = await getSignedInPerson();
  if (!person?.isAdmin) return null;
  return { name: person.fullName ?? person.email, email: person.email };
}
