import "server-only";
import { createClient } from "@/lib/supabase/server";
import { defaultFooterDoc, withReferLink, type FooterDoc } from "./doc";

/** The saved footer (with the refer link, if it was saved before there was one), or the default one. */
export async function getEmailFooter(): Promise<FooterDoc> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("email_footer").select("doc").maybeSingle();
  if (error) throw error;
  return withReferLink((data?.doc as unknown as FooterDoc | undefined) ?? defaultFooterDoc());
}
