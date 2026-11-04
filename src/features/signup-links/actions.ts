"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/session";
import type { ActionState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import { MAX_EVENT_NAME_LENGTH, slugify, type SignupLink } from "./links";

/** Makes a link for one event. On success `data` is the new link, so the dialog can show its URL and QR code. */
export async function createSignupLink(
  _prev: ActionState<SignupLink>,
  formData: FormData,
): Promise<ActionState<SignupLink>> {
  await requireAdmin();
  const name = String(formData.get("eventName") ?? "").trim();
  if (!name) return { status: "error", fieldErrors: { eventName: "Enter the event name." } };
  if (name.length > MAX_EVENT_NAME_LENGTH) {
    return {
      status: "error",
      fieldErrors: { eventName: `Shorten the event name to ${MAX_EVENT_NAME_LENGTH} characters or fewer.` },
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_signup_link", { p_name: name, p_slug: slugify(name) });
  if (error || !data) {
    console.error("create_signup_link failed:", error?.message);
    return { status: "error", message: "We couldn’t create this link. Try again." };
  }
  revalidatePath("/admin/signup-links");
  return { status: "success", data: { id: data.id, name: data.name, slug: data.slug, clicks: 0, joins: 0 } };
}
