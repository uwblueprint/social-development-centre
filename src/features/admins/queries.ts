import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface AdminRow {
  id: string;
  name: string | null;
  email: string;
  addedAt: string;
  hasSignedIn: boolean;
}

export async function listAdmins(): Promise<AdminRow[]> {
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
