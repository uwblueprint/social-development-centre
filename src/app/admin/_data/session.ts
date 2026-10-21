import { createClient } from "@/lib/supabase/server";
import type { AdminUser } from "./types";

/**
 * The signed-in SDC admin, or null when this person isn't one (the layout then redirects to /login).
 *
 * Being an admin means having a row in `public.admins`. The database decides it, through
 * `is_admin()` (security definer): the rule lives in one place, and nothing the browser sends can
 * influence the answer. Reading the session also makes every admin route dynamic, so no admin page
 * is ever prerendered or cached.
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  // Lets people work on UI locally without Supabase credentials; production always enforces auth.
  // Same condition as the sign-in redirect in src/lib/supabase/proxy.ts, so the two agree.
  if (process.env.NODE_ENV !== "production" && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { name: "Admin User", email: "admin@sdc.example" };
  }

  const supabase = await createClient();
  const { data: session } = await supabase.auth.getClaims();
  const claims = session?.claims;
  if (!claims?.sub) return null;

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error) {
    // A failed check is not an admin: fail closed and let the layout send them to /login.
    console.error("is_admin failed:", error.message);
    return null;
  }
  if (!isAdmin) return null;

  // Their own row is readable under the people policy (`user_id = auth.uid()`).
  const { data: person } = await supabase
    .from("people")
    .select("full_name, email")
    .eq("user_id", claims.sub)
    .maybeSingle();

  const email = person?.email ?? (typeof claims.email === "string" ? claims.email : "");
  // full_name is empty until someone fills it in (the welcome form, or an admin adding them),
  // so fall back to the part of the address before the @ rather than showing nothing.
  const name = person?.full_name?.trim() || email.split("@")[0];
  return { name, email };
}
