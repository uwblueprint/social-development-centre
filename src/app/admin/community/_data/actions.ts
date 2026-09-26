"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/forms";
import type { ExportScope, ImportPreview, Member, MemberTier } from "./types";
import { findByEmail, members, nextMemberId } from "./store";

/*
 * Backend: implement against the real audience store and email provider, keeping names,
 * FormData field names and ActionState results. Every action must verify the caller is an SDC admin.
 * Email sends (welcome, new-paying, upgrade, revoked) go through the existing provider so nobody
 * gets duplicate welcomes.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const done = (message: string): ActionState => {
  revalidatePath("/admin/community");
  return { status: "success", message };
};
const fail = (message: string, fieldErrors?: ActionState["fieldErrors"]): ActionState => ({ status: "error", message, fieldErrors });
const find = (id: string) => members().find((m) => m.id === id);

/** Splits on commas, semicolons, spaces and new lines. */
function parse(raw: string) {
  const tokens = raw.split(/[\s,;]+/).map((t) => t.trim()).filter(Boolean);
  const seen = new Set<string>();
  const valid: string[] = [];
  const invalid: string[] = [];
  let duplicatesRemoved = 0;
  for (const t of tokens) {
    const email = t.toLowerCase();
    if (!EMAIL.test(email)) invalid.push(t);
    else if (seen.has(email)) duplicatesRemoved++;
    else {
      seen.add(email);
      valid.push(email);
    }
  }
  return { valid, invalid, duplicatesRemoved };
}

function analyse(tier: MemberTier, raw: string): ImportPreview {
  const { valid, invalid, duplicatesRemoved } = parse(raw);
  const preview: ImportPreview = { tier, toCreate: [], toUpgrade: [], toSkip: [], unsubscribed: [], invalid, duplicatesRemoved, emailsToSend: 0 };
  for (const email of valid) {
    const m = findByEmail(email);
    if (!m) preview.toCreate.push(email);
    else if (!m.subscribed) preview.unsubscribed.push(email);
    else if (m.tier === "paying") preview.toSkip.push({ email, reason: tier === "paying" ? "already-paying" : "paying-not-downgraded" });
    else if (tier === "paying") preview.toUpgrade.push(email);
    else preview.toSkip.push({ email, reason: "already-general" });
  }
  preview.emailsToSend = preview.toCreate.length + preview.toUpgrade.length;
  return preview;
}

/** Field: emails (text). Checks addresses without saving or sending anything. */
export async function previewImport(tier: MemberTier, _prev: ActionState<ImportPreview>, fd: FormData): Promise<ActionState<ImportPreview>> {
  const raw = text(fd, "emails");
  if (!raw) return { status: "error", message: "Paste at least one email address.", fieldErrors: { emails: "Paste at least one email address." } };
  const preview = analyse(tier, raw);
  if (preview.toCreate.length + preview.toUpgrade.length === 0) {
    return { status: "error", message: "Nothing to add: every address is invalid, already a member or unsubscribed.", data: preview };
  }
  return { status: "success", data: preview };
}

/**
 * Field: emails (same text as the preview). Re-checks on the server; never resubscribes unsubscribed
 * addresses or downgrades paying members. The initial backfill of SDC's list is a code-side migration, not this action.
 */
export async function confirmImport(tier: MemberTier, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const preview = analyse(tier, text(fd, "emails"));
  const now = new Date().toISOString();
  for (const email of preview.toCreate) members().push({ id: nextMemberId(), email, tier, subscribed: true, addedAt: now });
  for (const email of preview.toUpgrade) findByEmail(email)!.tier = "paying";
  const added = preview.toCreate.length + preview.toUpgrade.length;
  const sent = preview.emailsToSend;
  return done(`${added} ${added === 1 ? "member" : "members"} added. ${sent} ${sent === 1 ? "email" : "emails"} sent.`);
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

/** Sends the upgrade email with the paid benefits and access link. */
export async function grantPaidAccess(id: string): Promise<ActionState> {
  const m = find(id);
  if (!m || !m.subscribed || m.tier !== "general") return fail("Only subscribed general members can be given paying access.");
  m.tier = "paying";
  return done(`${m.name ?? m.email} is now a paying member. Upgrade email sent.`);
}

/** Removes paid entitlement now and sends the revocation notice; general emails continue. */
export async function revokePaidAccess(id: string): Promise<ActionState> {
  const m = find(id);
  if (!m || m.tier !== "paying") return fail("This person isn't a paying member.");
  m.tier = "general";
  return done(`Paying access removed for ${m.name ?? m.email}. They'll keep getting general emails.`);
}

/** Stops all emails and removes paid access; the record stays, marked Unsubscribed. */
export async function unsubscribeMember(id: string): Promise<ActionState> {
  const m = find(id);
  if (!m || !m.subscribed) return fail("This person is already unsubscribed.");
  m.subscribed = false;
  m.tier = "general";
  m.unsubscribedAt = new Date().toISOString();
  return done(`${m.name ?? m.email} was unsubscribed.`);
}

/**
 * Restores an unsubscribed person as a general member (never paying). Disabled in the UI until
 * SDC confirms its consent rules and how the email provider handles resubscribes.
 */
export async function restoreEmailEligibility(id: string): Promise<ActionState> {
  const m = find(id);
  if (!m || m.subscribed) return fail("This person isn't unsubscribed.");
  m.subscribed = true;
  m.unsubscribedAt = undefined;
  return done(`${m.name ?? m.email} can receive general emails again.`);
}

function exportRows(scope: ExportScope, includeUnsubscribed: boolean): Member[] {
  return members().filter(
    (m) => (m.subscribed || includeUnsubscribed) && (scope === "all" || (m.subscribed ? m.tier === scope : scope === "general")),
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
