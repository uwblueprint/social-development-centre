"use server";

import { revalidatePath } from "next/cache";
import { sendSignInLink } from "@/features/auth/actions";
import { requireAdmin } from "@/features/auth/session";
import { normalizeEmail } from "@/lib/email";
import type { ActionState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

type NewMember = { fullName: string; email: string };

/**
 * Adds them to SDC's list if they're new and makes them a member. They get a sign-in link.
 * Optional fields: `joinedAt` (YYYY-MM-DD, defaults to today) and `joinEmails` (checkbox, on by
 * default; off when backfilling existing members, so join emails don't go out).
 */
export async function addMember(_prev: ActionState<NewMember>, formData: FormData): Promise<ActionState<NewMember>> {
  await requireAdmin();
  const values = {
    fullName: String(formData.get("fullName") ?? "").trim(),
    email: String(formData.get("email") ?? ""),
  };
  const email = normalizeEmail(values.email);
  if (!email) {
    return { status: "error", fieldErrors: { email: "Enter an email address like name@example.org." }, data: values };
  }

  const supabase = await createClient();
  const { data: result, error } = await supabase.rpc("add_member", {
    p_email: email,
    p_full_name: values.fullName,
    p_joined_at: joinedAtFrom(formData),
    p_join_emails: joinEmailsFrom(formData),
  });
  if (error) {
    console.error("add_member failed:", error.message);
    return { status: "error", message: "We couldn’t add this member. Try again.", data: values };
  }
  if (result === "already_member") {
    return { status: "error", fieldErrors: { email: "This person is already a member." }, data: values };
  }
  revalidatePath("/admin/members");

  const name = values.fullName || email;
  if ((await sendSignInLink("member", email)) !== "sent") {
    return {
      status: "error",
      message: `${name} is now a member, but the sign-in link didn’t send. Use Resend link to try again.`,
    };
  }
  return { status: "success", message: `${name} is now a member. We sent a sign-in link to ${email}.` };
}

/** They stay on SDC's list (tags, history, email subscription) and can't sign in to the members' area. */
export async function removeMember(personId: string): Promise<ActionState> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_member", { p_person_id: personId });
  if (error) {
    console.error("remove_member failed:", error.message);
    return { status: "error", message: "We couldn’t remove this member. Try again." };
  }
  revalidatePath("/admin/members");
  return { status: "success" };
}

// ---------- shared ----------

/** A date field (YYYY-MM-DD) as the start of that day in Waterloo Region, or undefined for today. */
function joinedAtFrom(formData: FormData): string | undefined {
  const date = String(formData.get("joinedAt") ?? "");
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date} 00:00 America/Toronto` : undefined;
}

/** "Send join emails" is on unless the form says otherwise (`joinEmails` = "off"). */
function joinEmailsFrom(formData: FormData): boolean {
  return formData.get("joinEmails") !== "off";
}

function failed<Data = undefined>(what: string, error: { message: string }): ActionState<Data> {
  console.error(`${what} failed:`, error.message);
  return { status: "error", message: "Something went wrong. Try again." };
}

function refresh(personId?: string) {
  revalidatePath("/admin/members");
  if (personId) revalidatePath(`/admin/members/${personId}`);
}

// ---------- adding many ----------

export type AddMembersSummary = { added: number; alreadyMembers: string[]; notEmails: string[] };

/**
 * One member per line of `members`: "Name, email", "Name <email>", "email, Name" or just "email",
 * pasted or from a spreadsheet. Same `joinedAt` and `joinEmails` for all of them. Doesn't send sign-in
 * links: members ask for one on the sign-in page when they want it.
 */
export async function addMembers(
  _prev: ActionState<AddMembersSummary>,
  formData: FormData,
): Promise<ActionState<AddMembersSummary>> {
  await requireAdmin();
  const lines = String(formData.get("members") ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return { status: "error", fieldErrors: { members: "Add at least one email address." } };
  }

  const rows = lines.map(parseMemberLine);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("add_members", {
    p_members: rows.map(({ email, fullName }) => ({ email, full_name: fullName })),
    p_joined_at: joinedAtFrom(formData),
    p_join_emails: joinEmailsFrom(formData),
  });
  if (error) return failed("add_members", error);
  refresh();

  const summary: AddMembersSummary = {
    added: data.filter((r) => r.result === "added").length,
    alreadyMembers: data.filter((r) => r.result === "already_member").map((r) => r.email),
    notEmails: data.flatMap((r, i) => (r.result === "invalid_email" ? [lines[i]] : [])),
  };
  return { status: summary.added > 0 ? "success" : "error", data: summary };
}

function parseMemberLine(line: string): { email: string; fullName: string } {
  const parts = line
    .replace(/[<>"]/g, " ")
    .split(/[,\t;]|\s{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  const emailPart = parts.find((part) => normalizeEmail(part)) ?? line.split(/\s+/).find((word) => normalizeEmail(word));
  if (!emailPart) return { email: line, fullName: "" };
  const name = parts
    .filter((part) => part !== emailPart)
    .join(" ")
    .replace(emailPart, "")
    .trim();
  return { email: normalizeEmail(emailPart)!, fullName: name };
}

// ---------- tags ----------

export async function createTag(name: string): Promise<ActionState<{ tagId: string }>> {
  await requireAdmin();
  if (!name.trim()) return { status: "error", fieldErrors: { name: "Enter a tag name." } };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_tag", { p_name: name });
  if (error) return failed("create_tag", error);
  refresh();
  return { status: "success", data: { tagId: data } };
}

export async function renameTag(tagId: string, name: string): Promise<ActionState> {
  await requireAdmin();
  if (!name.trim()) return { status: "error", fieldErrors: { name: "Enter a tag name." } };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("rename_tag", { p_tag_id: tagId, p_name: name });
  if (error) return failed("rename_tag", error);
  if (data === "taken") return { status: "error", fieldErrors: { name: "Another tag already has this name." } };
  refresh();
  return { status: "success" };
}

/** Removes it from every member (each removal is logged) and deletes it. */
export async function deleteTag(tagId: string): Promise<ActionState> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_tag", { p_tag_id: tagId });
  if (error) return failed("delete_tag", error);
  refresh();
  return { status: "success" };
}

/** Tags many members at once; each one counts as its own "tag added" for automatic emails. */
export async function tagMembers(tagId: string, personIds: string[]): Promise<ActionState<{ changed: number }>> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("tag_members", { p_tag_id: tagId, p_person_ids: personIds });
  if (error) return failed("tag_members", error);
  refresh(personIds.length === 1 ? personIds[0] : undefined);
  return { status: "success", data: { changed: data } };
}

export async function untagMembers(tagId: string, personIds: string[]): Promise<ActionState<{ changed: number }>> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("untag_members", { p_tag_id: tagId, p_person_ids: personIds });
  if (error) return failed("untag_members", error);
  refresh(personIds.length === 1 ? personIds[0] : undefined);
  return { status: "success", data: { changed: data } };
}

/** Tags everyone whose email is in `emails` (pasted, one per line or comma-separated). */
export async function tagByEmails(
  tagId: string,
  emails: string,
): Promise<ActionState<{ changed: number; notFound: string[] }>> {
  await requireAdmin();
  const wanted = [...new Set(emails.split(/[\s,;]+/).map(normalizeEmail).filter((e): e is string => e !== null))];
  if (wanted.length === 0) return { status: "error", fieldErrors: { emails: "Add at least one email address." } };
  const supabase = await createClient();
  const { data: people, error } = await supabase.from("people").select("id, email").in("email", wanted);
  if (error) return failed("tag lookup", error);
  const found = new Set(people.map((p) => p.email));
  const result = await tagMembers(tagId, people.map((p) => p.id));
  if (result.status === "error") return { status: "error", message: result.message };
  return { status: "success", data: { changed: result.data?.changed ?? 0, notFound: wanted.filter((e) => !found.has(e)) } };
}

// ---------- notes ----------

export async function addNote(personId: string, body: string): Promise<ActionState> {
  await requireAdmin();
  if (!body.trim()) return { status: "error", fieldErrors: { body: "Write something first." } };
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_note", { p_person_id: personId, p_body: body });
  if (error) return failed("add_note", error);
  refresh(personId);
  return { status: "success" };
}

/** The earlier text is kept and shows in the note's history. */
export async function editNote(personId: string, noteId: string, body: string): Promise<ActionState> {
  await requireAdmin();
  if (!body.trim()) return { status: "error", fieldErrors: { body: "Write something first." } };
  const supabase = await createClient();
  const { error } = await supabase.rpc("edit_note", { p_note_id: noteId, p_body: body });
  if (error) return failed("edit_note", error);
  refresh(personId);
  return { status: "success" };
}

/** Hidden, not erased: the row and its history stay in the database. */
export async function deleteNote(personId: string, noteId: string): Promise<ActionState> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_note", { p_note_id: noteId });
  if (error) return failed("delete_note", error);
  refresh(personId);
  return { status: "success" };
}

// ---------- referrals ----------

/** Records that this member referred someone. If that person becomes a member, it links up. */
export async function addReferral(referrerId: string, email: string, fullName: string): Promise<ActionState> {
  await requireAdmin();
  const normalized = normalizeEmail(email);
  if (!normalized) return { status: "error", fieldErrors: { email: "Enter an email address like name@example.org." } };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("add_referral", {
    p_referrer_id: referrerId,
    p_email: normalized,
    p_full_name: fullName,
  });
  if (error) return failed("add_referral", error);
  if (data === null) return { status: "error", fieldErrors: { email: "This referral is already recorded." } };
  refresh(referrerId);
  return { status: "success" };
}

// ---------- email subscription ----------

/** Stops every email to them, including ones waiting to go out. Only they can resubscribe. */
export async function unsubscribeMember(personId: string): Promise<ActionState> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("unsubscribe_member", { p_person_id: personId });
  if (error) return failed("unsubscribe_member", error);
  refresh(personId);
  return { status: "success" };
}

/** Existing unsubscribes from another tool (e.g. Mailchimp), one email per line or comma-separated. */
export async function importUnsubscribes(
  emails: string,
): Promise<ActionState<{ unsubscribed: number; already: number; remembered: number }>> {
  await requireAdmin();
  const list = [...new Set(emails.split(/[\s,;]+/).map(normalizeEmail).filter((e): e is string => e !== null))];
  if (list.length === 0) return { status: "error", fieldErrors: { emails: "Add at least one email address." } };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("import_unsubscribes", { p_emails: list });
  if (error) return failed("import_unsubscribes", error);
  refresh();
  return { status: "success", data: data[0] };
}
