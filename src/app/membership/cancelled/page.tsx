import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { signOut } from "@/features/auth/actions";
import { AuthActions, AuthColumn, AuthHeading, AuthScreen, SdcLogo } from "@/features/auth/AuthScreen";
import { memberCopy } from "@/features/payments/copy";

export const metadata: Metadata = { title: "Membership cancelled" };

/**
 * Shown right after a member cancels. Cancelling ends their membership, so they can't see the members'
 * area any more; this confirms it and lets them sign out.
 */
export default function MembershipCancelledPage() {
  return (
    <AuthScreen>
      <AuthColumn>
        <SdcLogo />
        <AuthHeading title={memberCopy.cancelledTitle} description={memberCopy.cancelledDescription} />
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
