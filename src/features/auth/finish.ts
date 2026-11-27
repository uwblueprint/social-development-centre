import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { portals, safeAdminPath, type Portal } from "./portals";

export type FinishResult = { destination: string } | { error: "failed" | "no-access" };

/**
 * After a sign-in link checks out: link the login to its person, then pick where they go. A login
 * whose address has no person is signed out again rather than left signed in as nobody. On the admin
 * page, someone whose admin access was removed after the link was sent is signed out too, and told why.
 */
export async function finishSignIn(
  supabase: Awaited<ReturnType<typeof createClient>>,
  portal: Portal,
  next: string | null | undefined,
): Promise<FinishResult> {
  const { data: linked, error } = await supabase.rpc("record_sign_in");
  if (!linked) {
    console.error("record_sign_in found no person:", error?.message ?? "no match");
    await supabase.auth.signOut({ scope: "local" });
    return { error: "failed" };
  }
  if (portal === "admin") {
    const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");
    if (adminError) {
      console.error("is_admin failed after sign-in:", adminError.message);
      return { error: "failed" };
    }
    if (!isAdmin) {
      await supabase.auth.signOut({ scope: "local" });
      return { error: "no-access" };
    }
  }
  return {
    destination: (portal === "admin" && safeAdminPath(next)) || portals[portal].homePath,
  };
}
