"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/forms";
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
