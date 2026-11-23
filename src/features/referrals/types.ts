/** How the friend hears about SDC: we email them once, or the member sends a message themselves. */
export type Delivery = "email" | "self";

export interface ReferralValues {
  name: string;
  email: string;
  delivery: Delivery;
}

/** What the page shows after a referral. The server action (and the design demo) return this. */
export type ReferralResult =
  /** We've taken it from here. Said the same whether or not an email goes out, so nobody learns who is a member. */
  | { status: "emailed"; friendName: string }
  /** The member sends it. `referredOn` is set when they already referred this address. */
  | { status: "message"; friendName: string; link: string; referredOn?: string }
  | { status: "invalid"; fieldErrors: { name?: string; email?: string } }
  /** Ten new referrals in a day. */
  | { status: "limit" }
  /** The link's token doesn't belong to a current member. */
  | { status: "unknown" }
  | { status: "failed" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A token or id from a URL, or undefined if it isn't a UUID (so it never reaches the database). */
export function parseUuid(value: unknown): string | undefined {
  return typeof value === "string" && UUID.test(value) ? value.toLowerCase() : undefined;
}

/** The friend's link: the members' intake form, carrying the referral so joining credits it. */
export function friendLinkPath(referralId: string) {
  return `/intake-form/sdc-members?r=${referralId}`;
}
