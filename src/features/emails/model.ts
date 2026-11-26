/*
 * Emails prototype: the shared contract. Types, constants and the store API every flow codes against.
 * Frontend-only: everything lives in memory (see store.tsx). Nothing here talks to a server.
 *
 * Words follow the PRDs: Scheduled / Waiting for review / Sent / Not sent. "Couldn't send" is a label on a
 * scheduled send the provider rejected for 24 hours, not a status (`Send.couldntSend`). "Waiting for you"
 * is a derived group in the Outbox, not a status.
 */

export const ADMINS = { me: "Suhanya", other: "Priya" } as const;
export const TIME_ZONE = "America/Toronto";
export const UNDO_MS = 60_000;
export const OUTBOX_DAYS = 30;

/* ---------- Members ---------- */

export type MemberStatus = "active" | "unsubscribed" | "bounced" | "reported-spam";

export interface Member {
  id: string;
  firstName: string; // may be "" to test fallbacks
  lastName: string;
  email: string;
  joinedAt: string; // ISO
  tags: string[];
  status: MemberStatus;
  referredBy?: string; // member id
  /** Emails already sent to them this calendar month, for the monthly limit warning. */
  sentThisMonth: number;
}

/** Why a member can't receive an email. Order matters for display. */
export const EXCLUSION_REASON: Record<Exclude<MemberStatus, "active">, string> = {
  unsubscribed: "Unsubscribed",
  bounced: "Bounced",
  "reported-spam": "Reported spam",
};

/* ---------- Moments, delays, conditions (Automatic Emails + One-off audience) ---------- */

export type MomentType =
  | "join-any"
  | "join-no-referral"
  | "join-referral"
  | "refers-someone"
  | "referral-joins"
  | "tag-added";

export const MOMENT_LABEL: Record<MomentType, string> = {
  "join-any": "Member joins (any way)",
  "join-no-referral": "Member joins without a referral",
  "join-referral": "Member joins via referral",
  "refers-someone": "Member refers someone",
  "referral-joins": "Member's referral joins",
  "tag-added": "Tag added to member",
};

export interface Moment {
  type: MomentType;
  tag?: string; // when type === "tag-added"
}

export type Delay = { kind: "immediately" } | { kind: "same-day" } | { kind: "days-after"; days: number };

export type Rule =
  | { id: string; type: "has-tag"; tag: string }
  | { id: string; type: "except-tag"; tag: string }
  | { id: string; type: "joined-before"; date: string } // yyyy-mm-dd
  | { id: string; type: "joined-after"; date: string }
  | { id: string; type: "joined-in"; month: string }; // yyyy-mm

export interface Conditions {
  match: "all" | "any";
  rules: Rule[];
}

/* ---------- Email content and variables ---------- */

/**
 * Stored content. `subject` is plain text and `bodyHtml` is HTML limited to p, strong, em, a, ul, ol, li, br.
 * Variables are stored as tokens like `{{member.firstName}}` in both; the editor shows them as chips.
 * The footer is NOT part of the content: it is attached automatically (settings.footer).
 */
export interface EmailContent {
  subject: string;
  bodyHtml: string;
}

export type VarKey =
  | "member.firstName"
  | "member.lastName"
  | "member.fullName"
  | "member.email"
  | "member.joinDate"
  | "referrer.firstName"
  | "referrer.lastName"
  | "referrer.fullName"
  | "referred.firstName"
  | "referred.lastName"
  | "referred.fullName";

export interface VarDef {
  key: VarKey;
  label: string; // chip text, e.g. "First name"
  group: "Member" | "Referrer" | "Referred person";
  example: string; // shown on chip hover
  defaultFallback: string;
}

export const VARIABLES: VarDef[] = [
  { key: "member.firstName", label: "First name", group: "Member", example: "Amira", defaultFallback: "there" },
  { key: "member.lastName", label: "Last name", group: "Member", example: "Haddad", defaultFallback: "" },
  { key: "member.fullName", label: "Full name", group: "Member", example: "Amira Haddad", defaultFallback: "friend" },
  { key: "member.email", label: "Email", group: "Member", example: "amira@example.com", defaultFallback: "" },
  { key: "member.joinDate", label: "Join date", group: "Member", example: "March 4, 2026", defaultFallback: "" },
  { key: "referrer.firstName", label: "Referrer first name", group: "Referrer", example: "Dev", defaultFallback: "a friend" },
  { key: "referrer.lastName", label: "Referrer last name", group: "Referrer", example: "Patel", defaultFallback: "" },
  { key: "referrer.fullName", label: "Referrer full name", group: "Referrer", example: "Dev Patel", defaultFallback: "a friend" },
  { key: "referred.firstName", label: "Referred person first name", group: "Referred person", example: "Lena", defaultFallback: "a friend" },
  { key: "referred.lastName", label: "Referred person last name", group: "Referred person", example: "Kim", defaultFallback: "" },
  { key: "referred.fullName", label: "Referred person full name", group: "Referred person", example: "Lena Kim", defaultFallback: "a friend" },
];

/** Which variables an email can use. `moment` is undefined for one-off emails (member variables only). */
export function variablesFor(moment: Moment | undefined): VarDef[] {
  return VARIABLES.filter((v) => {
    if (v.group === "Member") return true;
    if (!moment) return false;
    if (v.group === "Referrer") return moment.type === "join-referral";
    return moment.type === "refers-someone" || moment.type === "referral-joins";
  });
}

export type Fallbacks = Record<VarKey, string>;

/* ---------- Automatic emails ---------- */

export type AutomaticState = "draft" | "published" | "trash";
export type SendMode = "automatic" | "review";

export interface AutomaticEmail {
  id: string;
  name: string;
  moment: Moment | null; // null until chosen (new draft)
  delay: Delay | null;
  conditions: Conditions;
  content: EmailContent;
  sendMode: SendMode | null;
  state: AutomaticState;
  /** Set on unpublish; used on the next publish for catch-up. Cleared by publish. Not set by trash. */
  stoppedLiveAt?: string;
  /** True once published at least once (first publish confirmation differs from a re-publish). */
  everPublished: boolean;
  updatedAt: string;
}

/* ---------- Sends (one row per member per occurrence) ---------- */

export type SendStatus = "scheduled" | "waiting-review" | "sent" | "not-sent";

export type NotSentReason =
  | "no-longer-matched"
  | "unpublished"
  | "unsubscribed"
  | "bounced"
  | "reported-spam"
  | "removed-by-admin";

export const NOT_SENT_LABEL: Record<NotSentReason, string> = {
  "no-longer-matched": "No longer matched",
  unpublished: "Unpublished",
  unsubscribed: "Unsubscribed",
  bounced: "Bounced",
  "reported-spam": "Reported spam",
  "removed-by-admin": "Removed by admin",
};

export interface SendLock {
  by: string; // admin name
}

export interface Send {
  id: string;
  memberId: string;
  /** automaticId for automatic emails, oneOffId for one-off emails. */
  source: { kind: "automatic"; automaticId: string } | { kind: "one-off"; oneOffId: string };
  /** The occurrence this send is for ("join", a referral id, or a tag-added event id). Keys one-send-per-occurrence. */
  occurrence: string;
  status: SendStatus;
  notSentReason?: NotSentReason;
  /** When it is due. Morning sends carry a time inside the 10:30-11:30 Toronto window; UI labels say "morning". */
  sendAt: string;
  /** The admin chose to send it ("now" = Send now, "morning" = Approve when its day has passed). Holds even if she later discards edits. */
  chosen?: "now" | "morning";
  approved?: boolean;
  /** Copy owned by this send once the admin edits it. Unedited sends render from the automatic email. */
  editedContent?: EmailContent;
  /** Set when a catch-up send: the time it was originally due while the automatic email was unpublished. */
  missedDueAt?: string;
  /** The provider rejected it for 24 hours: shows in Waiting for you as "Couldn't send" with Retry / Don't send. */
  couldntSend?: boolean;
  /** 1-minute window after Approve, Send now, Don't send or a one-off Send. Worker can't claim until it ends. */
  undo?: { until: string; action: "approve" | "send-now" | "dont-send" | "one-off" };
  /** Open for editing by an admin. The send is paused while the lock holds. */
  lock?: SendLock;
  sentAt?: string;
  /** Exact subject and body that went out (variables already filled in). */
  sentSubject?: string;
  sentBodyHtml?: string;
}

/* ---------- One-off emails ---------- */

export type Audience =
  | { kind: "all" }
  | { kind: "conditions"; conditions: Conditions }
  | { kind: "hand"; memberIds: string[] };

export interface OneOffEmail {
  id: string;
  content: EmailContent;
  audience: Audience;
  /** Members the admin removed from this send (all and conditions audiences). */
  removedIds: string[];
  status: "draft" | "sending" | "sent";
  updatedAt: string;
  sentAt?: string;
  /** Fixed at send time. */
  recipientIds?: string[];
  excludedIds?: string[];
}

/* ---------- Settings, lab ---------- */

export interface Settings {
  senderName: string; // "Suhanya from SDC"
  replyTo: string;
  monthlyLimit: number;
  /** Contains {{unsubscribe}}Unsubscribe{{/unsubscribe}} style tag; the prototype renders it as `Suhanya at SDC | Unsubscribe`. */
  footer: string;
  mailingAddress: string;
}

export const LAB_FLAGS = [
  "slowLoad",
  "loadError",
  "empty",
  "longText",
  "slowSave",
  "saveError",
  "providerDown",
  "otherAdminEditing",
  "overMonthlyLimit",
  "offline",
] as const;
export type LabFlag = (typeof LAB_FLAGS)[number];
export type LabFlags = Record<LabFlag, boolean>;

export type ActionResult = { ok: true } | { ok: false; error: string };

export interface EmailsState {
  members: Member[];
  automatic: AutomaticEmail[];
  sends: Send[];
  oneOffs: OneOffEmail[];
  fallbacks: Fallbacks;
  settings: Settings;
}

export interface PublishPreview {
  everPublished: boolean;
  /** Members scheduled as normal. */
  scheduled: number;
  /** Sends that come back as waiting for review (were waiting, or approved, at unpublish). */
  comeBackForReview: number;
  /** Members who missed it while unpublished; they wait in "Waiting for you". */
  missed: number;
  /** Members whose send would push them past the monthly limit. */
  overLimit: number;
}

export interface UnpublishPreview {
  /** Sends the admin edited in the Outbox (links to them), wiped on unpublish. */
  edited: Send[];
  approved: number;
  waitingForReview: number;
  /** Sends another admin has open; their edit is lost. */
  openByOther: { send: Send; by: string }[];
}

export interface AudienceResult {
  recipients: Member[];
  excluded: { member: Member; reason: string }[];
}

/**
 * The store API (implemented in store.tsx; get it with `useEmails()`).
 * Mutations that a person triggers return Promise<ActionResult> and honour the lab's slow/failing save.
 * If a flow needs something this API doesn't have, derive it from `state` and use `mutate` as an escape
 * hatch, and write the gap into docs/backend/emails.md (do NOT edit store.tsx).
 */
export interface EmailsApi {
  state: EmailsState;
  /** Ticks every second; the Lab can move it forward. */
  now: Date;
  lab: LabFlags;
  setLab(flag: LabFlag, on: boolean): void;
  resetLab(): void;
  advanceClock(ms: number): void;
  /** Re-seeds the data. */
  resetData(scenario?: "default" | "busy" | "empty"): void;
  /** Direct state change for things the API lacks. Synchronous, no lab effects. */
  mutate(updater: (s: EmailsState) => EmailsState): void;

  /** Call in each page: honours the lab's slow load / failed load. */
  usePageLoad(): { status: "loading" | "ready" | "error"; retry(): void };

  /* selectors */
  member(id: string): Member | undefined;
  /** Waiting-for-review sends that are inside the 30-day window or past due (the platform-wide count). */
  reviewCount: number;
  /** Sends whose due date has passed and need her: waiting for review or Couldn't send. */
  waitingForYou: Send[];
  /** Sends due in the next 30 days (and waiting-for-you), excluding sent / not-sent. */
  outbox: Send[];
  sendsFor(automaticId: string): Send[];
  /** Members who'd get this draft today: moment already happened, send date still ahead (Automatic Emails "Who is scheduled"). */
  scheduledFor(email: AutomaticEmail): Member[];
  renderFor(content: EmailContent, member: Member, opts?: { moment?: Moment }): { subject: string; bodyHtml: string };
  matches(conditions: Conditions, member: Member): boolean;

  /* automatic emails */
  createAutomatic(): AutomaticEmail;
  updateAutomatic(id: string, patch: Partial<AutomaticEmail>): Promise<ActionResult>;
  previewPublish(id: string): PublishPreview;
  publish(id: string): Promise<ActionResult>;
  previewUnpublish(id: string): UnpublishPreview;
  unpublish(id: string): Promise<ActionResult>;
  trash(id: string): Promise<ActionResult>;
  restore(id: string): Promise<ActionResult>;
  duplicate(id: string): AutomaticEmail;
  sendTest(content: EmailContent, memberId?: string): Promise<ActionResult>;
  setFallback(key: VarKey, value: string): Promise<ActionResult>;

  /* outbox */
  approve(sendIds: string[], opts?: { now?: boolean }): Promise<ActionResult>;
  sendNow(sendIds: string[]): Promise<ActionResult>;
  dontSend(sendIds: string[]): Promise<ActionResult>;
  /** Undo within the 1-minute window after approve / send now / don't send / one-off send. */
  undo(sendIds: string[]): Promise<ActionResult>;
  retry(sendId: string): Promise<ActionResult>;
  resetToOriginal(sendId: string): Promise<ActionResult>;
  /** Opens for editing: pauses the send and takes the lock. Fails with `by` if another admin has it. */
  openForEdit(sendId: string): { ok: true } | { ok: false; by: string };
  /** Update for one member, or the whole batch (`scope: "batch"` = every send with the same source and sendAt day). */
  updateSend(
    sendId: string,
    content: EmailContent,
    opts?: { scope?: "one" | "batch"; overwriteEdited?: boolean },
  ): Promise<ActionResult>;
  /** Discards unsaved edits and releases the lock; the send goes as planned. */
  closeEdit(sendId: string): void;
  batchEditedCount(sendId: string): number;

  /* one-off emails */
  createOneOff(prefillMemberId?: string): OneOffEmail;
  updateOneOff(id: string, patch: Partial<OneOffEmail>): Promise<ActionResult>;
  deleteOneOff(id: string): Promise<ActionResult>;
  duplicateOneOff(id: string): OneOffEmail;
  resolveAudience(audience: Audience, removedIds?: string[]): AudienceResult;
  /** Freezes the audience, creates one send per recipient with a 1-minute undo. */
  sendOneOff(id: string): Promise<ActionResult>;
  /** Undo returns it to drafts. */
  undoOneOff(id: string): Promise<ActionResult>;
  /** Members this send would push past the monthly limit. */
  overLimitFor(memberIds: string[]): Member[];
}
