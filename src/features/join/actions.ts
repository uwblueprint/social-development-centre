"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Counting for signup links (docs/backend/signup-links.md). The join steps are open to anyone, so both
 * arguments are untrusted: anything malformed is dropped here, and the database drops unknown slugs.
 * Neither ever throws: counting must never get in the way of someone joining.
 */

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function valid(source: unknown, visitId: unknown): source is string {
  return (
    typeof source === "string" &&
    source.length <= 520 &&
    SLUG.test(source) &&
    typeof visitId === "string" &&
    UUID.test(visitId)
  );
}

async function record(fn: "record_signup_link_click" | "record_signup_link_join", source: string, visitId: string) {
  // Local UI work without Supabase credentials (as in src/lib/supabase/proxy.ts): nothing to count into.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc(fn, { p_source: source, p_visit_id: visitId });
    if (error) console.error(`${fn} failed:`, error.message);
  } catch (error) {
    console.error(`${fn} failed:`, error);
  }
}

/** The welcome step loaded from a signup link. */
export async function recordSignupLinkClick(source: unknown, visitId: unknown): Promise<void> {
  if (valid(source, visitId)) await record("record_signup_link_click", source, visitId as string);
}

/** The thank-you step loaded on a visit that started from a signup link. */
export async function recordSignupLinkJoin(source: unknown, visitId: unknown): Promise<void> {
  if (valid(source, visitId)) await record("record_signup_link_join", source, visitId as string);
}
