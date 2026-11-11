import type { PersonRow } from "@/features/people/person";

/**
 * The Member Directory's data, as the screens receive it. Written against the database in
 * docs/backend/directory.md; the design screens in src/app/design/ build against these types.
 */

/** Why no email reaches them. Unsubscribe always wins; a bounce clears when their address changes. */
export type Subscription = "subscribed" | "unsubscribed" | "bounced";

export interface Tag {
  id: string;
  name: string;
}

/** A row on the members list. */
export interface MemberRow extends PersonRow {
  firstName: string | null;
  lastName: string | null;
  joinedAt: string;
  /** YYYY-MM-DD: 12 months after joining unless an admin moved it (a renewal). */
  endsAt: string;
  tags: Tag[];
  subscription: Subscription;
}

/** A tag with how many members have it, for the tag manager. */
export interface TagSummary extends Tag {
  memberCount: number;
}

export interface Note {
  id: string;
  body: string;
  createdAt: string;
  createdBy: string | null;
  /** When it was last edited; earlier versions are in getNoteRevisions(). */
  editedAt: string | null;
}

export interface NoteRevision {
  body: string;
  writtenBy: string | null;
  writtenAt: string;
}

export interface Referral {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  /** Set once they became a member. */
  joinedAt: string | null;
  personId: string | null;
}

export type SendStatus = "scheduled" | "waiting_for_review" | "sent" | "not_sent";

/** One email in a member's history: every send, upcoming ones included. */
export interface EmailHistoryEntry {
  sendId: string;
  emailName: string;
  /** What started it: a member event kind for automatic emails, null for one-off emails. */
  startedBy: string | null;
  startedByTag: string | null;
  status: SendStatus;
  notSentReason: string | null;
  sendAt: string;
  sentAt: string | null;
  couldNotSend: boolean;
  subject: string | null;
  edited: boolean;
}

export type TimelineKind =
  | "joined"
  | "referred_someone"
  | "referral_joined"
  | "tag_added"
  | "tag_removed"
  | "note"
  | "email"
  | "unsubscribed"
  | "resubscribed"
  | "bounced"
  | "bounce_cleared";

/** One line on a member's timeline, newest first. */
export interface TimelineEntry {
  at: string;
  kind: TimelineKind;
  tagName: string | null;
  referralId: string | null;
  noteId: string | null;
  sendId: string | null;
  emailStatus: SendStatus | null;
  /** Note text, email name, unsubscribe reason or bounce detail, depending on kind. */
  body: string | null;
  /** Who did it, by name or email, when it was an admin. */
  by: string | null;
  edited: boolean;
}

/** Everything on one member's page. */
export interface MemberDetail {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  joinedAt: string;
  /** YYYY-MM-DD. */
  endsAt: string;
  joinEmails: boolean;
  hasSignedIn: boolean;
  subscription: Subscription;
  unsubscribeReason: string | null;
  bounceDetail: string | null;
  tags: Tag[];
  referredBy: { id: string; name: string | null; email: string } | null;
  referrals: Referral[];
  notes: Note[];
  timeline: TimelineEntry[];
  emails: EmailHistoryEntry[];
}
