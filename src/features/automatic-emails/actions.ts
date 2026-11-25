"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/session";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

/*
 * The automatic emails pages' writes. Each checks the admin here and again in the database. They
 * return a small result instead of throwing, so the page can keep the admin's edits and say what
 * went wrong.
 */

type Result = { ok: true } | { ok: false };
const LIST = "/admin/automatic-emails";

function failed(what: string, error: { message: string }): { ok: false } {
  console.error(`${what} failed:`, error.message);
  return { ok: false };
}

/** A blank draft. Returns its id. */
export async function createAutomaticEmail(): Promise<{ ok: true; id: string } | { ok: false }> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_automatic_email");
  if (error) return failed("create_automatic_email", error);
  revalidatePath(LIST);
  return { ok: true, id: data };
}

/** Autosave: the whole draft (see patchFromEmail). Only drafts can be saved. */
export async function saveAutomaticEmail(id: string, patch: Record<string, Json>): Promise<Result> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_automatic_email", { p_id: id, p_patch: patch });
  if (error) return failed("save_automatic_email", error);
  revalidatePath(LIST);
  return { ok: true };
}

/** Publishes, or returns what still blocks it in the editor's words ("add a name"). */
export async function publishAutomaticEmail(id: string): Promise<{ ok: true; blockers: string[] } | { ok: false }> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("publish_automatic_email", { p_id: id });
  if (error) return failed("publish_automatic_email", error);
  revalidatePath(LIST);
  return { ok: true, blockers: data };
}

export async function unpublishAutomaticEmail(id: string): Promise<Result> {
  return run("unpublish_automatic_email", id);
}

export async function trashAutomaticEmail(id: string): Promise<Result> {
  return run("trash_automatic_email", id);
}

export async function restoreAutomaticEmail(id: string): Promise<Result> {
  return run("restore_automatic_email", id);
}

/** A new draft with the same setup. Returns its id. */
export async function duplicateAutomaticEmail(id: string): Promise<{ ok: true; id: string } | { ok: false }> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("duplicate_automatic_email", { p_id: id });
  if (error) return failed("duplicate_automatic_email", error);
  revalidatePath(LIST);
  return { ok: true, id: data };
}

/** The backup text for one personalized field, shared by every email not yet sent. */
export async function setEmailFallback(field: string, value: string): Promise<Result> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_email_fallback", { p_field: field, p_value: value });
  if (error) return failed("set_email_fallback", error);
  return { ok: true };
}

async function run(fn: "unpublish_automatic_email" | "trash_automatic_email" | "restore_automatic_email", id: string): Promise<Result> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc(fn, { p_id: id });
  if (error) return failed(fn, error);
  revalidatePath(LIST);
  revalidatePath(`${LIST}/${id}`);
  return { ok: true };
}
