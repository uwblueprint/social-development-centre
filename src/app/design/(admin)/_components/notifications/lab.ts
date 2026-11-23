import type { AdminNotification, NotificationsSource } from "@/features/notifications/types";
import { NOTIFICATION_TYPES } from "@/features/notifications/types";
import { ago, createDemoSource, p, seed } from "./demo";

/*
 * The notifications lab: other data and timing for the same panel, so every edge case the backend can
 * produce can be designed. It never changes the panel; it only swaps the source the panel is given.
 */

/** What's in the list. One at a time. */
export const LAB_DATA = [
  { id: "mixed", label: "Mix of new and seen" },
  { id: "never-opened", label: "Never opened (everything new)" },
  { id: "all-seen", label: "Nothing new" },
  { id: "empty", label: "All caught up (empty)" },
  { id: "every-type", label: "One of each type" },
  { id: "counts", label: "1 email vs 3 emails" },
  { id: "long-text", label: "Very long names and titles" },
  { id: "unread-99", label: "99+ new on the bell" },
  { id: "many-pages", label: "Many pages" },
  { id: "closed-by-run", label: "Closed by the daily run" },
] as const;

/** How calls behave. Any mix. */
export const LAB_FAULTS = [
  { id: "slow", label: "Slow network (5 seconds)" },
  { id: "first-page-fails", label: "List fails to load" },
  { id: "next-page-fails", label: "Older ones fail to load" },
  { id: "done-fails", label: "Mark as done fails to save" },
  { id: "undo-fails", label: "Undo fails to save" },
] as const;

export type LabDataId = (typeof LAB_DATA)[number]["id"];
export type LabFaultId = (typeof LAB_FAULTS)[number]["id"];

/** Short notes under a choice, where the label alone doesn't say how to see it. */
export const LAB_NOTES: Partial<Record<LabDataId | LabFaultId, string>> = {
  "closed-by-run": "10 seconds after the list loads, the daily run closes the Outbox one. The open panel still shows it; close and reopen to see it gone.",
  "next-page-fails": "Scroll to the end of the list. Pair it with Many pages for more to scroll.",
  "undo-fails": "Mark one as done, then press Undo in the toast.",
};

const SLOW_MS = 5000;
/** How long a failing call takes to fail, so the row's exit plays first, as on a real network. */
const FAIL_MS = 800;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const offline = () => new Error("The lab made this call fail.");

/** Every type once, plus the second shape of the ones that have two (refund or reversal, pause or new tier, ...). */
function everyType(): AdminNotification[] {
  const all: AdminNotification[] = [
    { id: "t1", type: "outboxWaiting", occurredAt: ago(0.1), data: { count: 4 } },
    { id: "t2", type: "outboxPastDue", occurredAt: ago(0.5), data: { count: 2 } },
    { id: "t3", type: "outboxFailed", occurredAt: ago(1), data: { count: 3 } },
    { id: "t4", type: "paymentDeclined", occurredAt: ago(2), data: { person: p("sam", "Sam Lee") } },
    { id: "t5", type: "paymentsStopped", occurredAt: ago(3), data: { person: p("marcus", "Marcus Lee") } },
    { id: "t6", type: "paymentUnmatched", occurredAt: ago(4), data: { amount: 5000, paymentId: "pay-8812" } },
    { id: "t7", type: "refunds", occurredAt: ago(5), data: { person: p("dana", "Dana Wright"), amount: 2500, kind: "refund" } },
    { id: "t7b", type: "refunds", occurredAt: ago(5.5), data: { person: p("ola", "Ola Nowak"), amount: 1000, kind: "reversal" } },
    { id: "t8", type: "paymentReceived", occurredAt: ago(6), data: { person: p("ravi", "Ravi Shah"), amount: 2500 } },
    { id: "t9", type: "memberJoins", occurredAt: ago(8), data: { person: p("amira", "Amira Khan"), source: "Ride for Refuge" } },
    { id: "t9b", type: "memberJoins", occurredAt: ago(9), data: { person: p("noah", "Noah Kim") } },
    { id: "t10", type: "cancels", occurredAt: ago(26), data: { person: p("tom", "Tom Becker"), reason: "moving away" } },
    { id: "t10b", type: "cancels", occurredAt: ago(27), data: { person: p("ivy", "Ivy Nguyen") } },
    { id: "t11", type: "pausesOrTierChanges", occurredAt: ago(30), data: { person: p("lena", "Lena Ortiz"), change: "paused", until: "2027-02-22" } },
    { id: "t11b", type: "pausesOrTierChanges", occurredAt: ago(31), data: { person: p("sami", "Sam Ito"), change: "tier", tier: "Gold" } },
    { id: "t12", type: "unsubscribes", occurredAt: ago(50), data: { person: p("jordan", "Jordan Park") } },
    { id: "t13", type: "referralJoins", occurredAt: ago(80), data: { person: p("leo", "Leo Chen"), referrer: p("priya", "Priya Patel") } },
  ];
  // Kept honest: a new type in types.ts shows up here as a missing one.
  const missing = NOTIFICATION_TYPES.filter((t) => !all.some((n) => n.type === t));
  if (missing.length) console.warn(`Notifications lab: no example for ${missing.join(", ")}`);
  return all;
}

/** The count types at 1 and at more than 1, and a payment at $1 and at $1,234.50. */
function counts(): AdminNotification[] {
  return [
    { id: "c1", type: "outboxWaiting", occurredAt: ago(0.2), data: { count: 1 } },
    { id: "c2", type: "outboxPastDue", occurredAt: ago(0.4), data: { count: 1 } },
    { id: "c3", type: "outboxFailed", occurredAt: ago(0.6), data: { count: 1 } },
    { id: "c4", type: "outboxWaiting", occurredAt: ago(25), data: { count: 3 } },
    { id: "c5", type: "outboxPastDue", occurredAt: ago(26), data: { count: 3 } },
    { id: "c6", type: "outboxFailed", occurredAt: ago(27), data: { count: 3 } },
    { id: "c7", type: "paymentReceived", occurredAt: ago(48), data: { person: p("ravi", "Ravi Shah"), amount: 100 } },
    { id: "c8", type: "paymentUnmatched", occurredAt: ago(49), data: { amount: 123450, paymentId: "pay-1" } },
  ];
}

function longText(): AdminNotification[] {
  const long = p("long-1", "Maximiliana Alexandrina Featherstonehaugh-Montgomery-Oyelaran");
  const longer = p("long-2", "Bartholomew Christopherson-Vanderbilt-Nakamura-Abernathy");
  const unbroken = p("long-3", "Wolfeschlegelsteinhausenbergerdorff");
  return [
    { id: "l1", type: "referralJoins", occurredAt: ago(0.2), data: { person: long, referrer: longer } },
    { id: "l2", type: "memberJoins", occurredAt: ago(1), data: { person: unbroken, source: "Waterloo Region Community Foundation Annual Ride for Refuge Fundraiser and Family Picnic 2026" } },
    { id: "l3", type: "cancels", occurredAt: ago(2), data: { person: longer, reason: "We're moving across the country for a new job and won't be able to come to events anymore, but we loved being part of it" } },
    { id: "l4", type: "pausesOrTierChanges", occurredAt: ago(3), data: { person: long, change: "tier", tier: "Community Champion Plus (monthly, sliding scale, with family add-on)" } },
    { id: "l5", type: "refunds", occurredAt: ago(4), data: { person: unbroken, amount: 1_234_567, kind: "reversal" } },
    { id: "l6", type: "outboxWaiting", occurredAt: ago(5), data: { count: 1248 } },
    { id: "l7", type: "paymentsStopped", occurredAt: ago(6), data: { person: longer } },
    { id: "l8", type: "paymentUnmatched", occurredAt: ago(24 * 40), data: { amount: 99_999_999, paymentId: "pay-long" } },
  ];
}

/** `n` notifications a few minutes apart, cycling through the person types. */
function many(n: number, prefix: string): AdminNotification[] {
  const first = ["Noah", "Fatima", "Ben", "Chloe", "Arjun", "Mei", "Owen", "Sara", "Luca", "Ana", "Kofi", "Ella"];
  const last = ["Kim", "Ali", "Ortiz", "Martin", "Rao", "Lin", "Clark", "Haddad", "Rossi", "Silva"];
  return Array.from({ length: n }, (_, i): AdminNotification => {
    const person = p(`${prefix}-${i}`, `${first[i % first.length]} ${last[(i * 7) % last.length]}`);
    const occurredAt = ago(0.05 + i * 0.4);
    const id = `${prefix}${i}`;
    switch (i % 4) {
      case 0:
        return { id, type: "memberJoins", occurredAt, data: { person } };
      case 1:
        return { id, type: "paymentReceived", occurredAt, data: { person, amount: 2500 } };
      case 2:
        return { id, type: "paymentDeclined", occurredAt, data: { person } };
      default:
        return { id, type: "unsubscribes", occurredAt, data: { person } };
    }
  });
}

/** A fresh in-memory source for one data choice. Marking done and seen last until the choice changes. */
export function labSource(data: LabDataId): NotificationsSource {
  switch (data) {
    case "mixed":
      return createDemoSource(seed, { seenAt: () => ago(4) });
    case "never-opened":
      return createDemoSource(seed, { seenAt: () => null });
    case "all-seen":
      return createDemoSource(seed, { seenAt: () => new Date().toISOString() });
    case "empty":
      return createDemoSource(() => [], { seenAt: () => null });
    case "every-type":
      return createDemoSource(everyType, { seenAt: () => ago(7) });
    case "counts":
      return createDemoSource(counts, { seenAt: () => ago(12) });
    case "long-text":
      return createDemoSource(longText, { seenAt: () => ago(2.5) });
    case "unread-99":
      return createDemoSource(() => many(150, "u"), { seenAt: () => null });
    case "many-pages":
      return createDemoSource(() => many(200, "m"), { seenAt: () => ago(2) });
    case "closed-by-run":
      return createDemoSource(seed, { seenAt: () => ago(4), closeByRun: { id: "n1", afterMs: 10_000 } });
  }
}

/** Wraps a source so its calls are slow or fail, as switched on in the lab. */
export function withFaults(source: NotificationsSource, faults: ReadonlySet<LabFaultId>): NotificationsSource {
  if (faults.size === 0) return source;
  const slow = () => (faults.has("slow") ? wait(SLOW_MS) : Promise.resolve());
  return {
    loadNewCount: () => source.loadNewCount(),
    async openPanel() {
      await slow();
      if (faults.has("first-page-fails")) {
        await wait(FAIL_MS);
        throw offline();
      }
      return source.openPanel();
    },
    async loadPage(cursor) {
      await slow();
      if (faults.has("next-page-fails")) {
        await wait(FAIL_MS);
        throw offline();
      }
      return source.loadPage(cursor);
    },
    async setDone(id, done) {
      await slow();
      if (faults.has(done ? "done-fails" : "undo-fails")) {
        await wait(FAIL_MS);
        throw offline();
      }
      return source.setDone(id, done);
    },
  };
}
