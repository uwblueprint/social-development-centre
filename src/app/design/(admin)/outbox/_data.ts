/**
 * Demo data for the Outbox design screen. Nothing here talks to a server: the real feature reads the
 * Automatic Emails engine (see docs/backend/outbox.md for what the screen needs from it).
 */

import type { JSONContent } from "@tiptap/react";
import { VARIABLES } from "@/app/design/email-editor/variables";
import { docToPlainText, fillDoc, templateDocs } from "./_emailDoc";

export type TemplateKey = "thanks" | "big" | "month" | "update" | "gala";

/**
 * Where an automatic email opens. Points at the Automatic Emails design (gaurav/design-automatic-emails),
 * which isn't in main yet; the product route will be /admin/automatic-emails/[id].
 */
export const automaticEmailHref = (key: TemplateKey) => `/design/automatic-emails?email=${key}`;

/*
 * An automatic email's rule, in the Automatic Emails editor's words (gaurav/design-automatic-emails):
 * When = what starts it (a member joins, a tag is added, a monthly schedule, a one-off) plus a delay;
 * Who = audience conditions. "only" is OR (any one tag), "require" is AND (every tag), "never" subtracts last.
 * Simplified: the editor's "joined between" condition isn't modelled here.
 */
export type Trigger =
  | { kind: "joins" }
  | { kind: "tag"; tag: string }
  | { kind: "monthly"; day: number }
  | { kind: "one_off"; by: string };
export type DelayUnit = "days" | "weeks" | "months";
export interface Rule {
  trigger: Trigger;
  /** How long after the trigger it sends; null sends within 24 hours. Monthly and one-off emails have none. */
  delay: { n: number; unit: DelayUnit } | null;
  audience: { only: string[]; require: string[]; never: string[] };
}

export interface Template {
  key: TemplateKey;
  name: string;
  subject: string;
  body: string;
  rule: Rule;
}

export interface Member {
  id: string;
  name: string;
  first: string;
  email: string;
  tags: string[];
  /** When they joined, in days from today (negative: in the past). Emails that react to joining override this. */
  since: number;
  /** State lab Partial data: no name on file, so `name` holds the email address and `first` is "there". */
  unnamed?: boolean;
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
  /** Set once the email is edited for this person; null means it follows the template. The Email Editor's own documents (TipTap JSON), so formatting is kept. */
  subject: JSONContent | null;
  body: JSONContent | null;
}

/** The demo's "today". Every send's day is counted from here. */
export const TODAY = new Date(2026, 10, 3);
/** State lab "Today is a Sunday": the same demo, with today moved to Sunday, Nov 1. */
export const SUNDAY_TODAY = new Date(2026, 10, 1);
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
    rule: { trigger: { kind: "joins" }, delay: { n: 1, unit: "days" }, audience: { only: [], require: [], never: ["$1,000+"] } },
  },
  big: {
    key: "big",
    name: "Thank-you: $1,000+ donors",
    subject: "[First name], your support means so much",
    body: "Hi [First name],\n\nYour generous gift makes our work in Waterloo Region possible. I would love to thank you in person.\n\nWith gratitude,\nSuhanya",
    rule: { trigger: { kind: "tag", tag: "$1,000+" }, delay: { n: 1, unit: "days" }, audience: { only: [], require: [], never: [] } },
  },
  month: {
    key: "month",
    name: "One-month check-in",
    subject: "One month in, how are things, [First name]?",
    body: "Hi [First name],\n\nIt has been a month since you joined. Here are three ways to get involved this season.\n\nWarmly,\nThe SDC team",
    rule: { trigger: { kind: "joins" }, delay: { n: 1, unit: "months" }, audience: { only: ["Volunteer", "Board"], require: [], never: ["Lapsed"] } },
  },
  update: {
    key: "update",
    name: "Monthly member update for all SDC members",
    subject: "What's new at SDC this month, [First name]",
    body: "Hi [First name],\n\nHere is what happened at SDC this month, and what is coming up next.\n\nWarmly,\nThe SDC team",
    rule: { trigger: { kind: "monthly", day: 1 }, delay: null, audience: { only: [], require: [], never: [] } },
  },
  gala: {
    key: "gala",
    name: "Gala volunteer call: November fundraiser at the Kitchener Public Library",
    subject: "Can you help at the gala, [First name]?",
    body: "Hi [First name],\n\nWe are looking for volunteers for the November gala. Reply to this email if you can help.\n\nThanks,\nSuhanya",
    rule: { trigger: { kind: "one_off", by: "Suhanya" }, delay: null, audience: { only: [], require: ["Volunteer"], never: [] } },
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

/* Tags that no automatic email's rule needs or excludes, so they can be added freely without breaking "Why this email".
   (Volunteer, Board, $1,000+ and Lapsed are in rules; they are only ever given on purpose.) */
const FILLER_TAGS = [
  "Newsletter", "Gala 2025", "Food bank", "Youth program", "Mentor", "New member", "Corporate partner", "Speaker",
  "Committee: Events", "Committee: Finance", "Waterloo", "Kitchener", "Cambridge", "French speaker", "Monthly donor", "Ride for Refuge",
];

/** A member has 5 to 10 tags: the rule-relevant ones they already have, topped up from the filler vocabulary. Same result every time for the same index. */
export function withDemoTags(index: number, tags: string[]): string[] {
  const target = Math.max(tags.length, 5 + ((index * 7 + 3) % 6));
  const out = [...tags];
  for (let k = 0; out.length < target && k < FILLER_TAGS.length * 2; k++) {
    const t = FILLER_TAGS[(index * 5 + k * 3) % FILLER_TAGS.length];
    if (!out.includes(t)) out.push(t);
  }
  return out;
}

/* Real-world lengths: about one in six names is long (hyphenated, several given names), a few are very short.
   The members the demo scenarios lean on (2 Chloe Martin, 5 Farah Brown, 9 Jon Reyes, 18 Sam Sato, 21 Victor Haddad, 48 Sam Okafor) keep their generated names. */
const NAME_OVERRIDES: Record<number, string> = {
  1: "Maria-Alexandra Fitzgerald", 8: "Oluwaseun Adebayo-Williams", 12: "Nguyen Thi Minh Anh", 16: "Christopher Vandenberghe-Lowe",
  20: "Ana Sofia Rodriguez-Hernandez", 25: "Mohammed Abdul-Rahman Al-Farsi", 30: "Katarzyna Wisniewska-Kowalczyk", 35: "Jean-Baptiste Tremblay-Lafleur",
  41: "Priyanka Venkataraman-Iyer", 46: "Elizabeth Montgomery-Clarke", 53: "Siobhan MacCallaghan-Brennan", 58: "Tatiana Ivanova Petrovskaya",
  64: "Chukwuemeka Okonkwo-Eze", 71: "Margaret Anne Fitzpatrick", 80: "Wei-Lin Chen-Zhang",
  10: "Jon Liu", 13: "Bo Li", 17: "Ed Wu", 27: "Ty Lee", 33: "Al Tran", 44: "Mia Ng", 62: "Raj Rao", 75: "Zoe Ito",
};

export const MEMBERS: Member[] = Array.from({ length: 90 }, (_, i) => {
  const name = NAME_OVERRIDES[i] ?? `${FIRST[i % 30]} ${LAST[(i + Math.floor(i / 30) * 4) % 15]}`;
  return {
    id: `m${i}`,
    name,
    first: name.split(" ")[0],
    email: `${name.toLowerCase().split(" ").join(".")}@example.org`,
    tags: TAGS.filter((_, k) => (i * 31 + k * 17) % 9 === 0),
    since: -(45 + ((i * 53) % 800)),
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
  /* Two people with four emails each (with the gala call and the monthly update), to try deleting many emails to the same few people: search a name, select all, Delete. */
  { key: "thanks-12", template: "thanks", day: 12, status: "scheduled", members: [1, 4] },
  { key: "month-12", template: "month", day: 12, status: "scheduled", members: [4] },
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

/** Keep the demo honest: every member who gets an email matches that email's rule (has the tags it needs, none it excludes). */
function conformMembersToRules() {
  const pairs: [number, TemplateKey][] = [
    ...BATCHES.flatMap((b) => b.members.map((m): [number, TemplateKey] => [m, b.template])),
    ...HISTORY.map(([m, t]): [number, TemplateKey] => [m, t]),
  ];
  for (const [i, key] of pairs) {
    const { trigger, audience } = TEMPLATES[key].rule;
    const m = MEMBERS[i];
    let tags = m.tags.filter((t) => !audience.never.includes(t));
    const need = [...audience.require, ...(trigger.kind === "tag" ? [trigger.tag] : [])];
    if (audience.only.length && !audience.only.some((t) => tags.includes(t))) need.push(audience.only[0]);
    for (const t of need) if (!tags.includes(t)) tags = [...tags, t];
    m.tags = tags;
  }
}
conformMembersToRules();
// After the rules are satisfied (which can remove or add a tag), give everyone 5 to 10 tags.
MEMBERS.forEach((m, i) => {
  m.tags = withDemoTags(i, m.tags);
});

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

export const isLive = (s: Send) => s.status !== "sent" && s.status !== "removed";
/** Going out inside the Outbox's window: today up to LAST_DAY. */
export const isUpcoming = (s: Send) => s.day >= 0 && s.day <= LAST_DAY;
export const isPastDue = (s: Send) => s.status === "review" && s.day < 0;

/** The status tint a send gets in the list. */
export function sendTone(s: Send): "danger" | "warning" | undefined {
  if (s.status === "couldnt") return "danger";
  if (isPastDue(s)) return "warning";
  return undefined;
}

export const isEdited = (s: Send) => s.subject != null || s.body != null;
/** The subject and message this send will go out with, as Email Editor documents: its own edit, or the template's. */
export const subjectOf = (s: Send): JSONContent => s.subject ?? templateDocs(TEMPLATES[s.template]).subject;
export const bodyOf = (s: Send): JSONContent => s.body ?? templateDocs(TEMPLATES[s.template]).body;
/**
 * The fields of an email being edited, starting from what it is now, as plain text with this member's details in it.
 * A send is stored without personalized text: the backend fills it in when the send is created, so an edit is
 * always of the member's own words ("Hi Dev,"), never of "@First name".
 */
export const draftOf = (s: Send, m: Member) => ({ draftSubject: fillFor(subjectOf(s), m), draftBody: fillFor(bodyOf(s), m) });

/** What a personalized-text chip says for this member. Join date counts back from `since`; referral details use the editor's examples (the demo has no referrals). */
function memberValue(id: string, m: Member): string {
  switch (id) {
    case "first_name":
      return m.first;
    case "full_name":
      return m.name;
    case "last_name":
      return m.unnamed ? "" : m.name.slice(m.first.length).trim();
    case "email":
      return m.email;
    case "join_date": {
      const d = dayDate(m.since);
      return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }
    default:
      return VARIABLES.find((v) => v.id === id)?.example ?? "";
  }
}

/** The document with the member's details where it has personalized text. */
export const fillFor = (doc: JSONContent, m: Member) => fillDoc(doc, (id) => memberValue(id, m));
/** The template's subject and message as this member would get them: what an edit is compared with (and Reset goes back to). */
export const templateFor = (template: { subject: string; body: string }, m: Member) => {
  const docs = templateDocs(template);
  return { subject: fillFor(docs.subject, m), body: fillFor(docs.body, m) };
};
/** The document as plain text with the member's details filled in (Gmail's compose link, subject length). */
export const plainFor = (doc: JSONContent, m: Member) => docToPlainText(doc, (id) => memberValue(id, m));

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** The date n days from `today` (the demo's TODAY unless the state lab moves it). */
export function dayDate(n: number, today: Date = TODAY) {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d;
}

function ordinal(n: number) {
  const v = n % 100;
  return n + (v >= 11 && v <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th");
}

export function longDate(d: Date) {
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${ordinal(d.getDate())}`;
}

export const fmtDay = (n: number) => longDate(dayDate(n));
export const shortWeekdays = WEEKDAYS.map((w) => ({ full: w, short: w.slice(0, 3) }));

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "5 days", "3 weeks", "2 months". */
export function span(days: number) {
  if (days < 14) return plural(days, "day", "days");
  if (days < 60) return plural(Math.round(days / 7), "week", "weeks");
  return plural(Math.round(days / 30), "month", "months");
}

const ago = (days: number) => (days === 0 ? "today" : `${span(days)} ago`);

/** Day heading in the All tab: "Today (Tuesday, November 3rd)". */
export function dayLabel(n: number) {
  if (n === 0) return `Today (${fmtDay(0)})`;
  if (n === 1) return `Tomorrow (${fmtDay(1)})`;
  return fmtDay(n);
}

/** Opens Gmail's compose window with this email filled in, for sending by hand when our system fails. */
export function gmailComposeUrl(to: string, subject: string, body: string) {
  const q = new URLSearchParams({ view: "cm", fs: "1", to, su: subject, body });
  return `https://mail.google.com/mail/?${q.toString()}`;
}

/** The line under a recipient's name in the open email. */
export function timingLabel(s: Send) {
  if (s.status === "couldnt") return `Couldn't send ${ago(-s.day)}`;
  if (s.day < 0) return `${plural(-s.day, "day", "days")} past due`;
  if (s.day === 0) return "Sends today";
  return `Sends ${fmtDay(s.day)}`;
}

const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));

/** "Oct 3". */
export const shortDate = (d: Date) => `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
/** "Oct 3, 2026". */
export const dateWithYear = (d: Date) => `${shortDate(d)}, ${d.getFullYear()}`;
/** "October 2026". */
export const monthYear = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

const DELAY_DAYS: Record<DelayUnit, number> = { days: 1, weeks: 7, months: 30 };
/** Days between the trigger and the send (the demo counts a month as 30 days); within 24 hours counts as 1. */
const delayDays = (r: Rule) => (r.delay ? r.delay.n * DELAY_DAYS[r.delay.unit] : 1);

/** The day (from today) this member joined. An email that follows the join sets the date; otherwise the member's own. */
export function joinedDay(m: Member, member: number, sends: Send[]) {
  for (const s of sends) {
    if (s.member !== member) continue;
    const { rule } = TEMPLATES[s.template];
    if (rule.trigger.kind === "joins") return s.day - delayDays(rule);
  }
  return m.since;
}

const orList = (tags: string[]) => (tags.length <= 2 ? tags.join(" or ") : `${tags.slice(0, -1).join(", ")} or ${tags[tags.length - 1]}`);
const andList = (tags: string[]) => (tags.length <= 2 ? tags.join(" and ") : `${tags.slice(0, -1).join(", ")} and ${tags[tags.length - 1]}`);
const delayText = (r: Rule) => (r.delay ? `${plural(r.delay.n, r.delay.unit.slice(0, -1), r.delay.unit)} after` : "Within 24 hours after");

/** One audience condition, and the member's own tags that satisfy it (none for "Any member" and exclusions). */
export interface WhoLine {
  text: string;
  tags: string[];
}
export interface Why {
  who: WhoLine[];
  /** The trigger, from the rule: "1 day after joining". */
  rule: string;
  /** The member's value for that trigger, and when it sends: "Joined Oct 8, 2026 · Sends Oct 9". */
  detail: string;
}

/**
 * Why this member got this email, derived from the automatic email's rule and the member's own data
 * (tags, join date, the date a tag was added). The rule is the template's, so a personalized email still shows it.
 */
export function whyOf(s: Send, m: Member, rule: Rule): Why {
  const { trigger, audience } = rule;
  const who: WhoLine[] = [];
  if (audience.require.length) who.push({ text: `Has ${audience.require.length > 1 ? "all of the tags" : "the tag"} ${andList(audience.require)}`, tags: m.tags.filter((t) => audience.require.includes(t)) });
  if (audience.only.length) who.push({ text: `Has ${audience.only.length > 1 ? "one of the tags" : "the tag"} ${orList(audience.only)}`, tags: m.tags.filter((t) => audience.only.includes(t)) });
  // The excluded tags show as tags too, though the member (by the rule) doesn't have them.
  if (audience.never.length) who.push({ text: `Doesn't have ${audience.never.length > 1 ? "any of the tags" : "the tag"}`, tags: audience.never });
  if (!who.length) who.push({ text: "Any member", tags: [] });

  const verb = s.status === "sent" ? "Sent" : s.status === "couldnt" || s.day < 0 ? "Due" : "Sends";
  const send = `${verb} ${shortDate(dayDate(s.day))}`;
  const event = (label: string) => `${label} ${dateWithYear(dayDate(s.day - delayDays(rule)))} · ${send}`;
  switch (trigger.kind) {
    case "joins":
      return { who, rule: `${delayText(rule)} joining`, detail: event("Joined") };
    case "tag":
      return { who, rule: `${delayText(rule)} the ${trigger.tag} tag is added`, detail: event("Tag added") };
    case "monthly":
      return { who, rule: `Monthly, on the ${ordinal(trigger.day)}`, detail: send };
    case "one_off":
      return { who, rule: "One-off email", detail: `Set up by ${trigger.by} · ${send}` };
  }
}

const STATUS_WORD: Record<SendStatus, string | null> = {
  sent: "Sent",
  scheduled: "Scheduled",
  pending: "Scheduled",
  review: "To review",
  couldnt: "Couldn't send",
  removed: null,
};

export interface OtherEmail {
  id: string;
  template: TemplateKey;
  day: number;
  /** "Oct 29", or "Today". */
  date: string;
  /** "Sent", "Scheduled", "To review", "Couldn't send". */
  status: string;
}

/** The member's other emails from the last and next 30 days, the 5 nearest to today in date order, and how many more there are. */
export function otherEmails(open: Send, sends: Send[]) {
  const all = sends
    .filter((s) => s.member === open.member && s.id !== open.id && STATUS_WORD[s.status] && s.day >= 0 && s.day <= 30)
    .sort((a, b) => a.day - b.day);
  const shown = all.slice(0, 5).sort((a, b) => a.day - b.day);
  return {
    items: shown.map((s): OtherEmail => ({ id: s.id, template: s.template, day: s.day, date: s.day === 0 ? "Today" : shortDate(dayDate(s.day)), status: STATUS_WORD[s.status]! })),
    more: all.length - shown.length,
  };
}
