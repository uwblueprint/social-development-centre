import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // /components is the dev showcase; images are public files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|components|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
