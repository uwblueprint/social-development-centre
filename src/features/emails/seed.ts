/* Emails prototype: seed data, built relative to `now` so "tomorrow" is always tomorrow. */
import { VARIABLES, type AutomaticEmail, type EmailsState, type Fallbacks, type Member, type OneOffEmail, type Send, type Settings } from "./model";
import { addDays, dayKey, resolveAudienceFor, windowAt } from "./engine";

export type Scenario = "default" | "busy" | "empty";

export const DEFAULT_SETTINGS: Settings = {
  senderName: "Suhanya from SDC",
  replyTo: "suhanya@waterlooregion.org",
  monthlyLimit: 3,
  footer: "Suhanya at SDC | {{unsubscribe}}Unsubscribe{{/unsubscribe}}",
  mailingAddress: "[SDC mailing address: to collect from SDC]",
};

export function defaultFallbacks(): Fallbacks {
  return Object.fromEntries(VARIABLES.map((v) => [v.key, v.defaultFallback])) as Fallbacks;
}

const DAY = 86_400_000;

interface MemberSeed {
  f: string;
  l: string;
  ago: number; // days ago joined
  tags: string[];
  by?: number; // referred by member number
  sent?: number;
  status?: Member["status"];
}

const MEMBER_SEEDS: MemberSeed[] = [
  { f: "Amira", l: "Haddad", ago: 29, tags: ["Volunteer", "Donor"], sent: 1 },
  { f: "Dev", l: "Patel", ago: 29, tags: ["Donor", "Board"], sent: 2 },
  { f: "Lena", l: "Kim", ago: 29, tags: ["Volunteer", "Ride for Refuge"], by: 2 },
  { f: "Marcus", l: "Oyelaran", ago: 29, tags: ["Donor"], sent: 3 },
  { f: "", l: "Nguyen", ago: 29, tags: ["Volunteer"] },
  { f: "Sofia", l: "Alvarez", ago: 29, tags: ["Ride for Refuge"], by: 2 },
  { f: "Tom", l: "Becker", ago: 29, tags: ["Donor", "Staff"] },
  { f: "Priyanka", l: "Shah", ago: 29, tags: ["Volunteer", "Lapsed"] },
  { f: "Maximilian-Bartholomew", l: "Oyelaran-Thompson-Whitfield", ago: 29, tags: ["Donor", "Board"], sent: 2 },
  { f: "Hannah", l: "Cohen", ago: 29, tags: ["Donor"], by: 1 },
  { f: "Yusuf", l: "Rahman", ago: 29, tags: ["Volunteer"] },
  { f: "Chloe", l: "Dubois", ago: 29, tags: [] },
  { f: "", l: "", ago: 29, tags: ["Ride for Refuge"] },
  { f: "Ian", l: "MacLeod", ago: 29, tags: ["Lapsed"], sent: 1 },
  { f: "Noor", l: "Siddiqui", ago: 29, tags: ["Donor", "Volunteer"] },
  { f: "Grace", l: "Okafor", ago: 29, tags: ["Staff"] },
  { f: "Ethan", l: "Wong", ago: 29, tags: ["Volunteer"], by: 8 },
  { f: "Fatima", l: "Al-Rashid", ago: 29, tags: ["Ride for Refuge", "Donor"] },
  { f: "Jamal", l: "Brooks", ago: 16, tags: ["Volunteer"], sent: 2 },
  { f: "Elena", l: "Petrova", ago: 16, tags: ["Donor"] },
  { f: "Owen", l: "Fraser", ago: 0.12, tags: [] },
  { f: "Mei", l: "Tanaka", ago: 1.05, tags: ["Ride for Refuge"] },
  { f: "Kwame", l: "Mensah", ago: 34, tags: ["Volunteer"], sent: 1 },
  { f: "Ruth", l: "Abernathy", ago: 90, tags: ["Lapsed"], status: "unsubscribed" },
  { f: "Carlos", l: "Reyes", ago: 70, tags: ["Donor"], status: "bounced" },
  { f: "Zoe", l: "Whitaker", ago: 60, tags: [], status: "reported-spam" },
];

const join = (now: Date, ago: number) => new Date(now.getTime() - ago * DAY).toISOString();

function buildMembers(now: Date): Member[] {
  return MEMBER_SEEDS.map((s, i) => ({
    id: `m${i + 1}`,
    firstName: s.f,
    lastName: s.l,
    email: `${(s.f || "member").toLowerCase().replace(/[^a-z]/g, "")}${i + 1}@example.com`,
    joinedAt: join(now, s.ago),
    tags: s.tags,
    status: s.status ?? "active",
    referredBy: s.by ? `m${s.by}` : undefined,
    sentThisMonth: s.sent ?? 0,
  }));
}

const p = (html: string) => `<p>${html}</p>`;

function buildAutomatic(now: Date): AutomaticEmail[] {
  const t = now.toISOString();
  const base = { conditions: { match: "all" as const, rules: [] }, everPublished: true, updatedAt: t };
  return [
    {
      ...base,
      id: "a1",
      name: "Thank-you",
      moment: { type: "join-any" },
      delay: { kind: "same-day" },
      sendMode: "automatic",
      state: "published",
      content: {
        subject: "Welcome to SDC, {{member.firstName}}",
        bodyHtml:
          p("Hi {{member.firstName}},") +
          p("Thank you for joining the Social Development Centre on {{member.joinDate}}. We are glad you are here.") +
          p("Reply to this email any time if you have questions."),
      },
    },
    {
      ...base,
      id: "a2",
      name: "Thank-you: major supporters",
      moment: { type: "tag-added", tag: "Donor" },
      delay: { kind: "days-after", days: 1 },
      conditions: { match: "all", rules: [{ id: "r1", type: "has-tag", tag: "Donor" }, { id: "r2", type: "except-tag", tag: "Staff" }] },
      sendMode: "review",
      state: "published",
      content: {
        subject: "{{member.fullName}}, thank you for your support",
        bodyHtml:
          p("Dear {{member.firstName}},") +
          p("Your gift makes a real difference to newcomers in our region. <strong>Thank you.</strong>") +
          p("With gratitude,<br>Suhanya"),
      },
    },
    {
      ...base,
      id: "a3",
      name: "One-month check-in",
      moment: { type: "join-any" },
      delay: { kind: "days-after", days: 30 },
      sendMode: "review",
      state: "published",
      content: {
        subject: "How is your first month going, {{member.firstName}}?",
        bodyHtml:
          p("Hi {{member.firstName}},") +
          p("You joined us on {{member.joinDate}}. We would love to hear how it is going and how we can help.") +
          p("Just hit reply."),
      },
    },
    {
      ...base,
      id: "a4",
      name: "Welcome back",
      moment: { type: "tag-added", tag: "Lapsed" },
      delay: { kind: "same-day" },
      conditions: { match: "all", rules: [{ id: "r3", type: "has-tag", tag: "Lapsed" }] },
      sendMode: "automatic",
      state: "draft",
      everPublished: false,
      content: { subject: "We miss you, {{member.firstName}}", bodyHtml: p("Hi {{member.firstName}}, it has been a while. Come say hello.") },
    },
    {
      ...base,
      id: "a5",
      name: "Ride for Refuge: referral thanks",
      moment: { type: "join-referral" },
      delay: { kind: "days-after", days: 7 },
      sendMode: "automatic",
      state: "trash",
      content: {
        subject: "{{referrer.firstName}} told us about you",
        bodyHtml: p("Hi {{member.firstName}}, {{referrer.fullName}} invited you to join us."),
      },
    },
  ];
}

function buildSends(now: Date, members: Member[], busy: boolean): Send[] {
  const sends: Send[] = [];
  let n = 0;
  const day = (offset: number) => addDays(dayKey(now), offset);
  const add = (memberId: string, automaticId: string, occurrence: string, rest: Partial<Send> & Pick<Send, "status" | "sendAt">) =>
    sends.push({ id: `s${(n += 1)}`, memberId, source: { kind: "automatic", automaticId }, occurrence, ...rest });
  const win = (offset: number, memberId: string) => windowAt(day(offset), memberId).toISOString();
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();

  // A batch due tomorrow (one-month check-in, review): members 1 to 18.
  for (let i = 1; i <= 18; i += 1) {
    const id = `m${i}`;
    add(id, "a3", "join", {
      status: "waiting-review",
      sendAt: win(1, id),
      ...(i === 4
        ? { editedContent: { subject: "Marcus, how is your first month?", bodyHtml: p("Hi {{member.firstName}}, a personal note from Suhanya: thank you for stepping up as a donor.") } }
        : {}),
    });
  }
  // Two weeks out.
  add("m19", "a3", "join", { status: "waiting-review", sendAt: win(14, "m19") });
  add("m20", "a3", "join", { status: "waiting-review", sendAt: win(14, "m20") });
  // Waiting for you: 4 days past due, and a missed catch-up.
  add("m23", "a3", "join", { status: "waiting-review", sendAt: win(-4, "m23") });
  add("m2", "a2", "tag:Donor", { status: "waiting-review", sendAt: win(-2, "m2"), missedDueAt: win(-2, "m2") });
  add("m10", "a2", "tag:Donor", { status: "waiting-review", sendAt: win(5, "m10") });
  // Today's, and one the provider rejected.
  add("m21", "a1", "join", { status: "scheduled", sendAt: new Date(now.getTime() + 20 * 60_000).toISOString() });
  add("m22", "a1", "join", { status: "scheduled", sendAt: ago(25 * 3_600_000), couldntSend: true });

  // History: sent.
  const byId = new Map(members.map((m) => [m.id, m]));
  const sent = (memberId: string, automaticId: string, occurrence: string, subject: string, when: number) =>
    add(memberId, automaticId, occurrence, {
      status: "sent",
      sendAt: ago(when),
      sentAt: ago(when),
      sentSubject: subject.replace("{name}", byId.get(memberId)?.firstName || "there"),
      sentBodyHtml: p("This email was sent earlier."),
    });
  sent("m11", "a1", "join", "Welcome to SDC, {name}", 3 * DAY);
  sent("m12", "a1", "join", "Welcome to SDC, {name}", 5 * DAY);
  sent("m15", "a2", "tag:Donor", "Noor Siddiqui, thank you for your support", 8 * DAY);
  // History: not sent, each reason.
  add("m24", "a1", "join", { status: "not-sent", notSentReason: "unsubscribed", sendAt: ago(10 * DAY) });
  add("m25", "a1", "join", { status: "not-sent", notSentReason: "bounced", sendAt: ago(9 * DAY) });
  add("m26", "a1", "join", { status: "not-sent", notSentReason: "reported-spam", sendAt: ago(9 * DAY) });
  add("m14", "a2", "tag:Donor", { status: "not-sent", notSentReason: "no-longer-matched", sendAt: ago(6 * DAY) });
  add("m18", "a2", "tag:Donor", { status: "not-sent", notSentReason: "unpublished", sendAt: ago(7 * DAY) });
  add("m7", "a2", "tag:Donor", { status: "not-sent", notSentReason: "removed-by-admin", sendAt: ago(4 * DAY) });

  if (busy) {
    for (let i = 0; i < 70; i += 1) {
      const id = `m${100 + i}`;
      const d = 1 + (i % 29);
      add(id, "a3", "join", { status: "waiting-review", sendAt: win(30 - d, id) });
    }
  }
  return sends;
}

function buildOneOffs(now: Date, state: Pick<EmailsState, "members">): { oneOffs: OneOffEmail[]; sends: Send[] } {
  const t = now.toISOString();
  const sentAt = new Date(now.getTime() - 9 * DAY).toISOString();
  const audience = { kind: "all" as const };
  const removedIds = ["m18"];
  const { recipients, excluded } = resolveAudienceFor(state.members, audience, removedIds);
  const content = {
    subject: "Thank you for a great spring, {{member.firstName}}",
    bodyHtml: p("Hi {{member.firstName}}, thank you for everything this spring.") + p("See you at the next event."),
  };
  const oneOffs: OneOffEmail[] = [
    {
      id: "o1",
      content: { subject: "Ride for Refuge: volunteers needed", bodyHtml: p("Hi {{member.firstName}}, we need volunteers for Ride for Refuge. Can you help?") },
      audience: { kind: "conditions", conditions: { match: "all", rules: [{ id: "q1", type: "has-tag", tag: "Volunteer" }] } },
      removedIds: [],
      status: "draft",
      updatedAt: t,
    },
    { id: "o2", content: { subject: "", bodyHtml: "" }, audience: { kind: "hand", memberIds: ["m1", "m2", "m3"] }, removedIds: [], status: "draft", updatedAt: t },
    {
      id: "o3",
      content,
      audience,
      removedIds,
      status: "sent",
      updatedAt: sentAt,
      sentAt,
      recipientIds: recipients.map((m) => m.id),
      excludedIds: excluded.map((e) => e.member.id),
    },
  ];
  const sends: Send[] = [];
  const reasons = { unsubscribed: "unsubscribed", bounced: "bounced", "reported-spam": "reported-spam" } as const;
  recipients.forEach((m, i) =>
    sends.push({
      id: `so${i + 1}`,
      memberId: m.id,
      source: { kind: "one-off", oneOffId: "o3" },
      occurrence: "one-off",
      status: "sent",
      sendAt: sentAt,
      sentAt,
      sentSubject: `Thank you for a great spring, ${m.firstName || "there"}`,
      sentBodyHtml: p("This email was sent earlier."),
    }),
  );
  excluded.forEach((e, i) => {
    if (e.member.status === "active") return;
    sends.push({
      id: `sx${i + 1}`,
      memberId: e.member.id,
      source: { kind: "one-off", oneOffId: "o3" },
      occurrence: "one-off",
      status: "not-sent",
      notSentReason: reasons[e.member.status],
      sendAt: sentAt,
    });
  });
  return { oneOffs, sends };
}

function buildExtraMembers(now: Date): Member[] {
  return Array.from({ length: 70 }, (_, i) => ({
    id: `m${100 + i}`,
    firstName: ["Aaron", "Bela", "Chen", "Dana", "Eli", "Farah", "Gabe"][i % 7],
    lastName: `Member${i + 1}`,
    email: `busy${i + 1}@example.com`,
    joinedAt: join(now, 1 + (i % 29)),
    tags: i % 4 === 0 ? ["Volunteer"] : i % 5 === 0 ? ["Donor"] : [],
    status: "active" as const,
    sentThisMonth: i % 6 === 0 ? 2 : 0,
  }));
}

export function buildSeed(now: Date, scenario: Scenario = "default"): EmailsState {
  const busy = scenario === "busy";
  const members = [...buildMembers(now), ...(busy ? buildExtraMembers(now) : [])];
  const base = { members, fallbacks: defaultFallbacks(), settings: { ...DEFAULT_SETTINGS } };
  if (scenario === "empty") return { ...base, automatic: [], sends: [], oneOffs: [] };
  const one = buildOneOffs(now, { members });
  return { ...base, automatic: buildAutomatic(now), sends: [...buildSends(now, members, busy), ...one.sends], oneOffs: one.oneOffs };
}
