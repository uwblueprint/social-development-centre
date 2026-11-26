import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SignupLink } from "./links";

/** Every signup link with its counts, newest first. One row per event, so no paging. */
export async function listSignupLinks(): Promise<SignupLink[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("signup_link_counts")
    .select("id, name, slug, clicks, joins")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((l) => ({
    id: l.id!,
    name: l.name!,
    slug: l.slug!,
    clicks: l.clicks ?? 0,
    joins: l.joins ?? 0,
  }));
}
