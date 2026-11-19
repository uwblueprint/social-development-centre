import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createSecretClient } from "@/lib/supabase/secret";
import { portals } from "./portals";

export interface Person {
  id: string;
  email: string;
  fullName: string | null;
  isAdmin: boolean;
  isMember: boolean;
}

export const getSignedInPerson = cache(async (): Promise<Person | null> => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth) return null;

  const { data, error } = await supabase
    .from("people")
    .select("id, email, full_name, memberships(person_id)")
    .eq("user_id", auth.claims.sub)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  // The database decides who is an admin (is_admin()), including ending admin sessions after 7 days,
  // so pages, actions and row-level security always agree.
  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");
  if (adminError) throw adminError;

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    isAdmin: isAdmin === true,
    isMember: data.memberships !== null,
  };
});

export async function requireAdmin(): Promise<Person> {
  const person = await getSignedInPerson();
  if (person?.isAdmin) return person;
  // Signed in and still on the admin list, but not an admin right now: the 7-day admin session ran
  // out. Say so on the sign-in page instead of showing it as if they'd never signed in.
  if (person && (await isOnAdminList(person.email))) redirect(`${portals.admin.signInPath}?reason=expired`);
  redirect(portals.admin.signInPath);
}

async function isOnAdminList(email: string): Promise<boolean> {
  const db = createSecretClient() ?? (await createClient());
  const { data, error } = await db.rpc("can_sign_in", {
    p_email: email,
    p_portal: "admin",
  });
  if (error) console.error("can_sign_in failed:", error.message);
  return data === true;
}

export async function requireMember(): Promise<Person> {
  const person = await getSignedInPerson();
  if (!person?.isMember) redirect(portals.member.signInPath);
  return person;
}
