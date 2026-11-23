import { decodeCursor, encodeCursor } from "@/features/notifications/parse";
import type {
  AdminNotification,
  NotificationsPage,
  NotificationsSource,
  PersonRef,
} from "@/features/notifications/types";

/*
 * An in-memory stand-in for the backend, so the panel runs end to end: paging, seen and done. Every type
 * appears at least once, plus older joins and payments so there's more than one page to load.
 * The notifications lab (lab.ts) builds other data on the same source to show each edge case.
 */
export const HOUR = 3_600_000;
/** The same page size as the server actions (src/features/notifications/actions.ts). */
const PAGE_SIZE = 15;
/** Pretend network time, so loading states show. */
const LATENCY_MS = 400;

export const ago = (hours: number) => new Date(Date.now() - hours * HOUR).toISOString();
export const p = (id: string, name: string): PersonRef => ({ id, name });

export function seed(): AdminNotification[] {
  const base: AdminNotification[] = [
    { id: "n1", type: "outboxWaiting", occurredAt: ago(1), data: { count: 2 } },
    { id: "n2", type: "memberJoins", occurredAt: ago(2), data: { person: p("amira", "Amira Khan"), source: "Ride for Refuge" } },
    { id: "n3", type: "paymentDeclined", occurredAt: ago(3), data: { person: p("sam", "Sam Lee") } },
    { id: "n4", type: "paymentDeclined", occurredAt: ago(3.2), data: { person: p("priya", "Priya Patel") } },
    { id: "n5", type: "referralJoins", occurredAt: ago(5), data: { person: p("leo", "Leo Chen"), referrer: p("priya", "Priya Patel") } },
    { id: "n6", type: "outboxPastDue", occurredAt: ago(25), data: { count: 1 } },
    { id: "n7", type: "outboxFailed", occurredAt: ago(25.1), data: { count: 3 } },
    { id: "n8", type: "cancels", occurredAt: ago(28), data: { person: p("tom", "Tom Becker"), reason: "moving away" } },
    { id: "n9", type: "paymentsStopped", occurredAt: ago(30), data: { person: p("marcus", "Marcus Lee") } },
    { id: "n10", type: "paymentReceived", occurredAt: ago(33), data: { person: p("ravi", "Ravi Shah"), amount: 2500 } },
    { id: "n11", type: "pausesOrTierChanges", occurredAt: ago(50), data: { person: p("lena", "Lena Ortiz"), change: "paused", until: "2027-02-22" } },
    { id: "n12", type: "refunds", occurredAt: ago(60), data: { person: p("dana", "Dana Wright"), amount: 2500, kind: "reversal" } },
    { id: "n13", type: "paymentUnmatched", occurredAt: ago(75), data: { amount: 5000, paymentId: "pay-8812" } },
    { id: "n14", type: "unsubscribes", occurredAt: ago(80), data: { person: p("jordan", "Jordan Park") } },
    { id: "n15", type: "pausesOrTierChanges", occurredAt: ago(96), data: { person: p("sami", "Sam Ito"), change: "tier", tier: "Gold" } },
  ];
  const names = ["Noah Kim", "Fatima Ali", "Ben Ortiz", "Chloe Martin", "Arjun Rao", "Mei Lin", "Owen Clark", "Sara Haddad", "Luca Rossi", "Ana Silva", "Kofi Mensah", "Ella Wong", "Ravi Gupta", "Zoe Taylor", "Yusuf Kaya", "Ivy Nguyen", "Theo Brown", "Nadia Aziz", "Hugo Laurent", "Maya Singh"];
  const older = names.map((name, i): AdminNotification => {
    const person = p(`older-${i}`, name);
    const occurredAt = ago(120 + i * 30);
    return i % 2
      ? { id: `o${i}`, type: "paymentReceived", occurredAt, data: { person, amount: 2500 } }
      : { id: `o${i}`, type: "memberJoins", occurredAt, data: { person } };
  });
  return [...base, ...older];
}

export interface DemoOptions {
  /** This admin's last look before the panel opens; null = never opened, so everything is new. */
  seenAt: () => string | null;
  /**
   * The daily run closing a notification on its own (done, by nobody) this long after the list first loads,
   * e.g. the Outbox emails got approved elsewhere. An open panel keeps showing it until it loads again.
   */
  closeByRun?: { id: string; afterMs: number };
}

const byNewest = (a: AdminNotification, b: AdminNotification) =>
  b.occurredAt.localeCompare(a.occurredAt) || b.id.localeCompare(a.id);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** An in-memory source with the same paging and cursor as the server actions. Data is built on first use. */
export function createDemoSource(build: () => AdminNotification[], options: DemoOptions): NotificationsSource {
  let store: AdminNotification[] | null = null;
  const done = new Set<string>();
  let seenAt: string | null = null;
  let closing = false;

  function db() {
    if (!store) {
      store = build();
      seenAt = options.seenAt();
    }
    return store;
  }

  return {
    async loadNewCount() {
      return db().filter((n) => !done.has(n.id) && (!seenAt || n.occurredAt > seenAt)).length;
    },
    // Like open_admin_notifications: the first page, and everything up to its newest is now seen.
    async openPanel() {
      const page = await pageAfter(null);
      const newest = page.notifications[0]?.occurredAt;
      if (newest && (!seenAt || newest > seenAt)) seenAt = newest;
      return page;
    },
    loadPage: (cursor) => pageAfter(cursor),
    async setDone(id, isDone) {
      if (isDone) done.add(id);
      else done.delete(id);
    },
  };

  async function pageAfter(cursor: string | null): Promise<NotificationsPage> {
    await wait(LATENCY_MS);
    const open = db()
      .filter((n) => !done.has(n.id))
      .sort(byNewest);
    const before = decodeCursor(cursor);
    const rest = before ? open.filter((n) => byNewest(n, { occurredAt: before.at, id: before.id } as AdminNotification) > 0) : open;
    const notifications = rest.slice(0, PAGE_SIZE);
    const last = notifications.at(-1);
    const close = options.closeByRun;
    if (close && !closing) {
      closing = true;
      setTimeout(() => done.add(close.id), close.afterMs);
    }
    return {
      notifications,
      seenAt,
      nextCursor: rest.length > PAGE_SIZE && last ? encodeCursor(last) : null,
    };
  }
}

/**
 * The design screens' stand-in for the server actions. `?notifications=empty` in the URL starts with none;
 * the notifications lab (NotificationsLab.tsx) offers that and every other edge case.
 */
export const demoNotifications: NotificationsSource = createDemoSource(
  () => {
    const empty = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("notifications") === "empty";
    return empty ? [] : seed();
  },
  { seenAt: () => ago(4) },
);
