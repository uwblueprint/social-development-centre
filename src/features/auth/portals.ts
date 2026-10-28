export type Portal = "member" | "admin";

export const portals = {
  member: { signInPath: "/login", homePath: "/" },
  // Admins is the admin home until the admin portal lands.
  admin: { signInPath: "/login/admin", homePath: "/admin/admins" },
} satisfies Record<Portal, { signInPath: string; homePath: string }>;

export function isPortal(value: unknown): value is Portal {
  return value === "member" || value === "admin";
}

/**
 * `path` if it's an admin page to return to after signing in, else undefined. Only same-site /admin
 * paths, so a crafted link can't send someone to another site.
 */
export function safeAdminPath(path: string | null | undefined): string | undefined {
  if (!path || !(path === "/admin" || path.startsWith("/admin/")) || path.includes("//") || path.includes("\\")) {
    return undefined;
  }
  return path;
}

/**
 * Static files under `public/` that pages load. They are not secrets, and gating them breaks pages:
 * `next/image` fetches the file back through the proxy, gets the sign-in redirect instead of a PNG and
 * renders nothing, so the intake letter loses its logos and the 404 its illustration.
 */
const PUBLIC_ASSETS = ["/brand/", "/illustrations/"];

/**
 * Every page needs a session except the sign-in pages, /auth, public assets and the intake form, which is
 * deliberately open to anyone with the link (docs/decisions/intake-form.md).
 */
export function signInPathFor(pathname: string): string | null {
  if (pathname.startsWith("/login") || pathname.startsWith("/auth/") || pathname.startsWith("/intake-form")) return null;
  // Email link pages: the link's token is the proof, so no sign-in (see src/features/links/urls.ts).
  if (pathname.startsWith("/unsubscribe/") || pathname.startsWith("/refer/")) return null;
  if (PUBLIC_ASSETS.some((prefix) => pathname.startsWith(prefix))) return null;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return portals.admin.signInPath;
  return portals.member.signInPath;
}
