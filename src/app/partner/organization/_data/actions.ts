"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/forms";
import {
  addInvitedContact,
  cancelContactInvitation,
  contactFieldErrors,
  findContactIn,
  removeContactFromOrganization,
  resendContactInvitation,
} from "@/app/admin/partners/_data/contacts";
import { applyOrganizationProfile, profileFieldsError, readOrganizationProfile } from "@/app/admin/partners/_data/profile";
import { orgs, statusOf } from "@/app/admin/partners/_data/store";
import { getCurrentPartner } from "../../_data/session";

/*
 * Backend: implement against the real data store, keeping the name, FormData fields and ActionState result.
 * The organization always comes from the session, never from the client; see docs/backend/opportunities.md.
 */

/** Fields: name, website, description. Same rules as the admin's updateOrganization. */
export async function updateMyOrganization(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const partner = await getCurrentPartner();
  if (!partner) return { status: "error", message: "Your session ended. Sign in again to save changes." };
  const org = orgs().find((o) => o.id === partner.organization.id);
  if (!org || statusOf(org) === "removed") {
    return { status: "error", message: "Your organization's access has ended. Contact SDC if this is a mistake." };
  }
  const result = readOrganizationProfile(org, fd);
  if (result.fieldErrors) return profileFieldsError(result.fieldErrors);
  applyOrganizationProfile(org, result.changes);
  // The organization's name is the sidebar's product name, and Partners shows the profile too.
  revalidatePath("/partner", "layout");
  revalidatePath("/admin/partners");
  return { status: "success", message: "Changes saved." };
}

/*
 * Team: partners invite and remove colleagues in their own organization (partners decision 10).
 * Every action re-checks the session and only touches contacts of the signed-in partner's organization;
 * a contact ID from another organization acts as if it doesn't exist. Rules and messages are shared with
 * the admin actions (src/app/admin/partners/_data/contacts.ts).
 */

const SESSION_ENDED: ActionState = { status: "error", message: "Your session ended. Sign in again to save changes." };
const ACCESS_ENDED: ActionState = {
  status: "error",
  message: "Your organization's access has ended. Contact SDC if this is a mistake.",
};

type MyOrganization =
  | { error: ActionState }
  | { partner: NonNullable<Awaited<ReturnType<typeof getCurrentPartner>>>; org: ReturnType<typeof orgs>[number] };

async function myOrganization(): Promise<MyOrganization> {
  const partner = await getCurrentPartner();
  if (!partner) return { error: SESSION_ENDED };
  const org = orgs().find((o) => o.id === partner.organization.id);
  if (!org || statusOf(org) === "removed") return { error: ACCESS_ENDED };
  return { partner, org };
}

const settle = (result: ActionState): ActionState => {
  revalidatePath("/partner/organization");
  revalidatePath("/admin/partners");
  return result;
};

/** Fields: name, email. Invites a colleague to the signed-in partner's organization. */
export async function inviteColleague(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const me = await myOrganization();
  if ("error" in me) return me.error;
  const name = String(fd.get("name") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim();
  const fieldErrors = contactFieldErrors(name, email, { inUseMessage: "This person is already a current partner contact." });
  if (Object.keys(fieldErrors).length) return { status: "error", message: "Check the highlighted fields.", fieldErrors };
  return settle(await addInvitedContact(me.org, name, email));
}

export async function resendColleagueInvitation(contactId: string): Promise<ActionState> {
  const me = await myOrganization();
  if ("error" in me) return me.error;
  return settle(await resendContactInvitation(me.org, contactId));
}

export async function cancelColleagueInvitation(contactId: string): Promise<ActionState> {
  const me = await myOrganization();
  if ("error" in me) return me.error;
  return settle(cancelContactInvitation(me.org, contactId));
}

/** Removes an active colleague. Nobody can remove themselves (the UI hides the option on their own row). */
export async function removeColleague(contactId: string): Promise<ActionState> {
  const me = await myOrganization();
  if ("error" in me) return me.error;
  if (findContactIn(me.org, contactId) && contactId === me.partner.contactId) {
    return { status: "error", message: "You can't remove yourself. Ask a colleague or SDC to remove you." };
  }
  return settle(removeContactFromOrganization(me.org, contactId));
}
