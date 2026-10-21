import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const supabase = await createClient();

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("Missing auth params") };

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
