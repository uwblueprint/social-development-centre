import { redirect } from "next/navigation";
import { styled } from "next-yak";
import { signOut } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";

const Heading = styled.h1`
  font-size: 1.25rem;
`;

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", claims.sub)
    .single();

  return (
    <main>
      <Heading>Signed in as {profile?.email ?? claims.email}</Heading>
      <form action={signOut}>
        <Button type="submit" $variant="secondary">Sign out</Button>
      </form>
    </main>
  );
}
