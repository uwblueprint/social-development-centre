import "server-only";
import { requireAdmin } from "@/features/auth/session";
import { createClient } from "@/lib/supabase/server";

export interface Account {
  firstName: string;
  lastName: string;
  /** The last admin can't leave, so the page doesn't offer it. The database refuses it too. */
  onlyAdmin: boolean;
}

export async function getAccount(): Promise<Account> {
  const me = await requireAdmin();
  const supabase = await createClient();

  const [person, admins] = await Promise.all([
    supabase.from("people").select("first_name, last_name").eq("id", me.id).single(),
    supabase.from("admins").select("person_id", { count: "exact", head: true }),
  ]);
  if (person.error) throw person.error;
  if (admins.error) throw admins.error;

  return {
    firstName: person.data.first_name ?? "",
    lastName: person.data.last_name ?? "",
    onlyAdmin: (admins.count ?? 0) <= 1,
  };
}
