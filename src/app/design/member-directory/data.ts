/*
 * Demo data and the typed contract the member directory screens read. No server calls: the real feature
 * replaces `demoMembers` with queries (see docs/backend/member-directory.md).
 */

import type { TagColor as KitTagColor } from "@/components/ui/Tag";
import {
  DEMO_EVENTS,
  INTAKE_TIMES,
  INTAKE_TOPICS,
  INTAKE_TOPIC_OTHERS,
  INTAKE_WAYS,
  INTAKE_WAY_OTHERS,
  INTAKE_HOPES,
  NOTE_TEXTS,
  FIRST_NAMES,
  LAST_NAMES,
  PLACES,
  STREETS,
  agmMail,
  annualReportMail,
  comeBackMail,
  endedMail,
  eventReminderMail,
  inviteMail,
  monthlyMail,
  mulberry32,
  personalMail,
  receiptMail,
  referralMail,
  renewalReminderMail,
  thanksMail,
  volunteerAskMail,
  welcomeBackMail,
  welcomeMail,
  type Mail,
} from "./demoHistory";

export type MembershipKind = "paid" | "complimentary" | "gifted" | "sponsored";
export type MemberStatus = "member" | "waiting" | "ended";
export type PaymentMethod = "etransfer" | "cash" | "online";
/** The kit's tag colours; `undefined` is the neutral grey tag. */
export type TagColor = KitTagColor | undefined;

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
  /** When each tag was added (ISO date), by tag name. Optional: without it, the tag activity and then array order decide. */
  tagAddedAt?: Record<string, string>;
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

/**
 * A member's tags, newest first. A tag's added date is the latest of its `tagAddedAt` entry and its "Tagged X" activity;
 * tags with no date (or the same date) fall back to array order, where the last item is the newest.
 */
export function tagsByRecency(m: Pick<Member, "tags" | "tagAddedAt" | "activity">): string[] {
  const dateOf = (t: string) => {
    const dates = m.activity.filter((a) => a.kind === "tag" && !a.title.startsWith("Removed") && a.title.endsWith(t)).map((a) => a.at);
    if (m.tagAddedAt?.[t]) dates.push(m.tagAddedAt[t]);
    return dates.sort().pop() ?? "";
  };
  return m.tags
    .map((t, i) => ({ t, i, at: dateOf(t) }))
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : b.i - a.i))
    .map((x) => x.t);
}

export const totalPaid = (m: Member) => m.payments.reduce((sum, p) => sum + p.amount, 0);

/** The "Joined" activity title, from how they joined: "Joined via Website", "Joined with a gift from Helen Brooks". */
export function joinedTitle(howJoined: string): string {
  if (howJoined.startsWith("Gift from ")) return `Joined with a gift from ${howJoined.slice("Gift from ".length)}`;
  if (howJoined === "Added by an admin") return "Added by an admin";
  return `Joined via ${howJoined}`;
}


/* ---------- demo members ----------
 * Everything below runs once at module load. A seeded generator (no Math.random) makes the same ~220 people on the server and in the
 * browser: a few hand-written members with years of history, then generated ones with shorter histories built by the same code.
 */

export const demoTags: { name: string; color: TagColor }[] = [
  { name: "Board", color: "sky" },
  { name: "Volunteer", color: "emerald" },
  { name: "Leadership donor", color: "stone" },
  { name: "Ride for Refuge", color: "amber" },
  { name: "Do not contact", color: undefined },
  { name: "Community lunch regular", color: "amber" },
  { name: "Tenant organizer", color: "rose" },
  { name: "Speaker", color: "rose" },
  { name: "Student", color: "sky" },
  { name: "Local business", color: "stone" },
  { name: "Faith community", color: undefined },
  { name: "Media contact", color: undefined },
];

const rand = mulberry32(20261024);
const int = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));
const chance = (p: number) => rand() < p;
const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)];
function weighted<T>(xs: readonly (readonly [T, number])[]): T {
  let r = rand() * xs.reduce((s, x) => s + x[1], 0);
  for (const [v, w] of xs) {
    r -= w;
    if (r <= 0) return v;
  }
  return xs[xs.length - 1][0];
}
/** `n` different items, in a random order. */
function sample<T>(xs: readonly T[], n: number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

const counters = { m: 0, a: 0, p: 0 };
const nid = (p: "m" | "a" | "p") => `${p}${++counters[p]}`;
const ago = (days: number) => addDays(TODAY, -days);
const minD = (a: string, b: string) => (a < b ? a : b);
const clamp = (d: string) => minD(d, TODAY);

/** The first anniversary of `start` after today: where an auto-renewing membership currently ends. */
function activeEnd(start: string): string {
  let k = 1;
  while (addMonths(start, 12 * k) <= TODAY) k++;
  return addMonths(start, 12 * k);
}

/** Yearly renewal dates in [start, end), never in the future. */
function anniversaries(start: string, end: string): string[] {
  const out: string[] = [];
  for (let k = 0; ; k++) {
    const d = addMonths(start, 12 * k);
    if (d >= end || d > TODAY) break;
    out.push(d);
  }
  return out;
}

type Intake = NonNullable<Member["intake"]>;

/**
 * Answers to the Ride for Refuge intake form (src/features/intake): ranked topics, ways to connect, location, time and hopes,
 * all optional, in the form's own wording. People answer in October 2026, when the form launched, or just after they join.
 */
function makeIntake(joinedAt: string): Intake {
  const answeredAt = joinedAt >= "2026-10-01" ? clamp(addDays(joinedAt, int(0, 3))) : addDays("2026-10-01", int(0, diffDays("2026-10-01", TODAY)));
  const out: Intake = { answeredAt };
  if (!chance(0.08)) {
    const n = weighted([[1, 25], [2, 30], [3, 25], [4, 12], [5, 5], [6, 3]] as const);
    out.interests = sample(INTAKE_TOPICS, n);
    if (chance(0.1)) out.interests.push(`Other: ${pick(INTAKE_TOPIC_OTHERS)}`);
  }
  if (!chance(0.08)) {
    const n = weighted([[1, 45], [2, 30], [3, 17], [4, 8]] as const);
    out.ways = sample(INTAKE_WAYS, n);
    if (chance(0.05)) out.ways.push(`Other: ${pick(INTAKE_WAY_OTHERS)}`);
  }
  if (chance(0.92)) out.location = weighted(PLACES.map((p) => [p.location, p.weight] as const));
  if (chance(0.9)) out.time = pick(INTAKE_TIMES);
  if (chance(0.55)) out.hopes = pick(INTAKE_HOPES);
  return out;
}

interface Spec {
  first: string;
  last: string;
  email?: string;
  kind?: MembershipKind;
  /** Yearly amount for each year of paid membership; the last one repeats. */
  amounts?: number[];
  joinedAt: string;
  status?: MemberStatus;
  /** Years the membership ran before it ended. */
  years?: number;
  /** Left after `years`, then came back on `rejoinedAt`. */
  lapse?: { years: number; rejoinedAt: string };
  firstMethod?: PaymentMethod;
  howJoined?: string;
  address?: string;
  intake?: Intake;
  note?: Note;
  /** Tag name to the date it was added. */
  tags?: Record<string, string>;
  /** When they unsubscribed or were marked do not contact: no member emails after this. */
  mutedAt?: string;
  /** 0 to 1: how many of the monthly updates and invitations they were sent. */
  density?: number;
  /** 0 to 1: how often they come to events. */
  engage?: number;
  /** Personal notes from Suhanya. */
  personal?: number;
  /** Keep the history to about this many items (routine emails and older events go first). */
  cap?: number;
  extra?: Omit<ActivityItem, "id">[];
}

/** Items the generator may drop to keep a short history short. Everything else stays. */
const droppable = new Set<string>();

function build(s: Spec): Member {
  const memberId = nid("m");
  const { first, joinedAt } = s;
  const kind = s.kind ?? "paid";
  const amounts = s.amounts ?? [25];
  const periods: { start: string; end: string }[] = s.lapse
    ? [
        { start: joinedAt, end: addMonths(joinedAt, 12 * s.lapse.years) },
        { start: s.lapse.rejoinedAt, end: activeEnd(s.lapse.rejoinedAt) },
      ]
    : [{ start: joinedAt, end: s.years !== undefined ? addMonths(joinedAt, 12 * s.years) : activeEnd(joinedAt) }];
  const endsAt = periods[periods.length - 1].end;
  const status: MemberStatus = s.status ?? (endsAt < TODAY ? "ended" : "member");
  const density = s.density ?? 0.8;
  const engage = s.engage ?? 0.25;
  const volunteer = Boolean(s.tags && "Volunteer" in s.tags);
  const canMail = (d: string) => !s.mutedAt || d < s.mutedAt;

  const items: ActivityItem[] = [];
  const payments: Payment[] = [];
  const add = (k: ActivityKind, title: string, at: string, o: { detail?: string; body?: string; drop?: boolean } = {}) => {
    if (at > TODAY) return;
    const item: ActivityItem = { id: nid("a"), kind: k, title, at };
    if (o.detail) item.detail = o.detail;
    if (o.body) item.body = o.body;
    if (o.drop) droppable.add(item.id);
    items.push(item);
  };
  const mail = (m: Mail, at: string, o: { detail?: string; drop?: boolean } = {}) => add("email", m.title, at, { body: m.body, ...o });
  const paying = kind === "paid" && status !== "waiting";
  let yearIndex = 0;

  periods.forEach((p, pi) => {
    const last = pi === periods.length - 1;
    const ended = !last || status === "ended";
    const wEnd = minD(p.end, TODAY);

    if (pi === 0) {
      mail(welcomeMail(first, int(0, 2)), p.start);
      add("joined", joinedTitle(s.howJoined ?? "Website"), p.start);
      if (status === "waiting") add("status", "Waiting for payment", p.start);
    } else {
      add("status", "Rejoined SDC", p.start);
      mail(welcomeBackMail(first), p.start);
    }

    if (paying) {
      anniversaries(p.start, p.end).forEach((d, k) => {
        const amount = amounts[Math.min(yearIndex, amounts.length - 1)];
        const prev = amounts[Math.min(Math.max(yearIndex - 1, 0), amounts.length - 1)];
        payments.push({ id: nid("p"), amount, date: d, method: yearIndex === 0 && s.firstMethod ? s.firstMethod : "online" });
        mail(receiptMail(first, formatMoney(amount), formatDate(d), int(0, 1)), d, { drop: k > 0 });
        if (k > 0) {
          mail(thanksMail(first, k, int(0, 2)), d, { drop: true });
          const before = addDays(d, -14);
          if (before > p.start) mail(renewalReminderMail(first, formatMoney(amount), formatDate(d)), before, { drop: true });
          if (yearIndex > 0 && amount !== prev) add("status", `Changed to ${formatMoney(amount)} a year`, d);
        }
        yearIndex++;
      });
    }

    /* The monthly update: most months, the same text for everyone that month. */
    let cur = `${p.start.slice(0, 7)}-01`;
    while (cur <= wEnd) {
      const send = addDays(cur, int(3, 7));
      if (send > p.start && send <= wEnd && canMail(send) && chance(density)) {
        mail(monthlyMail(first, Number(cur.slice(0, 4)), Number(cur.slice(5, 7)) - 1), send, { drop: true });
      }
      cur = addMonths(cur, 1);
    }

    for (let y = Number(p.start.slice(0, 4)); y <= Number(wEnd.slice(0, 4)); y++) {
      const agm = `${y}-10-01`;
      if (agm > p.start && agm <= wEnd && canMail(agm) && chance(0.95)) mail(agmMail(first, y, int(0, 1)), agm, { drop: true });
      const report = `${y}-06-12`;
      if (report > p.start && report <= wEnd && canMail(report) && chance(density * 0.7)) mail(annualReportMail(first), report, { drop: true });
    }

    for (const e of DEMO_EVENTS) {
      if (e.date > wEnd) break;
      const via = s.howJoined === e.name && e.date <= p.start && diffDays(e.date, p.start) <= 45;
      if (e.date < p.start && !via) continue;
      const when = formatDate(e.date, false);
      const inviteAt = addDays(e.date, -12);
      const invited = inviteAt > p.start && canMail(inviteAt) && chance(density * 0.75);
      if (invited) mail(inviteMail(first, e, when, int(0, 2)), inviteAt, { drop: true });
      if (invited && chance(0.5)) mail(eventReminderMail(first, e, when, int(0, 3)), addDays(e.date, -1), { drop: true });
      const askAt = addDays(e.date, -21);
      if (e.ask && askAt > p.start && canMail(askAt) && chance(density * 0.45)) mail(volunteerAskMail(first, e, when, int(0, 1)), askAt, { drop: true });
      if (via || chance(engage * (volunteer ? 0.8 : 0.5))) {
        add("event", `Attended ${e.name}`, e.date, { detail: e.place === "online" ? "Online" : e.place[0].toUpperCase() + e.place.slice(1), drop: !via });
      }
    }

    if (ended && p.end <= TODAY) {
      add("ended", "Membership ended", p.end);
      mail(endedMail(first, formatDate(p.end)), p.end, { drop: true });
      if (chance(0.5)) mail(comeBackMail(first), addDays(p.end, 45), { drop: true });
    }
  });

  const span = diffDays(joinedAt, minD(endsAt, TODAY)) - 25;
  for (let i = 0; i < (s.personal ?? 0) && span > 0; i++) {
    mail(personalMail(first, int(0, 4)), addDays(joinedAt, 20 + int(0, span)), { detail: "Sent by Suhanya" });
  }

  const tagAddedAt: Record<string, string> = {};
  for (const [name, date] of Object.entries(s.tags ?? {})) {
    tagAddedAt[name] = date;
    add("tag", `Tagged ${name}`, date);
  }
  if (s.mutedAt) add("status", "Unsubscribed from member emails", s.mutedAt);
  for (const x of s.extra ?? []) add(x.kind, x.title, x.at, { detail: x.detail, body: x.body });

  return {
    id: memberId,
    firstName: first,
    lastName: s.last,
    email: s.email ?? `${first}.${s.last}`.toLowerCase().replace(/[^a-z.]/g, "") + "@example.com",
    status,
    kind,
    amount: kind === "paid" ? amounts[Math.min(Math.max(yearIndex - 1, 0), amounts.length - 1)] : undefined,
    joinedAt,
    endsAt,
    subscribed: !s.mutedAt,
    tags: Object.keys(s.tags ?? {}),
    tagAddedAt: Object.keys(tagAddedAt).length ? tagAddedAt : undefined,
    note: s.note,
    payments,
    activity: items,
    howJoined: s.howJoined ?? "Website",
    address: s.address,
    intake: s.intake,
    referrals: [],
  };
}

const byNewest = <T extends { at: string }>(a: T, b: T) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0);

/** Someone joined from this member's invite: the link on both sides, and a thank-you email. */
function wireReferral(referrer: Member, referred: Member) {
  referred.referredBy = fullName(referrer);
  referrer.referrals.push(fullName(referred));
  referrer.activity.push({ id: nid("a"), kind: "referral", title: `${fullName(referred)} joined from their invite`, at: referred.joinedAt });
  if (referrer.subscribed) {
    const m = referralMail(referrer.firstName, referred.firstName);
    referrer.activity.push({ id: nid("a"), kind: "email", title: m.title, at: referred.joinedAt, body: m.body });
  }
}

/** `giver` paid for `receiver`'s membership. */
function wireGift(giver: Member, receiver: Member) {
  giver.payments.push({ id: nid("p"), amount: giver.amount ?? 50, date: receiver.joinedAt, method: "online", note: "Gift membership", giftFor: fullName(receiver) });
  giver.payments.sort((a, b) => byNewest({ at: a.date }, { at: b.date }));
  giver.activity.push({ id: nid("a"), kind: "status", title: `Gave a membership to ${fullName(receiver)}`, at: receiver.joinedAt });
}

/** Keep a generated history to `cap` items by dropping routine emails at random. */
function trim(m: Member, cap: number) {
  const over = m.activity.length - cap;
  if (over <= 0) return;
  /* Older items are more likely to go, so the last few months stay complete. */
  const scored = m.activity.filter((a) => droppable.has(a.id)).map((a) => ({ id: a.id, score: rand() * (1 + diffDays(a.at, TODAY)) }));
  scored.sort((a, b) => b.score - a.score);
  const gone = new Set(scored.slice(0, over).map((x) => x.id));
  m.activity = m.activity.filter((a) => !gone.has(a.id));
}

/* ----- the hand-written people ----- */

const specs: Spec[] = [
  {
    first: "Dan", cap: 60,
    last: "Petrov",
    joinedAt: "2021-04-14",
    amounts: [30, 50, 60],
    tags: { Volunteer: "2021-09-20", Board: "2024-05-02" },
    howJoined: "Existing list",
    address: "39 Queen St S, Kitchener, ON",
    note: { text: "Called to thank him for the referrals. Asked after his daughter, who starts at Conestoga in the fall.", updatedAt: ago(11), by: "Suhanya" },
    intake: { interests: ["Homelessness, encampments, and ending chronic homelessness"], answeredAt: ago(8) },
    density: 0.85,
    engage: 0.45,
    personal: 4,
  },
  { first: "Kira", last: "Sandhu", joinedAt: ago(765), years: 1, amounts: [60], density: 0.7 },
  {
    first: "Leo", cap: 38,
    last: "Fontaine",
    joinedAt: ago(1196),
    years: 3,
    amounts: [15],
    note: { text: "Moved to Halifax in the summer. Said he'd like to rejoin if he's ever back in the region.", updatedAt: ago(100), by: "Suhanya" },
    personal: 1,
  },
  {
    first: "Farid", cap: 40,
    last: "Nasser",
    joinedAt: "2023-11-05",
    amounts: [25],
    tags: { Volunteer: ago(90), "Do not contact": ago(30), Board: ago(60) },
    mutedAt: ago(30),
    engage: 0.3,
    personal: 1,
  },
  {
    first: "Grace", cap: 52,
    last: "Lindqvist",
    joinedAt: "2022-11-18",
    amounts: [20, 20, 30],
    engage: 0.2,
    personal: 2,
    extra: [
      {
        kind: "email",
        title: "Can we count on you for another year?",
        at: ago(4),
        detail: "Sent by Suhanya",
        body: "Hi Grace,\n\nYour SDC membership ends next month. Would you like to renew? If anything's made it hard to stay involved, just reply and tell me.\n\nSuhanya",
      },
    ],
  },
  {
    first: "Fay",
    last: "Underhill",
    kind: "complimentary",
    joinedAt: ago(6),
    tags: { "Ride for Refuge": ago(6) },
    howJoined: "Ride for Refuge",
    intake: {
      interests: ["Housing, tenant rights, and eviction prevention", "Neighbourhood connections and community-building", "Other: Food security"],
      ways: ["Receive invitations to occasional workshops, discussions, or community events", "Be contacted about opportunities to share my knowledge, skills, or lived experience"],
      location: "Waterloo",
      time: "A few hours for an event or activity",
      hopes: "I'd like to meet neighbours who care about housing, and help out at events where I can.",
      answeredAt: ago(5),
    },
  },
  { first: "Bea", last: "Morland", kind: "complimentary", joinedAt: ago(6), tags: { "Ride for Refuge": ago(6) }, howJoined: "Ride for Refuge" },
  { first: "Xavier", last: "Roy", kind: "complimentary", joinedAt: ago(6), tags: { "Ride for Refuge": ago(6) }, howJoined: "Ride for Refuge", mutedAt: ago(4) },
  { first: "Tomas", last: "Rivera", kind: "gifted", joinedAt: ago(5), howJoined: "Gift from Helen Brooks", intake: makeIntake(ago(5)) },
  {
    first: "Margaret", cap: 60,
    last: "Ellison",
    joinedAt: "2020-10-17",
    amounts: [250, 500, 500, 1000, 1200],
    tags: { "Leadership donor": "2021-10-20", Board: "2023-03-14", Volunteer: ago(20) },
    note: { text: "Birthday is March 3. Prefers email over events.", updatedAt: ago(30), by: "Rithika" },
    density: 0.9,
    engage: 0.5,
    personal: 6,
  },
  { first: "Priya", last: "Raman", joinedAt: ago(6), amounts: [25], howJoined: "Fall workshop" },
  { first: "Jordan", last: "Lee", joinedAt: ago(1), amounts: [25], status: "waiting" },
  { first: "Quinn", last: "Harlow", kind: "sponsored", joinedAt: ago(90), howJoined: "Added by an admin", engage: 0.5 },
  { first: "Noah", last: "Brandt", joinedAt: ago(21), amounts: [10], firstMethod: "cash", howJoined: "Community lunch" },
  {
    first: "Helen", cap: 55,
    last: "Brooks",
    joinedAt: "2023-02-18",
    amounts: [50],
    tags: { Volunteer: "2023-05-01" },
    note: { text: "Gave Tomas a membership after meeting him at the lunch. Happy to do it again.", updatedAt: ago(5), by: "Suhanya" },
    personal: 2,
  },
  {
    first: "Ines", cap: 50,
    last: "Duarte",
    joinedAt: "2022-03-09",
    lapse: { years: 2, rejoinedAt: "2026-02-14" },
    amounts: [25, 25, 50],
    tags: { Volunteer: "2022-06-01" },
    note: { text: "Took time off after her second baby was born. Asked us to hold her place and rejoined in February.", updatedAt: "2026-02-14", by: "Suhanya" },
    personal: 2,
  },
  { first: "Tara", last: "Novak", joinedAt: ago(3), amounts: [25], howJoined: "Member invite", intake: makeIntake(ago(3)) },
  { first: "Sam", last: "Whitby", joinedAt: ago(12), amounts: [50], howJoined: "Member invite", intake: makeIntake(ago(12)) },
];

export const demoMembers: Member[] = specs.map(build);

const named = (first: string, last: string) => demoMembers.find((m) => m.firstName === first && m.lastName === last) as Member;
wireReferral(named("Dan", "Petrov"), named("Tara", "Novak"));
wireReferral(named("Dan", "Petrov"), named("Sam", "Whitby"));
wireGift(named("Helen", "Brooks"), named("Tomas", "Rivera"));

/* ----- everyone else ----- */

const TARGET = 220;
const usedNames = new Set(demoMembers.map(fullName));
const usedEmails = new Set(demoMembers.map((m) => m.email));
const NEW_TAGS = ["Community lunch regular", "Tenant organizer", "Speaker", "Student", "Local business", "Faith community", "Media contact"];
const TIERS = [[10, 3], [15, 6], [25, 40], [30, 6], [40, 3], [50, 22], [75, 3], [100, 12], [150, 2], [250, 1]] as const;

function generate(): Member {
  let first = pick(FIRST_NAMES);
  let last = pick(LAST_NAMES);
  while (usedNames.has(`${first} ${last}`)) {
    first = pick(FIRST_NAMES);
    last = pick(LAST_NAMES);
  }
  usedNames.add(`${first} ${last}`);
  let email = `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, "") + "@example.com";
  for (let n = 2; usedEmails.has(email); n++) email = `${first}.${last}${n}`.toLowerCase().replace(/[^a-z0-9.]/g, "") + "@example.com";
  usedEmails.add(email);

  const cls = weighted([["member", 83], ["waiting", 5], ["ended", 12]] as const);
  let kind: MembershipKind = cls === "waiting" ? "paid" : weighted([["paid", 81], ["complimentary", 8], ["gifted", 5], ["sponsored", 6]] as const);

  let joinedAt: string;
  let years: number | undefined;
  let status: MemberStatus | undefined;
  if (kind === "complimentary") {
    joinedAt = pick(["2025-10-18", "2026-10-18"]);
    years = 1;
  } else if (kind !== "paid") {
    joinedAt = ago(int(5, 700));
    years = 1;
  } else if (cls === "waiting") {
    joinedAt = ago(int(1, 25));
    status = "waiting";
  } else if (cls === "ended") {
    const days = int(430, 1700);
    joinedAt = ago(days);
    years = int(1, Math.floor(days / 366));
  } else {
    const r = rand();
    joinedAt = ago(r < 0.35 ? int(2, 150) : r < 0.65 ? int(150, 540) : r < 0.87 ? int(540, 1100) : int(1100, 2000));
  }
  const tenure = diffDays(joinedAt, TODAY);

  const base = weighted(TIERS);
  const amounts = chance(0.12) && base <= 50 ? [base, base * 2] : [base];

  const eligible = (m: Member) => m.kind === "paid" && m.status === "member" && m.joinedAt < addDays(joinedAt, -30);
  let howJoined: string;
  let referrer: Member | undefined;
  let giver: Member | undefined;
  if (kind === "complimentary") howJoined = "Ride for Refuge";
  else if (kind === "sponsored") howJoined = "Added by an admin";
  else if (kind === "gifted") {
    const givers = demoMembers.filter(eligible);
    if (givers.length === 0) {
      kind = "sponsored";
      howJoined = "Added by an admin";
    } else {
      giver = pick(givers);
      howJoined = `Gift from ${fullName(giver)}`;
    }
  } else {
    howJoined = weighted([["Website", 42], ["Community lunch", 12], ["Fall workshop", 7], ["Existing list", 9], ["Member invite", 14], ["Added by an admin", 6], ["Tenant rights workshop", 6]] as const);
    if (howJoined === "Member invite") {
      const refs = demoMembers.filter((m) => m.status === "member" && m.kind === "paid" && m.joinedAt < addDays(joinedAt, -5));
      if (refs.length === 0) howJoined = "Website";
      else referrer = pick(refs);
    }
  }

  const tags: Record<string, string> = {};
  const tagDate = () => clamp(addDays(joinedAt, int(0, Math.min(tenure, 300))));
  let mutedAt: string | undefined;
  if (kind === "complimentary") tags["Ride for Refuge"] = joinedAt;
  if (kind === "paid" && status !== "waiting") {
    if (chance(0.13)) tags.Volunteer = tagDate();
    if (chance(0.015)) tags.Board = tagDate();
    if (amounts[amounts.length - 1] >= 100 && chance(0.2)) tags["Leadership donor"] = tagDate();
    if (chance(0.18)) tags[pick(NEW_TAGS)] = tagDate();
    if (chance(0.02)) {
      tags["Do not contact"] = tagDate();
      mutedAt = tags["Do not contact"];
    }
  }
  if (!mutedAt && tenure >= 8 && chance(0.06)) mutedAt = clamp(addDays(joinedAt, int(5, tenure)));

  const place = weighted(PLACES.map((p) => [p, p.weight] as const));
  const viaRide = howJoined === "Ride for Refuge";
  const spec: Spec = {
    first,
    last,
    email,
    kind,
    amounts,
    joinedAt,
    years,
    status,
    howJoined,
    tags,
    mutedAt,
    density: 0.55 + rand() * 0.35,
    engage: 0.1 + rand() * 0.3,
    personal: chance(0.12) ? 1 : 0,
    address: chance(0.5) ? `${int(10, 480)} ${pick(STREETS)}, ${place.town}, ON` : undefined,
    intake: chance(viaRide || tenure <= 60 ? 0.85 : 0.14) ? { ...makeIntake(joinedAt), ...(chance(0.92) ? { location: place.location } : {}) } : undefined,
    note: chance(0.1) ? { text: pick(NOTE_TEXTS), updatedAt: clamp(addDays(joinedAt, int(0, tenure))), by: "Suhanya" } : undefined,
  };
  const m = build(spec);
  if (referrer) wireReferral(referrer, m);
  if (giver) wireGift(giver, m);
  return m;
}

while (demoMembers.length < TARGET) demoMembers.push(generate());

/* Newest first, and short histories trimmed (the hand-written people keep everything). */
const handWritten = specs.length;
demoMembers.forEach((m, i) => {
  const cap = i >= handWritten ? int(6, 25) : specs[i].cap;
  if (cap) trim(m, cap);
  m.activity.sort(byNewest);
});
