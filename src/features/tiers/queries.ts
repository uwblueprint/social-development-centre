import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { OfferedTier, Tier, TierMember } from "./types";

/** Tiers still offered, in the order admins set, with how many members have each. Admins only (row-level security). */
export async function listTiers(): Promise<Tier[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tiers")
    .select("id, name, price_cad, memberships(count)")
    .is("archived_at", null)
    .order("position");
  if (error) throw error;
  return data.map((tier) => ({
    id: tier.id,
    name: tier.name,
    priceCad: tier.price_cad,
    memberCount: tier.memberships[0]?.count ?? 0,
  }));
}

/** Everyone who has this tier, A–Z, for the confirmation before deleting it. */
export async function listTierMembers(tierId: string): Promise<TierMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("tier_members", { p_tier_id: tierId });
  if (error) throw error;
  return data.map((m) => ({ personId: m.person_id, name: m.full_name, email: m.email }));
}

/** What a member can choose from, in the order admins set. */
export async function listOfferedTiers(): Promise<OfferedTier[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_offered_tiers");
  if (error) throw error;
  return data.map((t) => ({ id: t.id, name: t.name, priceCad: t.price_cad }));
}

/** The signed-in member's tier id, or null if they haven't chosen one. */
export async function getMyTierId(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_tier_id");
  if (error) throw error;
  return data;
}
