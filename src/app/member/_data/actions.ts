"use server";

import { TOPICS } from "@/features/opportunities/catalog";
import type { TopicId } from "@/features/opportunities/types";
import { feedCopy } from "@/features/feed/copy";
import type { ActionState } from "@/lib/forms";
import { getCurrentMember } from "./session";

/*
 * Member entry points. The member always comes from the session, never from the client. Until the backend
 * exists the browser also keeps a local copy (src/features/feed/store.ts), so these only need to confirm the
 * member is signed in and could save; docs/backend/feed.md says what each must store.
 */

const signedOut: ActionState = { status: "error", message: feedCopy.toast.signedOut, fieldErrors: { session: "signed-out" } };

async function guarded(run: (memberId: string) => ActionState | Promise<ActionState>, failure: string): Promise<ActionState> {
  try {
    const member = await getCurrentMember();
    if (!member) return signedOut;
    return await run(member.id);
  } catch {
    return { status: "error", message: failure };
  }
}

/** Someone opened an opportunity's link from the feed. Idempotent: opening it again keeps the first `openedAt`. */
export async function recordOpen(opportunityId: string): Promise<ActionState> {
  return guarded(() => (opportunityId ? { status: "success" } : { status: "error", message: feedCopy.toast.saveFailed }), feedCopy.toast.saveFailed);
}

/** Removes an opportunity from Your opportunities (also what Undo calls). */
export async function forgetOpen(opportunityId: string): Promise<ActionState> {
  return guarded(() => (opportunityId ? { status: "success" } : { status: "error", message: feedCopy.toast.saveFailed }), feedCopy.toast.saveFailed);
}

/** Field: `topic`, once per chosen topic. Replaces the member's interests. */
export async function saveInterests(_prev: ActionState<{ interests: TopicId[] }>, fd: FormData): Promise<ActionState<{ interests: TopicId[] }>> {
  const valid = new Set<string>(TOPICS.map((t) => t.id));
  const interests = fd.getAll("topic").filter((t): t is TopicId => typeof t === "string" && valid.has(t));
  try {
    const member = await getCurrentMember();
    if (!member) return { status: "error", message: feedCopy.interests.signedOut, fieldErrors: { session: "signed-out" } };
    return { status: "success", data: { interests } };
  } catch {
    return { status: "error", message: feedCopy.interests.saveFailed };
  }
}
