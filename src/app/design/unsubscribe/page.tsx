import type { Metadata } from "next";
import { unsubscribeCopy } from "./copy";
import { EMAIL_RESULTS, SCREENS, SCREENS_WITH_DONE, demoMember, tiers, type EmailResult, type Screen } from "./data";
import { UnsubscribeFlow } from "./UnsubscribeFlow";

export const metadata: Metadata = { title: unsubscribeCopy.notInDoc.pageTitle };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * Email preferences and pause/cancel membership, as reached from an SDC email's footer links. Member
 * facing, so no sidebar. Every screen and variant opens directly for review:
 *
 * - `?screen=A4|B1…B5` opens that screen (default A4). A4, the email page, is footer link 1, as on
 *   Luma: one click from the email. B1 is footer link 2.
 * - `?fewer=open` opens A4 with "Stay in the loop with fewer emails" expanded.
 * - `?state=done` opens A4 unsubscribed, or B2's or B3's confirmed state.
 * - `?state=saved` opens A4 just after saving fewer emails; `?state=resubscribed` just after resubscribing.
 * - `?member=false` shows the version for someone who only subscribes (default true). B screens are
 *   for paying members only, so they always show a member.
 * - `?policy=end-of-period` shows B4's end-of-period cut-off (default: ends today).
 * - `?tier=friend|supporter|sustainer` sets the demo member's tier; `friend` is the lowest, so B2 hides
 *   the switch-tier offer.
 */
export default async function UnsubscribeDesign({ searchParams }: PageProps<"/design/unsubscribe">) {
  const params = await searchParams;
  const screenParam = first(params.screen)?.toUpperCase();
  const screen: Screen = SCREENS.includes(screenParam as Screen) ? (screenParam as Screen) : "A4";
  const tierParam = first(params.tier);
  const tierId = tiers.some((t) => t.id === tierParam) ? tierParam! : demoMember.tierId;
  // B2's confirmation is a switch to a lower tier, which the lowest tier doesn't have.
  const done =
    first(params.state) === "done" && SCREENS_WITH_DONE.includes(screen) && !(screen === "B2" && tierId === tiers[0].id);
  const stateParam = first(params.state);
  const emailResult =
    screen === "A4" && EMAIL_RESULTS.includes(stateParam as EmailResult) ? (stateParam as EmailResult) : null;
  const isMember = screen.startsWith("B") || first(params.member) !== "false";
  const policy = first(params.policy) === "end-of-period" ? "end-of-period" : "ends-today";

  const fewerOpen = screen === "A4" && (first(params.fewer) === "open" || emailResult === "saved");

  const start = { screen, done, emailResult, fewerOpen, isMember, policy, tierId } as const;
  // Keyed by the URL so changing a parameter starts the flow fresh.
  return <UnsubscribeFlow key={JSON.stringify(start)} start={start} />;
}
