import type { Metadata } from "next";
import { demoMember, membershipReasons, tiers } from "../unsubscribe/data";
import { CancelFlow, type CancelFlowStart } from "./CancelFlow";
import { cancelCopy } from "./copy";

export const metadata: Metadata = { title: cancelCopy.pageTitle };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * The cancel-membership flow, as reached from footer link 2 in an SDC email ("Pause or cancel
 * membership") or "Cancel membership" on the unsubscribed page. Member facing, so no sidebar. Every
 * state opens directly:
 *
 * - `?step=` choose (default) | pause | paused | reasons ("Before you go") | switched | unsubscribed |
 *   confirm | cancelled. The flow reads the step from the URL itself, so back and forward work.
 * - `?reason=emails|budget|break|done` opens "Before you go" with that answer chosen.
 * - `?subscribed=false` for someone who no longer gets emails: no email question after cancelling.
 * - `?policy=end-of-period` shows the end-of-period cut-off on the confirm step (default: ends today).
 * - `?tier=friend|supporter|sustainer` sets the demo member's tier (default supporter). A Friend has
 *   no lower tier, so "too expensive" offers only a pause.
 */
export default async function CancelMembershipDesign({ searchParams }: PageProps<"/design/cancel-membership">) {
  const params = await searchParams;
  const reason = first(params.reason);
  const tierParam = first(params.tier);

  const start: CancelFlowStart = {
    reason: membershipReasons.find((r) => r === reason) ?? null,
    subscribed: first(params.subscribed) !== "false",
    policy: first(params.policy) === "end-of-period" ? "end-of-period" : "ends-today",
    tierId: tiers.some((t) => t.id === tierParam) ? tierParam! : demoMember.tierId,
  };
  // Keyed by everything but the step, so moving between steps keeps the flow's state.
  return <CancelFlow key={JSON.stringify(start)} start={start} />;
}
