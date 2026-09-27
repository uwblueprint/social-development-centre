"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/forms";
import {
  addInvitedContact,
  cancelContactInvitation,
  contactFieldErrors,
  removeContactFromOrganization,
  resendContactInvitation,
  type InviteResult,
} from "@/app/admin/partners/_data/contacts";
import { applyOrganizationProfile, profileFieldsError, profileMessages, readOrganizationProfile } from "@/app/admin/partners/_data/profile";
import { orgs, statusOf } from "@/app/admin/partners/_data/store";
import { partnerCopy } from "../../_copy";
import { getCurrentPartner } from "../../_data/session";

/*
 * Backend: implement against the real data store, keeping the names, FormData fields and ActionState results.
 * The organization always comes from the session, never from the client; see docs/backend/opportunities.md.
 *
 * Every action first re-checks the session. If the person was signed out, or their organization lost access,
 * nothing is saved and the result carries `data.blocked`: the page then shows a persistent message with a
 * way forward (sign in again, or contact SDC) instead of a toast.
 */

/** Why an action couldn't run at all. */
export type Blocked = "signedOut" | "accessEnded";
export type BlockedData = { blocked?: Blocked };
/** Every Organization action's result: the shared rules' result, or `data.blocked`. */
export type PartnerResult<D = object> = ActionState<(BlockedData & D) | undefined>;

const blockedResult = (blocked: Blocked): PartnerResult<InviteResult> => ({
  status: "error",
  message: blocked === "signedOut" ? partnerCopy.organization.blocked.signedOut : partnerCopy.organization.blocked.accessEnded,
  data: { blocked, saved: false },
});

type Mine =
  | { blocked: Blocked }
  | { blocked?: undefined; partner: NonNullable<Awaited<ReturnType<typeof getCurrentPartner>>>; org: ReturnType<typeof orgs>[number] };

async function myOrganization(): Promise<Mine> {
  const partner = await getCurrentPartner();
  if (!partner) return { blocked: "signedOut" as const };
  const org = orgs().find((o) => o.id === partner.organization.id);
  if (!org || statusOf(org) === "removed") return { blocked: "accessEnded" as const };
  return { partner, org };
}

function settle<D>(result: ActionState<D>): ActionState<D> {
  revalidatePath("/partner", "layout");
  revalidatePath("/admin/partners");
  return result;
}

/** Fields: name, website, description. Same rules and messages as the admin's updateOrganization. */
export async function updateMyOrganization(_prev: PartnerResult, fd: FormData): Promise<PartnerResult> {
  const me = await myOrganization();
  if (me.blocked) return blockedResult(me.blocked);
  const result = readOrganizationProfile(me.org, fd);
  if (result.fieldErrors) return profileFieldsError(result.fieldErrors);
  applyOrganizationProfile(me.org, result.changes);
  // The organization's name is the sidebar's product name, and Partners shows the profile too.
  return settle({ status: "success", message: profileMessages.saved });
}

/*
 * Team: partners invite and remove colleagues in their own organization (partners decision 10).
 * A contact ID from another organization acts as if it doesn't exist. Rules and messages are shared with
 * the admin actions (src/app/admin/partners/_data/contacts.ts).
 */

/**
 * Fields: name, email. `data.saved` says whether the person was saved: if so the dialog closes and the
 * row shows (Invitation not sent with Retry if the email failed); if not, the dialog keeps its values.
 */
export async function inviteColleague(
  _prev: PartnerResult<InviteResult>,
  fd: FormData,
): Promise<PartnerResult<InviteResult>> {
  const me = await myOrganization();
  if (me.blocked) return blockedResult(me.blocked);
  const name = String(fd.get("name") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim();
  const fieldErrors = contactFieldErrors(name, email, { audience: "partner", org: me.org });
  if (Object.keys(fieldErrors).length) return { status: "error", fieldErrors };
  return settle(await addInvitedContact(me.org, name, email));
}

/** Resend invitation, Retry or Send new invitation, depending on the invitation's state. */
export async function resendColleagueInvitation(contactId: string): Promise<PartnerResult> {
  const me = await myOrganization();
  if (me.blocked) return blockedResult(me.blocked);
  return settle(await resendContactInvitation(me.org, contactId));
}

export async function cancelColleagueInvitation(contactId: string): Promise<PartnerResult> {
  const me = await myOrganization();
  if (me.blocked) return blockedResult(me.blocked);
  return settle(cancelContactInvitation(me.org, contactId));
}

/**
 * Removes a colleague who has access. Refuses the organization's last person with access and the caller
 * themselves (the UI hides that option on their own row).
 */
export async function removeColleague(contactId: string): Promise<PartnerResult> {
  const me = await myOrganization();
  if (me.blocked) return blockedResult(me.blocked);
  return settle(
    removeContactFromOrganization(me.org, contactId, { audience: "partner", selfContactId: me.partner.contactId }),
  );
}
