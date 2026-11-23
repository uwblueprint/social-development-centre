import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Ends this browser's session and shows the goodbye screen. For someone who has just left the admin
 * portal for good: it is not a plain sign-out (that goes back to the sign-in page). Signing out here
 * is only tidiness: with no admin row, `is_admin()` is already false for them.
 */
export async function endSessionAndSayGoodbye(): Promise<never> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) console.error("Sign-out after leaving failed:", error.message);
  redirect("/goodbye");
}
