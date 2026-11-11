/*
 * Demo data and the typed contract the member directory screens read. No server calls: the real feature
 * replaces `demoMembers` with queries (see docs/backend/member-directory.md).
 */

export type MembershipKind = "paid" | "complimentary" | "gifted" | "sponsored";
export type MemberStatus = "member" | "waiting" | "ended";
export type PaymentMethod = "etransfer" | "cash" | "online";
/** Badge categories from the kit (blue, violet, fuchsia, pink, lime); `undefined` is the neutral badge. */
export type TagColor = 1 | 2 | 3 | 4 | 5 | undefined;

/** The one running note on a member: staff edit it in place. */
export interface Note {
  text: string;
  updatedAt: string;
  by: string;
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  note?: string;
  /** Set when this payment covered someone else's membership. */
  giftFor?: string;
}

export type ActivityKind = "email" | "referral" | "event" | "joined" | "tag" | "ended" | "status";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  at: string;
  detail?: string;
  /** Emails only: the message as sent, without the footer. */
  body?: string;
}

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: MemberStatus;
  kind: MembershipKind;
  /** Yearly amount for paid memberships. */
  amount?: number;
  joinedAt: string;
  endsAt: string;
  subscribed: boolean;
  tags: string[];
  note?: Note;
  payments: Payment[];
  activity: ActivityItem[];
  howJoined: string;
  address?: string;
  /** Intake form answers, worded as the form's choices. Every question is optional. */
  intake?: { interests?: string[]; ways?: string[]; location?: string; time?: string; hopes?: string; answeredAt: string };
  referredBy?: string;
  referrals: string[];
}

/** The demo's "today", fixed so server and client render the same dates. */
export const TODAY = "2026-10-24";

export const methodLabel: Record<PaymentMethod, string> = {
  etransfer: "E-transfer",
  cash: "Cash or cheque",
  online: "Online",
};

export const kindLabel: Record<MembershipKind, string> = {
  paid: "Paid",
  complimentary: "Complimentary",
  gifted: "Gifted",
  sponsored: "Sponsored",
};

export const statusLabel: Record<MemberStatus, string> = {
  member: "Member",
  waiting: "Waiting for payment",
  ended: "Membership ended",
};

/* ---------- dates and money ---------- */

const toDate = (iso: string) => new Date(`${iso}T00:00:00Z`);
const toIso = (d: Date) => d.toISOString().slice(0, 10);

export function addMonths(iso: string, months: number): string {
  const d = toDate(iso);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return toIso(d);
}

export function addDays(iso: string, days: number): string {
  const d = toDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toIso(d);
}

/** Days from `a` to `b`. */
export const diffDays = (a: string, b: string) => Math.round((toDate(b).getTime() - toDate(a).getTime()) / 86400000);

export function formatDate(iso: string, withYear = true): string {
  return toDate(iso).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: withYear ? "numeric" : undefined,
    timeZone: "UTC",
  });
}

export function formatMoney(n: number): string {
  const cents = n % 1 !== 0;
  return `$${n.toLocaleString("en-CA", { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 })}`;
}

export const fullName = (m: Pick<Member, "firstName" | "lastName" | "email">) =>
  [m.firstName, m.lastName].filter(Boolean).join(" ") || m.email;

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** The end date only needs a word when it's close (30 days) or past. */
export function endNotice(endsAt: string): { text: string; tone: "warning" | "danger" } | null {
  if (!endsAt) return null;
  const n = diffDays(TODAY, endsAt);
  if (n < 0) return { text: `Ended ${plural(-n, "day")} ago`, tone: "danger" };
  if (n === 0) return { text: "Ends today", tone: "warning" };
  if (n <= 30) return { text: `Ends in ${plural(n, "day")}`, tone: "warning" };
  return null;
}

/** The panel's membership headline: how long is left, or that it has ended. */
export function endHeadline(endsAt: string): string {
  const n = diffDays(TODAY, endsAt);
  if (n < 0) return "Ended";
  if (n === 0) return "Ends today";
  return `Ends in ${plural(n, "day")}`;
}

export const totalPaid = (m: Member) => m.payments.reduce((sum, p) => sum + p.amount, 0);

/** The "Joined" activity title, from how they joined: "Joined via Website", "Joined with a gift from Helen Brooks". */
export function joinedTitle(howJoined: string): string {
  if (howJoined.startsWith("Gift from ")) return `Joined with a gift from ${howJoined.slice("Gift from ".length)}`;
  if (howJoined === "Added by an admin") return "Added by an admin";
  return `Joined via ${howJoined}`;
}

/* ---------- demo members ---------- */

let seq = 0;
const id = (p: string) => `${p}${++seq}`;
const ago = (days: number) => addDays(TODAY, -days);

const welcome = (first: string, at: string): ActivityItem => ({
  id: id("a"),
  kind: "email",
  title: `Welcome to SDC, ${first}`,
  at,
  body: `Hi ${first},\n\nWelcome to the Social Development Centre. You're now part of a community that shows up for Waterloo Region.\n\nWe'll send you a short note each month with ways to get involved.\n\nThe SDC team`,
});

function member(
  first: string,
  last: string,
  o: Partial<Member> & { joinedDaysAgo: number; endsAt?: string },
): Member {
  const joinedAt = ago(o.joinedDaysAgo);
  const kind = o.kind ?? "paid";
  const endsAt = o.endsAt ?? addMonths(joinedAt, 12);
  const email = o.email ?? `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, "") + "@example.com";
  return {
    id: id("m"),
    firstName: first,
    lastName: last,
    email,
    status: o.status ?? (endsAt < TODAY ? "ended" : "member"),
    kind,
    amount: o.amount,
    joinedAt,
    endsAt,
    subscribed: o.subscribed ?? true,
    tags: o.tags ?? [],
    note: o.note,
    payments: o.payments ?? [],
    activity: [
      ...(o.activity ?? []),
      welcome(first, joinedAt),
      { id: id("a"), kind: "joined", title: joinedTitle(o.howJoined ?? "Website"), at: joinedAt },
    ],
    howJoined: o.howJoined ?? "Website",
    address: o.address,
    intake: o.intake,
    referredBy: o.referredBy,
    referrals: o.referrals ?? [],
  };
}

const pay = (amount: number, daysAgo: number, method: PaymentMethod = "etransfer", extra: Partial<Payment> = {}): Payment => ({
  id: id("p"),
  amount,
  date: ago(daysAgo),
  method,
  ...extra,
});

/** One monthly member email per month for the last `months` months, so long timelines have something to page through. */
const monthlies = (months: number): ActivityItem[] =>
  Array.from({ length: months }, (_, i) => {
    const at = addMonths(ago(2), -i);
    const month = toDate(at).toLocaleDateString("en-CA", { month: "long", timeZone: "UTC" });
    return {
      id: id("a"),
      kind: "email",
      title: `SDC this month: ${month}`,
      at,
      body: `Hi,\n\nHere's what SDC is working on this ${month}, and a few ways to get involved.\n\nThe SDC team`,
    };
  });

export const demoTags: { name: string; color: TagColor }[] = [
  { name: "Board", color: 1 },
  { name: "Volunteer", color: 5 },
  { name: "Leadership donor", color: 2 },
  { name: "Ride for Refuge", color: 4 },
  { name: "Do not contact", color: undefined },
];

export const demoMembers: Member[] = [
  member("Dan", "Petrov", {
    joinedDaysAgo: 880,
    endsAt: addMonths(ago(150), 12),
    amount: 60,
    tags: ["Board"],
    howJoined: "Existing list",
    address: "39 Queen St S, Kitchener, ON",
    note: { text: "Called to thank him for the referrals. Asked after his daughter, who starts at Conestoga in the fall.", updatedAt: ago(11), by: "Suhanya" },
    payments: [pay(60, 150, "cash"), pay(60, 515, "cash")],
    referrals: ["Tara Novak", "Sam Whitby"],
    intake: { interests: ["Homelessness and encampments"], answeredAt: ago(870) },
    activity: [
      { id: id("a"), kind: "referral", title: "Tara Novak joined from their invite", at: ago(3) },
      { id: id("a"), kind: "email", title: "Tara joined because of you", at: ago(3), body: "Hi Dan,\n\nTara just became an SDC member through your invite. Thank you. This is how we grow.\n\nThe SDC team" },
      { id: id("a"), kind: "referral", title: "Sam Whitby joined from their invite", at: ago(12) },
    ],
  }),
  member("Kira", "Sandhu", {
    joinedDaysAgo: 765,
    endsAt: ago(400),
    amount: 60,
    payments: [pay(60, 765)],
    activity: [{ id: id("a"), kind: "ended", title: "Membership ended", at: ago(400) }],
  }),
  member("Leo", "Fontaine", {
    joinedDaysAgo: 1196,
    endsAt: ago(100),
    amount: 15,
    payments: [pay(15, 465, "cash")],
    activity: [{ id: id("a"), kind: "ended", title: "Membership ended", at: ago(100) }],
  }),
  member("Farid", "Nasser", { joinedDaysAgo: 340, endsAt: addDays(TODAY, 12), amount: 25, payments: [pay(25, 340)], tags: ["Volunteer"] }),
  member("Grace", "Lindqvist", {
    joinedDaysAgo: 720,
    endsAt: addDays(TODAY, 25),
    amount: 30,
    payments: [pay(30, 355), pay(30, 720)],
    activity: [
      {
        id: id("a"),
        kind: "email",
        title: "Can we count on you for another year?",
        at: ago(4),
        detail: "Sent by Suhanya",
        body: "Hi Grace,\n\nYour SDC membership ends next month. Would you like to renew? If anything's made it hard to stay involved, just reply and tell me.\n\nSuhanya",
      },
    ],
  }),
  member("Fay", "Underhill", {
    joinedDaysAgo: 6,
    kind: "complimentary",
    tags: ["Ride for Refuge"],
    howJoined: "Ride for Refuge",
    intake: {
      interests: ["Tenant rights and evictions", "Disability rights and accessibility", "Other: Food security"],
      ways: ["Meet people at community lunches or events", "Volunteer my time or skills"],
      location: "Waterloo",
      time: "A few hours for an event or activity",
      hopes: "I'd like to meet neighbours who care about housing, and help out at events where I can.",
      answeredAt: ago(5),
    },
  }),
  member("Bea", "Morland", { joinedDaysAgo: 6, kind: "complimentary", tags: ["Ride for Refuge"], howJoined: "Ride for Refuge" }),
  member("Xavier", "Roy", { joinedDaysAgo: 6, kind: "complimentary", tags: ["Ride for Refuge"], howJoined: "Ride for Refuge", subscribed: false }),
  member("Tomas", "Rivera", { joinedDaysAgo: 5, kind: "gifted", howJoined: "Gift from Helen Brooks" }),
  member("Margaret", "Ellison", {
    joinedDaysAgo: 400,
    amount: 1200,
    endsAt: addMonths(ago(7), 12),
    tags: ["Leadership donor", "Board"],
    payments: [pay(1200, 7), pay(1200, 400)],
    note: { text: "Birthday is March 3. Prefers email over events.", updatedAt: ago(30), by: "Rithika" },
    activity: monthlies(13),
  }),
  member("Priya", "Raman", { joinedDaysAgo: 6, amount: 25, payments: [pay(25, 6)], howJoined: "Fall workshop" }),
  member("Jordan", "Lee", { joinedDaysAgo: 1, amount: 25, status: "waiting" }),
  member("Quinn", "Harlow", { joinedDaysAgo: 90, kind: "sponsored" }),
  member("Noah", "Brandt", { joinedDaysAgo: 21, amount: 10, payments: [pay(10, 21, "cash")], howJoined: "Community lunch" }),
];
