/* Demo data for the Settings screen. No backend: everything lives in memory. */

export interface Settings {
  /** One field for the whole name; saved as a first and last name with splitName. */
  name: string;
  replyTo: string;
  /** The email footer under every email, with its fixed unsubscribe and cancel links (src/features/email-footer). */
  footer: FooterDoc;
  alerts: Record<AlertKey, string[]>;
}

import type { NotificationType } from "@/features/notifications/types";
import { defaultFooterDoc, type FooterDoc } from "@/features/email-footer/doc";

/** One email alert per kind of notification (src/features/notifications/types.ts). */
export type AlertKey = NotificationType;

export type AlertGroup = "Outbox" | "Payments" | "Members";

export const ALERTS: {
  key: AlertKey;
  group: AlertGroup;
  label: string;
  /** Finishes "We'll email … when" in the confirmation. */
  when: string;
}[] = [
  { key: "outboxWaiting", group: "Outbox", label: "Email waiting for review", when: "an email is waiting for review in the Outbox" },
  { key: "outboxPastDue", group: "Outbox", label: "Email past due", when: "a review email is past due and won't send until it's approved" },
  { key: "outboxFailed", group: "Outbox", label: "Emails couldn't send", when: "an email couldn't send after 3 tries" },
  { key: "paymentDeclined", group: "Payments", label: "Card declined", when: "someone's card is declined" },
  { key: "paymentsStopped", group: "Payments", label: "Payments stopped", when: "someone's payments stop after 2 declined cards" },
  { key: "paymentUnmatched", group: "Payments", label: "Payment not matched", when: "a payment comes in that we can't match to a person" },
  { key: "refunds", group: "Payments", label: "Refund or chargeback", when: "a payment is refunded or reversed" },
  { key: "paymentReceived", group: "Payments", label: "Payment received", when: "a payment comes in" },
  { key: "memberJoins", group: "Members", label: "Someone joins", when: "someone joins" },
  { key: "cancels", group: "Members", label: "Membership cancelled", when: "someone cancels their membership" },
  { key: "pausesOrTierChanges", group: "Members", label: "Membership paused or changed", when: "someone pauses their membership or changes tier" },
  { key: "unsubscribes", group: "Members", label: "Unsubscribes from emails", when: "someone unsubscribes from emails" },
  { key: "referralJoins", group: "Members", label: "Referral joins", when: "someone joins from a referral" },
];

export const ALERT_GROUPS: AlertGroup[] = ["Outbox", "Payments", "Members"];

/** Each group is its own section on the page. */
export const ALERT_GROUP_TITLES: Record<AlertGroup, string> = {
  Outbox: "Outbox alerts",
  Payments: "Payment alerts",
  Members: "Member alerts",
};

/** Who an alert can go to: the people on the Admins page. */
export const ADMINS = [
  { name: "Suhanya Ketheeswaran", email: "suhanya@waterlooregion.org" },
  { name: "Sarah Ranco", email: "sarah@waterlooregion.org" },
  { name: "Jesse Huang", email: "jesse@uwblueprint.org" },
  { name: "Carolyn Zhang", email: "carolyn@uwblueprint.org" },
];

/** The address this admin signs in with. Admins can't change it: another admin removes and re-adds them. */
export const LOGIN_EMAIL = "suhanya@waterlooregion.org";

/** No addresses means the alert is off. */
export const SEED: Settings = {
  name: "Suhanya Ketheeswaran",
  replyTo: "suhanya@waterlooregion.org",
  footer: defaultFooterDoc(),
  alerts: {
    outboxWaiting: ["suhanya@waterlooregion.org"],
    outboxPastDue: ["suhanya@waterlooregion.org", "jesse@uwblueprint.org"],
    outboxFailed: ["suhanya@waterlooregion.org"],
    paymentDeclined: [],
    paymentsStopped: ["suhanya@waterlooregion.org"],
    paymentUnmatched: [],
    refunds: ["suhanya@waterlooregion.org"],
    paymentReceived: [],
    memberJoins: [],
    cancels: ["suhanya@waterlooregion.org"],
    pausesOrTierChanges: ["suhanya@waterlooregion.org"],
    unsubscribes: [],
    referralJoins: [],
  },
};

export function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

/**
 * The database keeps a first and a last name (`people.first_name`, `last_name`, both required). People type
 * their name once: the first word is the first name and the rest is the last name, so "Mary Ann de la Cruz"
 * saves as "Mary" and "Ann de la Cruz". Null when there's only one word.
 */
export function splitName(name: string): { firstName: string; lastName: string } | null {
  const [first, ...rest] = name.trim().split(/\s+/);
  if (!first || rest.length === 0) return null;
  return { firstName: first, lastName: rest.join(" ") };
}
