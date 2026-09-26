"use server";

import { revalidatePath } from "next/cache";
import { closeListingsPastRemovalCutoff } from "@/features/opportunities/service";
import type { ActionState } from "@/lib/forms";
import {
  addInvitedContact,
  cancelContactInvitation,
  contactFieldErrors,
  emailInUse,
  removeContactFromOrganization,
  resendContactInvitation,
  sendInvitationEmail,
} from "./contacts";
import { applyOrganizationProfile, profileFieldsError, readOrganizationProfile } from "./profile";
import { currentContacts, newInvitation, nextId, orgs, statusOf } from "./store";

/*
 * Backend: implement these against the real data store and email service,
 * keeping the names, inputs (FormData field names) and ActionState results.
 * Every action must also verify the caller is an SDC admin.
 */

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
/** Revalidates Partners and the partner portal's Team list, then returns the shared result. */
const settle = (result: ActionState): ActionState => {
  revalidatePath("/admin/partners");
  revalidatePath("/partner/organization");
  return result;
};

function findContact(contactId: string) {
  for (const org of orgs()) {
    const c = currentContacts(org).find((x) => x.id === contactId);
    if (c) return { org, contact: c };
  }
  return null;
}

/** Fields: name, email, organizationId (existing) or organizationName (create new). */
export async function invitePartner(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const name = text(fd, "name");
  const email = text(fd, "email");
  const organizationId = text(fd, "organizationId");
  const organizationName = text(fd, "organizationName");

  const fieldErrors = contactFieldErrors(name, email, { inUseMessage: "This person is already a current partner contact." });
  if (!organizationId && !organizationName) fieldErrors.organization = "Choose an organization or create a new one.";
  if (organizationName && orgs().some((o) => o.name.toLowerCase() === organizationName.toLowerCase())) {
    fieldErrors.organization = "An organization with this name already exists. Choose it from the list.";
  }
  if (Object.keys(fieldErrors).length) return fail("Check the highlighted fields.", fieldErrors);

  let org = orgs().find((o) => o.id === organizationId);
  if (!org) {
    org = { id: nextId("org"), name: organizationName, contacts: [], createdAt: new Date().toISOString(), everActive: false };
    orgs().push(org);
  }
  return settle(await addInvitedContact(org, name, email));
}

export async function resendInvitation(contactId: string): Promise<ActionState> {
  const found = findContact(contactId);
  if (!found) return fail("This contact no longer exists.");
  return settle(await resendContactInvitation(found.org, contactId));
}

/** Deletes a pending contact; see cancelContactInvitation in _data/contacts.ts. */
export async function cancelInvitation(contactId: string): Promise<ActionState> {
  const found = findContact(contactId);
  if (!found) return fail("Only pending invitations can be cancelled.");
  return settle(cancelContactInvitation(found.org, contactId));
}

/** Removes one person from their organization; see removeContactFromOrganization in _data/contacts.ts. */
export async function removeContact(contactId: string): Promise<ActionState> {
  const found = findContact(contactId);
  if (!found) return fail("Only active contacts can be removed. Cancel a pending invitation instead.");
  return settle(removeContactFromOrganization(found.org, contactId));
}

/** Fields: name, email. Changing the email sends a fresh invitation; active contacts stay active. */
export async function updateContact(contactId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const found = findContact(contactId);
  if (!found) return fail("This contact no longer exists.");
  const name = text(fd, "name");
  const email = text(fd, "email");
  const fieldErrors = contactFieldErrors(name, email, {
    exceptContactId: contactId,
    inUseMessage: "Another current partner contact uses this email.",
  });
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

/**
 * Fields: name, website, description (see _data/profile.ts for the rules, shared with the partner portal).
 * Only fields present in the FormData change, so the panel can save the name and the profile separately.
 */
export async function updateOrganization(orgId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const org = orgs().find((o) => o.id === orgId);
  if (!org) return fail("This organization no longer exists.");
  const result = readOrganizationProfile(org, fd);
  if (result.fieldErrors) return profileFieldsError(result.fieldErrors);
  applyOrganizationProfile(org, result.changes);
  revalidatePath("/partner", "layout");
  return done("Changes saved.");
}

export async function removePartner(orgId: string): Promise<ActionState> {
  const org = orgs().find((o) => o.id === orgId);
  if (!org || statusOf(org) === "removed") return fail("This partner is already removed.");
  org.everActive ||= currentContacts(org).some((c) => c.status === "active");
  org.removedAt = new Date().toISOString();
  return done(`${org.name} was removed. Their access ended now; their opportunities expire within a month.`);
}

/** Sends fresh invitations to every saved contact and returns the partner to the current list as Pending. */
export async function reinvitePartner(orgId: string): Promise<ActionState> {
  const org = orgs().find((o) => o.id === orgId);
  if (!org || statusOf(org) !== "removed") return fail("Only removed partners can be reinvited.");
  const contacts = currentContacts(org);
  if (contacts.length === 0) return fail("Add a contact before reinviting.");
  const clash = contacts.find((c) => emailInUse(c.email));
  if (clash) return fail(`${clash.email} is already a contact at another current partner. Edit it first.`);

  const errors: string[] = [];
  for (const c of contacts) {
    const sendError = await sendInvitationEmail(c.email);
    c.status = "pending";
    c.invitation = { ...newInvitation(), sendError };
    if (sendError) errors.push(c.email);
  }
  if (org.removedAt) closeListingsPastRemovalCutoff(org.id, org.removedAt);
  org.removedAt = undefined;
  revalidatePath("/admin/partners");
  return errors.length
    ? { status: "error", message: `Reinvited, but these invitations weren't sent: ${errors.join(", ")}. Resend from the partner's details.` }
    : { status: "success", message: `${org.name} was reinvited. It shows as Invitation pending until someone accepts.` };
}
