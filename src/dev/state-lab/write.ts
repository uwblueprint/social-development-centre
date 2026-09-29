/* STATE LAB (disposable): the save-side switches. Server only (reads request headers). */
import { headers } from "next/headers";
import { DELAY_MS, labFlag, sleep } from "./state";

/**
 * Call in the session getters. Only affects server actions (saves), never page loads:
 * slow saves show pending buttons; failing saves throw; "signedOut" makes the getter return null.
 */
export async function labWrite(): Promise<"signed-out" | null> {
  if (!labFlag("slowSave") && !labFlag("saveError") && !labFlag("signedOut")) return null;
  const isAction = (await headers()).has("next-action");
  if (!isAction) return null;
  if (labFlag("slowSave")) await sleep(DELAY_MS);
  if (labFlag("saveError")) throw new Error("State lab: simulated server failure while saving.");
  return labFlag("signedOut") ? "signed-out" : null;
}

