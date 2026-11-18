"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { unsubscribeCopy as shared } from "../unsubscribe/copy";
import {
  addMonths,
  demoMember,
  DEMO_TODAY,
  formatDate,
  formatMoney,
  formatMonthYear,
  membershipReasons,
  pauseLengths,
  tierById,
  tiers,
  type MembershipReason,
  type PauseLength,
} from "../unsubscribe/data";
import { Body, Lead, Note, Options, Stack, Template, TextLink, useFocusHeadingOn } from "../unsubscribe/parts";
import { cancelCopy as copy } from "./copy";

/*
 * The cancel-membership flow, its own path. Footer link 2 in every SDC email ("Pause or cancel
 * membership") and "Cancel membership" on the unsubscribed page both open "Before you go": one click
 * from either. Pausing is one of its offers.
 *
 *   Before you go ─► (break, or too expensive) Pause ─► Paused (end)
 *     ├─ too many emails → Unsubscribed, membership kept (end)
 *     ├─ too expensive   → Switched to a lower tier (end)
 *     └─ Continue to cancel ─► Cancel your membership? ─► We're sorry to see you go (end)
 *                                        └─ Keep my membership ─► Your membership is active again (end)
 *
 * Every step is in the URL (`?step=`), so the phone's back button goes back a step, not out of the
 * flow. Saying yes to an alternative ends on its own screen, like the email flow's "You can close this
 * tab now". Built from the email flow's parts (../unsubscribe/parts.tsx). Client state only.
 */

export const CANCEL_STEPS = ["reasons", "pause", "paused", "switched", "unsubscribed", "confirm", "kept", "cancelled"] as const;
export type CancelStep = (typeof CANCEL_STEPS)[number];

export interface CancelFlowStart {
  reason: MembershipReason | null;
  /** Still subscribed to emails. False skips the email question after cancelling. */
  subscribed: boolean;
  tierId: string;
}

const isStep = (s: string | null): s is CancelStep => CANCEL_STEPS.includes(s as CancelStep);

export function CancelFlow({ start }: { start: CancelFlowStart }) {
  const router = useRouter();
  const params = useSearchParams();
  const urlStep = params.get("step");
  const step: CancelStep = isStep(urlStep) ? urlStep : "reasons";

  const tier = tierById(start.tierId);
  const nextPayment = demoMember.nextPaymentDate;
  const lowerTiers = tiers.filter((t) => t.monthlyPrice < tier.monthlyPrice).reverse();

  const [navigated, setNavigated] = useState(false);
  const [reason, setReason] = useState<MembershipReason | null>(start.reason);
  const [pauseLength, setPauseLength] = useState<PauseLength>("1");
  const [switchedTo, setSwitchedTo] = useState(lowerTiers[0]?.id ?? tier.id);
  const [subscribed, setSubscribed] = useState(start.subscribed);
  const [askedAboutEmails, setAskedAboutEmails] = useState(start.subscribed);
  const [undone, setUndone] = useState(false);

  // A new step, or an undo that changes the heading: move focus to the heading.
  useFocusHeadingOn(`${step}:${undone}`);

  /** Go to a step, keeping the other demo parameters in the URL. */
  function go(next: CancelStep) {
    const query = new URLSearchParams(params);
    query.set("step", next);
    setUndone(false);
    setNavigated(true);
    router.push(`?${query}`, { scroll: false });
  }
  /** Back a step: the browser's back when we got here in this flow, else the first step. */
  function back(fallback: CancelStep) {
    if (navigated) router.back();
    else go(fallback);
  }

  const restartDate = addMonths(DEMO_TODAY, Number(pauseLength));
  const switched = tierById(switchedTo);

  switch (step) {
    case "pause":
      return (
        <Template
          screenKey={step}
          heading={copy.pause.heading}
          actions={
            <>
              <Button type="button" $size="lg" onClick={() => go("paused")}>
                {copy.pause.pause}
              </Button>
              <Button type="button" $variant="outline" $size="lg" onClick={() => back("reasons")}>
                {copy.back}
              </Button>
            </>
          }
        >
          <Options
            id="pause-question"
            question={copy.pause.question}
            value={pauseLength}
            onChange={setPauseLength}
            options={pauseLengths.map((l) => ({ value: l, label: copy.pause.lengths[l] }))}
          />
          <Stack>
            {/* After Disney+: the restart date updates as they choose, before they press Pause. */}
            <Lead aria-live="polite">{copy.pause.restartsOn(formatDate(restartDate))}</Lead>
            <Note>{copy.pause.whatHappens}</Note>
          </Stack>
        </Template>
      );

    case "paused":
      return (
        <Template
          screenKey={step}
          heading={undone ? copy.active.heading : copy.paused.heading}
          line={undone ? copy.active.thanks : copy.paused.body(formatDate(restartDate), formatMoney(tier.monthlyPrice))}
          undo={
            !undone && (
              <>
                <Note>{copy.paused.restartQuestion}</Note>
                <Button type="button" $variant="ghost" onClick={() => setUndone(true)}>
                  {copy.paused.restartNow}
                </Button>
              </>
            )
          }
        />
      );

    case "reasons":
      return (
        <Template
          screenKey={step}
          heading={copy.reasons.heading}
          // Always visible: the question never stands between someone and cancelling.
          actions={
            <Button type="button" $variant="danger-outline" $size="lg" onClick={() => go("confirm")}>
              {copy.reasons.continueToCancel}
            </Button>
          }
        >
          <Options
            id="cancel-question"
            question={copy.reasons.question}
            value={reason}
            onChange={setReason}
            // One line and the buttons for one alternative per answer; no nesting. "No longer
            // involved" has nothing to offer, so it just leaves Continue to cancel.
            options={membershipReasons.map((r) => ({
              value: r,
              label: copy.reasons.options[r],
              followUp:
                r === "emails" ? (
                  <>
                    <Body>{copy.reasons.emailsBody}</Body>
                    <Button
                      type="button"
                      $variant="outline"
                      $size="lg"
                      onClick={() => {
                        setSubscribed(false);
                        go("unsubscribed");
                      }}
                    >
                      {copy.reasons.emailsAction}
                    </Button>
                  </>
                ) : r === "budget" ? (
                  <>
                    <Body>
                      {lowerTiers.length > 0 ? copy.reasons.lowerTierBody(formatDate(nextPayment)) : copy.reasons.noLowerTierBody}
                    </Body>
                    {lowerTiers.map((t) => (
                      <Button
                        key={t.id}
                        type="button"
                        $variant="outline"
                        $size="lg"
                        onClick={() => {
                          setSwitchedTo(t.id);
                          go("switched");
                        }}
                      >
                        {copy.reasons.switchTo(t.name, formatMoney(t.monthlyPrice))}
                      </Button>
                    ))}
                    <Button type="button" $variant="outline" $size="lg" onClick={() => go("pause")}>
                      {copy.reasons.pauseInstead}
                    </Button>
                  </>
                ) : r === "break" ? (
                  <>
                    <Body>{copy.reasons.breakBody}</Body>
                    <Button type="button" $variant="outline" $size="lg" onClick={() => go("pause")}>
                      {copy.reasons.pauseInstead}
                    </Button>
                  </>
                ) : undefined,
            }))}
          />
        </Template>
      );

    case "switched":
      return (
        <Template
          screenKey={step}
          heading={undone ? copy.switched.stayed(tier.name) : copy.switched.heading(switched.name)}
          line={!undone && copy.switched.body(formatDate(nextPayment), formatMoney(switched.monthlyPrice))}
          undo={
            !undone && (
              <>
                <Note>{copy.switched.undoQuestion}</Note>
                <Button type="button" $variant="ghost" onClick={() => setUndone(true)}>
                  {copy.switched.undo(tier.name)}
                </Button>
              </>
            )
          }
        >
          {!undone && <Note>{shared.emails.closeTab}</Note>}
        </Template>
      );

    case "unsubscribed":
      return (
        <Template
          screenKey={step}
          heading={undone ? copy.resubscribed : shared.unsubscribed}
          // Resubscribing changes nothing about the membership, so this line stays.
          line={shared.emails.membership(tier.name, formatDate(nextPayment), formatMoney(tier.monthlyPrice))}
          undo={
            !undone && (
              <>
                <Note>{shared.undoUnsubscribe}</Note>
                <Button
                  type="button"
                  $variant="ghost"
                  onClick={() => {
                    setSubscribed(true);
                    setUndone(true);
                  }}
                >
                  {shared.resubscribe}
                </Button>
              </>
            )
          }
        />
      );

    case "confirm":
      return (
        <Template
          screenKey={step}
          heading={copy.confirm.heading}
          line={copy.confirm.whatEnds}
          // Keeping is the filled button, first; cancelling is the red outline under it.
          actions={
            <>
              <Button type="button" $size="lg" onClick={() => go("kept")}>
                {copy.confirm.keepMembership}
              </Button>
              <Button
                type="button"
                $variant="danger-outline"
                $size="lg"
                onClick={() => {
                  setAskedAboutEmails(subscribed);
                  go("cancelled");
                }}
              >
                {shared.cancelMembership}
              </Button>
            </>
          }
        >
          <Note>{copy.confirm.refund(formatDate(addMonths(nextPayment, -1)), copy.confirm.refundEmail)}</Note>
        </Template>
      );

    case "kept":
      // "Keep my membership": nothing changed, so a short thank-you and no actions.
      return <Template screenKey={step} heading={copy.active.heading} line={copy.active.thanks} />;

    case "cancelled":
      return (
        <Template
          screenKey={step}
          heading={copy.cancelled.heading}
          line={copy.cancelled.line(formatMonthYear(demoMember.memberSince))}
        >
          {/* Small print, no buttons: the unsubscribe line only if they were still getting emails. */}
          <Stack>
            <Note>{copy.cancelled.confirmationSent(demoMember.email)}</Note>
            {askedAboutEmails && (
              <Note>
                {copy.cancelled.unsubscribe(<TextLink href="/design/unsubscribe">{copy.cancelled.unsubscribeLink}</TextLink>)}
              </Note>
            )}
          </Stack>
        </Template>
      );
  }
}
