export type Portal = "member" | "admin";

export const portals = {
  member: { signInPath: "/login", homePath: "/" },
  // Admins is the admin home until the admin portal lands.
  admin: { signInPath: "/login/admin", homePath: "/admin/admins" },
} satisfies Record<Portal, { signInPath: string; homePath: string }>;

export function isPortal(value: unknown): value is Portal {
  return value === "member" || value === "admin";
}

/** Every page needs a session except the sign-in pages and /auth. */
export function signInPathFor(pathname: string): string | null {
  if (pathname.startsWith("/login") || pathname.startsWith("/auth/")) return null;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return portals.admin.signInPath;
  return portals.member.signInPath;
}
