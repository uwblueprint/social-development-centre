import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * The database with the secret key, for checks the public key must not be able to make (like
 * `can_sign_in`, which would otherwise tell anyone who the admins are). Server only. Null until
 * `SUPABASE_SECRET_KEY` is set.
 */
export function createSecretClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) return null;
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
