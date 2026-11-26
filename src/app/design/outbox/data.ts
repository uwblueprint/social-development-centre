/**
 * Demo data for the Outbox design screen. Nothing here talks to a server: the real feature reads the
 * Automatic Emails engine (see docs/backend/outbox.md for what the screen needs from it).
 */

export type TemplateKey = "thanks" | "big" | "month" | "update" | "gala";

export interface Template {
  key: TemplateKey;
  name: string;
  subject: string;
  body: string;
}

export interface Member {
  id: string;
  name: string;
  first: string;
  email: string;
  tags: string[];
}

/** review: waiting for an admin. scheduled/pending: going out on its day. couldnt: failed. sent/removed: history. */
export type SendStatus = "review" | "scheduled" | "pending" | "couldnt" | "sent" | "removed";

/** Why a send failed: nobody approved it in time, our system failed, or the address bounced. */
export type FailReason = "admin" | "platform" | "bounce";

export interface Send {
  id: string;
  member: number;
  template: TemplateKey;
  /** Days from today: negative is past, 0 is today. */
  day: number;
  status: SendStatus;
  fail?: FailReason;
  /** Set once the email is edited for this person; null means it follows the template. */
  subject: string | null;
  body: string | null;
}

/** The demo's "today". Every send's day is counted from here. */
export const TODAY = new Date(2026, 10, 3);
/** Every email goes out together, once a day. */
export const SEND_TIME = "10:30 AM";
/** The Outbox shows this many days ahead. */
export const LAST_DAY = 30;

export const TEMPLATES: Record<TemplateKey, Template> = {
  thanks: {
    key: "thanks",
    name: "Thank-you: standard",
    subject: "Thank you for joining, [First name]!",
    body: "Hi [First name],\n\nThank you for joining the Social Development Centre. We are so glad to have you with us.\n\nWarmly,\nThe SDC team",
  },
  big: {
    key: "big",
    name: "Thank-you: $1,000+",
    subject: "[First name], your support means so much",
    body: "Hi [First name],\n\nYour generous gift makes our work in Waterloo Region possible. I would love to thank you in person.\n\nWith gratitude,\nSuhanya",
  },
  month: {
    key: "month",
    name: "One-month check-in",
    subject: "One month in, how are things, [First name]?",
    body: "Hi [First name],\n\nIt has been a month since you joined. Here are three ways to get involved this season.\n\nWarmly,\nThe SDC team",
  },
  update: {
    key: "update",
    name: "Monthly member update",
    subject: "What's new at SDC this month, [First name]",
    body: "Hi [First name],\n\nHere is what happened at SDC this month, and what is coming up next.\n\nWarmly,\nThe SDC team",
  },
  gala: {
    key: "gala",
    name: "Gala volunteer call",
    subject: "Can you help at the gala, [First name]?",
    body: "Hi [First name],\n\nWe are looking for volunteers for the November gala. Reply to this email if you can help.\n\nThanks,\nSuhanya",
  },
};

export const TEMPLATE_KEYS = Object.keys(TEMPLATES) as TemplateKey[];

const FIRST = [
  "Ana", "Ben", "Chloe", "Dev", "Emma", "Farah", "Grace", "Hiro", "Isla", "Jon",
  "Kai", "Lena", "Maya", "Noah", "Olu", "Priya", "Quinn", "Ravi", "Sam", "Tara",
  "Uma", "Victor", "Wren", "Xin", "Yusuf", "Zoe", "Amir", "Bea", "Cole", "Dana",
];
const LAST = ["Ali", "Tran", "Martin", "Sato", "Wilson", "Brown", "Haddad", "Okafor", "Patel", "Reyes", "Liu", "Nguyen", "Chen", "Osei", "Singh"];
const TAGS = ["Volunteer", "Board", "$1,000+", "Monthly donor", "Ride for Refuge"];

export const MEMBERS: Member[] = Array.from({ length: 90 }, (_, i) => {
  const name = `${FIRST[i % 30]} ${LAST[(i + Math.floor(i / 30) * 4) % 15]}`;
  return {
    id: `m${i}`,
    name,
    first: name.split(" ")[0],
    email: `${name.toLowerCase().split(" ").join(".")}@example.org`,
    tags: TAGS.filter((_, k) => (i * 31 + k * 17) % 9 === 0),
  };
});
MEMBERS[2].tags = ["$1,000+"];
MEMBERS[5].tags = ["Board", "$1,000+"];

interface Batch {
  key: string;
  template: TemplateKey;
  day: number;
  status: SendStatus;
  fail?: FailReason;
  members: number[];
}

const BATCHES: Batch[] = [
  { key: "big-m2", template: "big", day: -2, status: "review", members: [5] },
  { key: "thanks-m1", template: "thanks", day: -1, status: "couldnt", fail: "bounce", members: [9] },
  { key: "month-m2", template: "month", day: -2, status: "couldnt", fail: "admin", members: [18] },
  { key: "thanks-m1b", template: "thanks", day: -1, status: "couldnt", fail: "platform", members: [21] },
  { key: "gala-0", template: "gala", day: 0, status: "pending", members: [1, 4, 10, 13, 17, 20, 23, 26, 29, 33, 36, 40, 44, 47, 51, 55, 58, 62, 66, 70, 73, 77, 81, 85] },
  { key: "thanks-0", template: "thanks", day: 0, status: "scheduled", members: [30, 31, 32] },
  { key: "thanks-1", template: "thanks", day: 1, status: "scheduled", members: [34, 35] },
  { key: "month-2", template: "month", day: 2, status: "scheduled", members: [0, 3] },
  { key: "big-5", template: "big", day: 5, status: "review", members: [2] },
  { key: "thanks-3", template: "thanks", day: 3, status: "scheduled", members: [37] },
  { key: "month-6", template: "month", day: 6, status: "scheduled", members: [1] },
  { key: "thanks-7", template: "thanks", day: 7, status: "scheduled", members: [38, 39] },
  { key: "month-9", template: "month", day: 9, status: "scheduled", members: [7, 8] },
  { key: "thanks-10", template: "thanks", day: 10, status: "scheduled", members: [41] },
  { key: "thanks-15", template: "thanks", day: 15, status: "scheduled", members: [42, 43, 45] },
  { key: "month-16", template: "month", day: 16, status: "scheduled", members: [12] },
  { key: "big-19", template: "big", day: 19, status: "review", members: [48] },
  { key: "thanks-21", template: "thanks", day: 21, status: "scheduled", members: [46] },
  { key: "month-23", template: "month", day: 23, status: "scheduled", members: [14, 15] },
  { key: "thanks-24", template: "thanks", day: 24, status: "scheduled", members: [49, 50] },
  { key: "update-28", template: "update", day: 28, status: "scheduled", members: MEMBERS.map((_, k) => k).filter((k) => k % 7 !== 3) },
  { key: "month-27", template: "month", day: 27, status: "scheduled", members: [16] },
  { key: "thanks-29", template: "thanks", day: 29, status: "scheduled", members: [52] },
];

/** Sent history for the last month, so past days on the calendar have counts. */
const HISTORY: [member: number, template: TemplateKey, day: number][] = [
  [0, "thanks", -1], [3, "month", -2], [1, "thanks", -3], [53, "thanks", -3], [54, "thanks", -4],
  [2, "big", -5], [55, "thanks", -6], [56, "month", -7], [57, "thanks", -8], [58, "thanks", -9],
  [59, "month", -10], [60, "thanks", -12], [61, "thanks", -13], [5, "big", -14], [62, "month", -15],
  [63, "thanks", -17], [64, "thanks", -19], [65, "month", -21], [66, "thanks", -24], [67, "thanks", -27],
];

export function seedSends(): Send[] {
  const sends: Send[] = [];
  for (const b of BATCHES) {
    for (const m of b.members) {
      sends.push({ id: `${b.key}:${m}`, member: m, template: b.template, day: b.day, status: b.status, fail: b.fail, subject: null, body: null });
    }
  }
  HISTORY.forEach(([m, template, day], k) => {
    sends.push({ id: `h${k}`, member: m, template, day, status: "sent", subject: null, body: null });
  });
  return sends;
}

export const isEdited = (s: Send) => s.subject != null || s.body != null;
export const subjectOf = (s: Send) => s.subject ?? TEMPLATES[s.template].subject;
export const bodyOf = (s: Send) => s.body ?? TEMPLATES[s.template].body;
export const fill = (text: string, m: Member) => text.split("[First name]").join(m.first);

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function dayDate(n: number) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + n);
  return d;
}

export function ordinal(n: number) {
  const v = n % 100;
  return n + (v >= 11 && v <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th");
}

export function longDate(d: Date) {
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${ordinal(d.getDate())}`;
}

export const fmtDay = (n: number) => longDate(dayDate(n));
export const monthTitle = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
export const shortWeekdays = WEEKDAYS.map((w) => ({ full: w, short: w.slice(0, 3) }));

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "5 days", "3 weeks", "2 months". */
export function span(days: number) {
  if (days < 14) return plural(days, "day", "days");
  if (days < 60) return plural(Math.round(days / 7), "week", "weeks");
  return plural(Math.round(days / 30), "month", "months");
}

export const ago = (days: number) => (days === 0 ? "today" : `${span(days)} ago`);

/** Day heading in the All tab: "Today (Tuesday, November 3rd)". */
export function dayLabel(n: number) {
  if (n === 0) return `Today (${fmtDay(0)})`;
  if (n === 1) return `Tomorrow (${fmtDay(1)})`;
  return fmtDay(n);
}

/** The short label above a recipient's name. */
export function whenLabel(s: Send) {
  if (s.status === "couldnt") return `Couldn't send · ${ago(-s.day)}`;
  if (s.status === "review" && s.day < 0) return `Past due · ${ago(-s.day)}`;
  if (s.status === "pending") return "One-off, sending today";
  if (s.day === 0) return "Today";
  if (s.day === 1) return "Tomorrow";
  return span(s.day);
}

/** Opens Gmail's compose window with this email filled in, for sending by hand when our system fails. */
export function gmailComposeUrl(to: string, subject: string, body: string) {
  const q = new URLSearchParams({ view: "cm", fs: "1", to, su: subject, body });
  return `https://mail.google.com/mail/?${q.toString()}`;
}
