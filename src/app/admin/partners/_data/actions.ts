"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/forms";
import { newInvitation, nextId, orgs, statusOf } from "./store";

/*
 * Backend: implement these against the real data store and email service,
 * keeping the names, inputs (FormData field names) and ActionState results.
 * Every action must also verify the caller is an SDC admin.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const done = (message: string): ActionState => {
  revalidatePath("/admin/partners");
  return { status: "success", message };
};
const fail = (message: string, fieldErrors?: ActionState["fieldErrors"]): ActionState => ({
  status: "error",
  message,
  fieldErrors,
});

// Dev stand-in for the email service: addresses containing "fail" simulate a send error.
async function sendInvitationEmail(email: string): Promise<string | undefined> {
  await new Promise((r) => setTimeout(r, 500));
  return email.includes("fail") ? "The invitation email couldn't be delivered." : undefined;
}

function findContact(contactId: string) {
  for (const org of orgs()) {
    const c = org.contacts.find((x) => x.id === contactId);
    if (c) return { org, contact: c };
  }
  return null;
}

function emailInUse(email: string, exceptContactId?: string) {
  return orgs().some(
    (o) => statusOf(o) !== "removed" && o.contacts.some((c) => c.id !== exceptContactId && c.email.toLowerCase() === email.toLowerCase()),
  );
}

/** Fields: name, email, organizationId (existing) or organizationName (create new). */
export async function invitePartner(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const name = text(fd, "name");
  const email = text(fd, "email");
  const organizationId = text(fd, "organizationId");
  const organizationName = text(fd, "organizationName");

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "Enter the contact's name.";
  if (!EMAIL.test(email)) fieldErrors.email = "Enter an email address like name@example.org.";
  else if (emailInUse(email)) fieldErrors.email = "This person is already a current partner contact.";
  if (!organizationId && !organizationName) fieldErrors.organization = "Choose an organization or create a new one.";
  if (organizationName && orgs().some((o) => o.name.toLowerCase() === organizationName.toLowerCase())) {
    fieldErrors.organization = "An organization with this name already exists. Choose it from the list.";
  }
  if (Object.keys(fieldErrors).length) return fail("Check the highlighted fields.", fieldErrors);

  let org = orgs().find((o) => o.id === organizationId);
  if (!org) {
    org = { id: nextId("org"), name: organizationName, contacts: [], opportunityCount: 0, createdAt: new Date().toISOString(), everActive: false };
    orgs().push(org);
  }
  const sendError = await sendInvitationEmail(email);
  org.contacts.push({ id: nextId("c"), name, email, status: "pending", invitation: { ...newInvitation(), sendError } });
  revalidatePath("/admin/partners");
  return sendError
    ? { status: "error", message: `${name} was added, but the invitation wasn't sent. ${sendError} Try resending.` }
    : { status: "success", message: `Invitation sent to ${email}.` };
}

export async function resendInvitation(contactId: string): Promise<ActionState> {
  const found = findContact(contactId);
  if (!found) return fail("This contact no longer exists.");
  const sendError = await sendInvitationEmail(found.contact.email);
  found.contact.invitation = { ...newInvitation(), sendError };
  if (sendError) {
    revalidatePath("/admin/partners");
    return fail(`The invitation wasn't sent. ${sendError}`);
  }
  return done(`Invitation resent to ${found.contact.email}. The previous link no longer works.`);
}

/** Deletes a pending contact; deletes the organization too if nobody is left and it was never active. */
export async function cancelInvitation(contactId: string): Promise<ActionState> {
  const found = findContact(contactId);
  if (!found || found.contact.status !== "pending") return fail("Only pending invitations can be cancelled.");
  found.org.contacts = found.org.contacts.filter((c) => c.id !== contactId);
  if (found.org.contacts.length === 0 && !found.org.everActive) {
    const all = orgs();
    all.splice(all.indexOf(found.org), 1);
  }
  return done("Invitation cancelled.");
}

/** Fields: name, email. Changing the email sends a fresh invitation; active contacts stay active. */
export async function updateContact(contactId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const found = findContact(contactId);
  if (!found) return fail("This contact no longer exists.");
  const name = text(fd, "name");
  const email = text(fd, "email");
  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "Enter the contact's name.";
  if (!EMAIL.test(email)) fieldErrors.email = "Enter an email address like name@example.org.";
  else if (emailInUse(email, contactId)) fieldErrors.email = "Another current partner contact uses this email.";
  if (Object.keys(fieldErrors).length) return fail("Check the highlighted fields.", fieldErrors);

  const emailChanged = email.toLowerCase() !== found.contact.email.toLowerCase();
  found.contact.name = name;
  found.contact.email = email;
  if (emailChanged && statusOf(found.org) !== "removed") {
    const sendError = await sendInvitationEmail(email);
    found.contact.invitation = { ...newInvitation(), sendError };
    if (sendError) {
      revalidatePath("/admin/partners");
      return fail(`Saved, but the new invitation wasn't sent. ${sendError}`);
    }
    return done(`Saved. A new invitation was sent to ${email}.`);
  }
  return done("Changes saved.");
}

/** Field: name. */
export async function updateOrganization(orgId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const org = orgs().find((o) => o.id === orgId);
  if (!org) return fail("This organization no longer exists.");
  const name = text(fd, "name");
  if (!name) return fail("Check the highlighted field.", { name: "Enter the organization's name." });
  if (orgs().some((o) => o !== org && o.name.toLowerCase() === name.toLowerCase())) {
    return fail("Check the highlighted field.", { name: "Another organization already has this name." });
  }
  org.name = name;
  return done("Changes saved.");
}

export async function removePartner(orgId: string): Promise<ActionState> {
  const org = orgs().find((o) => o.id === orgId);
  if (!org || statusOf(org) === "removed") return fail("This partner is already removed.");
  org.everActive ||= org.contacts.some((c) => c.status === "active");
  org.removedAt = new Date().toISOString();
  return done(`${org.name} was removed. Their access ended now; their opportunities expire within a month.`);
}

/** Sends fresh invitations to every saved contact and returns the partner to the current list as Pending. */
export async function reinvitePartner(orgId: string): Promise<ActionState> {
  const org = orgs().find((o) => o.id === orgId);
  if (!org || statusOf(org) !== "removed") return fail("Only removed partners can be reinvited.");
  if (org.contacts.length === 0) return fail("Add a contact before reinviting.");
  const clash = org.contacts.find((c) => emailInUse(c.email));
  if (clash) return fail(`${clash.email} is already a contact at another current partner. Edit it first.`);

  const errors: string[] = [];
  for (const c of org.contacts) {
    const sendError = await sendInvitationEmail(c.email);
    c.status = "pending";
    c.invitation = { ...newInvitation(), sendError };
    if (sendError) errors.push(c.email);
  }
  org.removedAt = undefined;
  revalidatePath("/admin/partners");
  return errors.length
    ? { status: "error", message: `Reinvited, but these invitations weren't sent: ${errors.join(", ")}. Resend from the partner's details.` }
    : { status: "success", message: `${org.name} was reinvited. It shows as Pending until someone accepts.` };
}
