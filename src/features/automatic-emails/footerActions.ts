"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/session";
import type { ActionState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import { normalizeReferLinkText, referLinkTextError } from "./footer";

/**
 * Saves the refer link's text, from the popover on the link in any email footer. Every member email
 * changes, for every admin. `data.text` is the text as stored.
 */
export async function saveReferLinkText(text: string): Promise<ActionState<{ text: string }>> {
  await requireAdmin();
  const value = normalizeReferLinkText(String(text ?? ""));
  const invalid = referLinkTextError(value);
  if (invalid) return { status: "error", fieldErrors: { text: invalid } };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_refer_link_text", { p_text: value });
  if (error) {
    console.error("set_refer_link_text failed:", error.message);
    // 22023: the database's rules caught something ours didn't.
    return error.code === "22023"
      ? { status: "error", fieldErrors: { text: "This text can’t be used in emails. Try other words." } }
      : { status: "error", message: "We couldn’t save the link text. Try again." };
  }

  // Every email footer in the portal reads it from the admin layout.
  revalidatePath("/admin", "layout");
  return { status: "success", data: { text: data } };
}
