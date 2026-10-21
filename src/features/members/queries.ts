import "server-only";
import { displayName, type PersonRow } from "@/features/people/person";
import { createClient } from "@/lib/supabase/server";

/** A–Z by name, or email when there's no name. About 150 people, so no paging yet. */
export async function listPayingMembers(): Promise<PersonRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .select("person:people!person_id(id, email, full_name, created_at, first_signed_in_at)")
    .eq("tier", "paying");
  if (error) throw error;

  return data
    .map(({ person }) => ({
      id: person.id,
      name: person.full_name,
      email: person.email,
      addedAt: person.created_at,
      hasSignedIn: person.first_signed_in_at !== null,
    }))
    .sort((a, b) => displayName(a).localeCompare(displayName(b), "en", { sensitivity: "base" }));
}
