"use server";

import { revalidatePath } from "next/cache";
import { removeAdmin } from "@/features/admins/actions";
import { requireAdmin } from "@/features/auth/session";
import { normalizeReferLinkText, referLinkTextError } from "@/features/automatic-emails/footer";
import type { ActionState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import { getAccount } from "./queries";

/** Matches the database's limit (`update_own_name`). */
const NAME_MAX = 100;

export type SettingsValues = { firstName: string; lastName: string; referLinkText: string };

/**
 * Saves whatever changed on the Settings page: your name (yours only) and the refer link's text (every
 * admin's). The link text is written only when it differs from what the page loaded
 * (`referLinkTextBefore`), so saving your name never undoes another admin's newer link text.
 *
 * `data` is what's stored afterwards, so it comes back on success and when only part was saved.
 */
export async function saveSettings(
  _prev: ActionState<SettingsValues>,
  formData: FormData,
): Promise<ActionState<SettingsValues>> {
  await requireAdmin();
  const values = {
    firstName: String(formData.get("firstName") ?? "").trim(),
    lastName: String(formData.get("lastName") ?? "").trim(),
    referLinkText: normalizeReferLinkText(String(formData.get("referLinkText") ?? "")),
  };

  const fieldErrors: Record<string, string> = {};
  if (!values.firstName) fieldErrors.firstName = "Enter your first name.";
  else if (values.firstName.length > NAME_MAX) fieldErrors.firstName = `Use ${NAME_MAX} characters or fewer.`;
  // Last name is optional: admins invited with a one-word name have none.
  if (values.lastName.length > NAME_MAX) fieldErrors.lastName = `Use ${NAME_MAX} characters or fewer.`;
  const referError = referLinkTextError(values.referLinkText);
  if (referError) fieldErrors.referLinkText = referError;
  if (Object.keys(fieldErrors).length) return { status: "error", fieldErrors };

  const stored = await getAccount();
  const before = formData.get("referLinkTextBefore");
  const nameChanged = values.firstName !== stored.firstName || values.lastName !== stored.lastName;
  const referChanged =
    values.referLinkText !== (typeof before === "string" ? normalizeReferLinkText(before) : stored.referLinkText);
  const supabase = await createClient();

  if (referChanged) {
    const { data, error } = await supabase.rpc("set_refer_link_text", { p_text: values.referLinkText });
    if (error) {
      console.error("set_refer_link_text failed:", error.message);
      // 22023: the database's rules caught something ours didn't. Nothing was saved, your name included.
      return error.code === "22023"
        ? { status: "error", fieldErrors: { referLinkText: "This text can’t be used in emails. Try other words." } }
        : { status: "error", message: "We couldn’t save your changes. Try again." };
    }
    values.referLinkText = data;
  }

  if (nameChanged) {
    const { error } = await supabase.rpc("update_own_name", {
      p_first_name: values.firstName,
      p_last_name: values.lastName,
    });
    if (error) {
      console.error("update_own_name failed:", error.message);
      revalidatePath("/admin", "layout");
      return {
        status: "error",
        message: referChanged
          ? "The refer link text is saved, but we couldn’t save your name. Try again."
          : "We couldn’t save your name. Try again.",
        // The link text is stored; the name isn't, so Save stays for the name.
        data: { ...values, firstName: stored.firstName, lastName: stored.lastName },
      };
    }
  }

  // The sidebar and Admins list show the name; every email footer in the portal shows the link text.
  revalidatePath("/admin", "layout");
  return { status: "success", message: savedMessage(nameChanged, referChanged, values), data: values };
}

function savedMessage(nameChanged: boolean, referChanged: boolean, v: SettingsValues) {
  if (nameChanged && referChanged) return "Your name and the refer link text are saved.";
  if (referChanged) return `Member emails now say “${v.referLinkText}” in the footer.`;
  return `Your name is now ${v.firstName} ${v.lastName}`.trim() + ".";
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
