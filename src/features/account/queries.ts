import "server-only";
import { requireAdmin } from "@/features/auth/session";
import { createClient } from "@/lib/supabase/server";

export interface Account {
  firstName: string;
  lastName: string;
  /** The last admin can't leave, so the page doesn't offer it. The database refuses it too. */
  onlyAdmin: boolean;
  /** The refer link's text in every member email's footer. Shared by all admins. */
  referLinkText: string;
}

export async function getAccount(): Promise<Account> {
  const me = await requireAdmin();
  const supabase = await createClient();

  const [person, admins, settings] = await Promise.all([
    supabase.from("people").select("first_name, last_name").eq("id", me.id).single(),
    supabase.from("admins").select("person_id", { count: "exact", head: true }),
    // Throws rather than showing the default: saving over text we couldn't read would lose it.
    supabase.from("email_settings").select("refer_link_text").single(),
  ]);
  if (person.error) throw person.error;
  if (admins.error) throw admins.error;
  if (settings.error) throw settings.error;

  return {
    firstName: person.data.first_name ?? "",
    lastName: person.data.last_name ?? "",
    onlyAdmin: (admins.count ?? 0) <= 1,
    referLinkText: settings.data.refer_link_text,
  };
}
