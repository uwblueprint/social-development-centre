import type { ActionState } from "@/lib/forms";
import type { InvitationState, PartnerContact } from "./types";
import { currentContacts, newInvitation, nextId, orgs, statusOf, type StoredContact, type StoredOrg } from "./store";

/*
 * Rules for people and invitations, shared by the admin (Partners) and partner (/partner/organization)
 * actions so both portals validate, invite, resend, cancel and remove the same way and say the same thing.
 * Not a server action module: each portal's actions check the caller, find the organization, call these,
 * then revalidate their own pages. Backend: replace the store calls; keep the states and messages.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Which portal is asking: the refusals point partners to SDC and admins to the action they have. */
export type Audience = "admin" | "partner";

/** Server messages about people and invitations (docs/ux/portal.md, Team and invitations). */
export const contactMessages = {
  nameMissing: "Enter their name.",
  emailInvalid: "Enter an email address like name@example.org.",
  alreadyHasAccessHere: "This person already has access to your organization.",
  alreadyAt: (organization: string) => `This person already has access to ${organization}.`,
  alreadyElsewhere: "This person already has access to another organization. Contact SDC for help.",
  sent: (email: string) => `Invitation sent to ${email}.`,
  savedNotSent: (name: string) => `${name} was added, but we couldn't send the invitation. Select Retry to try again.`,
  notSent: "We couldn't send the invitation. Try again.",
  resent: (email: string) => `New invitation sent to ${email}. The previous link won't work.`,
  resendFailed: "We couldn't send the new invitation. Try again.",
  cancelled: "Invitation cancelled.",
  personMissing: "This person could not be found.",
  invitationClosed: "This invitation is no longer open. Refresh the team list.",
  removeRefusedPending: "This person doesn't have access yet. Cancel their invitation instead.",
  removeRefusedLast: {
    partner: "This is the only person with access to this organization. Contact SDC for help.",
    admin: "This is the only person with access to this organization. Remove the organization's access instead.",
  },
  removeRefusedSelf: "You can't remove your own access. Ask a colleague or SDC for help.",
  removed: (name: string, organization: string) => `${name} was removed from ${organization}. They no longer have access.`,
} as const;

/** `saved` tells an invite dialog whether to close (the person is listed) or stay open with its values. */
export type InviteResult = { saved: boolean };

const fail = <D = undefined>(message: string, data?: D): ActionState<D> => ({ status: "error", message, data });
const ok = (message: string): ActionState => ({ status: "success", message });

/** Mutually exclusive invitation state of a pending person; undefined once they've accepted. */
export function invitationStateOf(
  contact: Pick<PartnerContact, "status" | "invitation">,
  now = Date.now(),
): InvitationState | undefined {
  if (contact.status !== "pending") return undefined;
  const { sentAt, expiresAt } = contact.invitation ?? {};
  if (!sentAt || !expiresAt) return "notSent";
  return Date.parse(expiresAt) <= now ? "expired" : "pending";
}

export const withInvitationState = (contact: StoredContact): PartnerContact => ({
  ...contact,
  invitationState: invitationStateOf(contact),
});

/**
 * Dev stand-in for the email service: addresses containing "fail" simulate a delivery failure.
 * The reason is logged for SDC and never shown to the person.
 */
export async function sendInvitationEmail(email: string): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 500));
  if (email.includes("fail")) {
    console.error(`[invitations] Delivery to ${email} failed (simulated).`);
    return false;
  }
  return true;
}

/** Where an email already has access: an organization, or nothing. Removed organizations don't count. */
function organizationUsing(email: string, exceptContactId?: string) {
  return orgs().find(
    (o) =>
      statusOf(o) !== "removed" &&
      currentContacts(o).some((c) => c.id !== exceptContactId && c.email.toLowerCase() === email.toLowerCase()),
  );
}

/** True if the email belongs to a current person at a current organization. */
export const emailInUse = (email: string, exceptContactId?: string) => !!organizationUsing(email, exceptContactId);

/**
 * Field errors for a person's name and email. `org` is the organization they're joining (undefined for a
 * brand-new one); partners never learn which other organization an email belongs to.
 */
export function contactFieldErrors(
  name: string,
  email: string,
  { audience, org, exceptContactId }: { audience: Audience; org?: StoredOrg; exceptContactId?: string },
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = contactMessages.nameMissing;
  if (!EMAIL.test(email)) fieldErrors.email = contactMessages.emailInvalid;
  else {
    const holder = organizationUsing(email, exceptContactId);
    if (holder) {
      fieldErrors.email =
        audience === "admin"
          ? contactMessages.alreadyAt(holder.name)
          : holder === org
            ? contactMessages.alreadyHasAccessHere
            : contactMessages.alreadyElsewhere;
    }
  }
  return fieldErrors;
}

/** Saves the person (dev: an address containing "nosave" simulates a failed save). */
function savePendingContact(org: StoredOrg, name: string, email: string): StoredContact {
  if (email.includes("nosave")) throw new Error("Simulated save failure.");
  // Someone who was here before (removed, or at a removed organization) is restored, not duplicated.
  const existing = org.contacts.find((c) => c.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    Object.assign(existing, { name, status: "pending", invitation: {}, removedAt: undefined });
    return existing;
  }
  const created: StoredContact = { id: nextId("c"), name, email, status: "pending", invitation: {} };
  org.contacts.push(created);
  return created;
}

/**
 * Saves a pending person at `org`, then sends their invitation (single use, 7 days). Validate first.
 * Saved but not delivered → the person is listed as Invitation not sent (`data.saved`).
 * Nothing saved → the dialog keeps its values.
 */
export async function addInvitedContact(
  org: StoredOrg,
  name: string,
  email: string,
  successMessage = contactMessages.sent(email),
): Promise<ActionState<InviteResult>> {
  let contact: StoredContact;
  try {
    contact = savePendingContact(org, name, email);
  } catch (error) {
    console.error("[invitations] Couldn't save the person.", error);
    return fail(contactMessages.notSent, { saved: false });
  }
  if (!(await sendInvitationEmail(email))) return fail(contactMessages.savedNotSent(name), { saved: true });
  contact.invitation = newInvitation();
  return { status: "success", message: successMessage, data: { saved: true } };
}

export function findContactIn(org: StoredOrg, contactId: string) {
  return currentContacts(org).find((c) => c.id === contactId);
}

/**
 * Resend (pending), Retry (not sent) or Send new invitation (expired). Only a successful send replaces the
 * link: a failure leaves the earlier link, its expiry and the row's state exactly as they were.
 */
export async function resendContactInvitation(org: StoredOrg, contactId: string): Promise<ActionState> {
  const contact = findContactIn(org, contactId);
  if (!contact) return fail(contactMessages.personMissing);
  const state = invitationStateOf(contact);
  if (!state) return fail(contactMessages.invitationClosed);
  const delivered = await sendInvitationEmail(contact.email);
  if (!delivered) return fail(state === "notSent" ? contactMessages.notSent : contactMessages.resendFailed);
  contact.invitation = newInvitation();
  return ok(state === "notSent" ? contactMessages.sent(contact.email) : contactMessages.resent(contact.email));
}

/**
 * Deletes a pending person (any invitation state). An organization always has at least one person, so if
 * nobody is left: one that was never active is deleted too; one that was (a reinvited organization whose
 * only invitation is cancelled) goes back to Removed.
 */
export function cancelContactInvitation(org: StoredOrg, contactId: string): ActionState {
  const contact = findContactIn(org, contactId);
  if (!contact) return fail(contactMessages.personMissing);
  if (contact.status !== "pending") return fail(contactMessages.invitationClosed);
  org.contacts = org.contacts.filter((c) => c.id !== contactId);
  if (org.contacts.length === 0 && !org.everActive) {
    const all = orgs();
    all.splice(all.indexOf(org), 1);
  } else if (currentContacts(org).length === 0 && !org.removedAt) {
    org.removedAt = new Date().toISOString();
  }
  return ok(contactMessages.cancelled);
}

/**
 * Removes one person who has access (they left the organization). Their access ends now; the record is kept
 * for history (People → Removed) and they can be invited again. Refuses pending people, the last person with
 * access, and (for partners) the caller themselves.
 */
export function removeContactFromOrganization(
  org: StoredOrg,
  contactId: string,
  { audience, selfContactId }: { audience: Audience; selfContactId?: string },
): ActionState {
  const contact = findContactIn(org, contactId);
  if (!contact) return fail(contactMessages.personMissing);
  if (contact.status !== "active") return fail(contactMessages.removeRefusedPending);
  if (currentContacts(org).filter((c) => c.status === "active").length <= 1) {
    return fail(contactMessages.removeRefusedLast[audience]);
  }
  if (contactId === selfContactId) return fail(contactMessages.removeRefusedSelf);
  contact.removedAt = new Date().toISOString();
  contact.invitation = undefined;
  return ok(contactMessages.removed(contact.name, org.name));
}
