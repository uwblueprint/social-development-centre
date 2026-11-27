import "server-only";
import { createClient } from "@/lib/supabase/server";
import { defaultFooterDoc, type FooterDoc } from "./doc";

/** The saved footer, or the default one if no one has edited it yet. */
export async function getEmailFooter(): Promise<FooterDoc> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("email_footer").select("doc").maybeSingle();
  if (error) throw error;
  return (data?.doc as unknown as FooterDoc | undefined) ?? defaultFooterDoc();
}
