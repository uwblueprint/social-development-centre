/*
 * Demo data and rules for the automatic emails design, ported from Justin's prototype
 * (https://claude.ai/artifact/2cVQKQ7tmiNCGGewqRd1i6). No backend: everything lives in memory.
 */

export type Trigger = "join_any" | "join_noref" | "join_ref" | "refers" | "ref_joins" | "tag" | "monthly";
export type Delay = "now" | "same" | "days";
export type Unit = "days" | "months";
export type CondType = "has" | "except" | "before" | "after" | "in";
export type EmailState = "published" | "draft" | "trash";
export type Mode = "auto" | "review";
export type AlertWhen = "waiting" | "48h" | "overdue";

export interface Condition {
  type: CondType;
  value: string;
}

export interface AutomaticEmail {
  id: string;
  name: string;
  trigger: Trigger;
  tag: string;
  monthDay?: string;
  delay: Delay;
  days: string;
  unit?: Unit;
  match: "all" | "any";
  conds: Condition[];
  mode: Mode;
  alert?: boolean;
  alertTo?: string;
  alertWhen?: AlertWhen;
  state: EmailState;
  subject: string;
  /** Outbox emails someone edited, approved, or that are waiting for review. Drives the unpublish warning. */
  edited: number;
  approved: number;
  waiting: number;
  wasPublished?: boolean;
}

export const TODAY = new Date("2026-10-20T12:00:00");
export const MAX_CONDS = 5;
export const DEFAULT_ALERT_TO = "suhanya@waterlooregion.org";
export const TAGS = ["$1,000+", "Volunteer", "Lapsed", "Board", "Monthly donor"];

interface Member {
  n: string;
  d: number;
  tags: string[];
  ref?: boolean;
}

export const MEMBERS: Member[] = [
  { n: "Ana Okafor", d: 3, tags: [], ref: true },
  { n: "Ben Tran", d: 10, tags: ["Volunteer"] },
  { n: "Chloe Martin", d: 18, tags: ["$1,000+"] },
  { n: "Dev Patel", d: 25, tags: [], ref: true },
  { n: "Emma Wilson", d: 41, tags: ["Volunteer"] },
  { n: "Farah Ali", d: 60, tags: ["Board", "$1,000+"] },
  { n: "Grace Liu", d: 75, tags: ["Lapsed"] },
  { n: "Hiro Sato", d: 90, tags: [] },
  { n: "Isla Brown", d: 120, tags: ["Monthly donor"] },
  { n: "Jon Reyes", d: 150, tags: [] },
  { n: "Kim Nguyen", d: 200, tags: ["Volunteer"], ref: true },
  { n: "Leo Fischer", d: 260, tags: ["Lapsed"] },
];

export const TRIGGER_OPTIONS: { value: Trigger; label: string }[] = [
  { value: "join_any", label: "a member joins (any way)" },
  { value: "join_noref", label: "a member joins without a referral" },
  { value: "join_ref", label: "a member joins via referral" },
  { value: "refers", label: "a member refers someone" },
  { value: "ref_joins", label: "a member's referral joins" },
  { value: "tag", label: "a tag is added to a member" },
  { value: "monthly", label: "a new month starts (every month)" },
];

export const CONDITION_OPTIONS: { value: CondType; label: string }[] = [
  { value: "has", label: "have the tag" },
  { value: "except", label: "not have the tag" },
  { value: "before", label: "have joined before" },
  { value: "after", label: "have joined after" },
  { value: "in", label: "have joined in" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FULL_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const TRIG: Partial<Record<Trigger, string>> = {
  join_any: "a member joins",
  join_noref: "a member joins without a referral",
  join_ref: "a member joins via referral",
  refers: "a member refers someone (sent to the referrer)",
  ref_joins: "a member's referral joins (sent to the referrer)",
};

function daysAgo(d: number) {
  const x = new Date(TODAY);
  x.setDate(x.getDate() - d);
  return x;
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
function monthLabel(v: string) {
  const [year, month] = v.split("-");
  return `${FULL_MONTHS[parseInt(month, 10) - 1]} ${year}`;
}

export function isTagCond(type: CondType) {
  return type === "has" || type === "except";
}

export function unitOf(e: AutomaticEmail): Unit {
  return e.unit === "months" ? "months" : "days";
}
export function maxFor(e: AutomaticEmail) {
  return unitOf(e) === "months" ? 120 : 3650;
}
export function daysNum(e: AutomaticEmail) {
  const s = String(e.days).trim();
  return /^\d+$/.test(s) && +s >= 1 && +s <= maxFor(e) ? +s : null;
}
// Calendar days until the send; months are approximated as 30 days for the preview.
function delayDays(e: AutomaticEmail) {
  const n = daysNum(e);
  return n === null ? null : unitOf(e) === "months" ? n * 30 : n;
}

export function ordinal(n: number) {
  const v = n % 100;
  return n + (v >= 11 && v <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th");
}
export function monthDayOf(e: AutomaticEmail) {
  const d = parseInt(e.monthDay ?? "", 10);
  return d >= 1 && d <= 28 ? d : 1;
}
// Days from today until the next occurrence of the chosen day of the month.
function daysToMonthDay(e: AutomaticEmail) {
  const next = new Date(TODAY);
  next.setDate(monthDayOf(e));
  if (next <= TODAY) next.setMonth(next.getMonth() + 1);
  return Math.round((next.getTime() - TODAY.getTime()) / 86400000);
}

export function summarize(e: AutomaticEmail) {
  const n = daysNum(e);
  const unit = unitOf(e);
  const d =
    e.delay === "now"
      ? "Immediately after "
      : e.delay === "same"
        ? "In the next send window after "
        : `${n === null ? `[N] ${unit}` : `${n} ${n === 1 ? unit.slice(0, -1) : unit}`} after `;
  const t = e.trigger === "tag" ? `the tag ${e.tag} is added to a member` : TRIG[e.trigger];
  const pos: string[] = [];
  for (const c of e.conds) {
    if (c.type === "has") pos.push(`they have the tag ${c.value}`);
    if (c.type === "before" && c.value) pos.push(`they joined before ${prettyIso(c.value)}`);
    if (c.type === "after" && c.value) pos.push(`they joined after ${prettyIso(c.value)}`);
    if (c.type === "in" && c.value) pos.push(`they joined in ${monthLabel(c.value)}`);
  }
  const ex = e.conds.filter((c) => c.type === "except").map((c) => c.value);
  let s = e.trigger === "monthly" ? `On the ${ordinal(monthDayOf(e))} of every month, to every member` : d + t;
  if (pos.length) s += `, if ${pos.join(e.match === "all" ? " and " : " or ")}`;
  if (ex.length) s += `, except members with the tag ${ex.join(" or ")}`;
  return `${s}.`;
}

function matches(e: AutomaticEmail, m: Member) {
  const joined = iso(daysAgo(m.d));
  if (e.conds.some((c) => c.type === "except" && m.tags.includes(c.value))) return false;
  const tests = e.conds
    .filter((c) => c.type !== "except")
    .map((c) => {
      if (c.type === "has") return m.tags.includes(c.value);
      if (c.type === "before") return !c.value || joined < c.value;
      if (c.type === "after") return !c.value || joined > c.value;
      if (c.type === "in") return !c.value || joined.slice(0, 7) === c.value;
      return true;
    });
  if (!tests.length) return true;
  return e.match === "all" ? tests.every(Boolean) : tests.some(Boolean);
}

export interface ScheduledRecipient {
  name: string;
  email: string;
  sendDate: string;
  when: string;
}

function scheduled(m: Member, left: number): ScheduledRecipient {
  return {
    name: m.n,
    email: `${m.n.toLowerCase().split(" ").join(".")}@example.org`,
    sendDate: pretty(daysAgo(-left)),
    when: `in ${left}${left === 1 ? " day" : " days"}`,
  };
}

/** Members already scheduled to get this email, worked out from the demo members. */
export function previewFor(e: AutomaticEmail): ScheduledRecipient[] {
  if (e.trigger === "monthly") {
    const left = daysToMonthDay(e);
    return MEMBERS.filter((m) => matches(e, m)).map((m) => scheduled(m, left));
  }
  const isJoin = e.trigger === "join_any" || e.trigger === "join_noref" || e.trigger === "join_ref";
  const n = delayDays(e);
  if (!isJoin || e.delay !== "days" || n === null) return [];
  return MEMBERS.filter((m) => {
    if (m.d >= n) return false;
    if (e.trigger === "join_noref" && m.ref) return false;
    if (e.trigger === "join_ref" && !m.ref) return false;
    return matches(e, m);
  }).map((m) => scheduled(m, n - m.d));
}

export type RecipientStatus = "sent" | "scheduled" | "review" | "notsent";

export const RECIPIENT_STATUS: Record<RecipientStatus, { label: string; variant: "success" | "info" | "warning" | "neutral" }> = {
  sent: { label: "Sent", variant: "success" },
  scheduled: { label: "Scheduled", variant: "info" },
  review: { label: "Waiting for review", variant: "warning" },
  notsent: { label: "Not sent", variant: "neutral" },
};

const SEED_RECIPIENTS: Record<string, { name: string; status: RecipientStatus; detail: string }[]> = {
  e1: [
    { name: "Ana Okafor", status: "sent", detail: "Oct 17" },
    { name: "Ben Tran", status: "sent", detail: "Oct 10" },
    { name: "Dev Patel", status: "sent", detail: "Sep 25" },
    { name: "Chloe Martin", status: "notsent", detail: "No longer matched" },
    { name: "Leo Fischer", status: "notsent", detail: "Unsubscribed" },
  ],
  e2: [
    { name: "Chloe Martin", status: "sent", detail: "Oct 2 · approved by you" },
    { name: "Farah Ali", status: "review", detail: "Due Oct 21" },
  ],
};

export function recipientsFor(e: AutomaticEmail) {
  return (
    SEED_RECIPIENTS[e.id] ??
    (e.state === "published"
      ? previewFor(e).map((p) => ({
          name: p.name,
          status: (e.mode === "review" ? "review" : "scheduled") as RecipientStatus,
          detail: `Sends ${p.when}`,
        }))
      : [])
  );
}

export const STATE_META: Record<EmailState, { label: string; variant: "success" | "neutral" }> = {
  published: { label: "Published", variant: "success" },
  draft: { label: "Draft", variant: "neutral" },
  trash: { label: "In trash", variant: "neutral" },
};

export const GROUPS: { key: EmailState; title: string; emptyText: string }[] = [
  { key: "published", title: "Published", emptyText: "Nothing is sending yet. Publish a draft to turn it on." },
  { key: "draft", title: "Drafts", emptyText: "No drafts." },
  { key: "trash", title: "Trash", emptyText: "Trash is empty." },
];

export function displayName(e: AutomaticEmail) {
  return e.name || "Untitled automatic email";
}

/** Everything wrong with the email that stops it publishing, plus the warnings shown beside the conditions. */
export function checkEmail(e: AutomaticEmail) {
  const has = e.conds.filter((c) => c.type === "has").map((c) => c.value);
  const excepts = e.conds.filter((c) => c.type === "except").map((c) => c.value);
  let conflictText = "";
  const bothTag = excepts.find((t) => has.includes(t));
  if (bothTag) {
    conflictText = `The tag ${bothTag} is both included and excepted. Exceptions always win, so no one with it gets this email.`;
  } else if (e.trigger === "tag" && excepts.includes(e.tag)) {
    conflictText = `This email starts when ${e.tag} is added, but members with ${e.tag} are excepted, so no one would ever get it.`;
  }

  const alertTo = e.alertTo ?? DEFAULT_ALERT_TO;
  const alertInvalid = e.mode === "review" && e.alert !== false && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(alertTo.trim());
  const daysInvalid = e.trigger !== "monthly" && e.delay === "days" && daysNum(e) === null;
  const incompleteCount = e.conds.filter((c) => !isTagCond(c.type) && !c.value).length;

  const before = e.conds.filter((c) => c.type === "before" && c.value).map((c) => c.value).sort()[0];
  const after = e.conds.filter((c) => c.type === "after" && c.value).map((c) => c.value).sort().reverse()[0];
  const rangeText =
    e.match === "all" && before && after && after >= before
      ? `No member can have joined both after ${prettyIso(after)} and before ${prettyIso(before)}, so no one matches. Check the dates or switch to "any".`
      : "";

  const blockers: string[] = [];
  if (!e.name.trim()) blockers.push("add a name");
  if (daysInvalid) blockers.push("fix the number of days");
  if (incompleteCount) blockers.push("finish or remove the empty condition");
  if (conflictText) blockers.push("fix the tag conflict");
  if (!e.subject.trim()) blockers.push("add a subject");
  if (alertInvalid) blockers.push("fix the alert email");

  return { conflictText, rangeText, alertInvalid, daysInvalid, blockers };
}

export const SEED: AutomaticEmail[] = [
  { id: "e1", name: "Thank-you: standard", trigger: "join_any", tag: "$1,000+", delay: "same", days: "1", match: "all", conds: [{ type: "except", value: "$1,000+" }], mode: "auto", state: "published", subject: "Thank you for joining, [First name]!", edited: 1, approved: 0, waiting: 0 },
  { id: "e2", name: "Thank-you: $1,000+", trigger: "tag", tag: "$1,000+", delay: "same", days: "1", match: "all", conds: [], mode: "review", state: "published", subject: "[First name], your support means so much", edited: 0, approved: 1, waiting: 1 },
  { id: "e3", name: "One-month check-in", trigger: "join_any", tag: "$1,000+", delay: "days", days: "30", match: "all", conds: [{ type: "except", value: "Lapsed" }], mode: "auto", state: "draft", subject: "One month in, how are things, [First name]?", edited: 0, approved: 0, waiting: 0 },
  { id: "e4", name: "Lapsed check-in", trigger: "tag", tag: "Lapsed", delay: "days", days: "7", match: "all", conds: [], mode: "review", state: "trash", subject: "We miss you, [First name]", edited: 0, approved: 0, waiting: 0 },
  { id: "e5", name: "Monthly member update", trigger: "monthly", monthDay: "1", tag: "$1,000+", delay: "same", days: "1", match: "all", conds: [{ type: "except", value: "Lapsed" }], mode: "auto", state: "draft", subject: "What's new at SDC this month, [First name]", edited: 0, approved: 0, waiting: 0 },
];

export function newEmail(id: string): AutomaticEmail {
  return { id, name: "", trigger: "join_any", tag: TAGS[0], delay: "same", days: "30", match: "all", conds: [], mode: "auto", state: "draft", subject: "", edited: 0, approved: 0, waiting: 0 };
}
