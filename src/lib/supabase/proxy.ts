import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

  const { data } = await supabase.auth.getClaims();
  const { pathname } = request.nextUrl;

  if (!data?.claims && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

/**
 * Pages that work without a session: the sign-in page, the sign-in link's landing route, and the
 * intake form, which is deliberately open to anyone with the link (docs/decisions/intake-form.md).
 *
 * Static files under `public/` are public too. They are not secrets, and gating them breaks the
 * pages above: `next/image` fetches the file back through this proxy, gets the redirect to /login
 * instead of a PNG and renders nothing, so the intake letter loses both its logos and the 404 loses
 * its illustration. The matcher already skips `_next/static` and `favicon.ico` for the same reason;
 * these are the rest.
 */
const PUBLIC_ASSETS = ["/brand/", "/illustrations/"];

function isPublic(pathname: string): boolean {
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/intake-form") ||
    PUBLIC_ASSETS.some((prefix) => pathname.startsWith(prefix))
  );
}
