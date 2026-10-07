import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { signInPathFor } from "@/features/auth/portals";

export async function updateSession(request: NextRequest) {
  // Lets people work on UI locally without Supabase credentials; production always enforces auth.
  if (process.env.NODE_ENV !== "production" && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Signed-out visitors go to their portal's sign-in page. Pages still check roles themselves.
  const { data } = await supabase.auth.getClaims();
  const signInPath = signInPathFor(request.nextUrl.pathname);
  if (!data && signInPath) {
    return NextResponse.redirect(new URL(signInPath, request.url));
  }

  return supabaseResponse;
}
