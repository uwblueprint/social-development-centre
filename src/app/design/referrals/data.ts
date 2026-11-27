/*
 * Demo data for the referral page: the same component as /refer/<token>, with this function standing in
 * for the server action. The real rules live in `refer_friend` (supabase/migrations/20261120000000_referrals.sql).
 *
 * Try these in the email field (every state is also laid out at /design/referrals/states):
 * - amara@example.org: the referrer's own address (refused)
 * - sam@example.org: already referred on Nov 3 (never a second email; you get their link instead).
 *   Sam+sdc@example.org and SAM@Example.org count as the same person (see normalizeEmail).
 * - lee@example.org: already a member, and taken@example.org: already invited by another member. Both look
 *   exactly like a new referral, so the form can't be used to find out who's a member or who invited whom.
 * - fail@example.org: the connection drops
 * - priya@gmial.com: a likely typo, so the form asks "Did you mean priya@gmail.com?"
 * - anything else: a new referral
 * Open /design/referrals?link=unknown for a link with a bad or missing token.
 */
import { copy } from "./copy";
import type { ReferralResult, ReferralValues } from "@/features/referrals/types";

export const REFERRER = { firstName: "Amara", email: "amara@example.org" };

/**
 * The member's own invite link, ready to share anywhere. It opens the join page as a referral (the join
 * page reads `via=referral` and greets the friend with "Amara invited you to join SDC"). Demo value.
 */
export const INVITE_LINK = "https://sdc.example.org/join?via=referral&ref=amara-k4p";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/**
 * One friend's own link: the join page as a referral, with that referral's code, so SDC knows which
 * email (and member) it belongs to. Product code still builds an intake-form link (friendLinkPath); see
 * docs/backend/referrals.md, "Where a referral link goes".
 */
const link = (id: string) => `https://sdc.example.org/join?via=referral&ref=${id.slice(0, 8)}`;

/**
 * A name with the first letter of each word in capitals: "mary-jane" becomes "Mary-Jane". Only a letter at
 * the start of the name or right after a space or hyphen changes; the rest stays as typed, so "McKenzie"
 * and "DeShawn" keep their capitals. Same length as what was typed, so the cursor stays put.
 */
export function capitalizeName(name: string) {
  return name.replace(/(^|[\s-])(\p{Ll})/gu, (_, before: string, letter: string) => before + letter.toUpperCase());
}

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

/** Common email domains, for "Did you mean …?". */
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
  const email = normalizeEmail(rawEmail);
  const errors: { name?: string; email?: string } = {};
  if (!name) errors.name = copy.nameRequired;
  else if (/[<>/\\:@]/.test(name)) errors.name = copy.nameInvalid;
  if (!EMAIL.test(rawEmail.trim())) errors.email = copy.emailInvalid;
  else if (email === REFERRER.email) errors.email = copy.ownEmail;
  return errors.name || errors.email ? errors : null;
}

/** Demo stand-in for a referral's id: a stable 8-character code from the (normalised) email. */
function codeFor(email: string) {
  let h = 2166136261;
  for (const c of email) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return h.toString(16).padStart(8, "0");
}

/**
 * The link a friend will get, shown as soon as their email is typed (before anything is recorded), so the
 * member always sees it. Copy link records the referral with this same link. Null until the email looks
 * complete.
 */
export function previewLinkFor(email: string): string | null {
  return EMAIL.test(email.trim()) ? link(codeFor(normalizeEmail(email))) : null;
}

export async function demoReferFriend(values: ReferralValues): Promise<ReferralResult> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const name = values.name.trim();
  const email = normalizeEmail(values.email);

  const fieldErrors = checkRecipient(values.name, values.email);
  if (fieldErrors) return { status: "invalid", fieldErrors };
  if (email === "fail@example.org") throw new Error("Network error (demo)");

  const friendName = name.split(/\s+/)[0];
  if (email === "sam@example.org") return { status: "message", friendName, link: link(codeFor(email)), referredOn: "Nov 3" };
  if (values.delivery === "email") return { status: "emailed", friendName };
  // Each person gets their own link; the same person always gets the same one.
  return { status: "message", friendName, link: link(codeFor(email)) };
}

/** The rest of the address to offer after what's typed ("alex@g" → "mail.com"), or null. */
export function completeEmail(value: string): string | null {
  const at = value.indexOf("@");
  if (at < 1 || value.indexOf("@", at + 1) !== -1) return null;
  const typed = value.slice(at + 1).toLowerCase();
  if (!typed) return null;
  const match = DOMAINS.find((domain) => domain.startsWith(typed) && domain !== typed);
  return match ? match.slice(typed.length) : null;
}
