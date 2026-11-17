import type { Metadata } from "next";
import { unsubscribeCopy } from "./copy";
import { SCREENS, demoMember, emailReasons, membershipReasons, tiers, type Screen } from "./data";
import { UnsubscribeFlow, type FlowStart } from "./UnsubscribeFlow";

export const metadata: Metadata = { title: unsubscribeCopy.pageTitle };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const oneOf = <T extends string>(list: readonly T[], v: string | undefined): T | null =>
  list.includes(v as T) ? (v as T) : null;

/**
 * The email page and the pause/cancel membership pages, as reached from an SDC email's two footer
 * links. Member facing, so no sidebar. Every state opens directly for review:
 *
 * - `?screen=A4|A5|B1|B4|B5` (default A4). A4, the email page, is footer link 1; A5 is its closing screen ("Sounds good"); B1 ("Pause or cancel
 *   membership") is footer link 2; B4 confirms cancelling; B5 is cancelled.
 * - `?reason=…` opens with that "What's going on?" answer chosen. A4: too-many, not-relevant,
 *   no-more. B1: emails, budget, break, done.
 * - `?state=…` opens just after an action. A4: saved (with reason=too-many), unsubscribed,
 *   resubscribed. B1: paused (with reason=break or budget), unsubscribed (with reason=emails).
 * - `?member=false` shows A4 for someone who only subscribes (default: a member).
 * - `?policy=end-of-period` shows B4's end-of-period cut-off (default: ends today).
 * - `?tier=friend|supporter|sustainer` sets the demo member's tier.
 */
export default async function UnsubscribeDesign({ searchParams }: PageProps<"/design/unsubscribe">) {
  const params = await searchParams;
  const screen: Screen = oneOf(SCREENS, first(params.screen)?.toUpperCase()) ?? "A4";
  const reasonParam = first(params.reason);
  const emailReason = screen === "A4" ? oneOf(emailReasons, reasonParam) : null;
  const membershipReason = screen === "B1" ? oneOf(membershipReasons, reasonParam) : null;
  const state = first(params.state) ?? null;
  const tierParam = first(params.tier);

  const start: FlowStart = {
    screen,
    emailReason,
    membershipReason,
    state,
    isMember: screen !== "A4" || first(params.member) !== "false",
    policy: first(params.policy) === "end-of-period" ? "end-of-period" : "ends-today",
    tierId: tiers.some((t) => t.id === tierParam) ? tierParam! : demoMember.tierId,
  };
  // Keyed by the URL so changing a parameter starts the flow fresh.
  return <UnsubscribeFlow key={JSON.stringify(start)} start={start} />;
}
