/** Contract between the Community UI and the backend. See docs/backend/community.md. */

export type MemberTier = "general" | "paying";

export interface Member {
  id: string;
  /** Optional: pasted addresses often have no name; it can be added later. */
  name?: string;
  email: string;
  /** Unsubscribed people are always "general" (unsubscribing removes paid access). */
  tier: MemberTier;
  subscribed: boolean;
  addedAt: string;
  unsubscribedAt?: string;
  /** Most recent email sent to this person, for the table. */
  lastEmail?: { subject: string; sentAt: string };
}

export type EmailKind = "general-welcome" | "paying-welcome" | "upgrade" | "revoked" | "opportunities";

/**
 * One email this person was sent, newest first. The rendered message isn't included: the panel
 * fetches each body separately (`getSentEmailHtml`) only when it scrolls into view.
 */
export interface SentEmail {
  id: string;
  kind: EmailKind;
  subject: string;
  sentAt: string;
  status: "delivered" | "bounced";
}

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
}

/** Result of checking pasted addresses before anything is saved or sent. */
export interface ImportPreview {
  tier: MemberTier;
  /** New people who will be created and welcomed. */
  toCreate: string[];
  /** Existing subscribed general members who will be upgraded (paying tab only). */
  toUpgrade: string[];
  /** Already in the destination category, or paying members pasted into General (never downgraded). */
  toSkip: { email: string; reason: "already-general" | "already-paying" | "paying-not-downgraded" }[];
  /** Unsubscribed addresses: not imported; an admin must restore them deliberately. */
  unsubscribed: string[];
  invalid: string[];
  duplicatesRemoved: number;
  /** Emails that will be sent on confirm (welcome, new-paying or upgrade). */
  emailsToSend: number;
}

/** "general" is every subscribed person (paying included), matching the General members tab. */
export type ExportScope = "general" | "paying";
