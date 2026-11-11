import { NextResponse, type NextRequest } from "next/server";
import { finishSignIn } from "@/features/auth/finish";
import { isPortal, portals } from "@/features/auth/portals";
import { createClient } from "@/lib/supabase/server";

/** Where sign-in links land: verify the link, link the login to its person, then send them home. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const portal = params.get("portal");
  const { signInPath } = portals[isPortal(portal) ? portal : "member"];
  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, request.url));

  const tokenHash = params.get("token_hash");
  if (!tokenHash) return redirectTo(`${signInPath}?error=failed`);

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
  if (error) {
    console.error("Sign-in link failed:", error.code ?? error.message);
    return redirectTo(`${signInPath}?error=${error.code === "otp_expired" ? "expired" : "failed"}`);
  }

  const destination = await finishSignIn(supabase, isPortal(portal) ? portal : "member", params.get("next"));
  return redirectTo(destination ?? `${signInPath}?error=failed`);
}
