"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { unsubscribeCopy as shared } from "../unsubscribe/copy";
import {
  addDays,
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
  type CutOffPolicy,
  type MembershipReason,
  type PauseLength,
} from "../unsubscribe/data";
import { Body, Lead, Note, Options, Question, Stack, Template, UndoLine, done, useFocusHeadingOn } from "../unsubscribe/parts";
import { cancelCopy as copy } from "./copy";

/*
 * The cancel-membership flow, its own path. Footer link 2 in every SDC email ("Pause or cancel
 * membership") opens the first step; "Cancel membership" on the unsubscribed page opens "Before you go".
 *
 *   Pause or cancel ─► Pause ─► Paused (end)
 *         │              ▲
 *         ▼              │
 *   Before you go ──────┤ (break, or too expensive → pause)
 *     ├─ too many emails → Unsubscribed, membership kept (end)
 *     ├─ too expensive   → Switched to a lower tier (end)
 *     └─ Continue to cancel ─► Cancel your membership? ─► We're sorry to see you go (end)
 *
 * Every step is in the URL (`?step=`), so the phone's back button goes back a step, not out of the
 * flow. Saying yes to an alternative ends on its own screen, like the email flow's "You can close this
 * tab now". Built from the email flow's parts (../unsubscribe/parts.tsx). Client state only.
 */

export const CANCEL_STEPS = ["choose", "pause", "paused", "reasons", "switched", "unsubscribed", "confirm", "cancelled"] as const;
export type CancelStep = (typeof CANCEL_STEPS)[number];

export interface CancelFlowStart {
  reason: MembershipReason | null;
  /** Still subscribed to emails. False skips the email question after cancelling. */
  subscribed: boolean;
  policy: CutOffPolicy;
  tierId: string;
}

const isStep = (s: string | null): s is CancelStep => CANCEL_STEPS.includes(s as CancelStep);

export function CancelFlow({ start }: { start: CancelFlowStart }) {
  const router = useRouter();
  const params = useSearchParams();
  const urlStep = params.get("step");
  const step: CancelStep = isStep(urlStep) ? urlStep : "choose";

  const tier = tierById(start.tierId);
  const nextPayment = demoMember.nextPaymentDate;
  const lowerTiers = tiers.filter((t) => t.monthlyPrice < tier.monthlyPrice).reverse();

  const [navigated, setNavigated] = useState(false);
  const [reason, setReason] = useState<MembershipReason | null>(start.reason);
  const [pauseLength, setPauseLength] = useState<PauseLength>("1");
  const [switchedTo, setSwitchedTo] = useState(lowerTiers[0]?.id ?? tier.id);
  const [subscribed, setSubscribed] = useState(start.subscribed);
  const [askedAboutEmails, setAskedAboutEmails] = useState(start.subscribed);
  const [emailsAnswer, setEmailsAnswer] = useState<"kept" | "unsubscribed" | null>(null);
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
    case "choose":
      return (
        <Template
          screenKey={step}
          heading={copy.choose.heading}
          line={copy.choose.summary(tier.name, formatMoney(tier.monthlyPrice), formatDate(nextPayment))}
          actions={
            <>
              <Button type="button" $size="lg" onClick={() => go("pause")}>
                {copy.pause.pause}
              </Button>
              <Button type="button" $variant="danger-outline" $size="lg" onClick={() => go("reasons")}>
                {shared.cancelMembership}
              </Button>
            </>
          }
        />
      );

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
              <Button type="button" $variant="outline" $size="lg" onClick={() => back("choose")}>
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
            <Body>{copy.pause.whatHappens}</Body>
          </Stack>
        </Template>
      );

    case "paused":
      return (
        <Template
          screenKey={step}
          heading={undone ? copy.paused.restarted : copy.paused.heading}
          line={shared.emails.closeTab}
          actions={
            !undone && (
              <UndoLine>
                <Note>{copy.paused.restartQuestion}</Note>
                <Button type="button" $variant="ghost" onClick={() => setUndone(true)}>
                  {copy.paused.restartNow}
                </Button>
              </UndoLine>
            )
          }
        >
          {!undone && (
            <Stack>
              <Lead>{copy.paused.body(formatDate(restartDate), formatMoney(tier.monthlyPrice))}</Lead>
            </Stack>
          )}
        </Template>
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
          line={shared.emails.closeTab}
          actions={
            !undone && (
              <UndoLine>
                <Note>{copy.switched.undoQuestion}</Note>
                <Button type="button" $variant="ghost" onClick={() => setUndone(true)}>
                  {copy.switched.undo(tier.name)}
                </Button>
              </UndoLine>
            )
          }
        >
          {!undone && (
            <Stack>
              <Lead>{copy.switched.body(formatDate(nextPayment), formatMoney(switched.monthlyPrice))}</Lead>
            </Stack>
          )}
        </Template>
      );

    case "unsubscribed":
      return (
        <Template
          screenKey={step}
          heading={undone ? copy.resubscribed : shared.unsubscribed}
          line={shared.emails.closeTab}
          actions={
            !undone && (
              <UndoLine>
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
              </UndoLine>
            )
          }
        >
          {/* Resubscribing changes nothing about the membership, so this line stays. */}
          <Stack>
            <Lead>{shared.emails.membership(tier.name, formatDate(nextPayment), formatMoney(tier.monthlyPrice))}</Lead>
          </Stack>
        </Template>
      );

    case "confirm":
      return (
        <Template
          screenKey={step}
          heading={copy.confirm.heading}
          actions={
            <>
              <Button
                type="button"
                $variant="danger-outline"
                $size="lg"
                onClick={() => {
                  setAskedAboutEmails(subscribed);
                  setEmailsAnswer(null);
                  go("cancelled");
                }}
              >
                {shared.cancelMembership}
              </Button>
              <Button type="button" $variant="outline" $size="lg" onClick={() => back("reasons")}>
                {copy.confirm.keepMembership}
              </Button>
            </>
          }
        >
          {/* The biggest consequences first; "you can rejoin" last and quieter. */}
          <Stack>
            <Lead>
              <strong>
                {start.policy === "end-of-period"
                  ? copy.confirm.endsAtPeriodEnd(formatDate(addDays(nextPayment, -1)))
                  : copy.confirm.endsToday}
              </strong>
            </Lead>
            <Lead>{copy.confirm.noMoreCharges}</Lead>
            <Lead>{copy.confirm.notRefundable(formatDate(addMonths(nextPayment, -1)))}</Lead>
            <Note>{copy.confirm.rejoin}</Note>
          </Stack>
        </Template>
      );

    case "cancelled":
      return (
        <Template
          screenKey={step}
          heading={copy.cancelled.heading}
          line={copy.cancelled.line(formatMonthYear(demoMember.memberSince))}
          // Only ask about emails if they were still subscribed when they cancelled. Each button keeps
          // its place, so the one pressed keeps focus as it turns into its result.
          actions={
            askedAboutEmails && (
              <>
                {emailsAnswer === "kept" ? (
                  done(copy.cancelled.emailsKept)
                ) : emailsAnswer === null ? (
                  <Button type="button" $size="lg" onClick={() => setEmailsAnswer("kept")}>
                    {copy.cancelled.keepEmails}
                  </Button>
                ) : null}
                {emailsAnswer === "unsubscribed" ? (
                  done(shared.unsubscribed)
                ) : emailsAnswer === null ? (
                  <Button
                    type="button"
                    $variant="danger-outline"
                    $size="lg"
                    onClick={() => {
                      setSubscribed(false);
                      setEmailsAnswer("unsubscribed");
                    }}
                  >
                    {shared.unsubscribe}
                  </Button>
                ) : null}
              </>
            )
          }
        >
          <Stack>
            <Lead>{copy.cancelled.confirmationSent(demoMember.email)}</Lead>
            {askedAboutEmails && <Question>{copy.cancelled.emailQuestion}</Question>}
          </Stack>
        </Template>
      );
  }
}
