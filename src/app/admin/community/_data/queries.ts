import type { CommunityCounts, Member, MemberPage, MemberTier, SentEmail } from "./types";
import { emailsFor, members } from "./store";

/** Backend: replace these with real queries; keep the signatures. */

export const PAGE_SIZE = 50;

const label = (m: Member) => (m.name ?? m.email).toLowerCase();

/**
 * General tab: subscribed general members first, then every unsubscribed record (badged).
 * Paying tab: subscribed paying members. Search matches name or email across the tab's records.
 */
export async function listMembers(tier: MemberTier, q = "", page = 1): Promise<MemberPage> {
  const query = q.trim().toLowerCase();
  const rows = members()
    .filter((m) => (tier === "paying" ? m.tier === "paying" && m.subscribed : m.tier === "general"))
    .filter((m) => !query || m.email.toLowerCase().includes(query) || (m.name ?? "").toLowerCase().includes(query))
    .sort((a, b) => Number(b.subscribed) - Number(a.subscribed) || label(a).localeCompare(label(b)));
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pageCount);
  const slice = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE).map((m) => {
    const [latest] = emailsFor(m);
    return latest ? { ...m, lastEmail: { subject: latest.subject, sentAt: latest.sentAt } } : m;
  });
  return { rows: slice, total: rows.length, page: current, pageCount };
}

export async function getCommunityCounts(): Promise<CommunityCounts> {
  const all = members();
  return {
    general: all.filter((m) => m.tier === "general" && m.subscribed).length,
    paying: all.filter((m) => m.tier === "paying" && m.subscribed).length,
    unsubscribed: all.filter((m) => !m.subscribed).length,
  };
}

export async function getMember(id: string): Promise<Member | null> {
  return members().find((m) => m.id === id) ?? null;
}

/** Emails sent to one person, newest first. Backend: read from the email provider's send log. */
export async function listMemberEmails(id: string): Promise<SentEmail[]> {
  const m = members().find((x) => x.id === id);
  return m ? emailsFor(m) : [];
}
