import { NextResponse, type NextRequest } from "next/server";
import { isPortal, portals } from "@/features/auth/portals";
import { createClient } from "@/lib/supabase/server";

/** Where sign-in links land: verify the link, link the login to its person, then send them home. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const portal = params.get("portal");
  const { signInPath, homePath } = portals[isPortal(portal) ? portal : "member"];
  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, request.url));

  const tokenHash = params.get("token_hash");
  if (!tokenHash) return redirectTo(`${signInPath}?error=failed`);

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
  if (error) {
    console.error("Sign-in link failed:", error.code ?? error.message);
    return redirectTo(`${signInPath}?error=${error.code === "otp_expired" ? "expired" : "failed"}`);
  }

  const { data: linked, error: linkError } = await supabase.rpc("record_sign_in");
  if (!linked) {
    console.error("record_sign_in found no person:", linkError?.message ?? "no match");
    await supabase.auth.signOut({ scope: "local" });
    return redirectTo(`${signInPath}?error=failed`);
  }
  return redirectTo(homePath);
}
