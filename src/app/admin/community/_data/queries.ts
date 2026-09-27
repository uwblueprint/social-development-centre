import { DEFAULT_MEMBER_SORT } from "./types";
import type { CommunityCounts, Member, MemberPage, MemberSort, MemberTier, SentEmail } from "./types";
import { emailsFor, members } from "./store";

/** Backend: replace these with real queries; keep the signatures. */

export const PAGE_SIZE = 50;

const withLastEmail = (m: Member): Member => {
  const [latest] = emailsFor(m);
  return latest ? { ...m, lastEmail: { subject: latest.subject, sentAt: latest.sentAt } } : m;
};

/** The value each sort key orders by; `undefined` (no name, never emailed) always sorts last. */
const sortValue: Record<MemberSort["key"], (m: Member) => string | undefined> = {
  name: (m) => m.name?.toLowerCase(),
  email: (m) => m.email.toLowerCase(),
  sent: (m) => m.lastEmail?.sentAt,
  added: (m) => m.addedAt,
};

/** Orders by the sort's value, missing values last in either direction, then by id so pages never overlap. */
const comparator = ({ key, direction }: MemberSort) => (a: Member, b: Member) => {
  const va = sortValue[key](a);
  const vb = sortValue[key](b);
  if (va !== vb) {
    if (va === undefined) return 1;
    if (vb === undefined) return -1;
    const order = va.localeCompare(vb);
    if (order !== 0) return direction === "asc" ? order : -order;
  }
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
};
const matcher = (q: string) => {
  const query = q.trim().toLowerCase();
  return (m: Member) => !query || m.email.toLowerCase().includes(query) || (m.name ?? "").toLowerCase().includes(query);
};

/**
 * General tab: every subscribed person, paying members included. Paying tab: subscribed paying members.
 * Unsubscribed people are never listed, except that a search on the General tab also returns
 * matching unsubscribed people, after every subscribed match (the UI badges them "Unsubscribed").
 * Search matches name or email. `sort` orders each group (subscribed, then unsubscribed) on its own,
 * so unsubscribed matches stay at the end whatever the sort; ties break on id.
 */
export async function listMembers(tier: MemberTier, q = "", page = 1, sort: MemberSort = DEFAULT_MEMBER_SORT): Promise<MemberPage> {
  const matches = matcher(q);
  const byChosenSort = comparator(sort);
  const all = members().map(withLastEmail);
  const subscribed = all.filter((m) => m.subscribed && (tier === "general" || m.tier === "paying") && matches(m)).sort(byChosenSort);
  const unsubscribed = tier === "general" && q.trim() ? all.filter((m) => !m.subscribed && matches(m)).sort(byChosenSort) : [];
  const rows = [...subscribed, ...unsubscribed];
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pageCount);
  const slice = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  return { rows: slice, total: rows.length, page: current, pageCount };
}

/**
 * Tab counts, narrowed by the search when one is given. Unsubscribed people are never in the tab counts;
 * `unsubscribedMatches` counts the unsubscribed people a search matches (0 without a search).
 */
export async function getCommunityCounts(q = ""): Promise<CommunityCounts> {
  const matches = matcher(q);
  const subscribed = members().filter((m) => m.subscribed && matches(m));
  return {
    general: subscribed.length,
    paying: subscribed.filter((m) => m.tier === "paying").length,
    unsubscribedMatches: q.trim() ? members().filter((m) => !m.subscribed && matches(m)).length : 0,
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
