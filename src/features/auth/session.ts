import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { portals } from "./portals";

export interface Person {
  id: string;
  email: string;
  fullName: string | null;
  isAdmin: boolean;
  isPayingMember: boolean;
  hasAnsweredWelcome: boolean;
}

export const getSignedInPerson = cache(async (): Promise<Person | null> => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth) return null;

  const { data, error } = await supabase
    .from("people")
    .select("id, email, full_name, admins!admins_person_id_fkey(person_id), memberships(tier), welcome_answers(person_id)")
    .eq("user_id", auth.claims.sub)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    isAdmin: data.admins !== null,
    isPayingMember: data.memberships?.tier === "paying",
    hasAnsweredWelcome: data.welcome_answers !== null,
  };
});

export async function requireAdmin(): Promise<Person> {
  const person = await getSignedInPerson();
  if (!person?.isAdmin) redirect(portals.admin.signInPath);
  return person;
}

export async function requireMember(): Promise<Person> {
  const person = await getSignedInPerson();
  if (!person?.isPayingMember) redirect(portals.member.signInPath);
  return person;
}
