/*
 * Demo data for the email-preferences and membership screens, all in memory. The types are the
 * contract the real feature fills from the member's record (via the per-recipient token in the email
 * link); every value below is made up.
 */

/**
 * A1, A2, A4: email preferences. B1–B5: membership. Labels match the copy doc. A3 (pick topics) is
 * gone: A1 now offers only "fewer emails" (A2) or "unsubscribe from all" (A4).
 */
export type Screen = "A1" | "A2" | "A4" | "B1" | "B2" | "B3" | "B4" | "B5";
export const SCREENS: Screen[] = ["A1", "A2", "A4", "B1", "B2", "B3", "B4", "B5"];

/** Screens with a follow-up state that can be opened directly with ?state=done (A4's is "resubscribed"). */
export const SCREENS_WITH_DONE: Screen[] = ["A2", "A4", "B2", "B3"];

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

/** A2's choices. Placeholders until SDC lists the email types it actually sends (doc: Open questions). */
export const fewerEmailChoices = [
  { id: "monthly", membersOnly: false },
  { id: "events", membersOnly: false },
  { id: "notices", membersOnly: true },
] as const;
export type FewerEmailChoice = (typeof fewerEmailChoices)[number]["id"];

export const pauseMonths = [1, 2, 3] as const;
export type PauseMonths = (typeof pauseMonths)[number];

export type UnsubscribeReason = "too-many" | "not-relevant" | "didnt-sign-up" | "other";
export const unsubscribeReasons: UnsubscribeReason[] = ["too-many", "not-relevant", "didnt-sign-up", "other"];

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
