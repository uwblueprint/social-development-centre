/**
 * The Outbox's model: the design's (#64, src/app/design/(admin)/outbox/_data.ts) with the demo seed replaced by
 * what the server loads (queries.ts). Days are whole days from today in Waterloo Region; negative is the past.
 */

import type { JSONContent } from "@tiptap/react";
import { VARIABLES } from "@/features/email-editor/variables";
import { docToPlainText, fillDoc } from "./_emailDoc";

/** An automatic email's id. */
export type TemplateKey = string;

/** Where an automatic email opens. */
export const automaticEmailHref = (key: TemplateKey) => `/admin/automatic-emails/${key}`;

/*
 * An automatic email's rule, in the Automatic Emails editor's words: When = what starts it plus a delay;
 * Who = audience conditions. "only" is OR (any one tag), "require" is AND (every tag), "never" subtracts last.
 * The editor's "joined between" condition isn't shown here.
 */
export type Trigger =
  | { kind: "joins"; referral: "any" | "with" | "without" }
  | { kind: "tag"; tag: string }
  | { kind: "refers" }
  | { kind: "referral_joins" };
export type DelayUnit = "days" | "weeks" | "months" | "years";
export interface Rule {
  trigger: Trigger;
  /** How long after the trigger it sends; null sends within 24 hours. */
  delay: { n: number; unit: DelayUnit } | null;
  /** Tag names. */
  audience: { only: string[]; require: string[]; never: string[] };
}

export interface Template {
  key: TemplateKey;
  name: string;
  /** The subject as plain text ("Welcome, [First name]"), for search and labels. */
  subject: string;
  /** The subject and message as the Email Editor wrote them, with personalized text as chips. */
  subjectDoc: JSONContent;
  bodyDoc: JSONContent;
  rule: Rule;
}

export interface Member {
  /** The person's id. */
  id: string;
  name: string;
  first: string;
  last: string;
  email: string;
  /** Tag names. */
  tags: string[];
  /** When they joined, in days from today (negative: in the past); null when they aren't a member. */
  since: number | null;
}

/** review: waiting for an admin. scheduled/pending: going out on its day. couldnt: failed. sent/removed: history. */
export type SendStatus = "review" | "scheduled" | "pending" | "couldnt" | "sent" | "removed";

/** Why a send failed: nobody approved it in time, our system failed, or the address bounced. */
export type FailReason = "admin" | "platform" | "bounce";

export interface Send {
  /** `${occurrenceId}:${personId}`: one member's copy of one occurrence. */
  id: string;
  occurrenceId: string;
  personId: string;
  /** Index into the loaded members. */
  member: number;
  template: TemplateKey;
  /** Days from today: negative is past, 0 is today. The due day, or for history the day it happened. */
  day: number;
  /** When the trigger happened for this member (joined, tag added), in days from today. */
  eventDay: number | null;
  status: SendStatus;
  fail?: FailReason;
  /** Set once the email is edited for this person; null means it follows the template. Email Editor documents. */
  subject: JSONContent | null;
  body: JSONContent | null;
}

/** Every email goes out together, once a day. */
export const SEND_TIME = "10:30 AM";
/** The Outbox shows this many days ahead. */
export const LAST_DAY = 30;

/** Today in Waterloo Region, as a local midnight: the day every send's `day` counts from. */
export function todayDate(): Date {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" }).format(new Date()).split("-").map(Number);
  return new Date(y, m - 1, d);
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
export const subjectOf = (s: Send, templates: Record<TemplateKey, Template>): JSONContent => s.subject ?? templates[s.template].subjectDoc;
export const bodyOf = (s: Send, templates: Record<TemplateKey, Template>): JSONContent => s.body ?? templates[s.template].bodyDoc;
/**
 * The fields of an email being edited, starting from what it is now, as plain text with this member's details in it.
 * A send is stored without personalized text: the backend fills it in when the send is created, so an edit is
 * always of the member's own words ("Hi Dev,"), never of "@First name".
 */
export const draftOf = (s: Send, m: Member, templates: Record<TemplateKey, Template>) => ({
  draftSubject: fillFor(subjectOf(s, templates), m),
  draftBody: fillFor(bodyOf(s, templates), m),
});

/** What a personalized-text chip says for this member. Referral details aren't loaded here, so they use the editor's examples; the sender fills in the real ones. */
function memberValue(id: string, m: Member): string {
  switch (id) {
    case "first_name":
      return m.first;
    case "full_name":
      return m.name;
    case "last_name":
      return m.last;
    case "email":
      return m.email;
    case "join_date": {
      if (m.since == null) return "";
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
export const templateFor = (template: Template, m: Member) => ({ subject: fillFor(template.subjectDoc, m), body: fillFor(template.bodyDoc, m) });
/** The document as plain text with the member's details filled in (Gmail's compose link, subject length). */
export const plainFor = (doc: JSONContent, m: Member) => docToPlainText(doc, (id) => memberValue(id, m));

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** The date n days from today. */
export function dayDate(n: number, today: Date = todayDate()) {
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

/** The day (from today) this member joined. */
export const joinedDay = (m: Member) => m.since;

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
  const event = (label: string) => (s.eventDay == null ? send : `${label} ${dateWithYear(dayDate(s.eventDay))} · ${send}`);
  switch (trigger.kind) {
    case "joins": {
      const how = trigger.referral === "with" ? " through a referral" : trigger.referral === "without" ? " without a referral" : "";
      return { who, rule: `${delayText(rule)} joining${how}`, detail: event("Joined") };
    }
    case "tag":
      return { who, rule: `${delayText(rule)} the ${trigger.tag} tag is added`, detail: event("Tag added") };
    case "refers":
      return { who, rule: `${delayText(rule)} they refer someone`, detail: event("Referred someone") };
    case "referral_joins":
      return { who, rule: `${delayText(rule)} someone they referred joins`, detail: event("Their referral joined") };
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
