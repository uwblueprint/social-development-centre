"use server";

import { redirect } from "next/navigation";
import { requireMember } from "@/features/auth/session";
import type { ActionState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

type WelcomeValues = { fullName: string; heardAbout: string; interests: string };

export async function submitWelcome(
  _prev: ActionState<WelcomeValues>,
  formData: FormData,
): Promise<ActionState<WelcomeValues>> {
  await requireMember();
  const values = {
    fullName: String(formData.get("fullName") ?? "").trim(),
    heardAbout: String(formData.get("heardAbout") ?? "").trim(),
    interests: String(formData.get("interests") ?? "").trim(),
  };
  if (!values.fullName) {
    return { status: "error", fieldErrors: { fullName: "Enter your full name." }, data: values };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_welcome", {
    p_full_name: values.fullName,
    p_answers: { heardAbout: values.heardAbout, interests: values.interests },
  });
  if (error) {
    console.error("submit_welcome failed:", error.message);
    return { status: "error", message: "We couldn’t save your answers. Try again.", data: values };
  }

  redirect("/");
}
