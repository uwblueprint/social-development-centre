import { labWrite } from "@/dev/state-lab/write"; // STATE LAB (disposable)
import type { MemberProfile } from "@/features/feed/types";

/**
 * Backend: return the signed-in paying member, or null if the user isn't signed in or isn't a paying
 * member. The layout then redirects to /login. Every member action must re-check this.
 * Interests are the topics chosen at onboarding.
 */
export async function getCurrentMember(): Promise<MemberProfile | null> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("getCurrentMember is not implemented: add the paying-member check before shipping.");
  }
  if ((await labWrite()) === "signed-out") return null; // STATE LAB (disposable)
  // Dev: a placeholder paying member who picked three topics at onboarding.
  return { id: "member_1", name: "Jordan Lee", email: "jordan.lee@example.org", interests: ["housing", "food", "civic"] };
}
