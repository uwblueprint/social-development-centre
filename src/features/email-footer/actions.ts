"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/session";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { footerProblem, type FooterDoc } from "./doc";

export type SaveFooterResult = { ok: true } | { ok: false; message: string };

/**
 * Saves the footer every email ends with. Emails not sent yet use it, because the sender reads the footer
 * when each one goes out. The database checks the same things (set_email_footer), so the fixed links stay.
 */
export async function saveEmailFooter(doc: FooterDoc): Promise<SaveFooterResult> {
  await requireAdmin();
  const problem = footerProblem(doc);
  if (problem) return { ok: false, message: problem };

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_email_footer", { p_doc: doc as Json });
  if (error) {
    console.error("set_email_footer failed:", error.message);
    return { ok: false, message: "We couldn’t save the footer. Try again." };
  }
  revalidatePath("/admin/settings");
  return { ok: true };
}
