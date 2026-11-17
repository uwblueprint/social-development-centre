import type { Metadata } from "next";
import { demoMember, membershipReasons, tiers } from "../unsubscribe/data";
import { CancelFlow, type CancelFlowStart, type CancelStep } from "./CancelFlow";
import { cancelCopy } from "./copy";

export const metadata: Metadata = { title: cancelCopy.pageTitle };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const steps: CancelStep[] = ["reasons", "confirm", "cancelled"];

/**
 * The cancel-membership flow, as reached from footer link 2 in an SDC email ("Pause or cancel
 * membership") or "Cancel membership" on the unsubscribed page. Member facing, so no sidebar. Every
 * state opens directly:
 *
 * - `?step=reasons|confirm|cancelled` (default reasons: "Before you go").
 * - `?reason=emails|budget|break|done` opens with that answer chosen.
 * - `?state=paused|switched|unsubscribed` opens just after that action (with break, budget, emails).
 * - `?subscribed=false` for someone who no longer gets emails: no email question after cancelling.
 * - `?policy=end-of-period` shows the end-of-period cut-off on the confirm step (default: ends today).
 * - `?tier=friend|supporter|sustainer` sets the demo member's tier (default supporter). A Friend has
 *   no lower tier, so "too expensive" opens straight to the pause.
 */
export default async function CancelMembershipDesign({ searchParams }: PageProps<"/design/cancel-membership">) {
  const params = await searchParams;
  const step = first(params.step);
  const reason = first(params.reason);
  const tierParam = first(params.tier);

  const start: CancelFlowStart = {
    step: steps.find((s) => s === step) ?? "reasons",
    reason: membershipReasons.find((r) => r === reason) ?? null,
    state: first(params.state) ?? null,
    subscribed: first(params.subscribed) !== "false",
    policy: first(params.policy) === "end-of-period" ? "end-of-period" : "ends-today",
    tierId: tiers.some((t) => t.id === tierParam) ? tierParam! : demoMember.tierId,
  };
  // Keyed by the URL so changing a parameter starts the flow fresh.
  return <CancelFlow key={JSON.stringify(start)} start={start} />;
}
