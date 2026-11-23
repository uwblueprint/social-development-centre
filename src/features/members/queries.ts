import "server-only";
import { displayName } from "@/features/people/person";
import { createClient } from "@/lib/supabase/server";
import type {
  EmailHistoryEntry,
  MemberDetail,
  MemberRow,
  NoteRevision,
  SendStatus,
  Subscription,
  TagSummary,
  TimelineEntry,
  TimelineKind,
} from "./types";

function subscriptionOf(person: { unsubscribed_at: string | null; bounced_at: string | null }): Subscription {
  return person.unsubscribed_at ? "unsubscribed" : person.bounced_at ? "bounced" : "subscribed";
}

/** A–Z by name, or email when there's no name. About 150 people, so no paging yet. */
export async function listMembers(): Promise<MemberRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .select(
      "joined_at, person:people!person_id(id, email, full_name, created_at, first_signed_in_at, unsubscribed_at, bounced_at, member_tags!member_tags_person_id_fkey(tag:tags(id, name)))",
    );
  if (error) throw error;

  return data
    .map(({ joined_at, person }) => ({
      id: person.id,
      name: person.full_name,
      email: person.email,
      addedAt: person.created_at,
      hasSignedIn: person.first_signed_in_at !== null,
      joinedAt: joined_at,
      tags: person.member_tags.map(({ tag }) => tag).sort((a, b) => a.name.localeCompare(b.name)),
      subscription: subscriptionOf(person),
    }))
    .sort((a, b) => displayName(a).localeCompare(displayName(b), "en", { sensitivity: "base" }));
}

/** Every tag, A–Z, with how many members have it. */
export async function listTags(): Promise<TagSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tags").select("id, name, member_tags(count)").order("name");
  if (error) throw error;
  return data.map((tag) => ({ id: tag.id, name: tag.name, memberCount: tag.member_tags[0]?.count ?? 0 }));
}

/** Everything on one member's page, or null if they aren't a member. */
export async function getMember(personId: string): Promise<MemberDetail | null> {
  const supabase = await createClient();
  const [person, timeline, emails, notes, referrals, referredBy] = await Promise.all([
    supabase
      .from("people")
      .select(
        "id, email, first_name, last_name, full_name, first_signed_in_at, unsubscribed_at, unsubscribe_reason, bounced_at, bounce_detail, memberships(joined_at, join_emails), member_tags!member_tags_person_id_fkey(tag:tags(id, name))",
      )
      .eq("id", personId)
      .maybeSingle(),
    supabase.from("member_timeline").select("*").eq("person_id", personId).order("at", { ascending: false }),
    supabase.from("member_email_history").select("*").eq("person_id", personId).order("send_at", { ascending: false }),
    supabase
      .from("member_notes")
      .select("id, body, created_at, created_by, updated_at")
      .eq("person_id", personId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("referrals")
      .select("id, referred_email, referred_first_name, referred_last_name, created_at, joined_at, referred_id")
      .eq("referrer_id", personId)
      .order("created_at", { ascending: false }),
    supabase
      .from("referrals")
      .select("referrer:people!referrer_id(id, email, full_name)")
      .eq("referred_id", personId)
      .maybeSingle(),
  ]);
  for (const result of [person, timeline, emails, notes, referrals, referredBy]) {
    if (result.error) throw result.error;
  }
  const p = person.data;
  if (!p?.memberships) return null;

  // Names for whoever wrote notes or tagged them, in one lookup.
  const authorIds = [
    ...new Set([...(timeline.data ?? []).map((t) => t.by_person_id), ...(notes.data ?? []).map((n) => n.created_by)]),
  ].filter((id): id is string => id !== null);
  const names = await namesById(supabase, authorIds);

  return {
    id: p.id,
    email: p.email,
    firstName: p.first_name,
    lastName: p.last_name,
    fullName: p.full_name,
    joinedAt: p.memberships.joined_at,
    joinEmails: p.memberships.join_emails,
    hasSignedIn: p.first_signed_in_at !== null,
    subscription: subscriptionOf(p),
    unsubscribeReason: p.unsubscribe_reason,
    bounceDetail: p.bounce_detail,
    tags: p.member_tags.map(({ tag }) => tag).sort((a, b) => a.name.localeCompare(b.name)),
    referredBy: referredBy.data?.referrer
      ? { id: referredBy.data.referrer.id, name: referredBy.data.referrer.full_name, email: referredBy.data.referrer.email }
      : null,
    referrals: (referrals.data ?? []).map((r) => ({
      id: r.id,
      email: r.referred_email,
      name: [r.referred_first_name, r.referred_last_name].filter(Boolean).join(" ") || null,
      createdAt: r.created_at,
      joinedAt: r.joined_at,
      personId: r.referred_id,
    })),
    notes: (notes.data ?? []).map((n) => ({
      id: n.id,
      body: n.body,
      createdAt: n.created_at,
      createdBy: n.created_by ? (names.get(n.created_by) ?? null) : null,
      editedAt: n.updated_at,
    })),
    timeline: (timeline.data ?? []).map(
      (t): TimelineEntry => ({
        at: t.at!,
        kind: t.kind as TimelineKind,
        tagName: t.tag_name,
        referralId: t.referral_id,
        noteId: t.note_id,
        sendId: t.send_id,
        emailStatus: t.email_status as SendStatus | null,
        body: t.body,
        by: t.by_person_id ? (names.get(t.by_person_id) ?? null) : null,
        edited: t.edited ?? false,
      }),
    ),
    emails: (emails.data ?? []).map(
      (e): EmailHistoryEntry => ({
        sendId: e.send_id!,
        emailName: e.email_name!,
        startedBy: e.started_by,
        startedByTag: e.started_by_tag,
        status: e.status as SendStatus,
        notSentReason: e.not_sent_reason,
        sendAt: e.send_at!,
        sentAt: e.sent_at,
        couldNotSend: e.could_not_send ?? false,
        subject: e.subject,
        edited: e.edited ?? false,
      }),
    ),
  };
}

/** Earlier versions of a note, newest first. */
export async function getNoteRevisions(noteId: string): Promise<NoteRevision[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("member_note_revisions")
    .select("body, written_by, written_at")
    .eq("note_id", noteId)
    .order("written_at", { ascending: false });
  if (error) throw error;
  const names = await namesById(
    supabase,
    data.map((r) => r.written_by).filter((id): id is string => id !== null),
  );
  return data.map((r) => ({
    body: r.body,
    writtenBy: r.written_by ? (names.get(r.written_by) ?? null) : null,
    writtenAt: r.written_at,
  }));
}

async function namesById(supabase: Awaited<ReturnType<typeof createClient>>, ids: string[]) {
  if (ids.length === 0) return new Map<string, string>();
  const { data, error } = await supabase.from("people").select("id, email, full_name").in("id", ids);
  if (error) throw error;
  return new Map(data.map((p) => [p.id, p.full_name ?? p.email]));
}

