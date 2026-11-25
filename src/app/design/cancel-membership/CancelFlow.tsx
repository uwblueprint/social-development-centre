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
import { Lead, Note, OfferCard, OfferGrid, Options, Stack, Template, TextLink, useFocusHeadingOn } from "../unsubscribe/parts";
import { cancelCopy as copy } from "./copy";

/*
 * The cancel-membership flow, its own path. Footer link 2 in every SDC email ("Pause or cancel
 * membership") and "Cancel membership" on the unsubscribed page both open "Before you go".
 * Three steps: survey → retention offer → cancellation confirmation.
 *
 *   1 Before you go (survey) ─Continue─► 2 Offer for that answer ─Continue to cancel─► 3 Cancel your membership?
 *        │ no answer, or "no longer involved": straight to 3                              ├─► We're sorry to see you go (end)
 *        │                                                                                └─ Keep my membership ─► active again (end)
 *        2 too many emails → Unsubscribe from emails instead → Unsubscribed, membership kept (end)
 *        2 too expensive   → Switch to a lower tier → Switched (end), or Pause instead
 *        2 need a break    → Pause instead → Pause ─► Paused (end)
 *
 * Every step is in the URL (`?step=`), so the phone's back button goes back a step, not out of the
 * flow. Saying yes to an alternative ends on its own screen, like the email flow's "You can close this
 * tab now". Built from the email flow's parts (../unsubscribe/parts.tsx). Client state only.
 */

export const CANCEL_STEPS = ["reasons", "offer", "pause", "paused", "switched", "unsubscribed", "confirm", "kept", "cancelled"] as const;
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
    router.push(`?${query}`, { scroll: false });
  }
  /** Answers with a retention offer. "No longer involved", or no answer, goes straight to the confirm step. */
  const hasOffer = reason === "emails" || reason === "budget" || reason === "break";

  /** "Keep my membership": on every step of cancelling, bottom left. Filled only on the confirm step. */
  const keep = (variant: "primary" | "outline") => (
    <Button type="button" $variant={variant} onClick={() => go("kept")}>
      {copy.keepMembership}
    </Button>
  );

  const restartDate = addMonths(DEMO_TODAY, Number(pauseLength));
  const switched = tierById(switchedTo);

  switch (step) {
    case "pause":
      return (
        <Template
          screenKey={step}
          heading={copy.pause.heading}
          footer={
            <>
              {keep("outline")}
              <Button type="button" onClick={() => go("paused")}>
                {copy.pause.pause}
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
          // The answer is optional: Continue always works, so the question never stands between
          // someone and cancelling.
          footer={
            <>
              {keep("outline")}
              <Button type="button" onClick={() => go(hasOffer ? "offer" : "confirm")}>
                {copy.reasons.continue}
              </Button>
            </>
          }
        >
          <Options
            id="cancel-question"
            question={copy.reasons.question}
            value={reason}
            onChange={setReason}
            options={membershipReasons.map((r) => ({ value: r, label: copy.reasons.options[r] }))}
          />
        </Template>
      );

    case "offer": {
      // Every offer page: the offer in a card (its button accepts it), then Keep my membership on the
      // left and Continue to cancel on the right.
      const footer = (
        <>
          {keep("outline")}
          <Button type="button" $variant="danger-outline" onClick={() => go("confirm")}>
            {copy.offer.continueToCancel}
          </Button>
        </>
      );

      // Opened without an offer (a stale link): the survey comes first.
      if (!hasOffer) {
        return (
          <Template
            screenKey="offer-none"
            heading={copy.reasons.heading}
            actions={
              <Button type="button" $size="lg" onClick={() => go("reasons")}>
                {copy.reasons.continue}
              </Button>
            }
          />
        );
      }

      if (reason === "emails") {
        return (
          <Template screenKey="offer-emails" heading={copy.offer.emails.heading} footer={footer}>
            <OfferCard
              title={copy.offer.emails.title}
              description={copy.offer.emails.description}
              action={
                <Button
                  type="button"
                  onClick={() => {
                    setSubscribed(false);
                    go("unsubscribed");
                  }}
                >
                  {copy.offer.emails.action}
                </Button>
              }
            />
          </Template>
        );
      }

      // Too expensive: one card per lower tier, side by side. A Friend has no lower tier, so they get
      // the break offer instead.
      if (reason === "budget" && lowerTiers.length > 0) {
        return (
          <Template
            screenKey="offer-budget"
            heading={copy.offer.budget.heading}
            line={copy.offer.budget.line(formatDate(nextPayment))}
            footer={footer}
            flow={lowerTiers.length > 1}
          >
            <OfferGrid>
              {lowerTiers.map((t) => (
                <OfferCard
                  key={t.id}
                  title={t.name}
                  description={copy.offer.budget.price(formatMoney(t.monthlyPrice))}
                  action={
                    <Button
                      type="button"
                      onClick={() => {
                        setSwitchedTo(t.id);
                        go("switched");
                      }}
                    >
                      {copy.offer.budget.choose(t.name)}
                    </Button>
                  }
                />
              ))}
            </OfferGrid>
          </Template>
        );
      }

      return (
        <Template screenKey="offer-break" heading={copy.offer.break.heading} footer={footer}>
          <OfferCard
            title={copy.offer.break.title}
            description={copy.offer.break.description}
            action={
              <Button type="button" onClick={() => go("pause")}>
                {copy.offer.break.action}
              </Button>
            }
          />
        </Template>
      );
    }

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
          // Keeping is the filled button, on the left like every step; cancelling is the red outline, right.
          footer={
            <>
              {keep("primary")}
              <Button
                type="button"
                $variant="danger-outline"
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
