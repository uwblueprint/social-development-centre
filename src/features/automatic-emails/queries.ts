import "server-only";
import { createClient } from "@/lib/supabase/server";
import { AUTOMATIC_EMAIL_COLUMNS, emailFromRow, type AutomaticEmailRow } from "./mapping";
import { pretty, type AutomaticEmail, type Recipient, type TagOption } from "./model";

/** Every automatic email, oldest first, as the list shows them. */
export async function listAutomaticEmails(): Promise<AutomaticEmail[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("automatic_emails")
    .select(AUTOMATIC_EMAIL_COLUMNS)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as AutomaticEmailRow[]).map((row) => emailFromRow(row));
}

/** Every tag, A to Z, for the pickers. */
export async function listTagOptions(): Promise<TagOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tags").select("id, name").order("name");
  if (error) throw error;
  return data;
}

/** Saved backup text by field id. Fields without a row use the editor's defaults. */
export async function getFallbacks(): Promise<Record<string, string>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("email_fallbacks").select("field, value");
  if (error) throw error;
  return Object.fromEntries(data.map((f) => [f.field, f.value]));
}

export interface EmailPageData {
  email: AutomaticEmail;
  /** Who the Outbox has this email scheduled for, soonest first. Empty unless it's published. */
  recipients: Recipient[];
}

/**
 * One email with what its page needs from the Outbox: who it's scheduled for (the "N members will
 * get this" line and the preview), and how many sends were edited, approved or are waiting for
 * review (the unpublish warning). Null if there's no such email.
 */
export async function getAutomaticEmail(id: string): Promise<EmailPageData | null> {
  const supabase = await createClient();
  const { data: row, error } = await supabase.from("automatic_emails").select(AUTOMATIC_EMAIL_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!row) return null;

  const { data: outbox, error: outboxError } = await supabase.rpc("outbox_upcoming");
  if (outboxError) throw outboxError;
  const mine = outbox.filter((s) => s.automatic_email_id === id);
  const counts = {
    edited: mine.filter((s) => s.edited).length,
    approved: mine.filter((s) => s.status === "approved").length,
    waiting: mine.filter((s) => s.status === "waiting_review" || s.status === "past_due").length,
  };

  const people = new Map<string, { first_name: string | null; last_name: string | null; joined_at: string | null }>();
  if (mine.length) {
    const { data, error: peopleError } = await supabase
      .from("people")
      .select("id, first_name, last_name, memberships(joined_at)")
      .in("id", [...new Set(mine.map((s) => s.person_id))]);
    if (peopleError) throw peopleError;
    for (const p of data) people.set(p.id, { ...p, joined_at: p.memberships?.joined_at ?? null });
  }

  const recipients = mine.map((s): Recipient => {
    const p = people.get(s.person_id);
    const fields: Record<string, string> = { email: s.email };
    if (p?.first_name) fields.first_name = p.first_name;
    if (p?.last_name) fields.last_name = p.last_name;
    if (s.full_name) fields.full_name = s.full_name;
    if (p?.joined_at) {
      fields.join_date = new Date(p.joined_at).toLocaleDateString("en-CA", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "America/Toronto",
      });
    }
    return {
      personId: s.person_id,
      name: s.full_name || s.email,
      email: s.email,
      sendDate: pretty(new Date(`${s.due_on}T12:00:00`)),
      fields,
    };
  });

  return { email: emailFromRow(row as AutomaticEmailRow, counts), recipients };
}
