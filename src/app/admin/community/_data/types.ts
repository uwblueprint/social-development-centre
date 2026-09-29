/** Contract between the Community UI and the backend. See docs/backend/community.md. */

export type MemberTier = "general" | "paying";

/** Who unsubscribed the person. Only people an admin unsubscribed can be resubscribed by an admin. */
export type UnsubscribedBy = "self" | "admin";

/** How the person joined. Export only: never shown in the UI. */
export type MemberSource = "legacy_import" | "booth" | "website" | "partner_event" | "referral" | "admin_added" | "file_import";

/** Whether they've finished setting up their preferences after joining. */
export type OnboardingState = "not_started" | "in_progress" | "completed";

/**
 * Where each person is in their journey. Derived on the server (see `deriveStatus`), never stored, and
 * checked in this order; the first that applies wins.
 */
export const MEMBER_STATUSES = ["unsubscribed", "invited", "onboarding_incomplete", "active", "inactive"] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

/** Shown by default: every status except Unsubscribed. */
export const DEFAULT_MEMBER_STATUSES: readonly MemberStatus[] = MEMBER_STATUSES.filter((s) => s !== "unsubscribed");

/** A CTA click within this many days makes someone Active; older clicks only, Inactive. */
export const ACTIVE_WINDOW_DAYS = 60;

/** What the stored record holds. `Member` adds what's derived from it and the send log. */
export interface MemberRecord {
  id: string;
  /** Optional: pasted addresses often have no name; it can be added later. */
  name?: string;
  email: string;
  /** Paying access is independent of email subscription: an unsubscribed person can be paying. */
  tier: MemberTier;
  subscribed: boolean;
  addedAt: string;
  unsubscribedAt?: string;
  /** Set whenever `subscribed` is false. */
  unsubscribedBy?: UnsubscribedBy;
  onboarding: OnboardingState;
  /** Export only. */
  source: MemberSource;
  /** Export only: e.g. the booth's location or the partner event's name. */
  sourceDetail?: string;
}

/** One person as the list and panel show them. `source` stays on the server (export only). */
export interface Member extends Omit<MemberRecord, "source" | "sourceDetail"> {
  status: MemberStatus;
  /** Total primary-action clicks (signed up or took action) across every email. Shares and opens don't count. */
  ctaClicks: number;
  lastClickAt?: string;
  /** Most recent email sent to this person, for the table. */
  lastEmail?: { subject: string; sentAt: string };
}

export type EmailKind = "general-welcome" | "paying-welcome" | "paying-added" | "paying-removed" | "opportunities";

/** An opportunity's primary action: register for something, or do something (sign a petition). */
export type CtaKind = "sign_up" | "take_action";

/** One thing a person did with an opportunity in an email. Opens are never recorded. */
export interface OpportunityAction {
  /** `cta`: clicked the primary action. `share`: used "Invite a friend". */
  type: "cta" | "share";
  at: string;
}

/** One opportunity an email contained, and what this person did with it. */
export interface EmailOpportunity {
  id: string;
  title: string;
  cta: CtaKind;
  actions: OpportunityAction[];
}

/**
 * One email this person was sent, newest first. The rendered message isn't included: the panel
 * fetches each body separately (`getSentEmailHtml`) only when it scrolls into view.
 */
export interface SentEmail {
  id: string;
  kind: EmailKind;
  subject: string;
  sentAt: string;
  status: "delivered" | "not-delivered";
  /** The opportunities it contained (opportunity emails only), each with this person's actions. */
  opportunities: EmailOpportunity[];
}

/** Columns the member list can sort by (the `sort` URL param). `added` is the default order, not a column. */
export const MEMBER_SORT_KEYS = ["name", "email", "clicks", "sent", "added"] as const;
export type MemberSortKey = (typeof MEMBER_SORT_KEYS)[number];

export interface MemberSort {
  key: MemberSortKey;
  direction: "asc" | "desc";
}

/** The order when no sort is chosen: newest added first. */
export const DEFAULT_MEMBER_SORT: MemberSort = { key: "added", direction: "desc" };

export interface MemberPage {
  rows: Member[];
  total: number;
  page: number;
  pageCount: number;
}

/** Counts for the tabs, the Status filter and the empty states. All narrowed by the search when there is one. */
export interface CommunityCounts {
  /** General members (not paying) with a selected status. */
  general: number;
  /** Paying members with a selected status. */
  paying: number;
  /** Matches in each tab that the Status filter hides. */
  hidden: Record<MemberTier, number>;
  /** People in the current tab per status, whatever the filter, for the filter's options. */
  byStatus: Record<MemberStatus, number>;
}

/** One address from the admin's input, with the name given for it (or the existing record's name). */
export interface ImportEntry {
  email: string;
  name?: string;
}

/** An unsubscribed person found in the input. */
export interface UnsubscribedEntry extends ImportEntry {
  /** True when "make them paying members" is checked and they're general: they become paying either way. */
  willConvert: boolean;
}

/**
 * Result of checking an Add member or Import members input before anything is saved or sent.
 * Every valid, distinct address is in exactly one of: added, converted, alreadyPaying,
 * alreadyMembers, unsubscribedSelf, unsubscribedAdmin, deleted. `duplicates` and `invalid` describe the input.
 */
export interface ImportPreview {
  /** "Make them paying members" was checked. */
  paying: boolean;
  /** New people, created as paying (when `paying`) or general members, and welcomed. */
  added: ImportEntry[];
  /** Subscribed general members who become paying (only when `paying`). */
  converted: ImportEntry[];
  /** Subscribed paying members: no change. Paying members are never downgraded. */
  alreadyPaying: ImportEntry[];
  /** Subscribed general members when `paying` is off: no change. */
  alreadyMembers: ImportEntry[];
  /** Addresses entered more than once; each is handled once. */
  duplicates: string[];
  /** Entries that aren't email addresses, as typed. Skipped. */
  invalid: string[];
  /** People who unsubscribed themselves: never resubscribed; still converted when `willConvert`. */
  unsubscribedSelf: UnsubscribedEntry[];
  /** People an admin unsubscribed: resubscribed only if the admin checks "Resubscribe…" in the preview. */
  unsubscribedAdmin: UnsubscribedEntry[];
  /** Addresses of people who were deleted: never re-added by an admin. Skipped. */
  deleted: string[];
}

/** Which tier to export; "both" is General members plus Paying members. */
export type ExportScope = "general" | "paying" | "both";

/** Members: one row per person. Activity: one row per click (primary action or share). */
export type ExportKind = "members" | "activity";
