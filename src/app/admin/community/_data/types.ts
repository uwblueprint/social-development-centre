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
}

export interface MemberPage {
  rows: Member[];
  total: number;
  page: number;
  pageCount: number;
}

export interface CommunityCounts {
  general: number;
  paying: number;
  unsubscribed: number;
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

export type ExportScope = "general" | "paying" | "all";
