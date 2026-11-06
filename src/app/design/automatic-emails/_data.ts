/*
 * Demo data and rules for the automatic emails design, ported from Justin's prototype
 * (https://claude.ai/artifact/2cVQKQ7tmiNCGGewqRd1i6). No backend: everything lives in memory.
 */

import type { JSONContent } from "@tiptap/react";
import { TAG_COLORS as TAG_PALETTE, type TagColor } from "@/components/ui/Tag";
import { VARIABLES, isAvailable, variableById, type EmailMoment } from "../email-editor/variables";

export type Trigger = "join_any" | "join_noref" | "join_ref" | "refers" | "ref_joins" | "tag";
export type Delay = "same" | "days";
export type Unit = "days" | "weeks" | "months" | "years";
export type JoinedOp = "any" | "before" | "after" | "between";
export type EmailState = "published" | "draft" | "trash";
export type Mode = "auto" | "review";

/*
 * Who gets the email. The logic is fixed, so there's nothing to set and nothing to get wrong:
 * - Same kind of condition = OR. Tags in "only" widen the audience: Volunteer or Board.
 * - Different kinds = AND. "Only Volunteer" and "joined after Jan 1" narrow each other.
 * - "require" (Must have) is AND within itself: the member needs every tag in it.
 * - "never" subtracts last.
 * The admin adds conditions one kind at a time; each kind appears once, so rows never need merging.
 * More kinds (interests, member type) can be added as rows later. Mistakes are read for intent,
 * never flagged: an empty condition is no filter, a tag lives in one list only (picking it in the
 * other moves it), swapped dates are swapped back, and a range with one date is open on that side.
 */
export type CondKind = "only" | "require" | "never" | "joined";
export interface JoinedRule {
  op: JoinedOp;
  from: string;
  to: string;
}
export interface Audience {
  /** The conditions the admin added, in the order they added them. */
  rows: CondKind[];
  only: string[];
  /** Must have: the member needs every one of these tags. */
  require: string[];
  never: string[];
  joined: JoinedRule;
}
export const EVERYONE: Audience = { rows: [], only: [], require: [], never: [], joined: { op: "any", from: "", to: "" } };

export interface AutomaticEmail {
  id: string;
  name: string;
  trigger: Trigger;
  tag: string;
  delay: Delay;
  days: string;
  unit?: Unit;
  /** True once the admin has typed in the delay number; after that, changing the unit keeps their number. */
  daysEdited?: boolean;
  audience: Audience;
  mode: Mode;
  state: EmailState;
  /** The subject as plain text ("Welcome, [First name]"), for the list and checks. Mirrors subjectDoc. */
  subject: string;
  /** Subject and message as Email Editor JSON. A seed without subjectDoc builds it from `subject`. */
  subjectDoc?: JSONContent;
  body?: JSONContent;
  /** How many files are attached (the editor owns the files themselves). */
  attachments?: number;
  /** Outbox emails someone edited, approved, or that are waiting for review. Drives the unpublish warning. */
  edited: number;
  approved: number;
  waiting: number;
  wasPublished?: boolean;
}

/** The demo clock: today at noon, so send dates and the Join date default agree. Seed data is relative to it. */
export const TODAY = (() => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d;
})();
const TAG_LIST = ["$1,000+", "Volunteer", "Lapsed", "Board", "Monthly donor", "Housing", "Newcomer", "Youth", "Food bank", "Event attendee", "Mentor", "Seniors"];

/** Member tags share five colours, grouped by meaning: money (emerald), people (sky), programs (amber), status (rose), community (stone). */
const TAG_COLORS: Record<string, TagColor> = {
  "$1,000+": "emerald",
  "Monthly donor": "emerald",
  Volunteer: "sky",
  Mentor: "sky",
  Board: "sky",
  Housing: "amber",
  "Food bank": "amber",
  Youth: "amber",
  Lapsed: "rose",
  Newcomer: "stone",
  Seniors: "stone",
  "Event attendee": "stone",
};

/** Tags for dropdowns: by colour in palette order, then A to Z within a colour. */
export function sortTags(tags: string[]) {
  const rank = (t: string) => { const c = TAG_COLORS[t]; return c ? TAG_PALETTE.indexOf(c) : TAG_PALETTE.length; };
  return [...tags].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

export const TAGS = sortTags(TAG_LIST);

export function tagColor(tag: string): TagColor | undefined {
  return TAG_COLORS[tag];
}

export interface Member {
  n: string;
  d: number;
  tags: string[];
  ref?: boolean;
  /** Demo events, in days ago: when this member last referred someone, when that referral joined, and when each tag was added. */
  referredDaysAgo?: number;
  referralJoinedDaysAgo?: number;
  tagsAdded?: Record<string, number>;
}

export const MEMBERS: Member[] = [
  { n: "Maya Singh", d: 0.3, tags: ["Newcomer"], tagsAdded: { Newcomer: 0.3 } },
  { n: "Noah Clarke", d: 0.8, tags: ["Youth"], ref: true, referredDaysAgo: 0.8, tagsAdded: { Youth: 0.8 } },
  { n: "Ana Okafor", d: 3, tags: [], ref: true, referredDaysAgo: 2, referralJoinedDaysAgo: 2 },
  { n: "Ben Tran", d: 10, tags: ["Volunteer", "$1,000+"], referredDaysAgo: 6, referralJoinedDaysAgo: 4, tagsAdded: { Volunteer: 9, "$1,000+": 5 } },
  { n: "Chloe Martin", d: 18, tags: ["$1,000+"], tagsAdded: { "$1,000+": 12 } },
  { n: "Dev Patel", d: 25, tags: ["Housing", "Food bank"], ref: true, tagsAdded: { Housing: 20 } },
  { n: "Emma Wilson", d: 41, tags: ["Volunteer", "Seniors", "Housing"], referredDaysAgo: 30, referralJoinedDaysAgo: 21, tagsAdded: { Volunteer: 35 } },
  { n: "Farah Ali", d: 60, tags: ["Board", "$1,000+"], tagsAdded: { Board: 50, "$1,000+": 45 } },
  { n: "Grace Liu", d: 75, tags: ["Lapsed"], tagsAdded: { Lapsed: 3 } },
  { n: "Hiro Sato", d: 90, tags: ["Seniors", "Housing"] },
  { n: "Isla Brown", d: 120, tags: ["Monthly donor", "Youth"] },
  { n: "Jon Reyes", d: 150, tags: ["Seniors", "Housing", "Food bank"] },
  { n: "Kim Nguyen", d: 200, tags: ["Volunteer", "Youth"], ref: true },
  { n: "Leo Fischer", d: 260, tags: ["Lapsed"] },
];

export const TRIGGER_OPTIONS: { value: Trigger; label: string; group: string }[] = [
  { value: "join_any", label: "a member joins (any way)", group: "Joining" },
  { value: "join_noref", label: "a member joins without a referral", group: "Joining" },
  { value: "join_ref", label: "a member joins through a referral", group: "Joining" },
  { value: "refers", label: "a member refers someone", group: "Referrals" },
  { value: "ref_joins", label: "a member's referral joins", group: "Referrals" },
  { value: "tag", label: "a tag is added to a member", group: "Tags" },
];



const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Which personalized text an email can use depends on what starts it (Email Editor PRD). */
export function momentFor(trigger: Trigger): EmailMoment {
  if (trigger === "join_ref") return "joins_referral";
  if (trigger === "refers") return "refers";
  if (trigger === "ref_joins") return "referral_joins";
  return "one_off";
}

const chip = (id: string): JSONContent => ({ type: "personalizedText", attrs: { id } });

/** "Hi [First name]," as editor JSON: each line is a paragraph, and a bracketed label becomes personalized text. */
export function textToDoc(text: string): JSONContent {
  return {
    type: "doc",
    content: text.split("\n").map((line) => ({
      type: "paragraph",
      content: line
        .split(/(\[[^\]]+\])/)
        .filter(Boolean)
        .map((part) => {
          const v = VARIABLES.find((x) => `[${x.label}]` === part);
          return v ? chip(v.id) : { type: "text", text: part };
        }),
    })),
  };
}

/** Editor JSON back to "Hi [First name],": the plain-text mirror used by the list and the checks. */
export function docToText(doc: JSONContent | undefined): string {
  if (!doc) return "";
  if (doc.type === "text") return doc.text ?? "";
  if (doc.type === "personalizedText") return `[${variableById(String(doc.attrs?.id))?.label ?? "?"}]`;
  const sep = doc.type === "doc" || doc.type === "bulletList" || doc.type === "orderedList" ? "\n" : "";
  return (doc.content ?? []).map(docToText).join(sep);
}

function chipIds(doc: JSONContent | undefined): string[] {
  if (!doc) return [];
  const own = doc.type === "personalizedText" ? [String(doc.attrs?.id)] : [];
  return [...own, ...(doc.content ?? []).flatMap(chipIds)];
}

const TRIG: Partial<Record<Trigger, string>> = {
  join_any: "a member joins",
  join_noref: "a member joins without a referral",
  join_ref: "a member joins through a referral",
  refers: "a member refers someone (sent to the referrer)",
  ref_joins: "a member's referral joins (sent to the referrer)",
};

function daysAgo(d: number) {
  return new Date(TODAY.getTime() - d * 86400000);
}
export function iso(dt: Date) {
  return dt.toISOString().slice(0, 10);
}
export function pretty(dt: Date) {
  return `${MONTHS[dt.getMonth()]} ${dt.getDate()}`;
}
function prettyIso(value: string) {
  return pretty(new Date(`${value}T12:00:00`));
}

/** "Volunteer or Board". Used in the pickers and the summary, so both read the same way. */
export function orList(tags: string[]) {
  return tags.length <= 2 ? tags.join(" or ") : `${tags.slice(0, -1).join(", ")} or ${tags[tags.length - 1]}`;
}

/**
 * The rule as it will run: what the admin meant, worked out from what they entered. Nothing here
 * is ever an error. A tag that starts the email can't also keep people out of it (the trigger is
 * the clearer intent, so it wins). Dates entered back to front are swapped. A "between" with one
 * date is open on the other side, and a date rule with no date is no rule.
 */
export function effectiveAudience(e: AutomaticEmail): Audience {
  const { rows } = e.audience;
  const triggerTag = e.trigger === "tag" ? e.tag : null;
  const never = rows.includes("never") ? e.audience.never.filter((t) => t !== triggerTag) : [];
  const require = rows.includes("require") ? e.audience.require.filter((t) => t !== triggerTag && !never.includes(t)) : [];
  const only = rows.includes("only") ? e.audience.only.filter((t) => t !== triggerTag && !never.includes(t) && !require.includes(t)) : [];
  let { op, from, to } = e.audience.joined;
  if (!rows.includes("joined")) op = "any";
  if (op === "between" && from && to && from > to) [from, to] = [to, from];
  if (op === "between" && !from && !to) op = "any";
  if ((op === "before" || op === "after") && !from) op = "any";
  return { rows, only, require, never, joined: { op, from, to } };
}

export function joinedText({ op, from, to }: JoinedRule) {
  if (op === "any" || (!from && !to) || (op !== "between" && !from)) return "";
  if (op === "before" || op === "after") return `joined ${op} ${prettyIso(from)}`;
  if (op === "between") {
    if (from && to) return `joined between ${prettyIso(from)} and ${prettyIso(to)}`;
    return from ? `joined on or after ${prettyIso(from)}` : `joined on or before ${prettyIso(to)}`;
  }
  return "";
}

export function unitOf(e: AutomaticEmail): Unit {
  return e.unit === "weeks" || e.unit === "months" || e.unit === "years" ? e.unit : "days";
}
/** The number a unit starts with: 30 days, or 1 week, month or year. */
export function defaultFor(unit: Unit) {
  return unit === "days" ? "30" : "1";
}
export function daysNum(e: AutomaticEmail) {
  const s = String(e.days).trim();
  return /^\d+$/.test(s) && +s >= 1 ? +s : null;
}
// Calendar days until the send; weeks, months and years are approximated as 7, 30 and 365 days for the preview.
function delayDays(e: AutomaticEmail) {
  const n = daysNum(e);
  return n === null ? null : n * { days: 1, weeks: 7, months: 30, years: 365 }[unitOf(e)];
}

export function summarize(e: AutomaticEmail) {
  const n = daysNum(e);
  const unit = unitOf(e);
  const d =
    e.delay === "same"
      ? "Within 24 hours after "
      : `${n === null ? `[N] ${unit}` : `${n} ${n === 1 ? unit.slice(0, -1) : unit}`} after `;
  const t = e.trigger === "tag" ? `the tag ${e.tag} is added to a member` : TRIG[e.trigger];
  const a = effectiveAudience(e);
  const jt = joinedText(a.joined);
  let s = d + t;
  const conds = [
    a.only.length ? `have the tag ${orList(a.only)}` : "",
    a.require.length ? `${a.only.length ? "also have" : "have"} ${requireTags(a.require)}` : "",
    jt,
  ].filter(Boolean);
  if (conds.length) s += `, if they ${conds.join(" and ")}`;
  if (a.never.length) s += `, except members with the tag ${orList(a.never)}`;
  return `${s}.`;
}

const withYear = (value: string) => `${prettyIso(value)}, ${new Date(`${value}T12:00:00`).getFullYear()}`;

/** The Joined rule in words with years, as the Joined pill shows it: "between Nov 1 and Nov 30, 2026". */
export function joinedPhrase({ op, from, to }: JoinedRule) {
  if (op === "before" || op === "after") return from ? `${op} ${withYear(from)}` : "";
  if (op !== "between" || (!from && !to)) return "";
  if (from && to) {
    const [a, b] = from <= to ? [from, to] : [to, from];
    return `between ${a.slice(0, 4) === b.slice(0, 4) ? prettyIso(a) : withYear(a)} and ${withYear(b)}`;
  }
  return from ? `after ${withYear(from)}` : `before ${withYear(to)}`;
}

/** The whole Who gets it block in plain words, for any mix of tags, Joined rule and Exclude. */
export function audienceSentence(a: Audience) {
  const tags = a.only.length ? orList(a.only) : "";
  const req = a.require.length ? requireTags(a.require) : "";
  const when = joinedPhrase(a.joined);
  const who = !tags && !req && !when ? "Every member" : "Members";
  let s = who;
  if (when) s += ` who joined ${when}`;
  if (tags) s += when ? ` and have the ${tags} tag` : ` with the ${tags} tag`;
  if (req) s += tags ? (when ? " and also have " : " who also have ") + req : when ? ` and have ${req}` : ` with ${req}`;
  if (a.never.length) s += `, except anyone with the ${orList(a.never)} tag`;
  return `${s}.`;
}

function matches(e: AutomaticEmail, m: Member) {
  const joined = iso(daysAgo(m.d));
  const { only, require, never, joined: j } = effectiveAudience(e);
  if (never.some((t) => m.tags.includes(t))) return false;
  if (!require.every((t) => m.tags.includes(t))) return false;
  if (only.length && !only.some((t) => m.tags.includes(t))) return false;
  if (j.op === "before") return joined < j.from;
  if (j.op === "after") return joined > j.from;
  if (j.op === "between") return (!j.from || joined >= j.from) && (!j.to || joined <= j.to);
  return true;
}

const emailOf = (m: Member) => `${m.n.toLowerCase().split(" ").join(".")}@example.org`;

export interface EligibleMember {
  name: string;
  email: string;
  joined: string;
  sendDate: string;
}

/**
 * Who will still get this email, as of now: they match the audience AND their send is upcoming.
 * The send time is the trigger's event time plus the timing; a send that already passed doesn't count.
 */
export function upcomingRecipients(e: AutomaticEmail, now: Date = TODAY): EligibleMember[] {
  const offset = e.delay === "same" ? 1 : delayDays(e);
  if (offset === null) return [];
  const out: EligibleMember[] = [];
  for (const m of MEMBERS) {
    if (e.trigger === "join_noref" && m.ref) continue;
    if (e.trigger === "join_ref" && !m.ref) continue;
    const age =
      e.trigger === "refers" ? m.referredDaysAgo
      : e.trigger === "ref_joins" ? m.referralJoinedDaysAgo
      : e.trigger === "tag" ? m.tagsAdded?.[e.tag]
      : m.d;
    if (age === undefined || age >= offset) continue;
    if (!matches(e, m)) continue;
    const send = new Date(now.getTime() + (offset - age) * 86400000);
    out.push({ name: m.n, email: emailOf(m), joined: iso(daysAgo(m.d)), sendDate: pretty(send) });
  }
  return out;
}

/** "30 days after a member joins" for the publish confirmation. */
export function timingPhrase(e: AutomaticEmail) {
  const t = e.trigger === "tag" ? `the tag ${e.tag} is added to a member` : (TRIG[e.trigger] ?? "").replace(/ \(sent to the referrer\)/, "");
  const n = daysNum(e);
  const unit = unitOf(e);
  const d = e.delay === "same" ? "within 24 hours after " : `${n === null ? `[N] ${unit}` : `${n} ${n === 1 ? unit.slice(0, -1) : unit}`} after `;
  return d + t;
}

export function displayName(e: AutomaticEmail) {
  return e.name || "Untitled automatic email";
}

/** Everything that stops the email publishing. Who-gets-it never does: effectiveAudience reads it for intent. */
export function checkEmail(e: AutomaticEmail) {
  const blockers: string[] = [];
  if (!e.name.trim()) blockers.push("add a name");
  if (!e.subject.trim()) blockers.push("add a subject");
  if (!docToText(e.body).trim()) blockers.push("write the message");
  // Switching the trigger can strand personalized text, e.g. a referrer's name on a plain join email.
  const moment = momentFor(e.trigger);
  if ([...chipIds(e.subjectDoc), ...chipIds(e.body)].some((id) => !isAvailable(id, moment))) {
    blockers.push("remove the personalized text this email can't fill");
  }

  return { blockers };
}

const SEED_BODIES: Record<string, string> = {
  e1: "Hi [First name],\nThank you for joining the Social Development Centre. We're so glad you're here.\nYou'll hear from us now and then with ways to get involved. If anything is unclear, just reply to this email.\nSuhanya",
  e2: "Hi [First name],\nYour support means a great deal to everyone at SDC. I wanted to thank you personally.\nSuhanya",
  e3: "Hi [First name],\nIt's been a month since you joined. How are things going? I'd love to hear what you think so far.\nSuhanya",
  e4: "Hi [First name],\nWe've missed you. If you'd like to come back, just reply and I'll help.\nSuhanya",
  e5: "Hi [First name],\nHere's what's new at SDC this month.\nSuhanya",
};

const SEED_EMAILS: AutomaticEmail[] = [
  { id: "e1", name: "Thank-you: standard", trigger: "join_any", tag: "$1,000+", delay: "same", days: "1", audience: { ...EVERYONE, rows: ["never"], never: ["$1,000+"] }, mode: "auto", state: "published", subject: "Thank you for joining, [First name]!", edited: 1, approved: 0, waiting: 0 },
  { id: "e2", name: "Thank-you: $1,000+", trigger: "tag", tag: "$1,000+", delay: "same", days: "1", audience: EVERYONE, mode: "review", state: "published", subject: "[First name], your support means so much", edited: 0, approved: 1, waiting: 1 },
  { id: "e3", name: "One-month check-in", trigger: "join_any", tag: "$1,000+", delay: "days", days: "30", audience: { ...EVERYONE, rows: ["only", "never"], only: ["Volunteer", "Board"], never: ["Lapsed"] }, mode: "auto", state: "draft", subject: "One month in, how are things, [First name]?", edited: 0, approved: 0, waiting: 0 },
  { id: "e4", name: "Lapsed check-in", trigger: "tag", tag: "Lapsed", delay: "days", days: "7", audience: EVERYONE, mode: "review", state: "trash", subject: "We miss you, [First name]", edited: 0, approved: 0, waiting: 0 },
  { id: "e5", name: "Monthly member update", trigger: "join_any", tag: "$1,000+", delay: "same", days: "1", audience: { ...EVERYONE, rows: ["never"], never: ["Lapsed"] }, mode: "auto", state: "draft", subject: "What's new at SDC this month, [First name]", edited: 0, approved: 0, waiting: 0 },
];

export const SEED: AutomaticEmail[] = SEED_EMAILS.map((e) => ({ ...e, body: textToDoc(SEED_BODIES[e.id] ?? "") }));

export function newEmail(id: string): AutomaticEmail {
  return { id, name: "", trigger: "join_any", tag: "$1,000+", delay: "same", days: "30", audience: EVERYONE, mode: "auto", state: "draft", subject: "", edited: 0, approved: 0, waiting: 0 };
}

/** The message talks about an attachment ("attached", "attaching") but nothing is attached: worth a second look. */
export function missingAttachment(e: AutomaticEmail) {
  const text = `${e.subject} ${docToText(e.body)}`;
  return /\battach(ed|ing|ment|ments)?\b/i.test(text) && !e.attachments;
}

/** "the Housing tag" / "the Seniors and Housing tags" / "all of the Seniors, Housing and Youth tags": every tag is needed. */
export function requireTags(tags: string[]) {
  if (tags.length === 1) return `the ${tags[0]} tag`;
  const head = tags.slice(0, -1).join(", ");
  const last = tags[tags.length - 1];
  return tags.length === 2 ? `the ${head} and ${last} tags` : `all of the ${head} and ${last} tags`;
}
