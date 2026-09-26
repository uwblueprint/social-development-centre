import type { CommunityCounts, Member, MemberPage, MemberTier, SentEmail } from "./types";
import { emailsFor, members } from "./store";

/** Backend: replace these with real queries; keep the signatures. */

export const PAGE_SIZE = 50;

const label = (m: Member) => (m.name ?? m.email).toLowerCase();
const byLabel = (a: Member, b: Member) => label(a).localeCompare(label(b));
const matcher = (q: string) => {
  const query = q.trim().toLowerCase();
  return (m: Member) => !query || m.email.toLowerCase().includes(query) || (m.name ?? "").toLowerCase().includes(query);
};

/**
 * General tab: every subscribed person, paying members included. Paying tab: subscribed paying members.
 * Unsubscribed people are never listed, except that a search on the General tab also returns
 * matching unsubscribed people, after every subscribed match (the UI badges them "Unsubscribed").
 * Search matches name or email.
 */
export async function listMembers(tier: MemberTier, q = "", page = 1): Promise<MemberPage> {
  const matches = matcher(q);
  const all = members();
  const subscribed = all.filter((m) => m.subscribed && (tier === "general" || m.tier === "paying") && matches(m)).sort(byLabel);
  const unsubscribed = tier === "general" && q.trim() ? all.filter((m) => !m.subscribed && matches(m)).sort(byLabel) : [];
  const rows = [...subscribed, ...unsubscribed];
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pageCount);
  const slice = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE).map((m) => {
    const [latest] = emailsFor(m);
    return latest ? { ...m, lastEmail: { subject: latest.subject, sentAt: latest.sentAt } } : m;
  });
  return { rows: slice, total: rows.length, page: current, pageCount };
}

/** Tab counts, narrowed by the search when one is given. Unsubscribed people are never counted. */
export async function getCommunityCounts(q = ""): Promise<CommunityCounts> {
  const subscribed = members().filter((m) => m.subscribed && matcher(q)(m));
  return {
    general: subscribed.length,
    paying: subscribed.filter((m) => m.tier === "paying").length,
  };
}

export async function getMember(id: string): Promise<Member | null> {
  return members().find((m) => m.id === id) ?? null;
}

/** Emails sent to one person, newest first, without bodies. Backend: read from the email provider's send log. */
export async function listMemberEmails(id: string): Promise<SentEmail[]> {
  const m = members().find((x) => x.id === id);
  return m ? emailsFor(m).map(({ id, kind, subject, sentAt, status }) => ({ id, kind, subject, sentAt, status })) : [];
}

/** The rendered body of one sent email, as delivered. Fetched per email, only when the panel scrolls to it. */
export async function getSentEmailHtml(memberId: string, emailId: string): Promise<string | null> {
  const m = members().find((x) => x.id === memberId);
  return (m && emailsFor(m).find((e) => e.id === emailId)?.html) ?? null;
}
