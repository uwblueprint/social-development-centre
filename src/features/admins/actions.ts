"use server";

import { revalidatePath } from "next/cache";
import { sendSignInLink, signOut } from "@/features/auth/actions";
import { requireAdmin } from "@/features/auth/session";
import { normalizeEmail } from "@/lib/email";
import type { ActionState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

type NewAdmin = { fullName: string; email: string };

export async function addAdmin(_prev: ActionState<NewAdmin>, formData: FormData): Promise<ActionState<NewAdmin>> {
  await requireAdmin();
  const values = {
    fullName: String(formData.get("fullName") ?? "").trim(),
    email: String(formData.get("email") ?? ""),
  };
  const email = normalizeEmail(values.email);

  const fieldErrors: Record<string, string> = {};
  if (!values.fullName) fieldErrors.fullName = "Enter their full name.";
  if (!email) fieldErrors.email = "Enter an email address like name@example.org.";
  if (!email || Object.keys(fieldErrors).length) return { status: "error", fieldErrors, data: values };

  const supabase = await createClient();
  const { data: added, error } = await supabase.rpc("add_admin", { p_email: email, p_full_name: values.fullName });
  if (error) {
    console.error("add_admin failed:", error.message);
    return { status: "error", message: "We couldn’t add this admin. Try again.", data: values };
  }
  if (!added) {
    return { status: "error", fieldErrors: { email: "This person is already an admin." }, data: values };
  }
  revalidatePath("/admin/admins");

  if ((await sendSignInLink("admin", email)) !== "sent") {
    return {
      status: "error",
      message: `${values.fullName} was added, but the invite didn’t send. Use Resend link to try again.`,
    };
  }
  return { status: "success", message: `Invite sent to ${email}.` };
}

/** Removing yourself is leaving: you're signed out. The last admin can't be removed. */
export async function removeAdmin(personId: string): Promise<ActionState> {
  const me = await requireAdmin();
  const supabase = await createClient();
  const { data: result, error } = await supabase.rpc("remove_admin", { p_person_id: personId });
  if (error) {
    console.error("remove_admin failed:", error.message);
    return { status: "error", message: "We couldn’t remove this admin. Try again." };
  }
  if (result === "last_admin") {
    return { status: "error", message: "You’re the only admin. Add another admin before you leave." };
  }
  if (personId === me.id) await signOut("admin");
  revalidatePath("/admin/admins");
  return { status: "success" };
}
