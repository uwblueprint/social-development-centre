/*
 * Automatic emails as the admin pages see them, and the rules the design reads them by (ported from
 * src/app/design/automatic-emails/_data.ts in #53, minus its demo data). The database stores the same
 * email (src/features/automatic-emails/queries.ts maps it); the server checks again on publish.
 */

import type { JSONContent } from "@tiptap/react";
import { VARIABLES, isAvailable, variableById, type EmailMoment } from "@/features/email-editor/variables";

export type Trigger = "join_any" | "join_no_referral" | "join_referral" | "refers" | "referral_joins" | "tag_added";
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
 * Tags are ids; `TagNames` turns them into words.
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
  /** The tag a tag_added email starts from (an id), or null until one is picked. */
  tag: string | null;
  delay: Delay;
  days: string;
  unit: Unit;
  /** True once the admin has typed in the delay number; after that, changing the unit keeps their number. */
  daysEdited?: boolean;
  audience: Audience;
  mode: Mode;
  state: EmailState;
  /** The subject as plain text ("Welcome, [First name]"), for the list and checks. Mirrors subjectDoc. */
  subject: string;
  subjectDoc?: JSONContent;
  body?: JSONContent;
  /** Outbox sends someone edited or approved, or that are waiting for review. Drive the unpublish warning. */
  edited: number;
  approved: number;
  waiting: number;
  /** Published before and unpublished since. */
  wasPublished?: boolean;
}

export interface TagOption {
  id: string;
  name: string;
}
/** Tag names by id. A tag that was deleted reads as "a deleted tag". */
export type TagNames = Map<string, string>;
export const tagName = (names: TagNames, id: string) => names.get(id) ?? "a deleted tag";

/** The largest delay the database accepts for each unit. */
export const DELAY_MAX: Record<Unit, number> = { days: 365, weeks: 52, months: 24, years: 5 };

export const TRIGGER_OPTIONS: { value: Trigger; label: string; group: string }[] = [
  { value: "join_any", label: "a member joins (any way)", group: "Joining" },
  { value: "join_no_referral", label: "a member joins without a referral", group: "Joining" },
  { value: "join_referral", label: "a member joins through a referral", group: "Joining" },
  { value: "refers", label: "a member refers someone", group: "Referrals" },
  { value: "referral_joins", label: "a member's referral joins", group: "Referrals" },
  { value: "tag_added", label: "a tag is added to a member", group: "Tags" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Which personalized text an email can use depends on what starts it (Email Editor PRD). */
export function momentFor(trigger: Trigger): EmailMoment {
  if (trigger === "join_referral") return "joins_referral";
  if (trigger === "refers") return "refers";
  if (trigger === "referral_joins") return "referral_joins";
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
  join_no_referral: "a member joins without a referral",
  join_referral: "a member joins through a referral",
  refers: "a member refers someone (sent to the referrer)",
  referral_joins: "a member's referral joins (sent to the referrer)",
};

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
  const triggerTag = e.trigger === "tag_added" ? e.tag : null;
  // The lists apply whether or not their row shows, as on the server; removing a row empties its list.
  const never = e.audience.never.filter((t) => t !== triggerTag);
  const require = e.audience.require.filter((t) => t !== triggerTag && !never.includes(t));
  const only = e.audience.only.filter((t) => t !== triggerTag && !never.includes(t) && !require.includes(t));
  let { op, from, to } = e.audience.joined;
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

/** The number a unit starts with: 30 days, or 1 week, month or year. */
export function defaultFor(unit: Unit) {
  return unit === "days" ? "30" : "1";
}
export function daysNum(e: AutomaticEmail) {
  const s = String(e.days).trim();
  return /^\d+$/.test(s) && +s >= 1 ? +s : null;
}

function delayPhrase(e: AutomaticEmail, capital: boolean) {
  if (e.delay === "same") return `${capital ? "W" : "w"}ithin 24 hours after `;
  const n = daysNum(e);
  return `${n === null ? `[N] ${e.unit}` : `${n} ${n === 1 ? e.unit.slice(0, -1) : e.unit}`} after `;
}

function triggerPhrase(e: AutomaticEmail, names: TagNames) {
  if (e.trigger !== "tag_added") return TRIG[e.trigger] ?? "";
  return e.tag ? `the tag ${tagName(names, e.tag)} is added to a member` : "a tag is added to a member";
}

export function summarize(e: AutomaticEmail, names: TagNames) {
  const a = effectiveAudience(e);
  const jt = joinedText(a.joined);
  const only = a.only.map((t) => tagName(names, t));
  const require = a.require.map((t) => tagName(names, t));
  let s = delayPhrase(e, true) + triggerPhrase(e, names);
  const conds = [
    only.length ? `have the tag ${orList(only)}` : "",
    require.length ? `${only.length ? "also have" : "have"} ${requireTags(require)}` : "",
    jt,
  ].filter(Boolean);
  if (conds.length) s += `, if they ${conds.join(" and ")}`;
  if (a.never.length) s += `, except members with the tag ${orList(a.never.map((t) => tagName(names, t)))}`;
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
export function audienceSentence(a: Audience, names: TagNames) {
  const tags = a.only.length ? orList(a.only.map((t) => tagName(names, t))) : "";
  const req = a.require.length ? requireTags(a.require.map((t) => tagName(names, t))) : "";
  const when = joinedPhrase(a.joined);
  const who = !tags && !req && !when ? "Every member" : "Members";
  let s = who;
  if (when) s += ` who joined ${when}`;
  if (tags) s += when ? ` and have the ${tags} tag` : ` with the ${tags} tag`;
  if (req) s += tags ? (when ? " and also have " : " who also have ") + req : when ? ` and have ${req}` : ` with ${req}`;
  if (a.never.length) s += `, except anyone with the ${orList(a.never.map((t) => tagName(names, t)))} tag`;
  return `${s}.`;
}

/** "30 days after a member joins" for the publish confirmation. */
export function timingPhrase(e: AutomaticEmail, names: TagNames) {
  return delayPhrase(e, false) + triggerPhrase(e, names).replace(/ \(sent to the referrer\)/, "");
}

export function displayName(e: Pick<AutomaticEmail, "name">) {
  return e.name || "Untitled automatic email";
}

/**
 * What stops the email publishing, in the editor's words. Who-gets-it never does: effectiveAudience
 * reads it for intent. publish_automatic_email makes the same checks on the server.
 */
export function checkEmail(e: AutomaticEmail) {
  const blockers: string[] = [];
  if (!e.name.trim()) blockers.push("add a name");
  if (e.trigger === "tag_added" && !e.tag) blockers.push("pick a tag");
  if (!e.subject.trim()) blockers.push("add a subject");
  if (!docToText(e.body).trim() && !hasImage(e.body)) blockers.push("write the message");
  // Switching the trigger can strand personalized text, e.g. a referrer's name on a plain join email.
  const moment = momentFor(e.trigger);
  if ([...chipIds(e.subjectDoc), ...chipIds(e.body)].some((id) => !isAvailable(id, moment))) {
    blockers.push("remove the personalized text this email can't fill");
  }
  return { blockers };
}

function hasImage(doc: JSONContent | undefined): boolean {
  return !!doc && (doc.type === "emailImage" || (doc.content ?? []).some(hasImage));
}

/** "the Housing tag" / "the Seniors and Housing tags" / "all of the Seniors, Housing and Youth tags": every tag is needed. */
export function requireTags(tags: string[]) {
  if (tags.length === 1) return `the ${tags[0]} tag`;
  const head = tags.slice(0, -1).join(", ");
  const last = tags[tags.length - 1];
  return tags.length === 2 ? `the ${head} and ${last} tags` : `all of the ${head} and ${last} tags`;
}

/** A member the email is scheduled for, from the Outbox. */
export interface Recipient {
  personId: string;
  name: string;
  email: string;
  /** "Nov 12". */
  sendDate: string;
  /** Their details by personalized field id, for the preview. */
  fields: Record<string, string>;
}
