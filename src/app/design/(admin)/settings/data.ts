/* Demo data for the Settings screen. No backend: everything lives in memory. */

export interface Settings {
  firstName: string;
  lastName: string;
  replyTo: string;
  /** The sign-off that closes every email: a name and SDC's mailing address. Links are added for you. */
  signature: string;
  alerts: Record<AlertKey, string[]>;
}

export type AlertKey = "memberJoins" | "unsubscribes" | "cancels" | "outboxWaiting" | "outboxPastDue" | "adminJoins";

export const ALERTS: {
  key: AlertKey;
  label: string;
  /** Shown beside the label. */
  detail?: string;
  /** Finishes "We'll email … when" in the confirmation. */
  when: string;
}[] = [
  { key: "memberJoins", label: "Member joins", when: "a member joins" },
  { key: "unsubscribes", label: "Email unsubscribes", when: "a member unsubscribes from emails" },
  { key: "cancels", label: "Membership cancellation", when: "a member cancels their membership" },
  {
    key: "outboxWaiting",
    label: "Email waiting in Outbox",
    detail: "48 hours prior",

    when: "an email is waiting for review in the Outbox",
  },
  {
    key: "outboxPastDue",
    label: "Email past due in Outbox",

    when: "an email is past due in the Outbox",
  },
  { key: "adminJoins", label: "New admin joins", when: "a new admin joins" },
];

/** Who an alert can go to: the people on the Admins page. */
export const ADMINS = [
  { name: "Suhanya Ketheeswaran", email: "suhanya@waterlooregion.org" },
  { name: "Sarah Ranco", email: "sarah@waterlooregion.org" },
  { name: "Jesse Huang", email: "jesse@uwblueprint.org" },
  { name: "Carolyn Zhang", email: "carolyn@uwblueprint.org" },
];

/** No addresses means the alert is off. */
export const SEED: Settings = {
  firstName: "Suhanya",
  lastName: "Ketheeswaran",
  replyTo: "suhanya@waterlooregion.org",
  signature:
    "Warm regards,\nSuhanya from Social Development Centre\nWaterloo Region Community Foundation\n43 Shantz Ave, Kitchener, ON N2G 1G7",
  alerts: {
    memberJoins: [],
    unsubscribes: [],
    cancels: ["suhanya@waterlooregion.org"],
    outboxWaiting: ["suhanya@waterlooregion.org"],
    outboxPastDue: ["suhanya@waterlooregion.org", "jesse@uwblueprint.org"],
    adminJoins: [],
  },
};

export function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}
