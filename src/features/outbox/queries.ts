import "server-only";
import type { JSONContent } from "@tiptap/react";
import { createClient } from "@/lib/supabase/server";
import type { DelayUnit, Member, Rule, Send, Template, Trigger } from "./_data";
import { textToDoc } from "./_emailDoc";

/** Everything the Outbox page shows, as the design's model (see _data.ts). */
export interface OutboxInitial {
  /** Today in Waterloo Region, YYYY-MM-DD: every send's `day` counts from it. */
  today: string;
  /**
   * Today's daily run is over, so whatever is still scheduled for today or earlier goes with tomorrow's.
   * True once email_runs has today's finished run, or from 11 am (the run is in the 10 o'clock hour).
   */
  afterSend: boolean;
  members: Member[];
  templates: Record<string, Template>;
  sends: Send[];
}

/** History the calendar and member panel look back over. */
const HISTORY_DAYS = 30;

const torontoToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" }).format(new Date());
const torontoHour = () =>
  Number(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", hour: "numeric", hourCycle: "h23" }).format(new Date()));
const dayOf = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" }).format(new Date(iso));
/** Whole days from `today` to a YYYY-MM-DD date. */
const daysFrom = (today: string, date: string) => Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);

/** A document with content, or null for the '{}' the database stores when there's none. */
const docOrNull = (doc: unknown): JSONContent | null =>
  doc && typeof doc === "object" && "type" in doc ? (doc as JSONContent) : null;

/**
 * The Outbox: who's due in the next 30 days (outbox_upcoming), what couldn't send (outbox_not_sent), and the
 * last 30 days of sent emails, with the members and automatic emails they belong to.
 */
export async function loadOutbox(): Promise<OutboxInitial> {
  const supabase = await createClient();
  const today = torontoToday();
  const since = new Date(Date.now() - HISTORY_DAYS * 86_400_000).toISOString();

  const [upcoming, notSent, sent, run, tags] = await Promise.all([
    supabase.rpc("outbox_upcoming", { p_days: 30 }),
    supabase.rpc("outbox_not_sent", { p_days: HISTORY_DAYS }),
    supabase
      .from("email_sends")
      .select("occurrence_id, person_id, automatic_email_id, sent_at")
      .eq("status", "sent")
      .gte("sent_at", since),
    supabase.from("email_runs").select("id").eq("run_on", today).not("finished_at", "is", null).limit(1),
    supabase.from("tags").select("id, name"),
  ]);
  for (const r of [upcoming, notSent, sent, run, tags]) if (r.error) throw r.error;

  const upcomingRows = upcoming.data ?? [];
  const notSentRows = notSent.data ?? [];
  const sentRows = sent.data ?? [];
  const tagName = new Map((tags.data ?? []).map((t) => [t.id, t.name]));

  const afterSend = (run.data ?? []).length > 0 || torontoHour() >= 11;
  const personIds = [...new Set([...upcomingRows, ...notSentRows, ...sentRows].map((r) => r.person_id))];
  if (personIds.length === 0) return { today, afterSend, members: [], templates: {}, sends: [] };
  const occurrenceIds = [...new Set([...upcomingRows, ...notSentRows].map((r) => r.occurrence_id))];
  const emailIds = [...new Set([...upcomingRows, ...notSentRows, ...sentRows].map((r) => r.automatic_email_id))];

  const [people, memberships, memberTags, occurrences, emails, overrides] = await Promise.all([
    supabase.from("people").select("id, full_name, first_name, last_name, email").in("id", personIds),
    supabase.from("memberships").select("person_id, joined_at").in("person_id", personIds),
    supabase.from("member_tags").select("person_id, tag_id").in("person_id", personIds),
    supabase.from("email_occurrences").select("id, event_at").in("id", occurrenceIds),
    supabase
      .from("automatic_emails")
      .select("id, name, subject, subject_doc, body, trigger, trigger_tag_id, delay_amount, delay_unit, conditions")
      .in("id", emailIds),
    // Outbox edits, to tell an edited send from one that follows its template.
    supabase
      .from("email_sends")
      .select("occurrence_id, person_id, subject_override, body_override")
      .in("occurrence_id", occurrenceIds)
      .or("subject_override.not.is.null,body_override.not.is.null"),
  ]);
  for (const r of [people, memberships, memberTags, occurrences, emails, overrides]) if (r.error) throw r.error;

  const joined = new Map((memberships.data ?? []).map((m) => [m.person_id, m.joined_at]));
  const tagsOf = new Map<string, string[]>();
  for (const mt of memberTags.data ?? []) {
    const name = tagName.get(mt.tag_id);
    if (name) tagsOf.set(mt.person_id, [...(tagsOf.get(mt.person_id) ?? []), name]);
  }
  const members: Member[] = (people.data ?? []).map((p) => {
    const at = joined.get(p.id);
    return {
      id: p.id,
      name: p.full_name || p.email,
      first: p.first_name ?? "",
      last: p.last_name ?? "",
      email: p.email,
      tags: (tagsOf.get(p.id) ?? []).sort((a, b) => a.localeCompare(b)),
      since: at ? daysFrom(today, dayOf(at)) : null,
    };
  });
  const memberIndex = new Map(members.map((m, i) => [m.id, i]));

  const names = (ids: unknown) => (Array.isArray(ids) ? ids.map((id) => tagName.get(String(id))).filter((n): n is string => !!n) : []);
  const templates: Record<string, Template> = {};
  for (const e of emails.data ?? []) {
    const c = (e.conditions ?? {}) as { only?: unknown; require?: unknown; never?: unknown };
    const trigger: Trigger =
      e.trigger === "tag_added"
        ? { kind: "tag", tag: (e.trigger_tag_id && tagName.get(e.trigger_tag_id)) || "a deleted tag" }
        : e.trigger === "refers"
          ? { kind: "refers" }
          : e.trigger === "referral_joins"
            ? { kind: "referral_joins" }
            : { kind: "joins", referral: e.trigger === "join_referral" ? "with" : e.trigger === "join_no_referral" ? "without" : "any" };
    const rule: Rule = {
      trigger,
      delay: e.delay_amount > 0 ? { n: e.delay_amount, unit: e.delay_unit as DelayUnit } : null,
      audience: { only: names(c.only), require: names(c.require), never: names(c.never) },
    };
    templates[e.id] = {
      key: e.id,
      name: e.name || "Untitled automatic email",
      subject: e.subject,
      subjectDoc: docOrNull(e.subject_doc) ?? textToDoc(e.subject),
      bodyDoc: docOrNull(e.body) ?? textToDoc(""),
      rule,
    };
  }

  const eventDay = new Map((occurrences.data ?? []).map((o) => [o.id, daysFrom(today, dayOf(o.event_at))]));
  const edits = new Map(
    (overrides.data ?? []).map((o) => [
      `${o.occurrence_id}:${o.person_id}`,
      { subject: o.subject_override == null ? null : textToDoc(o.subject_override), body: docOrNull(o.body_override) },
    ]),
  );

  const sends: Send[] = [];
  const push = (row: { occurrence_id: string; person_id: string; automatic_email_id: string }, rest: Pick<Send, "day" | "status" | "fail">) => {
    const member = memberIndex.get(row.person_id);
    if (member === undefined || !templates[row.automatic_email_id]) return;
    const id = `${row.occurrence_id}:${row.person_id}`;
    const edit = edits.get(id);
    sends.push({
      id,
      occurrenceId: row.occurrence_id,
      personId: row.person_id,
      member,
      template: row.automatic_email_id,
      eventDay: eventDay.get(row.occurrence_id) ?? null,
      subject: edit?.subject ?? null,
      body: edit?.body ?? null,
      ...rest,
    });
  };
  for (const r of upcomingRows) {
    // Approved sends go out on their own, like scheduled ones; past due ones wait for review (no expiry).
    const due = daysFrom(today, r.due_on);
    if (r.status === "scheduled" || r.status === "approved") {
      // It goes with the next run: today's if it hasn't happened yet, else tomorrow's (a join after 10:30 with no delay).
      push(r, { day: due > 0 ? due : afterSend ? 1 : 0, status: "scheduled" });
    } else {
      // Waiting for review keeps its due day, so past due reads "N days late". Due today after today's run,
      // approving it sends it tomorrow, so it shows tomorrow.
      push(r, { day: due === 0 && afterSend ? 1 : due, status: "review" });
    }
  }
  for (const r of notSentRows) {
    push(r, { day: daysFrom(today, dayOf(r.failed_at)), status: "couldnt", fail: r.reason === "bounced" ? "bounce" : "platform" });
  }
  for (const r of sentRows) {
    if (r.sent_at) push(r, { day: daysFrom(today, dayOf(r.sent_at)), status: "sent" });
  }

  return { today, afterSend, members, templates, sends };
}
