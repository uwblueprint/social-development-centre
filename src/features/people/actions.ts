"use server";

import { sendSignInLink } from "@/features/auth/actions";
import type { Portal } from "@/features/auth/portals";
import { requireAdmin } from "@/features/auth/session";
import type { ActionState } from "@/lib/forms";

/** Only sends if they can still sign in to that portal (`sendSignInLink` checks). */
export async function resendSignInLink(portal: Portal, email: string): Promise<ActionState> {
  await requireAdmin();
  return (await sendSignInLink(portal, email)) === "sent"
    ? { status: "success", message: "Sent" }
    : { status: "error", message: "Didn’t send. Try again." };
}
