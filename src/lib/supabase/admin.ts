import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase with the secret key: bypasses RLS and can call engine-only functions. Server code that
 * runs without a person (the automatic emails cron) only; never import it into a page or component.
 */
export function createAdminClient() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("SUPABASE_SECRET_KEY is not set");
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
