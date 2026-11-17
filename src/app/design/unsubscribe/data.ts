/*
 * Demo data for the email and membership pages, all in memory. The types are the contract the real
 * feature fills from the member's record (via the per-recipient token in the email link); every value
 * below is made up. The flow follows the "Unsub flow" FigJam board:
 * https://www.figma.com/board/jvbGjJ6Wb3CZIOjTB6x81Z/Unsub-flow
 */

/**
 * A4: the email page (footer link 1). B1: the membership page (footer link 2, "Pause or cancel
 * membership"). B4: confirm cancelling. B5: cancelled. Labels match the copy doc's screens.
 */
export type Screen = "A4" | "A5" | "B1" | "B4" | "B5";
export const SCREENS: Screen[] = ["A4", "A5", "B1", "B4", "B5"];

/** The email page's "What's going on?" answers. Each opens its own follow-up (FigJam). */
export const emailReasons = ["too-many", "not-relevant", "no-more"] as const;
export type EmailReason = (typeof emailReasons)[number];

/** The membership page's "What's going on?" answers. Each opens its own follow-up (FigJam). */
export const membershipReasons = ["emails", "budget", "break", "done"] as const;
export type MembershipReason = (typeof membershipReasons)[number];

/**
 * When a cancelled membership's voting rights and benefits end. SDC hasn't decided (doc: Open
 * questions); "ends-today" is the current policy and the default.
 */
export type CutOffPolicy = "ends-today" | "end-of-period";

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
}

export const demoMember: DemoMember = {
  firstName: "Priya",
  email: "priya.shah@example.com",
  tierId: "supporter",
  nextPaymentDate: "2026-12-01",
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

/** How long a pause lasts: a whole number and a unit (FigJam: "[number] [weeks, months, years]"). */
export const pauseUnits = ["weeks", "months", "years"] as const;
export type PauseUnit = (typeof pauseUnits)[number];

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

/** The date a pause of `count` `unit`s starting `from` ends and the membership restarts. */
export function addPause(from: string, count: number, unit: PauseUnit): string {
  if (unit === "weeks") return addDays(from, count * 7);
  return addMonths(from, unit === "years" ? count * 12 : count);
}

const dateFormat = new Intl.DateTimeFormat("en-CA", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
export const formatDate = (iso: string) => dateFormat.format(parse(iso));

const moneyFormat = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 2, minimumFractionDigits: 0 });
export const formatMoney = (dollars: number) => moneyFormat.format(dollars);

export const tierById = (id: string) => tiers.find((t) => t.id === id) ?? tiers[0];
