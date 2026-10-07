import { redirect } from "next/navigation";
import { styled } from "next-yak";
import { signOut } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";

// Placeholder until the members-only opportunities feed exists.
export default async function MembersHome() {
  const member = await requireMember();
  if (!member.hasAnsweredWelcome) redirect("/welcome");

  return (
    <main>
      <Heading>Signed in as {profile?.email ?? claims.email}</Heading>
      <form action={signOut}>
        <Button type="submit" $variant="secondary">Sign out</Button>
      </form>
    </main>
  );
}
