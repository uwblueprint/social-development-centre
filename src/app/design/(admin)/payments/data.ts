/**
 * Membership payments, as the design screen receives them. Demo data only: the real data comes from
 * PayPal's webhooks (Icema's `subscriptions` and `payments` tables) and Sophia's tiers. What the screen
 * needs that doesn't exist yet is listed in docs/backend/payments-insights.md.
 */

import type { MonthRange } from "@/components/ui/MonthRangePicker";
import { demoSignupLinks } from "../signup-links/data";

export type Status = "active" | "payment_problem" | "suspended" | "pending" | "cancelled";
/** The page's one date range, in whole months (null = all time). It drives the number, the chart and the transactions. */
export type Period = MonthRange | null;

export interface Tier {
  id: string;
  name: string;
  /** Whole Canadian dollars a month. */
  price: number;
  /** Archived tiers can't be chosen by new people; people already on one keep it and keep paying. */
  archived?: boolean;
  /**
   * Earlier costs, oldest first: `price` was charged to people who joined before `until` (YYYY-MM-DD). A new
   * cost applies only to people who join after the change; everyone already on the tier keeps theirs.
   */
  history?: { price: number; until: string }[];
}

export interface Source {
  id: string;
  name: string;
}

export interface Person {
  id: string;
  name: string;
  email: string;
  tierId: string;
  /** What this person pays a month, in whole dollars: their tier's cost on the day they joined. */
  pays: number;
  /**
   * Chosen at sign-up ("Gift a membership") and never changed: each monthly charge is then twice `pays`, their own
   * membership plus a gifted one of the same amount. Missing on older data; see `chargeAmounts`.
   */
  giftsMembership?: boolean;
  /** The signup link they joined through; null when they joined without one. */
  sourceId: string | null;
  status: Status;
  joinedAt: string;
  lastPaidAt: string | null;
  nextPaymentAt: string | null;
  cancelledAt: string | null;
}

/**
 * What a row in Transactions is. "payment": money for the payer's own membership. "gift": money for a membership
 * the payer bought for someone else (the person is the giver; there is no tier). "declined": PayPal tried the
 * payer's card and it was declined, so no money came in. "refund": SDC gave money back in PayPal. "reversal": the
 * payer's bank took it back (a chargeback). Refunds and reversals are negative, on the same person and tier as the
 * payment they undo, as the backend stores them (payments.kind, docs/backend/payments.md).
 */
export type PaymentKind = "payment" | "gift" | "declined" | "refund" | "reversal";

/** Money that went back: a refund or a chargeback. */
export const isMoneyBack = (p: Pick<Payment, "kind">) => p.kind === "refund" || p.kind === "reversal";

/** Payments in a range whose PayPal fee hasn't arrived yet (payments.fee_cents is null): what SDC kept can't be worked out. */
export const feesMissing = (items: Payment[]) => items.filter((p) => p.kind !== "declined" && !Number.isFinite(p.fee)).length;

export interface Payment {
  id: string;
  kind: PaymentKind;
  /**
   * PayPal's transaction id for the charge. One charge can be two rows (the payer's own membership and a gifted one):
   * both rows share it, the date and the payer.
   */
  chargeId: string;
  personId: string | null;
  /**
   * The tier this payment was for, kept on the payment so renames, cost changes and deletes don't move it. Null when
   * unmatched and for a gift. A declined payment keeps the tier it was charging for.
   */
  tierId: string | null;
  /** Dollars received. 0 for a declined payment. */
  amount: number;
  /**
   * PayPal's fee in dollars, with cents. PayPal charges one fee per charge, so a charge with two rows splits it in
   * proportion to their amounts (the cents add up to the charge's fee). 0 for a declined payment.
   */
  fee: number;
  paidAt: string;
  payerEmail: string;
}

export interface PaymentsData {
  today: string;
  tiers: Tier[];
  sources: Source[];
  people: Person[];
  payments: Payment[];
}

/**
 * What a charge from this person pays for, as row amounts: their own membership, then (when they gift) a gifted one
 * of the same amount. Uses the person's own contracted amount, never their tier's current cost, so a tier that
 * doubles its price later isn't mistaken for a gift. Without the sign-up flag, a charge of exactly twice `pays`
 * counts as own + gift.
 */
export function chargeAmounts(person: Pick<Person, "pays" | "giftsMembership">, charged: number): number[] {
  const gifts = person.giftsMembership ?? charged === 2 * person.pays;
  return gifts ? [person.pays, person.pays] : [charged];
}

/** Money actually received: every row except a declined payment. */
export const received = (items: Payment[]) => items.filter((p) => p.kind !== "declined");

export const tiers: Tier[] = [
  { id: "friend", name: "Friend", price: 5 },
  // Supporter was $8 until 1 Mar 2026; people who joined before then still pay $8.
  { id: "supporter", name: "Supporter", price: 10, history: [{ price: 8, until: "2026-03-01" }] },
  { id: "sustainer", name: "Sustainer", price: 25 },
  { id: "champion", name: "Champion", price: 50 },
];

/** What a tier cost on a date: the cost a person joining that day signs up at. */
export function priceOn(tier: Tier, date: string): number {
  return tier.history?.find((h) => date < h.until)?.price ?? tier.price;
}

export const sources: Source[] = demoSignupLinks.map((l) => ({ id: l.id, name: l.name }));

export const NO_LINK = "none";

// ---------- formatting ----------

const money = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
const moneyCompact = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  notation: "compact",
  maximumFractionDigits: 0,
});

export const formatMoney = (amount: number) => money.format(amount);
export const formatMoneyShort = (amount: number) => (Math.abs(amount) >= 10000 ? moneyCompact.format(amount) : money.format(amount));
export const formatCount = (n: number) => n.toLocaleString("en-CA");

export function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

// ---------- demo generation ----------

const TODAY = "2026-11-22";
const START = new Date("2023-03-06T12:00:00");

/** Small seeded random so the demo is the same on every load (and on the server and client). */
function random(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const FIRST = [
  "Amira", "Ben", "Chloé", "Daniel", "Esi", "Farah", "Gurpreet", "Hana", "Isaac", "Jasmine", "Kofi", "Lena",
  "Mateo", "Nadia", "Omar", "Priya", "Quinn", "Rosa", "Samir", "Tess", "Uma", "Victor", "Wen", "Yusuf", "Zoe",
  "Aaron", "Bea", "Carlos", "Dana", "Elif", "Femi", "Grace", "Hugo", "Ines", "Jonah", "Kira", "Liam", "Maya",
];
const LAST = [
  "Abdi", "Bauer", "Chen", "Dubois", "Eze", "Fraser", "Gill", "Haddad", "Ito", "Jansen", "Khan", "Lopez",
  "Mensah", "Nguyen", "Okafor", "Patel", "Quintero", "Rahman", "Singh", "Tremblay", "Usman", "Varga", "Wong",
  "Yilmaz", "Zhang", "MacLeod", "Martin", "Roy", "Kaur", "Ahmed",
];

/** PayPal's Canadian charity-ish rate for the demo: 2.9% + $0.30. */
export const paypalFee = (amount: number) => Math.round((amount * 0.029 + 0.3) * 100) / 100;

/**
 * PayPal charges one fee per charge. When a charge pays for two things (the payer's own membership and a gift) the
 * fee is split in proportion to their amounts, in whole cents, so the shares add up to the charge's fee exactly.
 */
export function splitFee(amounts: number[]): number[] {
  const total = amounts.reduce((t, a) => t + a, 0);
  const cents = Math.round(paypalFee(total) * 100);
  const shares = amounts.map((a) => Math.round((cents * a) / total));
  shares[shares.length - 1] = cents - shares.slice(0, -1).reduce((t, c) => t + c, 0);
  return shares.map((c) => c / 100);
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

function addMonths(d: Date, n: number): Date {
  const next = new Date(d);
  next.setMonth(next.getMonth() + n);
  return next;
}

function generate(): PaymentsData {
  const rand = random(42);
  const pick = <T,>(items: T[]) => items[Math.floor(rand() * items.length)];
  const today = new Date(`${TODAY}T12:00:00`);
  const people: Person[] = [];
  const payments: Payment[] = [];
  const days = Math.round((today.getTime() - START.getTime()) / 86400000);

  // Joins grow over time, with bumps after events.
  for (let i = 0; i < 300; i += 1) {
    const t = rand() ** 0.8;
    const joined = new Date(START.getTime() + Math.floor(t * days) * 86400000);
    const r = rand();
    const tier = r < 0.34 ? tiers[0] : r < 0.7 ? tiers[1] : r < 0.92 ? tiers[2] : tiers[3];
    const s = rand();
    const sourceId = s < 0.38 ? null : pick(sources).id;
    const first = pick(FIRST);
    const last = pick(LAST);
    const gifts = rand() < 0.06;
    const person: Person = {
      id: `p${i}`,
      name: `${first} ${last}`,
      email: `${first}.${last}${i}@example.org`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""),
      tierId: tier.id,
      pays: priceOn(tier, iso(joined)),
      giftsMembership: gifts,
      sourceId,
      status: "active",
      joinedAt: iso(joined),
      lastPaidAt: null,
      nextPaymentAt: null,
      cancelledAt: null,
    };

    // About one in six cancel at some point.
    let end = today;
    if (rand() < 0.3) {
      const months = 1 + Math.floor(rand() * 24);
      const cancelled = addMonths(joined, months);
      if (cancelled < today) {
        end = cancelled;
        person.status = "cancelled";
        person.cancelledAt = iso(cancelled);
      }
    }

    for (let n = 0; ; n += 1) {
      const due = addMonths(joined, n);
      if (due > end) {
        if (person.status === "active") person.nextPaymentAt = iso(due);
        break;
      }
      const id = `${person.id}-${n}`;
      // One PayPal charge; a person who gifts pays twice their own amount, split into their membership and a gifted one.
      const amounts = chargeAmounts(person, gifts ? 2 * person.pays : person.pays);
      const feeShares = splitFee(amounts);
      payments.push({ id, kind: "payment", chargeId: id, personId: person.id, tierId: tier.id, amount: amounts[0], fee: feeShares[0], paidAt: iso(due), payerEmail: person.email });
      if (amounts.length > 1)
        payments.push({ id: `${id}-gift`, kind: "gift", chargeId: id, personId: person.id, tierId: null, amount: amounts[1], fee: feeShares[1], paidAt: iso(due), payerEmail: person.email });
      person.lastPaidAt = iso(due);
    }
    people.push(person);
  }

  // Statuses that need someone: the newest few active people with a payment in the last month.
  const recent = people.filter((p) => p.status === "active" && p.lastPaidAt && p.lastPaidAt >= "2026-10-24");
  const failedOn = new Map<string, string>();
  const fail = (p: Person, status: Status, missed: number) => {
    for (let k = 0; k < missed; k += 1) {
      const idx = payments.findLastIndex((x) => x.personId === p.id);
      if (idx >= 0) {
        // The whole charge failed: both rows of a gifter's charge go.
        const charge = payments[idx].chargeId;
        failedOn.set(p.id, payments[idx].paidAt);
        for (let i = payments.length - 1; i >= 0; i -= 1) if (payments[i].chargeId === charge) payments.splice(i, 1);
      }
    }
    const last = payments.findLast((x) => x.personId === p.id);
    p.status = status;
    p.lastPaidAt = last?.paidAt ?? null;
    p.nextPaymentAt = status === "payment_problem" ? "2026-11-27" : null;
  };
  recent.slice(0, 3).forEach((p) => fail(p, "payment_problem", 1));
  recent.slice(3, 5).forEach((p) => fail(p, "suspended", 1));

  // Someone started paying this week but hasn't approved in PayPal yet.
  const waiting: Person = {
    id: "p-waiting",
    name: "Noor Haddad",
    email: "noor.haddad@example.org",
    tierId: "supporter",
    pays: 10,
    giftsMembership: false,
    sourceId: sources[0].id,
    status: "pending",
    joinedAt: "2026-11-19",
    lastPaidAt: null,
    nextPaymentAt: null,
    cancelledAt: null,
  };
  people.push(waiting);

  // Two payments PayPal couldn't link to anyone.
  payments.push(
    { id: "unmatched-1", kind: "payment", chargeId: "unmatched-1", personId: null, tierId: null, amount: 25, fee: paypalFee(25), paidAt: "2026-11-14", payerEmail: "m.tremblay.home@example.net" },
    { id: "unmatched-2", kind: "payment", chargeId: "unmatched-2", personId: null, tierId: null, amount: 10, fee: paypalFee(10), paidAt: "2026-11-03", payerEmail: "kitchen.collective@example.com" },
  );

  const personOf = new Map(people.map((p) => [p.id, p]));
  const declined = (p: Person, paidAt: string): Payment => ({
    id: `declined-${p.id}-${paidAt}`,
    kind: "declined",
    chargeId: `declined-${p.id}-${paidAt}`,
    personId: p.id,
    tierId: p.tierId,
    amount: 0,
    fee: 0,
    paidAt,
    payerEmail: p.email,
  });

  // Declined cards: the people whose payment failed this month, PayPal's attempts that didn't go through.
  for (const p of people) {
    const at = failedOn.get(p.id);
    if (at && p.status === "payment_problem") payments.push(declined(p, at));
  }
  // One person's card was declined and PayPal's retry three days later went through: both rows show.
  const retried = payments.find((x) => x.kind === "payment" && x.personId && x.paidAt >= "2026-11-04" && x.paidAt <= "2026-11-17" && personOf.get(x.personId)?.status === "active");
  if (retried?.personId) {
    const who = personOf.get(retried.personId)!;
    payments.push(declined(who, retried.paidAt));
    const later = new Date(`${retried.paidAt}T12:00:00`);
    later.setDate(later.getDate() + 3);
    if (who.lastPaidAt === retried.paidAt) who.lastPaidAt = iso(later);
    // Both rows of a gifter's charge move together.
    for (const row of payments) if (row.chargeId === retried.chargeId && row.kind !== "declined") row.paidAt = iso(later);
  }

  payments.sort((a, b) => a.paidAt.localeCompare(b.paidAt));
  return { today: TODAY, tiers, sources, people, payments };
}

/**
 * Every subscription has its own amount and every matched payment its tier. Data from before those fields
 * existed (an older save, a page kept open across a reload) gets them filled in: a person's amount is their
 * tier's cost on the day they joined, a payment's tier is its person's tier. Returns the same object when
 * nothing is missing.
 */
export function withAmounts(data: PaymentsData): PaymentsData {
  const okPeople = data.people.every((p) => Number.isFinite(p.pays));
  const okPayments = data.payments.every((p) => p.tierId !== undefined);
  if (okPeople && okPayments) return data;
  const tierOf = new Map(data.tiers.map((t) => [t.id, t]));
  const people = okPeople
    ? data.people
    : data.people.map((p) => {
        if (Number.isFinite(p.pays)) return p;
        const tier = tierOf.get(p.tierId);
        return { ...p, pays: tier ? priceOn(tier, p.joinedAt) : 0 };
      });
  const personTier = new Map(people.map((p) => [p.id, p.tierId]));
  const payments = okPayments
    ? data.payments
    : data.payments.map((p) => (p.tierId !== undefined ? p : { ...p, tierId: p.personId ? (personTier.get(p.personId) ?? null) : null }));
  return { ...data, people, payments };
}

export const demoPayments: PaymentsData = generate();

export const emptyPayments: PaymentsData = { today: TODAY, tiers, sources, people: [], payments: [] };

// ---------- periods ----------

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export interface Range {
  from: string;
  to: string;
}

const lastDay = (y: number, m: number) => new Date(y, m, 0).getDate();

const monthKey = (d: Date) => ymd(d).slice(0, 7);
const shiftMonth = (key: string, n: number) => {
  const [y, m] = key.split("-").map(Number);
  return monthKey(new Date(y, m - 1 + n, 1));
};
const endOfMonth = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return `${key}-${pad(lastDay(y, m))}`;
};
/** Whole months from `from` to `to`, counting both. */
export const monthCount = (p: MonthRange) => {
  const [fy, fm] = p.from.split("-").map(Number);
  const [ty, tm] = p.to.split("-").map(Number);
  return (ty - fy) * 12 + (tm - fm) + 1;
};

export const thisMonth = (today: string): MonthRange => ({ from: today.slice(0, 7), to: today.slice(0, 7) });
export const thisYear = (today: string): MonthRange => ({ from: `${today.slice(0, 4)}-01`, to: today.slice(0, 7) });

/**
 * The period, and the same number of months just before it (for the change). A period that runs to today
 * is compared with the same stretch of days, so the middle of a month isn't weighed against a whole one.
 */
export function ranges(period: Period, today: string): { current: Range; previous: Range | null } {
  if (!period) return { current: { from: "0000-01-01", to: today }, previous: null };
  const n = monthCount(period);
  const to = endOfMonth(period.to) < today ? endOfMonth(period.to) : today;
  const prevFromKey = shiftMonth(period.from, -n);
  const prevToKey = shiftMonth(period.to, -n);
  let prevTo = endOfMonth(prevToKey);
  if (to === today) {
    const day = Number(today.slice(8, 10));
    const [py, pm] = prevToKey.split("-").map(Number);
    prevTo = `${prevToKey}-${pad(Math.min(day, lastDay(py, pm)))}`;
  }
  return { current: { from: `${period.from}-01`, to }, previous: { from: `${prevFromKey}-01`, to: prevTo } };
}

const inRange = (date: string, r: Range) => date >= r.from && date <= r.to;

export function paymentsIn(data: PaymentsData, r: Range) {
  return data.payments.filter((p) => inRange(p.paidAt, r));
}

export const sum = (items: { amount: number }[]) => items.reduce((total, x) => total + x.amount, 0);

/** The date of the organisation's first payment (any row), or null when there is none. A comparison reaching back before it isn't real. */
export function firstPaymentDate(data: PaymentsData): string | null {
  return data.payments.reduce<string | null>((first, p) => (first === null || p.paidAt < first ? p.paidAt : first), null);
}

/** The day the first person joined (people still waiting to approve in PayPal don't count), or null. */
export function firstJoinDate(data: PaymentsData): string | null {
  return data.people.filter((p) => p.status !== "pending").reduce<string | null>((first, p) => (first === null || p.joinedAt < first ? p.joinedAt : first), null);
}

/** "Oct 22", or "Oct 22, 2025" when it isn't in today's year. */
export function dayText(iso: string, today: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-CA", { month: "short", day: "numeric", ...(iso.slice(0, 4) === today.slice(0, 4) ? {} : { year: "numeric" }) });
}

/**
 * What the Raised change is measured against, written as dates: "Oct 1–22" (the same days last month), "Oct 2026"
 * (the whole month before), "Jan – Mar 2026" (the equal stretch of months before). Empty when there's no previous period.
 */
export function comparedTo(period: Period, today: string): string {
  const { previous } = ranges(period, today);
  if (!period || !previous) return "";
  const wholeMonths = previous.from.endsWith("-01") && previous.to === endOfMonth(previous.to.slice(0, 7));
  if (wholeMonths) return periodText({ from: previous.from.slice(0, 7), to: previous.to.slice(0, 7) });
  const [from, to] = [dayText(previous.from, today), dayText(previous.to, today)];
  if (previous.from.slice(0, 7) !== previous.to.slice(0, 7)) return `${from} – ${to}`;
  // Same month: "Oct 1–22", with the year once at the end when it isn't this year.
  const year = previous.to.slice(0, 4) === today.slice(0, 4) ? "" : `, ${previous.to.slice(0, 4)}`;
  return `${from.replace(/, d{4}$/, "")}–${Number(previous.to.slice(8))}${year}`;
}

// ---------- chart ----------

export interface Bucket {
  key: string;
  /** The x-axis label, e.g. "Nov 3", "Mar 2026" or "2025". */
  label: string;
  /** The tooltip's date, e.g. "Monday, November 3, 2026". */
  title: string;
  range: Range;
  /** The bucket today falls in: still filling up. */
  current: boolean;
}

/** The bar size, from the range: one month = days, up to two years = months, longer or all time = years. */
export type Unit = "day" | "month" | "year";
export function unitOf(period: Period): Unit {
  if (!period) return "year";
  const n = monthCount(period);
  return n === 1 ? "day" : n <= 24 ? "month" : "year";
}

export function periodBuckets(period: Period, data: PaymentsData): Bucket[] {
  const unit = unitOf(period);
  if (period && unit === "day") {
    const [y, m] = period.from.split("-").map(Number);
    return Array.from({ length: lastDay(y, m) }, (_, i) => {
      const d = new Date(y, m - 1, i + 1);
      const key = ymd(d);
      return {
        key,
        label: d.toLocaleDateString("en-CA", { month: "short", day: "numeric" }),
        title: d.toLocaleDateString("en-CA", { month: "short", day: "numeric" }),
        range: { from: key, to: key },
        current: key === data.today,
      };
    });
  }
  if (period && unit === "month") {
    const n = monthCount(period);
    return Array.from({ length: n }, (_, i) => {
      const key = shiftMonth(period.from, i);
      const [y, m] = key.split("-").map(Number);
      const d = new Date(y, m - 1, 1);
      return {
        key,
        label: d.toLocaleDateString("en-CA", { month: "short", ...(m === 1 || i === 0 ? { year: "numeric" } : {}) }),
        title: d.toLocaleDateString("en-CA", { month: "long", year: "numeric" }),
        range: { from: `${key}-01`, to: endOfMonth(key) },
        current: key === data.today.slice(0, 7),
      };
    });
  }
  const now = Number(data.today.slice(0, 4));
  const first = period ? Number(period.from.slice(0, 4)) : Number((data.payments[0]?.paidAt ?? data.today).slice(0, 4));
  const last = period ? Number(period.to.slice(0, 4)) : now;
  return Array.from({ length: last - first + 1 }, (_, i) => {
    const year = first + i;
    return {
      key: String(year),
      label: String(year),
      title: String(year),
      range: { from: `${year}-01-01`, to: `${year}-12-31` },
      current: year === now,
    };
  });
}

/** What SDC keeps: payments minus PayPal's fees. */
export const kept = (items: Payment[]) => Math.round(received(items).reduce((t, p) => t + p.amount - p.fee, 0) * 100) / 100;
export const fees = (items: Payment[]) => Math.round(received(items).reduce((t, p) => t + p.fee, 0) * 100) / 100;

/**
 * What this month should end at: kept so far, plus the payments still due before the month ends from
 * everyone paying (a failed payment PayPal is retrying counts, since it usually goes through).
 */
export function expectedThisMonth(data: PaymentsData) {
  const { current } = ranges(thisMonth(data.today), data.today);
  const [y, m] = data.today.split("-").map(Number);
  const end = `${y}-${pad(m)}-${pad(new Date(y, m, 0).getDate())}`;
  const due = data.people
    .filter((p) => isPaying(p) && p.nextPaymentAt && p.nextPaymentAt > data.today && p.nextPaymentAt <= end)
    .reduce((t, p) => {
      const charge = p.giftsMembership ? 2 * p.pays : p.pays;
      return t + charge - paypalFee(charge);
    }, 0);
  return { expected: Math.round(kept(paymentsIn(data, current)) + due), end };
}

// ---------- insights: what each figure and chart is made of ----------

/** People paying on a date: joined by then and not yet cancelled. Today counts failed-but-retrying payments too. */
export function payingPeopleOn(data: PaymentsData, date: string): Person[] {
  if (date >= data.today) return data.people.filter(isPaying);
  return data.people.filter((p) => p.status !== "pending" && p.joinedAt <= date && (!p.cancelledAt || p.cancelledAt > date));
}
export const payingOn = (data: PaymentsData, date: string): number => payingPeopleOn(data, date).length;

export interface SeriesPoint extends Bucket {
  /** The bucket starts after today: nothing to show yet. */
  future: boolean;
  value: number;
}

/** The Earned chart's columns: what SDC kept in each day, month or year. */
export function keptSeries(data: PaymentsData, period: Period): SeriesPoint[] {
  return periodBuckets(period, data).map((b) => ({
    ...b,
    future: b.range.from > data.today,
    value: kept(paymentsIn(data, b.range)),
  }));
}

/** The unit after the big number: "raised this month", "raised in Jan – Mar 2026", "raised in total". */
export function raisedText(period: Period, today: string): string {
  if (!period) return "raised in total";
  const at = (key: string) => new Date(`${key}-01T12:00:00`);
  const from = at(period.from);
  const to = at(period.to);
  const mon = (d: Date) => d.toLocaleDateString("en-CA", { month: "short" });
  if (monthCount(period) === 1) {
    if (period.to === today.slice(0, 7)) return "raised this month";
    return `raised in ${to.toLocaleDateString("en-CA", { month: "long", year: "numeric" })}`;
  }
  if (from.getFullYear() === to.getFullYear()) return `raised in ${mon(from)} – ${mon(to)} ${to.getFullYear()}`;
  return `raised from ${mon(from)} ${from.getFullYear()} to ${mon(to)} ${to.getFullYear()}`;
}

// ---------- breakdowns ----------

const monthYear = (iso: string) =>
  iso.endsWith("-01") ? new Date(`${iso}T12:00:00`).toLocaleDateString("en-CA", { month: "short", year: "numeric" }) : formatDate(iso);

/**
 * The tiers with their numbers for a range. People are counted on the range's last day; what they bring in each
 * month is the sum of each person's own amount, never the tier's cost times people. Earned comes from the
 * payments themselves, by the tier on each payment.
 */
export function tierRows(data: PaymentsData, r: Range) {
  const paying = payingPeopleOn(data, r.to);
  const inPeriod = paymentsIn(data, r);
  return data.tiers.map((t) => {
    const on = paying.filter((p) => p.tierId === t.id);
    const amounts = [...new Set([t.price, ...on.map((p) => p.pays)])].sort((a, b) => a - b);
    const varies = amounts.length > 1;
    return {
      ...t,
      people: on.length,
      monthly: on.reduce((total, p) => total + p.pays, 0),
      raised: kept(inPeriod.filter((p) => p.tierId === t.id)),
      /** "$10 a month", or "$8–$10 a month" when members on the tier pay different amounts. */
      priceText: varies ? `${formatMoney(amounts[0])}–${formatMoney(amounts[amounts.length - 1])} a month` : `${formatMoney(t.price)} a month`,
      /** Who pays what, e.g. "$8 for members who joined before Mar 2026, $10 since". Null when everyone pays the same. */
      priceNote: varies ? priceNote(t) : null,
    };
  });
}

function priceNote(t: Tier): string {
  const parts = (t.history ?? []).map((h, i) => `${formatMoney(h.price)} ${i === 0 ? "for members who joined " : ""}before ${monthYear(h.until)}`);
  return [...parts, `${formatMoney(t.price)} since`].join(", ");
}

/** Kept from payments with no tier (not matched to anyone yet), so by-tier totals add up to Raised. Gifts have their own row. */
export function noTierRaised(data: PaymentsData, r: Range) {
  const ids = new Set(data.tiers.map((t) => t.id));
  return kept(paymentsIn(data, r).filter((p) => p.kind === "payment" && (!p.tierId || !ids.has(p.tierId))));
}

/** Kept from gifted memberships: money with no tier of its own, in its own row of Earned by tier. */
export function giftedRaised(data: PaymentsData, r: Range) {
  return kept(paymentsIn(data, r).filter((p) => p.kind === "gift"));
}

export function personTotals(data: PaymentsData) {
  const totals = new Map<string, number>();
  for (const p of data.payments) if (p.personId) totals.set(p.personId, (totals.get(p.personId) ?? 0) + p.amount);
  return totals;
}

/** What everyone paying on a date brings in each month: the sum of each person's own amount. */
export function monthlyIncome(data: PaymentsData, date: string = data.today) {
  return payingPeopleOn(data, date).reduce((total, p) => total + p.pays, 0);
}

/** Paying today: active, or a failed payment PayPal is still retrying. */
export const isPaying = (p: Person) => p.status === "active" || p.status === "payment_problem";

/** Monthly income that stops if failed and paused payments aren't fixed. */
export function atRisk(data: PaymentsData) {
  return data.people.filter((p) => p.status === "payment_problem" || p.status === "suspended").reduce((total, p) => total + p.pays, 0);
}

// ---------- where the money came from ----------

export interface SourceRow {
  key: string;
  name: string;
  /** Kept after PayPal fees, in dollars with cents. */
  raised: number;
  /** How many links an "Other links" row stands for (1 for a single link). */
  links: number;
}

/**
 * Money kept in the range, by the signup link each payer joined through: every payment in the range counts, not
 * only from people who joined in it, so the rows add up to Raised. The top five links, "Other links" and "No link"
 * (people who joined without one, and payments not matched to anyone), all sorted from most to least.
 */
export function sourceRows(data: PaymentsData, r: Range): SourceRow[] {
  const sourceOf = new Map(data.people.map((p) => [p.id, p.sourceId]));
  const totals = new Map<string | null, number>();
  for (const pay of received(paymentsIn(data, r))) {
    const source = pay.personId ? (sourceOf.get(pay.personId) ?? null) : null;
    totals.set(source, (totals.get(source) ?? 0) + pay.amount - pay.fee);
  }
  const cents = (n: number) => Math.round(n * 100) / 100;
  const name = new Map(data.sources.map((s) => [s.id, s.name]));
  const links = [...totals]
    .filter((entry): entry is [string, number] => entry[0] !== null)
    .map(([id, raised]) => ({ key: id, name: name.get(id) ?? "Deleted link", raised: cents(raised), links: 1 }))
    .sort((a, b) => b.raised - a.raised || a.name.localeCompare(b.name));
  const rest = links.slice(5);
  const none = cents(totals.get(null) ?? 0);
  return [
    ...links.slice(0, 5),
    ...(rest.length > 0 ? [{ key: "other", name: "Other links", raised: cents(rest.reduce((t, l) => t + l.raised, 0)), links: rest.length }] : []),
    ...(none > 0 ? [{ key: NO_LINK, name: "No link", raised: none, links: 0 }] : []),
  ].sort((a, b) => b.raised - a.raised);
}

const shortMonth = (key: string) => new Date(`${key}-01T12:00:00`).toLocaleDateString("en-US", { month: "short" });

/** "Nov 2026", "Jan – Mar 2026" or "Nov 2025 – Feb 2026", as the range menu writes it. */
export function periodText(period: MonthRange): string {
  const [fy, ty] = [period.from.slice(0, 4), period.to.slice(0, 4)];
  if (period.from === period.to) return `${shortMonth(period.from)} ${fy}`;
  if (fy === ty) return `${shortMonth(period.from)} – ${shortMonth(period.to)} ${ty}`;
  return `${shortMonth(period.from)} ${fy} – ${shortMonth(period.to)} ${ty}`;
}

/** The range written out for a card's takeaway line: "in Nov 2026", "in Jan – Mar 2026", "since Mar 2023". */
export function inPeriodText(period: Period, data: PaymentsData): string {
  if (period) return `in ${periodText(period)}`;
  return `since ${monthYear(`${(data.payments[0]?.paidAt ?? data.today).slice(0, 7)}-01`)}`;
}

export interface TierEarnedRow {
  key: string;
  name: string;
  /** "$5 a month", "$8–$10 a month", with " · Deleted" after it for a deleted tier. Empty for "No tier". */
  cost: string;
  /** Kept after PayPal fees, in dollars with cents. */
  raised: number;
}

/**
 * Earned by tier: money kept in the range from payments carrying each tier's id, most to least. A deleted
 * tier keeps its row only if it earned something; "Gifted memberships" (gift rows have no tier) and "No tier"
 * (unmatched payments) each have a row when above $0, so the rows add up to Raised.
 */
export function tierEarnedRows(data: PaymentsData, r: Range): TierEarnedRow[] {
  const rows: TierEarnedRow[] = tierRows(data, r)
    .filter((t) => !t.archived || t.raised !== 0)
    .map((t) => ({ key: t.id, name: t.name, cost: t.archived ? `${t.priceText} · Deleted` : t.priceText, raised: t.raised }));
  const gifted = giftedRaised(data, r);
  const none = noTierRaised(data, r);
  return [
    ...rows,
    ...(gifted !== 0 ? [{ key: "gifted", name: "Gifted memberships", cost: "", raised: gifted }] : []),
    ...(none !== 0 ? [{ key: "none", name: "No tier", cost: "", raised: none }] : []),
  ].sort((a, b) => b.raised - a.raised);
}
