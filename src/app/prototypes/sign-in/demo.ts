/** Demo data and rules for the sign-in prototype. Nothing here talks to a server. */

export const demo = {
  admin: { name: "Suhanya", email: "suhanya@sdcwr.org" },
  /** Someone who isn't an admin: the sign-in page answers the same, but no email goes out. */
  other: { email: "priya.patel@gmail.com" },
  linkLifetime: "1 hour",
  resendAfterMs: 60_000,
};

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/** Domains people signing in to SDC actually use, most common first. */
const knownDomains = [
  "waterlooregion.org",
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "yahoo.ca",
  "icloud.com",
  "uwaterloo.ca",
  "wlu.ca",
];

/** Letters to add, drop, change or swap to turn one word into the other. */
function editDistance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [
    i,
    ...Array(b.length).fill(0),
  ]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/**
 * "Did you mean …?" for a domain that's a slip away from one we know, e.g. waterlooregoin.org,
 * waterloregion.org, waterlooregion.com or gmial.com. Longer domains allow two slips, short ones one.
 */
export function suggestEmail(value: string): string | undefined {
  const [local, domain] = value.trim().toLowerCase().split("@");
  if (!local || !domain || knownDomains.includes(domain)) return undefined;
  for (const known of knownDomains) {
    const allowed = known.length >= 12 ? 2 : 1;
    const distance = editDistance(domain, known);
    if (distance > 0 && distance <= allowed) return `${local}@${known}`;
    // Right name, wrong ending: waterlooregion.com or .ca
    if (
      domain.split(".")[0] === known.split(".")[0] &&
      known === "waterlooregion.org"
    )
      return `${local}@${known}`;
  }
  return undefined;
}

const gmail = {
  label: "Open Gmail",
  logo: "/brand/gmail.svg",
  // Opens Gmail already searching for the email we just sent.
  href: `https://mail.google.com/mail/u/0/#search/${encodeURIComponent("from:SDC newer_than:1h")}`,
};
/**
 * A button that opens the person's inbox. Gmail is the one most people use, and work or school
 * addresses on Google Workspace use it too, so anything we can't place gets Gmail.
 */
export function inboxesFor(
  email: string,
): { label: string; href: string; logo?: string }[] {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return [];
  if (domain.startsWith("yahoo."))
    return [{ label: "Open Yahoo Mail", href: "https://mail.yahoo.com" }];
  if (domain === "icloud.com" || domain === "me.com")
    return [{ label: "Open iCloud Mail", href: "https://www.icloud.com/mail" }];
  return [gmail];
}
