/** Contract between the Community UI and the backend. See docs/backend/community.md. */

export type MemberTier = "general" | "paying";

/** Who unsubscribed the person. Only people an admin unsubscribed can be resubscribed by an admin. */
export type UnsubscribedBy = "self" | "admin";

export interface Member {
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
  /** Most recent email sent to this person, for the table. */
  lastEmail?: { subject: string; sentAt: string };
}

export type EmailKind = "general-welcome" | "paying-welcome" | "paying-added" | "paying-removed" | "opportunities";

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
}

/** Columns the member list can sort by (the `sort` URL param). */
export const MEMBER_SORT_KEYS = ["name", "email", "sent", "added"] as const;
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

/** Subscribed people only; unsubscribed people are never counted. */
export interface CommunityCounts {
  /** Every subscribed person, paying members included. */
  general: number;
  /** Subscribed paying members. */
  paying: number;
  /**
   * Unsubscribed people matching the search (0 when there's no search). They're listed only at the end of
   * General members search results, so an empty Paying search uses this to say where its matches are.
   */
  unsubscribedMatches: number;
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
 * alreadyMembers, unsubscribedSelf, unsubscribedAdmin. `duplicates` and `invalid` describe the input.
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
}

/** "general" is every subscribed person (paying included), matching the General members tab. */
export type ExportScope = "general" | "paying";
