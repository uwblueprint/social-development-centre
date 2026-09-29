"use server";

import { revalidatePath } from "next/cache";
import { closeListingsForOrganization } from "@/features/opportunities/service";
import { getCurrentAdmin } from "../../_data/session";
import type { ActionState } from "@/lib/forms";
import {
  addInvitedContact,
  cancelContactInvitation,
  contactFieldErrors,
  contactMessages,
  findContactIn,
  removeContactFromOrganization,
  resendContactInvitation,
  sendInvitationEmail,
  type InviteResult,
} from "./contacts";
import {
  applyOrganizationProfile,
  notesMessages,
  organizationMessages,
  profileFieldsError,
  profileMessages,
  readOrganizationProfile,
} from "./profile";
import { activityOf } from "./health";
import { currentContacts, newInvitation, nextId, orgs, statusOf, type StoredOrg } from "./store";
import { ORGANIZATION_NOTES_MAX } from "./types";

/*
 * Backend: implement these against the real data store and email service,
 * keeping the names, inputs (FormData field names) and ActionState results.
 * Every action must also verify the caller is an SDC admin.
 */

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const fail = (message: string): ActionState => ({ status: "error", message });

/** Revalidates Partners and the partner portal's Team list, then returns the result. */
function settle<D>(result: ActionState<D>): ActionState<D> {
  revalidatePath("/admin/partners");
  revalidatePath("/partner", "layout");
  return result;
}

function findContact(contactId: string) {
  for (const org of orgs()) {
    const contact = findContactIn(org, contactId);
    if (contact) return { org, contact };
  }
  return null;
}

/**
 * Reinviting a removed organization (owner decision 8): its removal is cleared, but nobody has access
 * until the invited person accepts. Its other people stay removed and can be invited again. Listings are
 * stored as closed first so none reopen before then; the acceptance handler reopens them
 * (docs/backend/partners.md).
 */
function reinstateForInvite(org: StoredOrg, email: string) {
  closeListingsForOrganization(org.id);
  for (const c of currentContacts(org)) {
    if (c.email.toLowerCase() !== email.toLowerCase()) c.removedAt = org.removedAt;
  }
  org.removedAt = undefined;
}

/** Fields: name, email, organizationId (existing, including a removed one) or organizationName (new). */
export async function invitePartner(_prev: ActionState<InviteResult>, fd: FormData): Promise<ActionState<InviteResult>> {
  const name = text(fd, "name");
  const email = text(fd, "email");
  const organizationId = text(fd, "organizationId");
  const organizationName = text(fd, "organizationName");

  let org = orgs().find((o) => o.id === organizationId);
  const fieldErrors = contactFieldErrors(name, email, { audience: "admin", org });
  if (!org && !organizationName) fieldErrors.organization = organizationMessages.chooseOrganization;
  if (!org && organizationName && orgs().some((o) => o.name.toLowerCase() === organizationName.toLowerCase())) {
    fieldErrors.organization = organizationMessages.nameExists;
  }
  if (Object.keys(fieldErrors).length) return { status: "error", fieldErrors };

  if (!org) {
    org = { id: nextId("org"), name: organizationName, contacts: [], createdAt: new Date().toISOString(), everActive: false };
    orgs().push(org);
  }
  const reinviting = statusOf(org) === "removed";
  if (reinviting) reinstateForInvite(org, email);
  const success = reinviting ? organizationMessages.reinvited(email, org.name) : contactMessages.sent(email);
  return settle(await addInvitedContact(org, name, email, success));
}

/** Resend invitation (pending), Retry (not sent) or Send new invitation (expired). */
export async function resendInvitation(contactId: string): Promise<ActionState> {
  const found = findContact(contactId);
  if (!found) return fail(contactMessages.personMissing);
  return settle(await resendContactInvitation(found.org, contactId));
}

/** Deletes a pending person; see cancelContactInvitation in _data/contacts.ts. */
export async function cancelInvitation(contactId: string): Promise<ActionState> {
  const found = findContact(contactId);
  if (!found) return fail(contactMessages.personMissing);
  return settle(cancelContactInvitation(found.org, contactId));
}

/** Removes one person from their organization; see removeContactFromOrganization in _data/contacts.ts. */
export async function removeContact(contactId: string): Promise<ActionState> {
  const found = findContact(contactId);
  if (!found) return fail(contactMessages.personMissing);
  return settle(removeContactFromOrganization(found.org, contactId, { audience: "admin" }));
}

/**
 * Fields: name, email. Changing the email sends a fresh invitation to the new address; an active person
 * stays active. If that email can't be sent, nothing is saved.
 */
export async function updateContact(contactId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const found = findContact(contactId);
  if (!found) return fail(contactMessages.personMissing);
  const name = text(fd, "name");
  const email = text(fd, "email");
  const fieldErrors = contactFieldErrors(name, email, { audience: "admin", org: found.org, exceptContactId: contactId });
  if (Object.keys(fieldErrors).length) return { status: "error", fieldErrors };

  const emailChanged = email.toLowerCase() !== found.contact.email.toLowerCase();
  if (emailChanged && statusOf(found.org) !== "removed") {
    if (!(await sendInvitationEmail(email))) return fail(contactMessages.notSent);
    found.contact.invitation = newInvitation();
  }
  found.contact.name = name;
  found.contact.email = email;
  return settle({
    status: "success",
    message: emailChanged ? `${profileMessages.saved(name)} ${contactMessages.sent(email)}` : profileMessages.saved(name),
  });
}

/** Fields: name, website, description (see _data/profile.ts; the same rules as the partner portal). */
export async function updateOrganization(orgId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const org = orgs().find((o) => o.id === orgId);
  if (!org) return fail(organizationMessages.missing);
  const result = readOrganizationProfile(org, fd);
  if (result.fieldErrors) return profileFieldsError(result.fieldErrors);
  applyOrganizationProfile(org, result.changes);
  return settle({ status: "success", message: profileMessages.saved(org.name) });
}

/** Remove access: everyone at the organization loses portal access; its listings close (Partner access removed). */
export async function removePartner(orgId: string): Promise<ActionState> {
  const org = orgs().find((o) => o.id === orgId);
  if (!org) return fail(organizationMessages.missing);
  if (statusOf(org) === "removed") return fail(organizationMessages.alreadyRemoved);
  org.everActive ||= currentContacts(org).some((c) => c.status === "active");
  org.removedAt = new Date().toISOString();
  closeListingsForOrganization(org.id);
  return settle({ status: "success", message: organizationMessages.removed(org.name) });
}

/**
 * Field: notes. SDC-only notes on an organization, saved with the admin's name and the time. Empty clears
 * them. Never returned to the partner portal.
 */
/** Hides this organization's current health tag (owner: "I don't need to worry about them"). */
export async function dismissHealth(orgId: string): Promise<ActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) return fail(organizationMessages.missing);
  const org = orgs().find((o) => o.id === orgId);
  if (!org) return fail(organizationMessages.missing);
  org.healthDismissed = activityOf(org).health?.tag;
  return settle({ status: "success", message: organizationMessages.healthDismissed(org.name) });
}

export async function saveOrganizationNotes(orgId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) return fail(organizationMessages.missing);
  const org = orgs().find((o) => o.id === orgId);
  if (!org) return fail(organizationMessages.missing);
  const notes = text(fd, "notes");
  if (notes.length > ORGANIZATION_NOTES_MAX) return { status: "error", fieldErrors: { notes: notesMessages.tooLong } };
  org.notes = notes ? { text: notes, editedBy: admin.name, editedAt: new Date().toISOString() } : undefined;
  return settle({ status: "success", message: notesMessages.saved(org.name) });
}
