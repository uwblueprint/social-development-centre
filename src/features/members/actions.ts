"use server";

import { revalidatePath } from "next/cache";
import { sendSignInLink } from "@/features/auth/actions";
import { requireAdmin } from "@/features/auth/session";
import { normalizeEmail } from "@/lib/email";
import type { ActionState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

type NewPayingMember = { fullName: string; email: string };

/** Adds them to SDC's list if they're new, or upgrades a general member. Either way they get a sign-in link. */
export async function addPayingMember(
  _prev: ActionState<NewPayingMember>,
  formData: FormData,
): Promise<ActionState<NewPayingMember>> {
  await requireAdmin();
  const values = {
    fullName: String(formData.get("fullName") ?? "").trim(),
    email: String(formData.get("email") ?? ""),
  };
  const email = normalizeEmail(values.email);
  if (!email) {
    return { status: "error", fieldErrors: { email: "Enter an email address like name@example.org." }, data: values };
  }

  const supabase = await createClient();
  const { data: result, error } = await supabase.rpc("add_paying_member", {
    p_email: email,
    p_full_name: values.fullName,
  });
  if (error) {
    console.error("add_paying_member failed:", error.message);
    return { status: "error", message: "We couldn’t add this paying member. Try again.", data: values };
  }
  if (result === "already_paying") {
    return { status: "error", fieldErrors: { email: "This person is already a paying member." }, data: values };
  }
  revalidatePath("/admin/community");

  const name = values.fullName || email;
  if ((await sendSignInLink("member", email)) !== "sent") {
    return {
      status: "error",
      message: `${name} is now a paying member, but the sign-in link didn’t send. Use Resend link to try again.`,
    };
  }
  return { status: "success", message: `${name} is now a paying member. We sent a sign-in link to ${email}.` };
}

/** They stay on SDC's list as a general member and can't sign in to the members' area. */
export async function removePayingAccess(personId: string): Promise<ActionState> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_paying_access", { p_person_id: personId });
  if (error) {
    console.error("remove_paying_access failed:", error.message);
    return { status: "error", message: "We couldn’t remove their paying access. Try again." };
  }
  revalidatePath("/admin/community");
  return { status: "success" };
}
