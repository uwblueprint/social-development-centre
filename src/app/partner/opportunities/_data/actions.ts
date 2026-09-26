"use server";

import type { ActionState } from "@/lib/forms";
import * as service from "@/features/opportunities/service";
import type { Actor } from "@/features/opportunities/types";
import { getCurrentPartner } from "../../_data/session";

/* Partner entry points: scoped to the signed-in contact's organization. The actor always comes from the session, never from the client. */

async function actor(): Promise<Actor> {
  const partner = await getCurrentPartner();
  if (!partner) throw new Error("Not signed in as a partner.");
  return { role: "partner", name: partner.name, organizationId: partner.organization.id };
}

export async function saveOpportunity(_prev: ActionState<{ id: string }>, fd: FormData) {
  return service.saveOpportunity(await actor(), fd);
}
export async function closeOpportunity(id: string) {
  return service.closeOpportunity(await actor(), id);
}
export async function reopenOpportunity(id: string) {
  return service.reopenOpportunity(await actor(), id);
}
export async function duplicateOpportunity(id: string) {
  return service.duplicateOpportunity(await actor(), id);
}
export async function deleteOpportunity(id: string) {
  return service.deleteOpportunity(await actor(), id);
}
