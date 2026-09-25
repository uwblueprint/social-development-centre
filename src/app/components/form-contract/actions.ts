"use server";

import type { ActionState } from "@/lib/forms";

type Received = Record<string, string[]>;

/** Reference server action: echoes what the form sent and shows how to return field errors. */
export async function echoForm(_prev: ActionState<Received>, formData: FormData): Promise<ActionState<Received>> {
  await new Promise((r) => setTimeout(r, 600));

  const received: Received = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("$ACTION")) continue;
    (received[key] ??= []).push(String(value));
  }

  const email = String(formData.get("email") ?? "");
  if (!email.includes("@")) {
    return {
      status: "error",
      message: "Check the highlighted field and try again.",
      fieldErrors: { email: "Enter an email address like name@example.org." },
      data: received,
    };
  }
  return { status: "success", message: "Saved.", data: received };
}
