/*
 * Demo data for the email-preferences and membership screens, all in memory. The types are the
 * contract the real feature fills from the member's record (via the per-recipient token in the email
 * link); every value below is made up.
 */

/**
 * A1: email preferences (footer link 1): tick the email types you want and save. A4: the unsubscribe
 * page (Luma-style: reasons, then confirm, then the result in place). B1–B5: membership (footer link 2). The doc's A2 and A3 are folded into A1.
 */
export type Screen = "A1" | "A4" | "B1" | "B2" | "B3" | "B4" | "B5";
export const SCREENS: Screen[] = ["A1", "A4", "B1", "B2", "B3", "B4", "B5"];

/** Screens with a confirmed state that can be opened directly with ?state=done (A4: unsubscribed). */
export const SCREENS_WITH_DONE: Screen[] = ["A4", "B2", "B3"];

/**
 * A1's result, if any. Open one directly with ?state=…: "saved" turns Save into "Your preference is
 * saved" until a tick changes; "resubscribed" shows a line under the buttons.
 */
export type EmailResult = "saved" | "resubscribed";
export const EMAIL_RESULTS: EmailResult[] = ["saved", "resubscribed"];

/**
 * When a cancelled membership's voting rights and benefits end. SDC hasn't decided (doc: Open
 * questions); "ends-today" is the current policy and the default.
 */
export type CutOffPolicy = "ends-today" | "end-of-period";

export type EmailStatus = "subscribed" | "unsubscribed";
export type MembershipStatus = "active" | "paused" | "cancelled" | "none";

export interface Tier {
  id: string;
  name: string;
  /** Dollars a month. */
  monthlyPrice: number;
  /** What changes when someone moves down to this tier: B2's "[What changes]". */
  whatChanges: string;
}

/** Cheapest first. B2 offers the next tier down, and hides that offer on the lowest tier. */
export const tiers: Tier[] = [
  { id: "friend", name: "Friend", monthlyPrice: 5, whatChanges: "You keep your vote and member event invitations." },
  { id: "supporter", name: "Supporter", monthlyPrice: 15, whatChanges: "You keep your vote, event invitations and the members' newsletter." },
  { id: "sustainer", name: "Sustainer", monthlyPrice: 30, whatChanges: "" },
];

export interface DemoMember {
  firstName: string;
  email: string;
  tierId: string;
  /** ISO dates (YYYY-MM-DD). */
  nextPaymentDate: string;
}

export const demoMember: DemoMember = {
  firstName: "Priya",
  email: "priya.shah@example.com",
  tierId: "supporter",
  nextPaymentDate: "2026-12-01",
};

/** Fixed so screenshots and reviews show the same dates every day. */
export const DEMO_TODAY = "2026-11-11";

/** Days before a pause ends that the restart reminder goes out. The board says one week; see the doc's open questions. */
export const RESTART_REMINDER_DAYS = 7;

/**
 * The email types A1 lets people tick, independent of each other so any mix makes sense. Placeholders
 * until SDC lists the email types it actually sends (doc: Open questions). Membership and voting
 * notices aren't here: voting members can't turn the legally required ones off.
 */
export const emailTypes = ["monthly", "events", "campaigns"] as const;
export type EmailType = (typeof emailTypes)[number];

/** A4's survey: multi-select, so the reasons must all be able to be true at once. */
export type UnsubscribeReason = "too-many" | "not-relevant" | "didnt-sign-up" | "other";
export const unsubscribeReasons: UnsubscribeReason[] = ["too-many", "not-relevant", "didnt-sign-up", "other"];

export const pauseMonths = [1, 2, 3] as const;
export type PauseMonths = (typeof pauseMonths)[number];

/* ---- Dates and money, written the way the copy reads them ---- */

const parse = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const toIso = (date: Date) => date.toISOString().slice(0, 10);

export function addMonths(iso: string, months: number): string {
  const date = parse(iso);
  date.setUTCMonth(date.getUTCMonth() + months);
  return toIso(date);
}

export function addDays(iso: string, days: number): string {
  const date = parse(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toIso(date);
}

const dateFormat = new Intl.DateTimeFormat("en-CA", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
export const formatDate = (iso: string) => dateFormat.format(parse(iso));

const moneyFormat = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 2, minimumFractionDigits: 0 });
export const formatMoney = (dollars: number) => moneyFormat.format(dollars);

export const tierById = (id: string) => tiers.find((t) => t.id === id) ?? tiers[0];
/** The next tier down, or undefined on the lowest tier. */
export function lowerTier(id: string): Tier | undefined {
  const i = tiers.findIndex((t) => t.id === id);
  return i > 0 ? tiers[i - 1] : undefined;
}
