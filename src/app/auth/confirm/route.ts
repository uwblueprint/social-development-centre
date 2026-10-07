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
    // Never put the provider's message in the URL: the sign-in page shows plain copy instead.
    console.error("Sign-in link failed:", error.message);
    return NextResponse.redirect(`${origin}/login?error=link`);
  }

  // Link this login to its row in `public.people`, which is what makes the person's role findable
  // (`current_person_id()`, and so `is_admin()`). Without it they'd be signed in as nobody.
  const { data: linked, error: linkError } = await supabase.rpc("record_sign_in");
  if (!linked) {
    // No person has this address, so there's nothing to sign in to. Drop the session rather than
    // leaving them signed in with no role.
    console.error("record_sign_in found no person:", linkError?.message ?? "no match");
    await supabase.auth.signOut({ scope: "local" });
    return NextResponse.redirect(`${origin}/login?error=link`);
  }

  return NextResponse.redirect(`${origin}/`);
}
