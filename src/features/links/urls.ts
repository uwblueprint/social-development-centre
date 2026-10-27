/**
 * Where each email's link token goes. One token per email (see docs/backend/directory.md, "Links"):
 * the page reads it to know who acted and from which email. The unsubscribe and referral pages
 * aren't built yet; these paths are reserved for them.
 */
export const linkPaths = {
  intake: (token: string) => `/intake-form?t=${token}`,
  unsubscribe: (token: string) => `/unsubscribe/${token}`,
  referral: (token: string) => `/refer/${token}`,
};

const TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The token from a URL, or undefined if it isn't one (so a mangled link falls back to the open form). */
export function parseLinkToken(value: unknown): string | undefined {
  return typeof value === "string" && TOKEN_PATTERN.test(value) ? value.toLowerCase() : undefined;
}
