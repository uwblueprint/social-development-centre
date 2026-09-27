"use server";

import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/forms";
import { getCurrentAdmin } from "../admin/_data/session";
import { kioskCopy as copy } from "./copy";

export type KioskState = ActionState<{ name: string; email: string }>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/*
 * TODO(kiosk): temporary stub. Replace with
 *   import { addBoothSignup } from "../admin/community/_data/actions";
 * once that action lands. Contract (docs/backend/community.md, "Booth kiosk"): adds a subscribed
 * general member tagged with the booth location and sends the general welcome; an existing email
 * returns the same success and changes nothing, so the kiosk never reveals who is already a member.
 */
async function addBoothSignup(name: string, email: string, location: string | null): Promise<ActionState> {
  void name;
  void email;
  void location;
  return { status: "success" };
}

/** Booth sign-up form (fields: name, email). `location` is bound from the page's `?location=`. */
export async function signUpAtBooth(location: string | null, _prev: KioskState, fd: FormData): Promise<KioskState> {
  // The kiosk runs on an admin's signed-in tablet; the action is a public endpoint, so check again.
  if (!(await getCurrentAdmin())) redirect("/login");

  const name = String(fd.get("name") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim();
  const data = { name, email };

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = copy.nameMissing;
  if (!email) fieldErrors.email = copy.emailMissing;
  else if (!EMAIL.test(email)) fieldErrors.email = copy.emailInvalid;
  if (Object.keys(fieldErrors).length) return { status: "error", fieldErrors, data };

  try {
    const result = await addBoothSignup(name, email, location);
    if (result.status === "error") {
      // Show backend field errors in kiosk words; anything else is a retryable failure.
      if (result.fieldErrors?.email) return { status: "error", fieldErrors: { email: copy.emailInvalid }, data };
      return { status: "error", message: copy.failed, data };
    }
  } catch {
    return { status: "error", message: copy.failed, data };
  }
  return { status: "success", data };
}
