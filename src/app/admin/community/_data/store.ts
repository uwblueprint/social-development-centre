import type { CtaKind, EmailKind, EmailOpportunity, MemberRecord, MemberSource, OnboardingState, SentEmail } from "./types";

/*
 * In-memory stand-in for the backend so the UI works end to end in development.
 * Resets on server restart. Backend: replace queries.ts and actions.ts; delete this file.
 */

const FIRST = ["Amara", "Luis", "Priya", "Sam", "Hannah", "Omar", "Julia", "Tom", "Grace", "Ben", "Aisha", "Noah", "Mei", "Ravi", "Lena", "Diego", "Fatima", "Jonas", "Chloe", "Kwame"];
const LAST = ["Okafor", "Romero", "Nair", "Chen", "Lee", "Haddad", "Novak", "Becker", "Wu", "Adeyemi", "Singh", "Martin", "Tremblay", "Roy", "Gagnon", "Kim", "Patel", "Nguyen", "Silva", "Mensah"];

const OPPORTUNITIES: { title: string; cta: CtaKind }[] = [
  { title: "Film night", cta: "sign_up" },
  { title: "Tenant workshop", cta: "sign_up" },
  { title: "Food bank volunteers", cta: "sign_up" },
  { title: "Youth mentor", cta: "sign_up" },
  { title: "ESL conversation circle", cta: "sign_up" },
  { title: "Park clean-up", cta: "sign_up" },
  { title: "Petition: safer crosswalks", cta: "take_action" },
  { title: "Community garden day", cta: "sign_up" },
  { title: "Tax clinic volunteers", cta: "sign_up" },
  { title: "Write to council about transit", cta: "take_action" },
  { title: "Newcomer welcome dinner", cta: "sign_up" },
  { title: "Repair café", cta: "sign_up" },
];

const DAY = 86_400_000;
const WEEK = 7 * DAY;

/** Deterministic pseudo-random numbers, so the sample data is the same on every restart. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(r: () => number, weighted: [T, number][]): T {
  let x = r() * weighted.reduce((sum, [, w]) => sum + w, 0);
  for (const [value, w] of weighted) if ((x -= w) < 0) return value;
  return weighted[weighted.length - 1][0];
}

const SOURCE_DETAIL: Partial<Record<MemberSource, string[]>> = {
  legacy_import: ["Newsletter list, 2019 to 2025"],
  booth: ["Kitchener Market", "Waterloo Public Library", "Uptown Waterloo Jazz Festival"],
  partner_event: ["Northside Food Bank open house", "Riverbend Youth Collective fair"],
  file_import: ["Volunteer fair sign-up sheet"],
};

interface Store {
  members: MemberRecord[];
  /** Send log per member id, newest first. */
  emails: Record<string, SentEmail[]>;
  /** Lowercased addresses of deleted people. Backend: store a hash, not the address. */
  deleted: Set<string>;
  seq: number;
}

function seed(): Store {
  const now = Date.now();
  const members: MemberRecord[] = [];
  const emails: Record<string, SentEmail[]> = {};

  for (let i = 0; i < 1000; i++) {
    const r = rng(i + 1);
    const first = FIRST[i % FIRST.length];
    const last = LAST[Math.floor(i / FIRST.length) % LAST.length];
    const source = pick<MemberSource>(r, [
      ["legacy_import", 40],
      ["booth", 18],
      ["website", 14],
      ["partner_event", 10],
      ["referral", 8],
      ["admin_added", 6],
      ["file_import", 4],
    ]);
    const legacy = source === "legacy_import";
    const addedAt = now - (legacy ? 380 + r() * 720 : r() * 360) * DAY;
    // Legacy imports skew Invited: most never started onboarding.
    const onboarding = pick<OnboardingState>(
      r,
      legacy
        ? [["not_started", 65], ["in_progress", 10], ["completed", 25]]
        : [["not_started", 12], ["in_progress", 13], ["completed", 75]],
    );
    const tier = onboarding === "completed" && r() < 0.09 ? "paying" : "general";
    const unsubscribed = r() < 0.06;
    const unsubscribedAt = unsubscribed ? addedAt + r() * (now - addedAt) : undefined;
    const details = SOURCE_DETAIL[source];

    const m: MemberRecord = {
      id: `m_${i + 1}`,
      name: i % 9 === 4 ? undefined : `${first} ${last}`,
      email: `${first}.${last}${i}`.toLowerCase() + "@example.org",
      tier,
      subscribed: !unsubscribed,
      addedAt: new Date(addedAt).toISOString(),
      unsubscribedAt: unsubscribedAt === undefined ? undefined : new Date(unsubscribedAt).toISOString(),
      // Most people unsubscribe themselves; a few were unsubscribed by an admin.
      unsubscribedBy: unsubscribed ? (r() < 0.15 ? "admin" : "self") : undefined,
      onboarding,
      source,
      sourceDetail: details && details[Math.floor(r() * details.length)],
    };
    members.push(m);
    emails[m.id] = seedEmails(m, r, onboarding, unsubscribedAt ?? now, now);
  }
  return { members, emails, deleted: new Set(), seq: 5000 };
}

/** A welcome, then (once onboarded) a weekly opportunities email for up to 26 weeks, with varied clicks. */
function seedEmails(m: MemberRecord, r: () => number, onboarding: OnboardingState, end: number, now: number): SentEmail[] {
  const added = new Date(m.addedAt).getTime();
  const out: SentEmail[] = [];
  const email = (kind: EmailKind, subject: string, at: number, opportunities: EmailOpportunity[] = []): SentEmail => ({
    id: `${m.id}_${out.length}`,
    kind,
    subject,
    sentAt: new Date(at).toISOString(),
    status: r() < 0.015 ? "not-delivered" : "delivered",
    opportunities,
  });

  const payingWelcome = m.tier === "paying" && r() < 0.5;
  out.push(email(payingWelcome ? "paying-welcome" : "general-welcome", TEMPLATES[payingWelcome ? "paying-welcome" : "general-welcome"].subject, added));
  if (m.tier === "paying" && !payingWelcome) out.push(email("paying-added", TEMPLATES["paying-added"].subject, added + 3 * DAY));
  if (onboarding !== "completed") return out.reverse();

  // Active: clicked recently. Lapsed: clicked, but only more than 60 days ago. Quiet: never clicked.
  const engagement = pick(r, [["active", 45], ["lapsed", 33], ["quiet", 22]] as ["active" | "lapsed" | "quiet", number][]);
  for (let t = Math.max(added + WEEK, now - 26 * WEEK); t < end; t += WEEK) {
    const recent = now - t < 60 * DAY;
    const chance = engagement === "quiet" ? 0 : engagement === "active" ? (recent ? 0.35 : 0.15) : recent ? 0 : 0.3;
    const start = Math.floor(r() * OPPORTUNITIES.length);
    const opportunities = [0, 4, 7].map((offset, k): EmailOpportunity => {
      const o = OPPORTUNITIES[(start + offset) % OPPORTUNITIES.length];
      const actions: EmailOpportunity["actions"] = [];
      const clickAt = () => new Date(Math.min(t + r() * 3 * DAY, now - 3600_000)).toISOString();
      if (r() < chance / 2 || (k === 0 && r() < chance / 3)) actions.push({ type: "cta", at: clickAt() });
      if (engagement !== "quiet" && r() < chance / 4) actions.push({ type: "share", at: clickAt() });
      return { id: `${m.id}_${out.length}_${k}`, title: o.title, cta: o.cta, actions };
    });
    out.push(email("opportunities", "This week's opportunities", t, opportunities));
  }
  return out.reverse();
}

const g = globalThis as unknown as { __communityStoreV3?: Store };
const store = (): Store => (g.__communityStoreV3 ??= seed()); // V3: reseeds with source, onboarding and clicks

export const members = (): MemberRecord[] => store().members;
export const nextMemberId = () => `m_${++store().seq}`;
export const findByEmail = (email: string) => members().find((m) => m.email.toLowerCase() === email.toLowerCase());
export const emailsFor = (m: MemberRecord): SentEmail[] => store().emails[m.id] ?? [];
export const isDeleted = (email: string) => store().deleted.has(email.toLowerCase());

/** Removes the person and their send log, and remembers the address so admins can't re-add it. */
export function deleteRecord(id: string): MemberRecord | undefined {
  const s = store();
  const index = s.members.findIndex((m) => m.id === id);
  if (index < 0) return undefined;
  const [m] = s.members.splice(index, 1);
  delete s.emails[id];
  s.deleted.add(m.email.toLowerCase());
  return m;
}

/** A booth sign-up is fresh consent from the person, so it lifts an earlier deletion's block. */
export const forgetDeleted = (email: string) => store().deleted.delete(email.toLowerCase());

const TEMPLATES: Record<Exclude<EmailKind, "opportunities">, { subject: string; body: string }> = {
  "general-welcome": {
    subject: "Welcome to the Social Development Centre community",
    body: "<p>You're now on the Social Development Centre community list.</p>",
  },
  "paying-welcome": {
    subject: "Welcome to the Social Development Centre: your membership is active",
    body: '<p>You\'re now a paying member.</p><p><a href="#">Access the member platform</a></p>',
  },
  "paying-added": {
    subject: "Your Social Development Centre membership is now active",
    body: '<p>Your account now includes paid membership.</p><p><a href="#">Access the member platform</a></p>',
  },
  "paying-removed": {
    subject: "Your Social Development Centre membership has ended",
    body: "<p>Your paid membership has ended. You'll still get our community emails.</p>",
  },
};

function html(title: string, body: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;line-height:1.5">
<h1 style="font-size:20px;margin:0 0 12px">${title}</h1>${body}
<p style="font-size:12px;margin-top:24px">Social Development Centre · <a href="#">Unsubscribe</a></p></div>`;
}

/** The rendered body of a sent email. Backend: the provider's stored copy. */
export function renderEmail(e: SentEmail): string {
  if (e.kind !== "opportunities") return html(e.subject, TEMPLATES[e.kind].body);
  const items = e.opportunities
    .map((o) => `<li><strong>${o.title}</strong> · <a href="#">${o.cta === "sign_up" ? "Sign up" : "Take action"}</a> · <a href="#">Invite a friend</a></li>`)
    .join("");
  return html(e.subject, `<ul>${items}</ul>`);
}

/** Dev stand-in for the email provider: records the send and reports delivery. Always delivers here. */
export function sendEmail(m: MemberRecord, kind: Exclude<EmailKind, "opportunities">): SentEmail["status"] {
  const list = (store().emails[m.id] ??= []);
  const status = "delivered" as const;
  list.unshift({ id: `${m.id}_s${list.length}`, kind, subject: TEMPLATES[kind].subject, sentAt: new Date().toISOString(), status, opportunities: [] });
  return status;
}
