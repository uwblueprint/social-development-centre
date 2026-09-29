/**
 * Accepts what people actually type ("sdckw.ca", "www.sdckw.ca/events", "https://sdckw.ca") and returns a
 * normalized https URL, or null if it isn't a plausible web address. Used for organization websites and
 * opportunity links so nobody has to type "https://".
 */
export function normalizeWebAddress(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  if (/^http:\/\//i.test(raw)) return normalizeWebAddress(raw.replace(/^http:\/\//i, "https://"));
  const withScheme = /^https:\/\//i.test(raw) ? raw : /^[a-z][a-z0-9+.-]*:/i.test(raw) ? null : `https://${raw}`;
  if (!withScheme) return null;
  try {
    const url = new URL(withScheme);
    // A host needs a dot and a letter-only top-level domain (rejects "localhost", "sdc", "1.2").
    if (!/\.[a-z]{2,}$/i.test(url.hostname) || /\s/.test(raw)) return null;
    return url.toString().replace(/\/$/, url.pathname === "/" && !raw.endsWith("/") ? "" : "/");
  } catch {
    return null;
  }
}
