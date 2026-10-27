import { redirect } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { requireMember } from "@/features/auth/session";
import { Button } from "@/components/ui/Button";

// Placeholder until the members-only opportunities feed exists.
export default async function MembersHome() {
  const member = await requireMember();
  if (!member.hasAnsweredWelcome) redirect("/welcome");

  return (
    <main>
      <h1>Signed in as {member.email}</h1>
      <form action={signOut.bind(null, "member")}>
        <Button type="submit" $variant="secondary">Sign out</Button>
      </form>
    </main>
  );
}
