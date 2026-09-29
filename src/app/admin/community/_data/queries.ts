import { labRead } from "@/dev/state-lab/state"; // STATE LAB (disposable)
import { DEFAULT_MEMBER_SORT, MEMBER_STATUSES } from "./types";
import type { CommunityCounts, Member, MemberPage, MemberRecord, MemberSort, MemberStatus, MemberTier, SentEmail } from "./types";
import { summarizeActivity } from "./status";
import { emailsFor, members, renderEmail } from "./store";

/** Backend: replace these with real queries; keep the signatures. */

export const PAGE_SIZE = 50;

/** The record as the UI sees it: derived status and clicks added, source left on the server (listed field by field so it never leaks). */
export function toMember(record: MemberRecord, now = Date.now()): Member {
  const { id, name, email, tier, subscribed, addedAt, unsubscribedAt, unsubscribedBy, onboarding } = record;
  const { status, ctaClicks, lastClickAt, lastEmail } = summarizeActivity(record, emailsFor(record), now);
  return { id, name, email, tier, subscribed, addedAt, unsubscribedAt, unsubscribedBy, onboarding, status, ctaClicks, lastClickAt, lastEmail };
}

/** The value each sort key orders by; `undefined` (no name, never emailed) always sorts last. */
const sortValue: Record<MemberSort["key"], (m: Member) => string | number | undefined> = {
  name: (m) => m.name?.toLowerCase(),
  email: (m) => m.email.toLowerCase(),
  clicks: (m) => m.ctaClicks,
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
    const order = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
    if (order !== 0) return direction === "asc" ? order : -order;
  }
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
};

const matcher = (q: string) => {
  const query = q.trim().toLowerCase();
  return (m: MemberRecord) => !query || m.email.toLowerCase().includes(query) || (m.name ?? "").toLowerCase().includes(query);
};

/** Everyone matching the search, with derived fields. */
function matching(q: string): Member[] {
  const now = Date.now();
  return members().filter(matcher(q)).map((m) => toMember(m, now));
}

/**
 * The tabs are exclusive (owner, 27 Sep): General is `tier = general`, Paying is `tier = paying`.
 * `statuses` is the Status filter; unsubscribed people are listed only when it includes `unsubscribed`
 * (the default leaves it out). Search matches name or email. Ties break on id.
 */
export async function listMembers(
  tier: MemberTier,
  q = "",
  page = 1,
  sort: MemberSort = DEFAULT_MEMBER_SORT,
  statuses: readonly MemberStatus[] = MEMBER_STATUSES,
): Promise<MemberPage> {
  await labRead(); // STATE LAB (disposable)
  const rows = matching(q)
    .filter((m) => m.tier === tier && statuses.includes(m.status))
    .sort(comparator(sort));
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pageCount);
  return { rows: rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE), total: rows.length, page: current, pageCount };
}

/** Tab counts and hidden matches follow the search and the Status filter; `byStatus` is for `tier` and ignores the filter. */
export async function getCommunityCounts(tier: MemberTier, q = "", statuses: readonly MemberStatus[] = MEMBER_STATUSES): Promise<CommunityCounts> {
  const counts: CommunityCounts = {
    general: 0,
    paying: 0,
    hidden: { general: 0, paying: 0 },
    byStatus: Object.fromEntries(MEMBER_STATUSES.map((s) => [s, 0])) as Record<MemberStatus, number>,
  };
  for (const m of matching(q)) {
    if (statuses.includes(m.status)) counts[m.tier]++;
    else counts.hidden[m.tier]++;
    if (m.tier === tier) counts.byStatus[m.status]++;
  }
  return counts;
}

export async function getMember(id: string): Promise<Member | null> {
  const m = members().find((x) => x.id === id);
  return m ? toMember(m) : null;
}

/** Emails sent to one person, newest first, with each opportunity's actions but no bodies. Backend: the provider's send log plus click tracking. */
export async function listMemberEmails(id: string): Promise<SentEmail[]> {
  const m = members().find((x) => x.id === id);
  return m ? emailsFor(m) : [];
}

/** The rendered body of one sent email, as delivered. Fetched per email, only when the panel scrolls to it. */
export async function getSentEmailHtml(memberId: string, emailId: string): Promise<string | null> {
  const m = members().find((x) => x.id === memberId);
  const email = m && emailsFor(m).find((e) => e.id === emailId);
  return email ? renderEmail(email) : null;
}
