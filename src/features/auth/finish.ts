import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { portals, safeAdminPath, type Portal } from "./portals";

/**
 * After a sign-in link or code checks out: link the login to its person, then pick where they go. A
 * login whose address has no person is signed out again rather than left signed in as nobody.
 */
export async function finishSignIn(
  supabase: Awaited<ReturnType<typeof createClient>>,
  portal: Portal,
  next: string | null | undefined,
): Promise<string | null> {
  const { data: linked, error } = await supabase.rpc("record_sign_in");
  if (!linked) {
    console.error("record_sign_in found no person:", error?.message ?? "no match");
    await supabase.auth.signOut({ scope: "local" });
    return null;
  }
  return (portal === "admin" && safeAdminPath(next)) || portals[portal].homePath;
}
