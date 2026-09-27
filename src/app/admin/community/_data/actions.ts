"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/forms";
import type { ExportScope, ImportPreview, Member } from "./types";
import { findByEmail, members, nextMemberId, sendEmail } from "./store";
import { EMAIL, parseInput } from "../_lib/import";

/*
 * Backend: implement against the real audience store and email provider, keeping names,
 * FormData field names and ActionState results. Every action must verify the caller is an SDC admin.
 * Email sends (general welcome, paying welcome, Paying membership added, Paying access removed) go through the existing provider so nobody
 * gets duplicate welcomes.
 */

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const checked = (fd: FormData, key: string) => fd.get(key) === "on";
const done = (message: string): ActionState => {
  revalidatePath("/admin/community");
  return { status: "success", message };
};
const fail = (message: string, fieldErrors?: ActionState["fieldErrors"]): ActionState => ({ status: "error", message, fieldErrors });
const find = (id: string) => members().find((m) => m.id === id);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "single" is Add member (fields: name, email); "bulk" is Import members (field: emails). */
export type AddMode = "single" | "bulk";

/** Reads the input for either mode, or returns the field error to show beside it. */
function readInput(mode: AddMode, fd: FormData): { raw: string } | { error: ActionState<ImportPreview> } {
  if (mode === "bulk") {
    const raw = text(fd, "emails");
    if (!raw) return { error: { status: "error", fieldErrors: { emails: "Paste email addresses or upload a CSV file." } } };
    return { raw };
  }
  const email = text(fd, "email");
  if (!email) return { error: { status: "error", fieldErrors: { email: "Enter an email address." } } };
  const parsed = parseInput(email);
  if (parsed.entries.length === 0) {
    return { error: { status: "error", fieldErrors: { email: "Enter an email address like name@example.org." } } };
  }
  // A name only makes sense for one person; if several addresses were pasted, the preview shows them all.
  const name = text(fd, "name").replace(/[<>,;]/g, " ").trim();
  return { raw: name && parsed.entries.length === 1 ? `${name} <${parsed.entries[0].email}>` : email };
}

function analyse(raw: string, paying: boolean): ImportPreview {
  const { entries, duplicates, invalid } = parseInput(raw);
  const preview: ImportPreview = {
    paying,
    added: [],
    converted: [],
    alreadyPaying: [],
    alreadyMembers: [],
    duplicates,
    invalid,
    unsubscribedSelf: [],
    unsubscribedAdmin: [],
  };
  for (const entry of entries) {
    const m = findByEmail(entry.email);
    if (!m) {
      preview.added.push(entry);
      continue;
    }
    const existing = { email: m.email, name: m.name };
    if (!m.subscribed) {
      const target = m.unsubscribedBy === "admin" ? preview.unsubscribedAdmin : preview.unsubscribedSelf;
      target.push({ ...existing, willConvert: paying && m.tier === "general" });
    } else if (m.tier === "paying") preview.alreadyPaying.push(existing); // never downgraded
    else if (paying) preview.converted.push(existing);
    else preview.alreadyMembers.push(existing);
  }
  return preview;
}

/**
 * Fields: name, email (single) or emails (bulk); paying ("on"). Checks the input without saving
 * or sending anything, and groups every address by what confirming will do.
 */
export async function previewMembers(mode: AddMode, _prev: ActionState<ImportPreview>, fd: FormData): Promise<ActionState<ImportPreview>> {
  const input = readInput(mode, fd);
  if ("error" in input) return input.error;
  return { status: "success", data: analyse(input.raw, checked(fd, "paying")) };
}

/**
 * Same fields as the preview, plus resubscribe ("on") to resubscribe people an admin unsubscribed.
 * Re-checks on the server, then applies. Never resubscribes people who unsubscribed themselves and
 * never downgrades paying members. The initial backfill of SDC's list is a code-side migration, not this action.
 */
export async function confirmMembers(mode: AddMode, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const input = readInput(mode, fd);
  if ("error" in input) return fail("The list changed. Go back and check it again.");
  const paying = checked(fd, "paying");
  const resubscribe = checked(fd, "resubscribe");
  const p = analyse(input.raw, paying);
  const now = new Date().toISOString();
  let sent = 0;
  let notDelivered = 0;
  const send = (m: Member, kind: Parameters<typeof sendEmail>[1]) => (sendEmail(m, kind) === "delivered" ? sent++ : notDelivered++);

  for (const { email, name } of p.added) {
    const m: Member = { id: nextMemberId(), email, name, tier: paying ? "paying" : "general", subscribed: true, addedAt: now };
    members().push(m);
    send(m, paying ? "paying-welcome" : "general-welcome");
  }
  for (const { email } of p.converted) {
    const m = findByEmail(email)!;
    m.tier = "paying";
    send(m, "paying-added");
  }
  let converted = p.converted.length;
  for (const { email, willConvert } of p.unsubscribedSelf) {
    if (!willConvert) continue;
    findByEmail(email)!.tier = "paying"; // stays unsubscribed, so no email
    converted++;
  }
  let resubscribed = 0;
  for (const { email, willConvert } of p.unsubscribedAdmin) {
    const m = findByEmail(email)!;
    if (willConvert) {
      m.tier = "paying";
      converted++;
    }
    if (resubscribe) {
      m.subscribed = true;
      m.unsubscribedAt = undefined;
      m.unsubscribedBy = undefined;
      resubscribed++;
      if (willConvert) send(m, "paying-added");
    }
  }

  const parts = [
    p.added.length && `${plural(p.added.length, "member", "members")} added`,
    converted && `${converted} converted to paying`,
    resubscribed && `${resubscribed} resubscribed`,
  ].filter(Boolean);
  if (parts.length === 0) return fail("Nothing changed.");
  const summary = parts.join(", ");
  const emails = sent ? ` ${plural(sent, "email", "emails")} sent.` : " No emails sent.";
  const failed = notDelivered ? ` ${plural(notDelivered, "email wasn't", "emails weren't")} delivered.` : "";
  return done(`${summary.charAt(0).toUpperCase()}${summary.slice(1)}.${emails}${failed}`);
}

/** Fields: name (optional), email. */
export async function updateMember(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const m = find(id);
  if (!m) return fail("This person no longer exists.");
  const name = text(fd, "name");
  const email = text(fd, "email").toLowerCase();
  if (!EMAIL.test(email)) return fail("Check the highlighted field.", { email: "Enter an email address like name@example.org." });
  const other = findByEmail(email);
  if (other && other.id !== id) {
    return fail("Check the highlighted field.", {
      email: other.subscribed ? "This email already belongs to another member." : "This email belongs to an unsubscribed record. Search for it instead.",
    });
  }
  m.name = name || undefined;
  m.email = email;
  return done("Changes saved.");
}

/**
 * Makes the person a paying member. No email-subscription gate: an unsubscribed person gets paying
 * access too, but no email. Sends the Paying membership added email to subscribed people.
 */
export async function grantPaidAccess(id: string): Promise<ActionState> {
  const m = find(id);
  if (!m) return fail("This person no longer exists.");
  const who = m.name ?? m.email;
  if (m.tier === "paying") return fail(`${who} is already a paying member.`);
  m.tier = "paying";
  if (!m.subscribed) return done(`${who} is now a paying member. No email sent because they're unsubscribed.`);
  return sendEmail(m, "paying-added") === "delivered"
    ? done(`${who} is now a paying member. Paying member email sent.`)
    : done(`${who} is now a paying member, but the email wasn't delivered. Check their email address.`);
}

/** Removes paid entitlement now and, if they're subscribed, sends the Paying access removed email; general emails continue. */
export async function revokePaidAccess(id: string): Promise<ActionState> {
  const m = find(id);
  if (!m || m.tier !== "paying") return fail("This person isn't a paying member.");
  m.tier = "general";
  if (!m.subscribed) return done(`Paying access removed for ${m.name ?? m.email}.`);
  sendEmail(m, "paying-removed");
  return done(`Paying access removed for ${m.name ?? m.email}. They'll keep getting general emails.`);
}

/** Stops all emails and removes paid access; the record stays, marked Unsubscribed by an admin. */
export async function unsubscribeMember(id: string): Promise<ActionState> {
  const m = find(id);
  if (!m || !m.subscribed) return fail("This person is already unsubscribed.");
  m.subscribed = false;
  m.unsubscribedAt = new Date().toISOString();
  m.unsubscribedBy = "admin";
  return done(`${m.name ?? m.email} was unsubscribed.`);
}

/**
 * Resubscribes someone an admin unsubscribed (owner decision 6). People who unsubscribed
 * themselves can only resubscribe themselves. Keeps their tier; sends no welcome.
 */
export async function resubscribeMember(id: string): Promise<ActionState> {
  const m = find(id);
  if (!m || m.subscribed) return fail("This person isn't unsubscribed.");
  if (m.unsubscribedBy !== "admin") return fail("They unsubscribed themselves. Only they can resubscribe.");
  m.subscribed = true;
  m.unsubscribedAt = undefined;
  m.unsubscribedBy = undefined;
  return done(`${m.name ?? m.email} was resubscribed.`);
}

/** General: every subscribed person (paying included), plus unsubscribed people when asked. Paying: subscribed paying members. */
function exportRows(scope: ExportScope, includeUnsubscribed: boolean): Member[] {
  return members().filter((m) =>
    scope === "paying" ? m.subscribed && m.tier === "paying" : m.subscribed || includeUnsubscribed, // includeUnsubscribed is ignored for paying: unsubscribing ends paid access
  );
}

export async function countExport(scope: ExportScope, includeUnsubscribed: boolean): Promise<number> {
  return exportRows(scope, includeUnsubscribed).length;
}

/** Returns CSV text (name,email) for the browser to download. */
export async function exportMembers(scope: ExportScope, includeUnsubscribed: boolean): Promise<{ filename: string; csv: string; count: number }> {
  const rows = exportRows(scope, includeUnsubscribed);
  const cell = (v = "") => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const csv = ["name,email", ...rows.map((m) => `${cell(m.name)},${cell(m.email)}`)].join("\n");
  const date = new Date().toISOString().slice(0, 10);
  return { filename: `sdc-${scope}-members-${date}.csv`, csv, count: rows.length };
}
