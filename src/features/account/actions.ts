"use server";

import { revalidatePath } from "next/cache";
import { removeAdmin } from "@/features/admins/actions";
import { requireAdmin } from "@/features/auth/session";
import type { ActionState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

/** Matches the database's limit (`update_own_name`). */
const NAME_MAX = 100;

export type NameValues = { firstName: string; lastName: string };

export async function updateName(_prev: ActionState<NameValues>, formData: FormData): Promise<ActionState<NameValues>> {
  await requireAdmin();
  const values = {
    firstName: String(formData.get("firstName") ?? "").trim(),
    lastName: String(formData.get("lastName") ?? "").trim(),
  };

  const fieldErrors: Record<string, string> = {};
  if (!values.firstName) fieldErrors.firstName = "Enter your first name.";
  else if (values.firstName.length > NAME_MAX) fieldErrors.firstName = `Use ${NAME_MAX} characters or fewer.`;
  if (!values.lastName) fieldErrors.lastName = "Enter your last name.";
  else if (values.lastName.length > NAME_MAX) fieldErrors.lastName = `Use ${NAME_MAX} characters or fewer.`;
  if (Object.keys(fieldErrors).length) return { status: "error", fieldErrors, data: values };

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_own_name", {
    p_first_name: values.firstName,
    p_last_name: values.lastName,
  });
  if (error) {
    console.error("update_own_name failed:", error.message);
    return {
      status: "error",
      message: "We couldn’t save your name. Try again.",
      data: values,
    };
  }

  // The sidebar and the Admins list show the name.
  revalidatePath("/admin", "layout");
  return {
    status: "success",
    message: `Your name is now ${values.firstName} ${values.lastName}.`,
    data: values,
  };
}

/**
 * Deleting your account is leaving the admin portal: your admin access ends, your person record and any
 * membership stay, and another admin can invite you back. On success this signs you out and redirects to
 * the goodbye screen, so it only returns when something went wrong, including `last_admin`: SDC always
 * keeps at least one admin.
 */
export async function deleteAccount(): Promise<ActionState> {
  const me = await requireAdmin();
  return removeAdmin(me.id);
}
