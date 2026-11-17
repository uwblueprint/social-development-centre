import "server-only";
import type { PersonRow } from "@/features/people/person";
import { createClient } from "@/lib/supabase/server";

export async function listAdmins(): Promise<PersonRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admins")
    .select("added_at, person:people!person_id(id, email, full_name, first_signed_in_at)")
    .order("added_at");
  if (error) throw error;

  return data.map(({ added_at, person }) => ({
    id: person.id,
    name: person.full_name,
    email: person.email,
    addedAt: added_at,
    hasSignedIn: person.first_signed_in_at !== null,
  }));
}
