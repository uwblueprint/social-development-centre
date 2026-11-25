/*
 * What the page checks before anything is sent, and the helpers it uses on what's typed. The server
 * (`refer_friend`, supabase/migrations/20261120000000_referrals.sql) checks everything again, including
 * the member's own address, which only it knows.
 */
import { copy } from "./copy";



const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * One address per person, for "already invited": lower case, no spaces, no "+tag"
 * (sam+sdc@ is sam@), and no dots in Gmail names (s.am@gmail.com is sam@gmail.com). The address typed is
 * still the one emailed.
 */
export function normalizeEmail(email: string) {
  const [user = "", domain = ""] = email.trim().toLowerCase().split("@");
  const base = user.split("+")[0];
  const gmail = domain === "gmail.com" || domain === "googlemail.com";
  return `${gmail ? base.replaceAll(".", "") : base}@${gmail ? "gmail.com" : domain}`;
}

/** Common email domains, most used first: offered as you type, and for "Did you mean …?". */
const DOMAINS = [
  "gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "yahoo.ca", "icloud.com", "live.com",
  "rogers.com", "bell.net", "sympatico.ca", "uwaterloo.ca", "wlu.ca", "conestogac.on.ca",
];

/** How many single-letter edits turn one word into the other (Damerau–Levenshtein, small strings). */
function distance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

/** "priya@gmial.com" → "priya@gmail.com"; null when the domain looks fine or isn't close to a common one. */
export function suggestEmail(email: string): string | null {
  const at = email.trim().lastIndexOf("@");
  if (at < 1) return null;
  const user = email.trim().slice(0, at);
  const domain = email.trim().slice(at + 1).toLowerCase();
  if (!domain.includes(".") || DOMAINS.includes(domain)) return null;
  const best = DOMAINS.map((d) => ({ d, n: distance(domain, d) })).sort((x, y) => x.n - y.n)[0];
  return best && best.n > 0 && best.n <= 2 ? `${user}@${best.d}` : null;
}

/**
 * The same checks as the server, run on Next so mistakes show before choosing how to invite. Null when
 * both are fine. (The server checks again on send.)
 */
export function checkRecipient(rawName: string, rawEmail: string): { name?: string; email?: string } | null {
  const name = rawName.trim();
  const errors: { name?: string; email?: string } = {};
  if (!name) errors.name = copy.nameRequired;
  else if (/[<>/\\:@]/.test(name)) errors.name = copy.nameInvalid;
  if (!EMAIL.test(rawEmail.trim())) errors.email = copy.emailInvalid;
  return errors.name || errors.email ? errors : null;
}




/** Titles people type before a name. Matched without case, with or without a full stop. */
const TITLES = new Set(["mr", "mrs", "ms", "miss", "mx", "dr", "prof", "professor", "rev", "sir", "madam", "dame"]);

/**
 * The friend's first name, for "Thank you for inviting Priya" and the invite email's greeting.
 * Drops titles ("Dr. Priya Patel" → "Priya") and keeps the first word ("Priya Patel" → "Priya").
 * A title with a single name left ("Dr. Patel") can't tell first from last, so it stays whole.
 * Case is kept as typed (names like "de la Cruz" or "McKay" aren't ours to change).
 */
export function firstNameOf(raw: string): string {
  const words = raw.trim().split(/\s+/).filter(Boolean);
  let i = 0;
  while (i < words.length && TITLES.has(words[i].replace(/\.$/, "").toLowerCase())) i++;
  const rest = words.slice(i);
  if (rest.length === 0) return raw.trim();
  if (i > 0 && rest.length === 1) return words.join(" ");
  return rest[0];
}

/** Offered as you type, from the same list (most used first): "priya@g" → gmail.com, "@h" → hotmail.com. */
/** The rest of the address to offer after what's typed ("priya@g" → "mail.com"), or null. */
export function completeEmail(value: string): string | null {
  const at = value.indexOf("@");
  if (at < 1 || value.indexOf("@", at + 1) !== -1) return null;
  const typed = value.slice(at + 1).toLowerCase();
  if (!typed) return null;
  const match = DOMAINS.find((domain) => domain.startsWith(typed) && domain !== typed);
  return match ? match.slice(typed.length) : null;
}
