import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { signOut } from "@/features/auth/actions";
import { AuthActions, AuthColumn, AuthHeading, AuthScreen, SdcLogo } from "@/features/auth/AuthScreen";
import { getSignedInPerson, requireMember } from "@/features/auth/session";
import { paypalManagePaymentsUrl } from "@/features/payments/config";
import { MembershipCard } from "@/features/payments/MembershipCard";
import { getMyMembership, planOptions } from "@/features/payments/queries";

/**
 * The front door. Admins go to the admin portal, where everything they do lives. Members get the
 * members' area (a placeholder until the member portal exists). The proxy has already sent anyone
 * without a session to `/login`.
 *
 * The public intake form at `/intake-form` is reached by its own link, not from here.
 */
export default async function Home() {
  // Without Supabase credentials (local UI work) there's no session to read; the admin portal has its
  // own placeholder admin for that case.
  if (process.env.NODE_ENV !== "production" && !process.env.NEXT_PUBLIC_SUPABASE_URL) redirect("/admin");
  if ((await getSignedInPerson())?.isAdmin) redirect("/admin");
  const member = await requireMember();
  const [membership, plans] = await Promise.all([getMyMembership(member.id), planOptions()]);

  return (
    <AuthScreen>
      <AuthColumn>
        <SdcLogo />
        <AuthHeading
          title="You’re signed in"
          description={`The members-only opportunities feed is coming soon.\nSigned in as ${member.email}.`}
        />
        <MembershipCard membership={membership} plans={plans} managePaymentsUrl={paypalManagePaymentsUrl()} />
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
