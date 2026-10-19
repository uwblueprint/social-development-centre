/*
 * Automatic emails: the system-written summary line, the pre-publish checks and small formatting helpers.
 * Pure functions on the model; no store access, so the list, the editor and the dialogs share one wording.
 */
import { checkEmail } from "../editor";
import type { AutomaticEmail, Conditions, Delay, Moment, Rule, Send } from "../model";
import { MOMENT_LABEL, NOT_SENT_LABEL, TIME_ZONE, VARIABLES } from "../model";
import { plainText } from "../editor/richtext";

export const AUTOMATIC_BASE = "/emails-pm-prototype/automatic";
export const OUTBOX_BASE = "/emails-pm-prototype/outbox";

export function plural(n: number, one: string, many: string = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function newRuleId(): string {
  return `rule-${Math.random().toString(36).slice(2, 9)}`;
}

/** "March 4, 2026" from yyyy-mm-dd, read as a calendar date (no time zone shift). */
export function dateText(isoDay: string): string {
  const d = new Date(`${isoDay}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return isoDay;
  return d.toLocaleDateString("en-CA", { dateStyle: "long", timeZone: "UTC" });
}

export function monthText(month: string): string {
  const d = new Date(`${month}-15T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return month;
  return d.toLocaleDateString("en-CA", { month: "long", year: "numeric", timeZone: "UTC" });
}

/** "Mar 4 morning": sends are labelled with the part of the day, never an exact time. */
export function morningText(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.toLocaleDateString("en-CA", { month: "short", day: "numeric", timeZone: TIME_ZONE })} morning`;
}

export function momentClause(moment: Moment): string {
  switch (moment.type) {
    case "join-any":
      return "a member joins";
    case "join-no-referral":
      return "a member joins without a referral";
    case "join-referral":
      return "a member joins through a referral";
    case "refers-someone":
      return "a member refers someone";
    case "referral-joins":
      return "a member's referral joins";
    case "tag-added":
      return moment.tag ? `a member gets the tag ${moment.tag}` : "a member gets a tag";
  }
}

function delayPrefix(delay: Delay, clause: string): string {
  switch (delay.kind) {
    case "immediately":
      return `The next morning after ${clause}`;
    case "same-day":
      return `The same morning ${clause}, or the next morning if it happens later`;
    case "days-after":
      return `${plural(delay.days, "day")} after ${clause}`;
  }
}

function ruleText(rule: Rule): string {
  switch (rule.type) {
    case "has-tag":
      return `they have the tag ${rule.tag || "…"}`;
    case "except-tag":
      return rule.tag || "…";
    case "joined-before":
      return `they joined before ${rule.date ? dateText(rule.date) : "…"}`;
    case "joined-after":
      return `they joined after ${rule.date ? dateText(rule.date) : "…"}`;
    case "joined-in":
      return `they joined in ${rule.month ? monthText(rule.month) : "…"}`;
  }
}

function joinList(items: string[], word: "and" | "or"): string {
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]} ${word} ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, ${word} ${items[items.length - 1]}`;
}

export function conditionsText(c: Conditions): string {
  const include = c.rules.filter((r) => r.type !== "except-tag");
  const except = c.rules.filter((r) => r.type === "except-tag");
  const parts: string[] = [];
  if (include.length) parts.push(`if ${joinList(include.map(ruleText), c.match === "all" ? "and" : "or")}`);
  if (except.length) {
    const tags = except.map((r) => ruleText(r));
    parts.push(`except members with the ${tags.length === 1 ? "tag" : "tags"} ${joinList(tags, "or")}`);
  }
  return parts.join(", ");
}

export interface SummaryInput {
  moment: Moment | null;
  delay: Delay | null;
  conditions: Conditions;
}

/** Plain-language summary written by the system, e.g. "30 days after a member joins without a referral, if they have the tag Volunteer, except members with the tag Board." */
export function summarize(email: SummaryInput): string {
  if (!email.moment) return "Choose when this email sends.";
  const delay = email.delay ?? { kind: "immediately" as const };
  const head = delayPrefix(delay, momentClause(email.moment));
  const tail = conditionsText(email.conditions);
  return `${head}${tail ? `, ${tail}` : ""}.`;
}

export const SEND_MODE_LABEL = {
  automatic: "Automatic",
  review: "Review first",
} as const;

/* One-line summaries for the step cards. */
export function momentShort(m: Moment | null): string {
  if (!m) return "";
  return m.type === "tag-added" && m.tag ? `${MOMENT_LABEL[m.type]}: ${m.tag}` : MOMENT_LABEL[m.type];
}

export function delayShort(d: Delay | null): string {
  if (!d) return "";
  if (d.kind === "immediately") return "Immediately";
  if (d.kind === "same-day") return "Same day";
  return `${plural(d.days, "day")} after`;
}

/** The list row: "30 days after · Member joins (any way)", plus the condition count when there is one. */
export function listSummary(e: { moment: Moment | null; delay: Delay | null; conditions: Conditions }): string {
  if (!e.moment) return "";
  const n = e.conditions.rules.length;
  return [delayShort(e.delay ?? { kind: "immediately" }), momentShort(e.moment), n ? plural(n, "condition") : ""].filter(Boolean).join(" · ");
}

export function whoShort(c: Conditions): string {
  const t = conditionsText(c);
  if (!t) return "Everyone";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function emailShort(content: { subject: string; bodyHtml: string }): string {
  const pretty = (t: string) => t.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k: string) => `[${VARIABLES.find((v) => v.key === k)?.label ?? k}]`);
  const body = pretty(plainText(content.bodyHtml)).replace(/\s+/g, " ").trim();
  return [pretty(content.subject.trim()), body].filter(Boolean).join(" · ");
}

/** The card a publish problem belongs to. */
export type CardKey = "when" | "wait" | "who" | "email" | "mode";
export function cardFor(fieldId: string): CardKey | "name" {
  if (fieldId === FIELD.name) return "name";
  if (fieldId === FIELD.moment || fieldId === FIELD.momentTag) return "when";
  if (fieldId === FIELD.delay || fieldId === FIELD.days) return "wait";
  if (fieldId === FIELD.email) return "email";
  if (fieldId === FIELD.sendMode) return "mode";
  return "who";
}

export interface FieldIssue {
  fieldId: string;
  message: string;
}

export const FIELD = {
  name: "auto-name",
  moment: "auto-moment",
  momentTag: "auto-moment-tag",
  delay: "auto-delay",
  days: "auto-delay-days",
  email: "auto-email",
  sendMode: "auto-send-mode",
  rule: (id: string) => `auto-rule-${id}`,
} as const;

/** Tags that are both "has" and "except": the exception always wins, so the pair is a mistake. */
export function tagConflicts(c: Conditions): string[] {
  const has = new Set(c.rules.filter((r) => r.type === "has-tag" && r.tag).map((r) => (r as { tag: string }).tag));
  return c.rules
    .filter((r) => r.type === "except-tag" && r.tag && has.has(r.tag))
    .map((r) => (r as { tag: string }).tag);
}

/** Everything that blocks publishing, in the order the fields appear. */
export function validateForPublish(email: AutomaticEmail | (SummaryInput & Pick<AutomaticEmail, "name" | "content" | "sendMode">)): FieldIssue[] {
  const issues: FieldIssue[] = [];
  if (!email.name.trim()) issues.push({ fieldId: FIELD.name, message: "Add a name." });
  if (!email.moment) issues.push({ fieldId: FIELD.moment, message: "Choose a moment." });
  else if (email.moment.type === "tag-added" && !email.moment.tag) issues.push({ fieldId: FIELD.momentTag, message: "Choose a tag." });
  if (!email.delay) issues.push({ fieldId: FIELD.delay, message: "Choose how long to wait." });
  else if (email.delay.kind === "days-after" && !(Number.isInteger(email.delay.days) && email.delay.days >= 1))
    issues.push({ fieldId: FIELD.days, message: "Enter a whole number of days, 1 or more." });
  for (const r of email.conditions.rules) {
    const missing =
      ((r.type === "has-tag" || r.type === "except-tag") && !r.tag) ||
      ((r.type === "joined-before" || r.type === "joined-after") && !r.date) ||
      (r.type === "joined-in" && !r.month);
    if (missing) issues.push({ fieldId: FIELD.rule(r.id), message: "Finish this condition or remove it." });
  }
  for (const tag of tagConflicts(email.conditions)) {
    const except = email.conditions.rules.find((r) => r.type === "except-tag" && r.tag === tag);
    issues.push({
      fieldId: FIELD.rule(except?.id ?? ""),
      message: `The tag ${tag} is both included and excluded. Remove one of them.`,
    });
  }
  const mail = checkEmail(email.content, email.moment ?? undefined);
  for (const m of mail) issues.push({ fieldId: FIELD.email, message: m.message });
  if (!email.sendMode) issues.push({ fieldId: FIELD.sendMode, message: "Choose a send mode." });
  return issues;
}

export interface RecipientLine {
  label: "Scheduled" | "Waiting for review" | "Sent" | "Not sent";
  variant: "info" | "warning" | "success" | "neutral";
  /** Quiet one-line reason; never red. */
  reason: string;
}

export function recipientLine(send: Send): RecipientLine {
  switch (send.status) {
    case "scheduled":
      return { label: "Scheduled", variant: "info", reason: send.couldntSend ? "Couldn't send yet. We keep trying." : `Goes out ${morningText(send.sendAt)}` };
    case "waiting-review":
      return { label: "Waiting for review", variant: "warning", reason: `Due ${morningText(send.sendAt)}` };
    case "sent":
      return { label: "Sent", variant: "success", reason: send.sentAt ? `Sent ${morningText(send.sentAt)}` : "" };
    case "not-sent":
      return { label: "Not sent", variant: "neutral", reason: send.notSentReason ? NOT_SENT_LABEL[send.notSentReason] : "" };
  }
}
