/*
 * Demo data for the email flow (/design/unsubscribe) and the cancel-membership flow
 * (/design/cancel-membership), all in memory. The types are the contract the real
 * feature fills from the member's record (via the per-recipient token in the email link); every value
 * below is made up. The flow follows the "Unsub flow" FigJam board:
 * https://www.figma.com/board/jvbGjJ6Wb3CZIOjTB6x81Z/Unsub-flow
 */

/** The email page's "What's going on?" answers. Each opens its own follow-up (FigJam). */
export const emailReasons = ["too-many", "not-relevant", "no-more"] as const;
export type EmailReason = (typeof emailReasons)[number];

/** "What's the main reason you're cancelling?" answers. Each opens its own follow-up (FigJam). */
export const membershipReasons = ["emails", "budget", "break", "done"] as const;
export type MembershipReason = (typeof membershipReasons)[number];

export type MembershipStatus = "active" | "paused" | "cancelled" | "none";

export interface Tier {
  id: string;
  name: string;
  /** Dollars a month. */
  monthlyPrice: number;
}

export const tiers: Tier[] = [
  { id: "friend", name: "Friend", monthlyPrice: 5 },
  { id: "supporter", name: "Supporter", monthlyPrice: 15 },
  { id: "sustainer", name: "Sustainer", monthlyPrice: 30 },
];

export interface DemoMember {
  firstName: string;
  email: string;
  tierId: string;
  /** ISO dates (YYYY-MM-DD). */
  nextPaymentDate: string;
  memberSince: string;
}

export const demoMember: DemoMember = {
  firstName: "Priya",
  email: "priya.shah@example.com",
  tierId: "supporter",
  nextPaymentDate: "2026-12-01",
  memberSince: "2023-04-15",
};

/** Fixed so screenshots and reviews show the same dates every day. */
export const DEMO_TODAY = "2026-11-11";

/** Days before a pause ends that the restart reminder goes out (FigJam: "an email a week before"). */
export const RESTART_REMINDER_DAYS = 7;

/**
 * The email types "too many emails" lets people tick, independent of each other so any mix makes
 * sense. Placeholders until SDC lists the email types it actually sends (doc: Open questions).
 * Membership and voting notices aren't here: voting members can't turn the legally required ones off.
 */
export const emailTypes = ["monthly", "events", "campaigns"] as const;
export type EmailType = (typeof emailTypes)[number];

/**
 * How long a pause lasts, in months: presets rather than free entry, since most people want one to
 * three months. The copy doc's maximum is 3 months (the FigJam board leaves it open): SDC to confirm.
 */
export const pauseLengths = ["1", "2", "3"] as const;
export type PauseLength = (typeof pauseLengths)[number];

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

const monthYearFormat = new Intl.DateTimeFormat("en-CA", { month: "long", year: "numeric", timeZone: "UTC" });
/** "April 2023": how long someone has been a member. */
export const formatMonthYear = (iso: string) => monthYearFormat.format(parse(iso));

const moneyFormat = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 2, minimumFractionDigits: 0 });
export const formatMoney = (dollars: number) => moneyFormat.format(dollars);

export const tierById = (id: string) => tiers.find((t) => t.id === id) ?? tiers[0];
