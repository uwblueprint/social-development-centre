import type { Metadata } from "next";
import { unsubscribeCopy } from "./copy";
import { demoMember, tiers } from "./data";
import { UnsubscribeFlow, type EmailFlowStart, type EmailScreen } from "./UnsubscribeFlow";

export const metadata: Metadata = { title: unsubscribeCopy.pageTitle };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const screens: EmailScreen[] = ["preferences", "unsubscribed", "closed"];

/**
 * The email flow, as reached from footer link 1 in an SDC email. Member facing, so no sidebar.
 * Cancelling a membership is its own flow at /design/cancel-membership. Whether the person is a
 * member comes from their record (`demoMember.isMember` in data.ts), never the URL. Every state opens
 * directly:
 *
 * - `?screen=unsubscribed` is the page after "Unsubscribe"; `?screen=closed` the
 *   closing screen after "Sounds good" (default: "Unsubscribe from SDC emails").
 * - `?tier=friend|supporter|sustainer` sets the demo member's tier (default sustainer).
 */
export default async function UnsubscribeDesign({ searchParams }: PageProps<"/design/unsubscribe">) {
  const params = await searchParams;
  const screenParam = first(params.screen);
  const tierParam = first(params.tier);

  const start: EmailFlowStart = {
    screen: screens.find((s) => s === screenParam) ?? "preferences",
    tierId: tiers.some((t) => t.id === tierParam) ? tierParam! : demoMember.tierId,
  };
  // Keyed by the URL so changing a parameter starts the flow fresh.
  return <UnsubscribeFlow key={JSON.stringify(start)} start={start} />;
}
