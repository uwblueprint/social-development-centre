import type { Audience, Member } from "../model";

/** Where the emails prototype lives. */
export const BASE = "/emails-pm-prototype";
export const ONE_OFF = `${BASE}/one-off`;

/** Rows per page in recipient lists, so hundreds of recipients stay scannable. */
export const PAGE_SIZE = 25;

export const copy = {
  title: "One-off emails",
  newEmail: "New email",
  loadError: "We couldn't load one-off emails.",
  loadErrorBody: "Your drafts and sent emails are safe.",
  retry: "Try again",
  notFoundTitle: "We couldn't find that email",
  back: "Back",
  noSubject: "No subject",
  testFailed: "We couldn't send the test. Try again.",
} as const;

/** "Amira Haddad", or the email when the member has no name. */
export function memberName(m: Pick<Member, "firstName" | "lastName" | "email">): string {
  const n = `${m.firstName} ${m.lastName}`.trim();
  return n || m.email;
}

export function members(n: number): string {
  return `${n} ${n === 1 ? "member" : "members"}`;
}

/** "All members", "Tag: Board", "3 people", "A group". Four words or fewer, for rows and headers. */
export function toWhom(a: Audience): string {
  if (a.kind === "all") return "All members";
  if (a.kind === "hand") {
    const n = a.memberIds.length;
    return n === 0 ? "No one yet" : `${n} ${n === 1 ? "person" : "people"}`;
  }
  const rules = a.conditions.rules;
  const only = rules.length === 1 ? rules[0] : undefined;
  if (only?.type === "has-tag" && only.tag) return `Tag: ${only.tag}`;
  if (only?.type === "except-tag" && only.tag) return `Not tag: ${only.tag}`;
  return rules.length === 0 ? "A group" : `Group of ${rules.length} rules`;
}

export function formatDateTime(iso: string | undefined): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Toronto",
  }).format(new Date(iso));
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeZone: "America/Toronto" }).format(new Date(iso));
}

/** "Oct 18, 11:50 p.m.": short enough for a narrow column. */
export function formatShort(iso: string | undefined): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Toronto" }).format(new Date(iso));
}
