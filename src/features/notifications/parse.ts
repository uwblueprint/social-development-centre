import { NOTIFICATION_TYPES, type AdminNotification, type NotificationType, type PersonRef } from "./types";

/*
 * Rows from admin_notifications_page() into AdminNotification. The database only checks that data is an
 * object, so each type's required facts are checked here: a row that's missing one (an old shape, a bad
 * write from a webhook) is left out of the list rather than breaking the panel.
 */

/** A row as the database functions return it. */
export interface NotificationRow {
  id: string;
  type: string;
  data: unknown;
  occurred_at: string;
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isPerson = (v: unknown): v is PersonRef => isObject(v) && typeof v.id === "string" && typeof v.name === "string";
const isCount = (v: unknown) => typeof v === "number" && Number.isInteger(v) && v >= 0;
const isCents = (v: unknown) => typeof v === "number" && Number.isFinite(v);

const VALID: Record<NotificationType, (d: Record<string, unknown>) => boolean> = {
  outboxWaiting: (d) => isCount(d.count),
  outboxPastDue: (d) => isCount(d.count),
  outboxFailed: (d) => isCount(d.count),
  paymentDeclined: (d) => isPerson(d.person),
  paymentsStopped: (d) => isPerson(d.person),
  paymentUnmatched: (d) => isCents(d.amount) && typeof d.paymentId === "string",
  refunds: (d) => isPerson(d.person) && isCents(d.amount) && (d.kind === "refund" || d.kind === "reversal"),
  paymentReceived: (d) => isPerson(d.person) && isCents(d.amount),
  memberJoins: (d) => isPerson(d.person) && (d.source === undefined || typeof d.source === "string"),
  cancels: (d) => isPerson(d.person) && (d.reason === undefined || typeof d.reason === "string"),
  pausesOrTierChanges: (d) =>
    isPerson(d.person) &&
    ((d.change === "paused" && typeof d.until === "string") || (d.change === "tier" && typeof d.tier === "string")),
  unsubscribes: (d) => isPerson(d.person),
  referralJoins: (d) => isPerson(d.person) && isPerson(d.referrer),
};

export function parseNotification(row: NotificationRow): AdminNotification | null {
  if (!(NOTIFICATION_TYPES as readonly string[]).includes(row.type)) return null;
  const type = row.type as NotificationType;
  if (!isObject(row.data) || !VALID[type](row.data)) {
    console.warn(`[notifications] skipped ${row.type} ${row.id}: its data doesn't have the expected facts`);
    return null;
  }
  return { id: row.id, type, occurredAt: new Date(row.occurred_at).toISOString(), data: row.data } as AdminNotification;
}

/** The cursor for the next page: the last row's time and id (ties in time are split by id). */
export function encodeCursor(n: { occurredAt: string; id: string }) {
  return `${n.occurredAt}|${n.id}`;
}
// The time is passed back exactly as the database sent it (microseconds and all), never through a Date.

export function decodeCursor(cursor: string | null): { at: string; id: string } | null {
  if (!cursor) return null;
  const [at, id] = cursor.split("|");
  if (!at || !id || Number.isNaN(Date.parse(at))) return null;
  return { at, id };
}
