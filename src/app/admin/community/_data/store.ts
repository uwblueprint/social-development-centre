import type { Member } from "./types";

/*
 * In-memory stand-in for the backend so the UI works end to end in development.
 * Resets on server restart. Backend: replace queries.ts and actions.ts; delete this file.
 */

const FIRST = ["Amara", "Luis", "Priya", "Sam", "Hannah", "Omar", "Julia", "Tom", "Grace", "Ben", "Aisha", "Noah", "Mei", "Ravi", "Lena", "Diego", "Fatima", "Jonas", "Chloe", "Kwame"];
const LAST = ["Okafor", "Romero", "Nair", "Chen", "Lee", "Haddad", "Novak", "Becker", "Wu", "Adeyemi", "Singh", "Martin", "Tremblay", "Roy", "Gagnon", "Kim", "Patel", "Nguyen", "Silva", "Mensah"];

function seed(): Member[] {
  const out: Member[] = [];
  const day = 86_400_000;
  for (let i = 0; i < 1000; i++) {
    const first = FIRST[i % FIRST.length];
    const last = LAST[Math.floor(i / FIRST.length) % LAST.length];
    const tier = i % 16 === 3 ? "paying" : "general";
    const unsubscribed = tier === "general" && i % 25 === 7;
    out.push({
      id: `m_${i + 1}`,
      name: i % 9 === 4 ? undefined : `${first} ${last}`,
      email: `${first}.${last}${i}`.toLowerCase() + "@example.org",
      tier,
      subscribed: !unsubscribed,
      addedAt: new Date(Date.now() - (i + 1) * day).toISOString(),
      unsubscribedAt: unsubscribed ? new Date(Date.now() - i * 3600_000).toISOString() : undefined,
    });
  }
  return out;
}

const g = globalThis as unknown as { __communityStore?: Member[]; __communitySeq?: number };
export const members = (): Member[] => (g.__communityStore ??= seed());
export const nextMemberId = () => `m_${(g.__communitySeq = (g.__communitySeq ?? 5000) + 1)}`;
export const findByEmail = (email: string) => members().find((m) => m.email.toLowerCase() === email.toLowerCase());
