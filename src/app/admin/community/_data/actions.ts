"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/forms";
import { dayKey } from "@/lib/date";
import type { ExportKind, ExportScope, ImportPreview, MemberRecord } from "./types";
import { summarizeActivity } from "./status";
import { deleteRecord, emailsFor, findByEmail, forgetDeleted, isDeleted, members, nextMemberId, sendEmail } from "./store";
import { EMAIL, parseInput } from "../_lib/import";
import { exportCopy } from "../_copy";

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
    deleted: [],
  };
  for (const entry of entries) {
    const m = findByEmail(entry.email);
    if (!m && isDeleted(entry.email)) {
      preview.deleted.push(entry.email); // deleted at their request: an admin can't add them back
      continue;
    }
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
  const send = (m: MemberRecord, kind: Parameters<typeof sendEmail>[1]) => (sendEmail(m, kind) === "delivered" ? sent++ : notDelivered++);

  for (const { email, name } of p.added) {
    const m: MemberRecord = {
      id: nextMemberId(),
      email,
      name,
      tier: paying ? "paying" : "general",
      subscribed: true,
      addedAt: now,
      onboarding: "not_started",
      source: mode === "single" ? "admin_added" : "file_import",
    };
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

/**
 * Deletes the person permanently, for data-removal requests: the record and its send log go, so they
 * leave Community and every export. Backend: also delete them from the email provider, and add a hash of
 * the address to a suppression list so imports and Add members can't bring them back.
 */
export async function deleteMember(id: string): Promise<ActionState> {
  const m = deleteRecord(id);
  if (!m) return fail("This person was already deleted.");
  return done(`${m.name ?? m.email} was deleted.`);
}

/**
 * For the sign-up kiosk: adds a general member with source `booth`, `sourceDetail` = the location, and
 * onboarding not started, and sends the general welcome. Returns the same success whether or not the
 * email already exists, and never changes an existing member (no resubscribe, no rename), so the kiosk
 * can't reveal who's on the list. Only an invalid email returns an error, on the `email` field.
 * A deleted person signing up again is fresh consent, so they're added. No admin check: the kiosk is public.
 */
export async function addBoothSignup(name: string, email: string, location: string): Promise<ActionState> {
  const address = email.trim().toLowerCase();
  if (!EMAIL.test(address)) return { status: "error", fieldErrors: { email: "Enter an email address like name@example.org." } };
  if (!findByEmail(address)) {
    forgetDeleted(address);
    const m: MemberRecord = {
      id: nextMemberId(),
      name: name.replace(/[<>]/g, "").trim() || undefined,
      email: address,
      tier: "general",
      subscribed: true,
      addedAt: new Date().toISOString(),
      onboarding: "not_started",
      source: "booth",
      sourceDetail: location.trim() || undefined,
    };
    members().push(m);
    sendEmail(m, "general-welcome");
    revalidatePath("/admin/community");
  }
  return { status: "success" };
}

/** General members (not paying), Paying members, or both; unsubscribed people of the same tiers only when asked. */
function exportRows(scope: ExportScope, includeUnsubscribed: boolean): MemberRecord[] {
  return members().filter((m) => (scope === "both" || m.tier === scope) && (m.subscribed || includeUnsubscribed));
}

/** People for Members; clicks (primary actions and shares) for Activity. */
export async function countExport(kind: ExportKind, scope: ExportScope, includeUnsubscribed: boolean): Promise<number> {
  const rows = exportRows(scope, includeUnsubscribed);
  if (kind === "members") return rows.length;
  return rows.reduce((n, m) => n + emailsFor(m).reduce((k, e) => k + e.opportunities.reduce((j, o) => j + o.actions.length, 0), 0), 0);
}

/** Quotes cells that need it, and defuses values a spreadsheet would run as a formula. */
const cell = (v: string | number | undefined = "") => {
  const text = String(v);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
const day = (iso?: string) => (iso ? dayKey(iso) : "");

function membersCsv(rows: MemberRecord[]): string[] {
  const c = exportCopy;
  const now = Date.now();
  const header = "name,email,status,tier,subscribed,unsubscribed_by,unsubscribed,onboarding,source,source_detail,added,last_email,emails_received,cta_clicks,signups,shares,last_click";
  return [
    header,
    ...rows.map((m) => {
      const a = summarizeActivity(m, emailsFor(m), now);
      return [
        m.name,
        m.email,
        c.status[a.status],
        c.tier[m.tier],
        m.subscribed ? c.yes : c.no,
        m.unsubscribedBy && c.unsubscribedBy[m.unsubscribedBy],
        day(m.unsubscribedAt),
        c.onboarding[m.onboarding],
        c.source[m.source],
        m.sourceDetail,
        day(m.addedAt),
        day(a.lastEmail?.sentAt),
        a.emailsReceived,
        a.ctaClicks,
        a.signups,
        a.shares,
        day(a.lastClickAt),
      ]
        .map((v) => cell(v))
        .join(",");
    }),
  ];
}

function activityCsv(rows: MemberRecord[]): string[] {
  const out = ["email,subject,sent,opportunity,action,clicked"];
  for (const m of rows) {
    for (const e of emailsFor(m)) {
      for (const o of e.opportunities) {
        for (const a of o.actions) {
          const action = a.type === "share" ? exportCopy.action.shared : exportCopy.action[o.cta];
          out.push([m.email, e.subject, day(e.sentAt), o.title, action, day(a.at)].map((v) => cell(v)).join(","));
        }
      }
    }
  }
  return out;
}

/** Returns CSV text for the browser to download: one row per person (members) or per click (activity). */
export async function exportMembers(
  kind: ExportKind,
  scope: ExportScope,
  includeUnsubscribed: boolean,
): Promise<{ filename: string; csv: string; count: number }> {
  const rows = exportRows(scope, includeUnsubscribed);
  const lines = kind === "members" ? membersCsv(rows) : activityCsv(rows);
  const who = scope === "both" ? "general-and-paying" : scope;
  return { filename: `sdc-${who}-${kind}-${dayKey(new Date().toISOString())}.csv`, csv: lines.join("\n"), count: lines.length - 1 };
}
