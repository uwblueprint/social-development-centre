/*
 * Demo data for the referral page. No backend: everything lives in memory. The real contract (functions,
 * tables, rules) is in docs/backend/referrals.md; `referFriend` below mimics what the server will return.
 *
 * Try these in the email field:
 * - amara@example.org: the referrer's own address (blocked)
 * - sam@example.org: already referred on Nov 3 (we never email anyone twice, so you get the message instead)
 * - lee@example.org: already a member. Looks exactly like a new referral, so a referral link can't be
 *   used to find out who is a member. The server records it and sends nothing.
 * - anything else: a new referral
 * Open /design/referrals?link=unknown for a link with a bad or missing token.
 */

export interface Referrer {
  firstName: string;
  fullName: string;
  email: string;
}

/** The member the email (and so the referral link) was sent to. */
export const REFERRER: Referrer = { firstName: "Amara", fullName: "Amara Okafor", email: "amara@example.org" };

export type Delivery = "email" | "self";

export interface ReferralInput {
  name: string;
  email: string;
  delivery: Delivery;
}

export type ReferralResult =
  /** We sent the friend the one referral email. */
  | { status: "emailed"; friendName: string }
  /** The member sends it themselves. `referredOn` is set when this address was already referred. */
  | { status: "message"; friendName: string; link: string; referredOn?: string }
  | { status: "invalid"; fieldErrors: { name?: string; email?: string } }
  | { status: "failed" };

const ALREADY_REFERRED: Record<string, { on: string; link: string }> = {
  "sam@example.org": { on: "Nov 3", link: "https://sdc.example.org/r/3f9c2a" },
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Stands in for the server action. */
export async function referFriend(input: ReferralInput): Promise<ReferralResult> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  const fieldErrors: { name?: string; email?: string } = {};
  if (!name) fieldErrors.name = "Enter their name.";
  if (!EMAIL.test(email)) fieldErrors.email = "Enter an email address like name@example.org.";
  else if (email === REFERRER.email) fieldErrors.email = "That’s your email address. Enter your friend’s.";
  if (fieldErrors.name || fieldErrors.email) return { status: "invalid", fieldErrors };

  const firstName = name.split(/\s+/)[0];
  const earlier = ALREADY_REFERRED[email];
  if (earlier) return { status: "message", friendName: firstName, link: earlier.link, referredOn: earlier.on };

  if (input.delivery === "email") return { status: "emailed", friendName: firstName };
  return { status: "message", friendName: firstName, link: "https://sdc.example.org/r/8b41de" };
}
