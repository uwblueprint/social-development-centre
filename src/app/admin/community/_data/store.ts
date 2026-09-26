import type { Member, SentEmail } from "./types";

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

const DAY = 86_400_000;

function html(title: string, body: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;line-height:1.5">
<h1 style="font-size:20px;margin:0 0 12px">${title}</h1>${body}
<p style="font-size:12px;margin-top:24px">Social Development Centre · <a href="#">Unsubscribe</a></p></div>`;
}

/** Deterministic sample history: a welcome (plus upgrade for paying members) and weekly opportunity digests. */
export function emailsFor(m: Member): SentEmail[] {
  const added = new Date(m.addedAt).getTime();
  const end = m.unsubscribedAt ? new Date(m.unsubscribedAt).getTime() : Date.now();
  const out: SentEmail[] = [];
  const welcome = m.tier === "paying" && Number(m.id.slice(2)) % 2 === 0 ? "paying-welcome" : "general-welcome";
  out.push({
    id: `${m.id}_w`,
    kind: welcome,
    subject: welcome === "paying-welcome" ? "Welcome to the Social Development Centre: your membership is active" : "Welcome to the Social Development Centre community",
    sentAt: new Date(added).toISOString(),
    status: "delivered",
    html: html("Welcome to the community", "<p>You're now on the Social Development Centre community list. Each week we'll email you opportunities from SDC and our partners.</p>"),
  });
  if (m.tier === "paying" && welcome === "general-welcome") {
    out.push({
      id: `${m.id}_u`,
      kind: "upgrade",
      subject: "Your Social Development Centre membership is now active",
      sentAt: new Date(added + 3 * DAY).toISOString(),
      status: "delivered",
      html: html("Your membership is active", '<p>Your account now includes paid membership.</p><p><a href="#">Access the member platform</a></p>'),
    });
  }
  const first = Math.max(added + 7 * DAY, end - 12 * 7 * DAY);
  for (let t = first, i = 0; t < end; t += 7 * DAY, i++) {
    const d = new Date(t);
    out.push({
      id: `${m.id}_o${i}`,
      kind: "opportunities",
      subject: `This week's opportunities · ${d.toLocaleDateString("en-CA", { month: "short", day: "numeric" })}`,
      sentAt: d.toISOString(),
      status: i === 4 && Number(m.id.slice(2)) % 11 === 0 ? "bounced" : "delivered",
      html: html("This week's opportunities", "<ul><li><strong>Food bank volunteers</strong> · Northside Food Bank</li><li><strong>Youth mentor</strong> · Riverbend Youth Collective</li><li><strong>ESL conversation circle</strong> · Eastside Newcomer Services</li></ul>"),
    });
  }
  return out.sort((a, b) => b.sentAt.localeCompare(a.sentAt));
}
