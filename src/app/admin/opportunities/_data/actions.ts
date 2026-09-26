"use server";

import type { ActionState } from "@/lib/forms";
import * as service from "@/features/opportunities/service";
import type { Actor } from "@/features/opportunities/types";
import { getCurrentAdmin } from "../../_data/session";

/* Admin entry points: the actor always comes from the session, never from the client. */

async function actor(): Promise<Actor> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not signed in as an SDC admin.");
  return { role: "admin", name: admin.name };
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
