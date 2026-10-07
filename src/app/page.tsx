import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { signOut } from "@/features/auth/actions";
import { AuthActions, AuthColumn, AuthHeading, AuthScreen, SdcLogo } from "@/features/auth/AuthScreen";
import { requireMember } from "@/features/auth/session";

// Placeholder until the members-only opportunities feed exists.
export default async function MembersHome() {
  const member = await requireMember();
  if (!member.hasAnsweredWelcome) redirect("/welcome");

  return (
    <AuthScreen>
      <AuthColumn>
        <SdcLogo />
        <AuthHeading
          title="You’re signed in"
          description={`The members-only opportunities feed is coming soon.\nSigned in as ${member.email}.`}
        />
        <AuthActions>
          <form action={signOut.bind(null, "member")}>
            <Button type="submit" $variant="outline" $size="lg">
              Sign out
            </Button>
          </form>
        </AuthActions>
      </AuthColumn>
    </AuthScreen>
  );
}
