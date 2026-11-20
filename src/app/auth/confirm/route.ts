import { NextResponse, type NextRequest } from "next/server";
import { finishSignIn } from "@/features/auth/finish";
import { isPortal, portals } from "@/features/auth/portals";
import { createClient } from "@/lib/supabase/server";

/**
 * Where sign-in links land: verify the link, link the login to its person, then send them straight
 * to the app. Problems go back to the sign-in page as `?error=`: `broken` (the link lost its token,
 * e.g. copied in part), `expired` (used or older than an hour; Supabase can't tell those apart),
 * `no-access` (no longer an admin) or `failed` (anything else).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const portalParam = params.get("portal");
  const portal = isPortal(portalParam) ? portalParam : "member";
  const { signInPath } = portals[portal];
  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, request.url));

  const tokenHash = params.get("token_hash");
  if (!tokenHash || tokenHash.length < 20) return redirectTo(`${signInPath}?error=broken`);

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "email",
  });
  if (error) {
    console.error("Sign-in link failed:", error.code ?? error.message);
    return redirectTo(`${signInPath}?error=${error.code === "otp_expired" ? "expired" : "failed"}`);
  }

  const result = await finishSignIn(supabase, portal, params.get("next"));
  return redirectTo("destination" in result ? result.destination : `${signInPath}?error=${result.error}`);
}
