import type { ActionState } from "@/lib/forms";
import { currentContacts, newInvitation, nextId, orgs, statusOf } from "./store";

/*
 * Contact rules shared by the admin (Partners) and partner (/partner/organization) actions, so both portals
 * validate, invite, resend, cancel and remove the same way. Not a server action module: each portal's
 * actions check the caller, find the organization, call these, then revalidate their own pages.
 * Backend: replace the store calls; keep the messages.
 */

type StoredOrg = ReturnType<typeof orgs>[number];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fail = (message: string, fieldErrors?: ActionState["fieldErrors"]): ActionState => ({
  status: "error",
  message,
  fieldErrors,
});

/** Dev stand-in for the email service: addresses containing "fail" simulate a send error. */
export async function sendInvitationEmail(email: string): Promise<string | undefined> {
  await new Promise((r) => setTimeout(r, 500));
  return email.includes("fail") ? "The invitation email couldn't be delivered." : undefined;
}

/** An email is unique among current contacts of current (not removed) organizations only. */
export function emailInUse(email: string, exceptContactId?: string) {
  return orgs().some(
    (o) =>
      statusOf(o) !== "removed" &&
      currentContacts(o).some((c) => c.id !== exceptContactId && c.email.toLowerCase() === email.toLowerCase()),
  );
}

/** Field errors for a contact's name and email; `inUseMessage` differs between adding and editing. */
export function contactFieldErrors(
  name: string,
  email: string,
  { exceptContactId, inUseMessage }: { exceptContactId?: string; inUseMessage: string },
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "Enter the contact's name.";
  if (!EMAIL.test(email)) fieldErrors.email = "Enter an email address like name@example.org.";
  else if (emailInUse(email, exceptContactId)) fieldErrors.email = inUseMessage;
  return fieldErrors;
}

/** Adds a pending contact to `org` and sends their invitation (valid for 7 days). Validate first. */
export async function addInvitedContact(org: StoredOrg, name: string, email: string): Promise<ActionState> {
  const sendError = await sendInvitationEmail(email);
  org.contacts.push({ id: nextId("c"), name, email, status: "pending", invitation: { ...newInvitation(), sendError } });
  return sendError
    ? { status: "error", message: `${name} was added, but the invitation wasn't sent. ${sendError} Try resending.` }
    : { status: "success", message: `Invitation sent to ${email}.` };
}

export function findContactIn(org: StoredOrg, contactId: string) {
  return currentContacts(org).find((c) => c.id === contactId);
}

/** Sends a fresh invitation; the previous link stops working. */
export async function resendContactInvitation(org: StoredOrg, contactId: string): Promise<ActionState> {
  const contact = findContactIn(org, contactId);
  if (!contact) return fail("This contact no longer exists.");
  const sendError = await sendInvitationEmail(contact.email);
  contact.invitation = { ...newInvitation(), sendError };
  if (sendError) return fail(`The invitation wasn't sent. ${sendError}`);
  return { status: "success", message: `Invitation resent to ${contact.email}. The previous link no longer works.` };
}

/** Deletes a pending contact; deletes the organization too if nobody is left and it was never active. */
export function cancelContactInvitation(org: StoredOrg, contactId: string): ActionState {
  const contact = findContactIn(org, contactId);
  if (!contact || contact.status !== "pending") return fail("Only pending invitations can be cancelled.");
  org.contacts = org.contacts.filter((c) => c.id !== contactId);
  if (org.contacts.length === 0 && !org.everActive) {
    const all = orgs();
    all.splice(all.indexOf(org), 1);
  }
  return { status: "success", message: "Invitation cancelled." };
}

/**
 * Removes one person from their organization (they left it). Their access ends now; the record is kept
 * for history and their email can be invited under another organization. The last contact can't be
 * removed; remove the organization instead.
 */
export function removeContactFromOrganization(org: StoredOrg, contactId: string): ActionState {
  const contact = findContactIn(org, contactId);
  if (!contact || contact.status !== "active") {
    return fail("Only active contacts can be removed. Cancel a pending invitation instead.");
  }
  if (currentContacts(org).length === 1) {
    return fail("This is the organization's only contact. Remove the organization's access instead.");
  }
  contact.removedAt = new Date().toISOString();
  contact.invitation = undefined;
  return { status: "success", message: `${contact.name} was removed from ${org.name}. Their access ended now.` };
}
