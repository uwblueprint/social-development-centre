import type { Metadata } from "next";
import { unsubscribeCopy } from "./copy";
import { demoMember, emailReasons, tiers } from "./data";
import { UnsubscribeFlow, type EmailFlowStart } from "./UnsubscribeFlow";

export const metadata: Metadata = { title: unsubscribeCopy.pageTitle };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * The email flow, as reached from footer link 1 in an SDC email. Member facing, so no sidebar.
 * Cancelling a membership is its own flow at /design/cancel-membership. Every state opens directly:
 *
 * - `?screen=closed` is the closing screen after "Sounds good" (default: the email page).
 * - `?reason=too-many|not-relevant|no-more` opens with that answer chosen.
 * - `?state=saved|unsubscribed|resubscribed` opens just after that action (saved goes with too-many).
 * - `?member=false` shows the page for someone who only subscribes (default: a member).
 * - `?tier=friend|supporter|sustainer` sets the demo member's tier (default sustainer).
 */
export default async function UnsubscribeDesign({ searchParams }: PageProps<"/design/unsubscribe">) {
  const params = await searchParams;
  const reason = first(params.reason);
  const tierParam = first(params.tier);

  const start: EmailFlowStart = {
    screen: first(params.screen) === "closed" ? "closed" : "email",
    reason: emailReasons.find((r) => r === reason) ?? null,
    state: first(params.state) ?? null,
    isMember: first(params.member) !== "false",
    tierId: tiers.some((t) => t.id === tierParam) ? tierParam! : demoMember.tierId,
  };
  // Keyed by the URL so changing a parameter starts the flow fresh.
  return <UnsubscribeFlow key={JSON.stringify(start)} start={start} />;
}
