/*
 * Admin notifications: the contract between the database and the panel. The database stores facts
 * (`admin_notifications.data`); the panel turns each one into words, an icon and a link (copy.ts), so
 * the backend never sends display text. Backend: docs/backend/notifications.md.
 *
 * `type` is also the key of the matching email alert in Settings, so the panel and the alerts are one list.
 */

/** Every kind of notification, in the order Settings groups them. Matches the database's check constraint. */
export const NOTIFICATION_TYPES = [
  "outboxWaiting",
  "outboxPastDue",
  "outboxFailed",
  "paymentDeclined",
  "paymentsStopped",
  "paymentUnmatched",
  "refunds",
  "paymentReceived",
  "memberJoins",
  "cancels",
  "pausesOrTierChanges",
  "unsubscribes",
  "referralJoins",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** A person the notification is about. `id` is `people.id`, used to link to them in the member directory. */
export interface PersonRef {
  id: string;
  name: string;
}

/** Money in cents, so the panel formats it. */
export type Cents = number;

/** What each type carries. Only facts; the panel writes the sentence. */
export interface NotificationData {
  /** Written when any email waiting for review is due within 2 days. `count` is every email waiting, due soon or not, because they're reviewed together. */
  outboxWaiting: { count: number };
  /** Review emails whose send day passed without approval. */
  outboxPastDue: { count: number };
  /** Sends that failed their third try today. */
  outboxFailed: { count: number };
  /** One declined card. */
  paymentDeclined: { person: PersonRef };
  /** PayPal stopped someone's payments after 2 declines. */
  paymentsStopped: { person: PersonRef };
  /** A payment that couldn't be matched to a person. */
  paymentUnmatched: { amount: Cents; paymentId: string };
  /** `refund`: SDC gave the money back. `reversal`: the payer disputed it with PayPal or their bank. */
  refunds: { person: PersonRef; amount: Cents; kind: "refund" | "reversal" };
  /** One payment received from a member. */
  paymentReceived: { person: PersonRef; amount: Cents };
  /** `source` is the signup link's event name, if they came from one. A referred join is `referralJoins` instead. */
  memberJoins: { person: PersonRef; source?: string };
  cancels: { person: PersonRef; reason?: string };
  /** `until` is yyyy-mm-dd for a pause; `tier` is the new tier's name for a change. */
  pausesOrTierChanges: { person: PersonRef } & ({ change: "paused"; until: string } | { change: "tier"; tier: string });
  unsubscribes: { person: PersonRef };
  referralJoins: { person: PersonRef; referrer: PersonRef };
}

type Variant<K extends NotificationType> = {
  id: string;
  type: K;
  /** UTC ISO 8601. When it happened, or when the situation last grew (one more email waiting). */
  occurredAt: string;
  data: NotificationData[K];
};

export type AdminNotification = { [K in NotificationType]: Variant<K> }[NotificationType];

/** One page of the panel's list: notifications that aren't done, newest first. */
export interface NotificationsPage {
  notifications: AdminNotification[];
  /** This admin's last look at the panel (UTC ISO), or null if never. Newer notifications show as new. */
  seenAt: string | null;
  /** Pass back to get the next page; null on the last page. */
  nextCursor: string | null;
}

/**
 * Where the panel gets its data. The admin portal passes server actions (source.ts); the design screens
 * pass an in-memory demo. Every call can fail (a dropped connection, a signed-out session): the panel
 * says so and keeps what it has.
 */
export interface NotificationsSource {
  /** The red count on the bell. */
  loadNewCount(): Promise<number>;
  /** Opening the panel: the first page, and this admin has now seen everything on it and older. */
  openPanel(): Promise<NotificationsPage>;
  /** The pages after the first. Reads only. */
  loadPage(cursor: string): Promise<NotificationsPage>;
  /** Done is shared by every admin; `false` is Undo. */
  setDone(id: string, done: boolean): Promise<void>;
}
