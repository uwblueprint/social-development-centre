"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireMember } from "@/features/auth/session";
import type { ActionState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import { listTierMembers } from "./queries";
import type { TierMember, TierValues } from "./types";

const NAME_ERROR = "Enter a tier name, up to 60 characters.";
const PRICE_ERROR = "Enter a whole number of dollars above 0.";
const TAKEN_ERROR = "A tier with this name already exists. Choose a different name.";

function failed<Data = undefined>(what: string, error: { message: string }): ActionState<Data> {
  console.error(`${what} failed:`, error.message);
  return { status: "error", message: "Something went wrong. Try again." };
}

/** A whole number of dollars above 0, or null. */
function parsePrice(value: string): number | null {
  const text = value.trim();
  if (!/^\d{1,7}$/.test(text)) return null;
  const price = Number(text);
  return price >= 1 ? price : null;
}

function readValues(formData: FormData): TierValues {
  return {
    name: String(formData.get("name") ?? "").trim(),
    priceCad: String(formData.get("priceCad") ?? "").trim(),
  };
}

function validate(values: TierValues): { price: number } | { errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if (!values.name || values.name.length > 60) errors.name = NAME_ERROR;
  const price = parsePrice(values.priceCad);
  if (price === null) errors.priceCad = PRICE_ERROR;
  return price === null || Object.keys(errors).length > 0 ? { errors } : { price };
}

function refreshSettings() {
  revalidatePath("/admin/settings");
  revalidatePath("/tiers");
}

/** Goes last in the order. Names only have to differ from tiers still offered; prices can repeat. */
export async function addTier(_prev: ActionState<TierValues>, formData: FormData): Promise<ActionState<TierValues>> {
  await requireAdmin();
  const values = readValues(formData);
  const checked = validate(values);
  if ("errors" in checked) return { status: "error", fieldErrors: checked.errors, data: values };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("add_tier", { p_name: values.name, p_price_cad: checked.price });
  if (error) return { ...failed("add_tier", error), data: values };
  if (data === "name_taken") return { status: "error", fieldErrors: { name: TAKEN_ERROR }, data: values };
  if (data !== "added") return { status: "error", message: "We couldn’t add this tier. Check the name and cost.", data: values };
  refreshSettings();
  return { status: "success", message: `${values.name} is added.` };
}

/** A new price applies to everyone on the tier, including members whose tier was deleted. */
export async function updateTier(
  tierId: string,
  _prev: ActionState<TierValues>,
  formData: FormData,
): Promise<ActionState<TierValues>> {
  await requireAdmin();
  const values = readValues(formData);
  const checked = validate(values);
  if ("errors" in checked) return { status: "error", fieldErrors: checked.errors, data: values };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("update_tier", {
    p_tier_id: tierId,
    p_name: values.name,
    p_price_cad: checked.price,
  });
  if (error) return { ...failed("update_tier", error), data: values };
  if (data === "name_taken") return { status: "error", fieldErrors: { name: TAKEN_ERROR }, data: values };
  if (data === "not_found") {
    return { status: "error", message: "This tier was deleted. Refresh the page.", data: values };
  }
  if (data !== "updated") return { status: "error", message: "We couldn’t save this tier. Check the name and cost.", data: values };
  refreshSettings();
  return { status: "success", message: `${values.name} is saved.` };
}

/** Hidden from new members; members who have it keep it and keep paying its price. */
export async function deleteTier(tierId: string): Promise<ActionState> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("archive_tier", { p_tier_id: tierId });
  if (error) return failed("archive_tier", error);
  refreshSettings();
  return { status: "success" };
}

/** `tierIds` is every tier still offered, in the new order. */
export async function reorderTiers(tierIds: string[]): Promise<ActionState> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("reorder_tiers", { p_ids: tierIds });
  if (error) return failed("reorder_tiers", error);
  refreshSettings();
  return { status: "success" };
}

/** For the confirmation before deleting: who has this tier. */
export async function getTierMembers(tierId: string): Promise<ActionState<TierMember[]>> {
  await requireAdmin();
  try {
    return { status: "success", data: await listTierMembers(tierId) };
  } catch (error) {
    return failed("tier_members", error instanceof Error ? error : { message: String(error) });
  }
}

/** A member picks one tier, once. Nothing checks it's the "right" one for them. */
export async function chooseTier(tierId: string): Promise<ActionState<{ tierId: string }>> {
  await requireMember();
  if (!tierId) return { status: "error", message: "Choose a tier first." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("choose_tier", { p_tier_id: tierId });
  if (error) return failed("choose_tier", error);
  if (data === "already_chosen") {
    return { status: "error", message: "You’ve already chosen a tier." };
  }
  if (data === "unavailable") {
    return { status: "error", message: "This tier isn’t offered anymore. Refresh the page and choose another." };
  }
  // No revalidate of /tiers: the page redirects away once a tier is chosen, and the picker is still
  // showing its "You're on ..." confirmation.
  return { status: "success", data: { tierId } };
}
