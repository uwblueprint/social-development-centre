import "server-only";
import { createClient } from "@/lib/supabase/server";

export type LinkPage = "intake" | "unsubscribe" | "referral";

/**
 * Logs that a link page was opened and returns the person's first name for a greeting, or null if the
 * token isn't a real link. Without Supabase credentials (local dev, CI) every link counts as unknown.
 */
export async function openLink(token: string, page: LinkPage): Promise<{ firstName: string | null } | null> {
  if (process.env.NODE_ENV !== "production" && !process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("open_link", { p_token: token, p_page: page });
  if (error) console.error("open_link failed:", error.message);
  const row = data?.[0];
  return row ? { firstName: row.first_name } : null;
}
