"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/app/admin/_data/session";
import { getCurrentPartner } from "@/app/partner/_data/session";
import type { ActionState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import { accountServerCopy as copy } from "./copy";
import { resetDevAccount, setDevAccountOverride } from "./devAccount";

export type AccountPortal = "admin" | "partner";

const NAME_MAX = 80;
/** The dialog resizes photos in the browser first, so this only stops oversized uploads that skipped it. */
const AVATAR_MAX_BYTES = 1024 * 1024;
const AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

async function currentUser(portal: AccountPortal) {
  return portal === "admin" ? getCurrentAdmin() : getCurrentPartner();
}

/**
 * Saves the My account form: `name`, plus `avatar` (a resized image file) or `removeAvatar=1`.
 * Backend: update the person's profile row and store the picture; see docs/backend/README.md, "Accounts".
 */
export async function updateAccount(portal: AccountPortal, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await currentUser(portal);
  if (!user) return { status: "error", message: copy.signedOut };

  const name = String(formData.get("name") ?? "").trim();
  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = copy.nameRequired;
  else if (name.length > NAME_MAX) fieldErrors.name = copy.nameTooLong(NAME_MAX);

  const avatar = formData.get("avatar");
  const hasAvatar = avatar instanceof File && avatar.size > 0;
  if (hasAvatar && !AVATAR_TYPES.has(avatar.type)) fieldErrors.avatar = copy.avatarType;
  else if (hasAvatar && avatar.size > AVATAR_MAX_BYTES) fieldErrors.avatar = copy.avatarSize;

  if (Object.keys(fieldErrors).length > 0) return { status: "error", fieldErrors };

  if (process.env.NODE_ENV === "production") {
    throw new Error("updateAccount is not implemented: see docs/backend/README.md, Accounts.");
  }
  let avatarUrl: string | null | undefined;
  if (hasAvatar) avatarUrl = `data:${avatar.type};base64,${Buffer.from(await avatar.arrayBuffer()).toString("base64")}`;
  else if (formData.get("removeAvatar") === "1") avatarUrl = null;
  setDevAccountOverride(user.email, { name, ...(avatarUrl !== undefined && { avatarUrl }) });

  revalidatePath(`/${portal}`, "layout");
  return { status: "success", message: copy.saved };
}

/**
 * Deletes the signed-in person's account, signs them out and shows the goodbye on /login.
 * Backend: remove their sign-in and access. For an admin, keep their past actions, attributed to
 * "Former admin". See docs/backend/README.md, "Accounts".
 */
export async function deleteAccount(portal: AccountPortal): Promise<void> {
  const user = await currentUser(portal);
  if (!user) redirect("/login");

  if (process.env.NODE_ENV === "production") {
    throw new Error("deleteAccount is not implemented: see docs/backend/README.md, Accounts.");
  }
  // Dev: nothing to delete; reset the dev account so it still works next time.
  resetDevAccount(user.email);
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login?accountDeleted=1");
}
