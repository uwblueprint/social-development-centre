"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  daysBetween,
  tierBenefits,
  wholeYears,
} from "../unsubscribe/data";
import {
  Confetti,
  Lead,
  Note,
  BenefitList,
  InfoPanel,
  OfferCard,
  OfferPair,
  Options,
  Stack,
  Template,
  useFocusHeadingOn,
  YearsCard,
} from "../unsubscribe/parts";
import { cancelCopy as copy } from "./copy";

/*
 * The cancel-membership flow, its own path. Footer link 2 in every SDC email ("Pause or cancel
 * membership") and "Cancel membership" on the unsubscribed page both open "Before you go".
 * Three steps: survey → retention offer → cancellation confirmation.
 *
 *   1 Before you go (survey) ─Continue─► 2 Offer for that answer ─Continue to cancel─► 3 Cancel your membership?
 *        │ no answer, or "no longer involved": straight to 3                              ├─► We're sorry to see you go (end)
 *        │                                                                                └─ Keep membership ─► active again (end)
 *        2 too many emails → Unsubscribe from emails instead → Unsubscribed, membership kept (end)
 *        2 too expensive   → Pay less instead: Continue on a tier card → Switched (end); a Friend gets the pause page
 *        2 need a break    → Pause membership instead? ─Pause membership─► Paused (end)
 *
 * Every step is in the URL (`?step=`), so the phone's back button goes back a step, not out of the
 * flow. Saying yes to an alternative ends on its own screen, like the email flow's "You can close this
 * tab now". Built from the email flow's parts (../unsubscribe/parts.tsx). Client state only.
 */

export const CANCEL_STEPS = ["reasons", "offer", "pause", "plan", "paused", "switched", "unsubscribed", "confirm", "kept", "cancelled"] as const;
export type CancelStep = (typeof CANCEL_STEPS)[number];

export interface CancelFlowStart {
  reason: MembershipReason | null;
  tierId: string;
}

const isStep = (s: string | null): s is CancelStep => CANCEL_STEPS.includes(s as CancelStep);

/** Each step's place in the flow, so going back slides the other way: survey, offer, pause, confirm, then the end screens. */
const ORDER: Record<CancelStep, number> = { reasons: 0, offer: 1, pause: 1, plan: 2, confirm: 3, paused: 4, switched: 4, unsubscribed: 4, kept: 4, cancelled: 4 };

export function CancelFlow({ start }: { start: CancelFlowStart }) {
  const params = useSearchParams();
  const urlStep = params.get("step");
  const step: CancelStep = isStep(urlStep) ? urlStep : "reasons";

  const tier = tierById(start.tierId);
  const nextPayment = demoMember.nextPaymentDate;
  const lowerTiers = tiers.filter((t) => t.monthlyPrice < tier.monthlyPrice).reverse();

  const [reason, setReason] = useState<MembershipReason | null>(start.reason);
  const [pauseLength, setPauseLength] = useState<PauseLength>("1");
  const [switchedTo, setSwitchedTo] = useState(lowerTiers[0]?.id ?? tier.id);
  const [undone, setUndone] = useState(false);
  // Steps this flow has pushed onto the browser history, so the back arrow can use the browser's own
  // back while there's somewhere in the flow to go back to.
  const pushed = useRef(0);

  // A new step, or an undo that changes the heading: move focus to the heading.
  useFocusHeadingOn(`${step}:${undone}`);

  /** Go to a step, keeping the other demo parameters in the URL. */
  function go(next: CancelStep) {
    const query = new URLSearchParams(params);
    query.set("step", next);
    setUndone(false);
    // The browser's own history, not router.push: the step lives only in this client component, so
    // there's no server round trip and the next screen appears on the same frame as the click.
    // Back and forward still work, and useSearchParams follows along.
    pushed.current += 1;
    window.history.pushState(null, "", `?${query}`);
  }
  /** Answers with a retention offer. "No longer involved", or no answer, goes straight to the confirm step. */
  const hasOffer = reason === "emails" || reason === "budget" || reason === "break";
  /** The offer is a pause: "I need a break", or too expensive with no lower tier (a Friend). */
  const offersPause = reason === "break" || (reason === "budget" && lowerTiers.length === 0);

  /** The step before this one, for the back arrow when the flow was opened partway (nothing to go back to). */
  const previous: Record<CancelStep, CancelStep | null> = {
    reasons: null,
    offer: "reasons",
    pause: "reasons",
    plan: "offer",
    confirm: offersPause ? "pause" : hasOffer ? "offer" : "reasons",
    paused: "pause",
    switched: "plan",
    unsubscribed: "offer",
    kept: "reasons",
    cancelled: "confirm",
  };

  /** The back arrow, top left on every step but the first: the browser's back, or the step before. */
  function goBack() {
    const to = previous[step];
    if (!to) return;
    setUndone(false);
    if (pushed.current > 0) {
      pushed.current -= 1;
      window.history.back();
      return;
    }
    const query = new URLSearchParams(params);
    query.set("step", to);
    window.history.replaceState(null, "", `?${query}`);
  }
  const back = previous[step] ? goBack : undefined;

  /** "Keep membership": on every step of cancelling, bottom left. Filled only on the confirm step. */
  const keep = (variant: "primary" | "outline") => (
    <Button type="button" $variant={variant} onClick={() => go("kept")}>
      {copy.keepMembership}
    </Button>
  );

  const restartDate = addMonths(DEMO_TODAY, Number(pauseLength));

  /** "Continue to cancel": bottom right of every offer, with Keep membership bottom left. */
  const offerFooter = (
    <>
      {keep("outline")}
      <Button type="button" $variant="danger-outline" onClick={() => go("confirm")}>
        {copy.offer.continueToCancel}
      </Button>
    </>
  );

  /**
   * The pause offer: for "I need a break", and for a Friend who finds it too expensive (no lower tier).
   * What pausing means, the lengths, the live restart date, then Pause membership right under them.
   */
  const pausePage = () => (
    <Template
          onBack={back}
          backLabel={shared.back}
      emoji={copy.emoji.pause} screenKey="pause"
      order={ORDER.pause}
      heading={copy.pause.heading}
      actions={
        <Button type="button" onClick={() => go("paused")}>
          {copy.pause.pause}
        </Button>
      }
      footer={offerFooter}
    >
      <Stack>
        <Options
          id="pause-question"
          question={copy.pause.whatHappens}
          plain
          value={pauseLength}
          onChange={setPauseLength}
          options={pauseLengths.map((l) => ({ value: l, label: copy.pause.lengths[l] }))}
        />
        {/* After Disney+: the restart date updates as they choose, before they press Pause. */}
        <Lead aria-live="polite">{copy.pause.restartsOn(formatDate(restartDate))}</Lead>
      </Stack>
    </Template>
  );
  const switched = tierById(switchedTo);

  switch (step) {
    case "pause":
      return pausePage();

    case "paused":
      return (
        <Template
          onBack={back}
          backLabel={shared.back}
          emoji={undone ? copy.emoji.active : copy.emoji.paused} screenKey={step} order={ORDER[step]}
          heading={undone ? copy.active.heading : copy.paused.heading}
          line={undone ? copy.active.thanks : copy.paused.body(formatDate(restartDate))}
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
          onBack={back}
          backLabel={shared.back}
          emoji={copy.emoji.reasons} screenKey={step} order={ORDER[step]}
          heading={copy.reasons.heading}
          // The answer is optional: Continue always works, so the question never stands between
          // someone and cancelling.
          footer={
            <>
              {keep("outline")}
              <Button type="button" onClick={() => go(offersPause ? "pause" : hasOffer ? "offer" : "confirm")}>
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
      // Every offer page: the offer in a card (its button accepts it), then Keep membership on the
      // left and Continue to cancel on the right.
      const footer = offerFooter;

      // Opened without an offer (a stale link): the survey comes first.
      if (!hasOffer) {
        return (
          <Template
          onBack={back}
          backLabel={shared.back}
            emoji={copy.emoji.reasons} screenKey="offer-none" order={ORDER.offer}
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
          <Template onBack={back} backLabel={shared.back} emoji={copy.emoji.emails} screenKey="offer-emails" order={ORDER.offer} heading={copy.offer.emails.heading} footer={footer}>
            <OfferCard
              title={copy.offer.emails.title}
              description={copy.offer.emails.description}
              action={
                <Button
                  type="button"
                  onClick={() => go("unsubscribed")}
                >
                  {copy.offer.emails.action}
                </Button>
              }
            />
          </Template>
        );
      }

      // The pause offer has its own page (a stale ?step=offer link for it lands there too).
      if (offersPause) return pausePage();

      // Too expensive: two cards, the member's current plan (marked) on the left and the next tier
      // down on the right. Continue on either opens "Confirm your plan change".
      const cheaper = lowerTiers[0];
      return (
        <Template
          onBack={back}
          backLabel={shared.back}
          emoji={copy.emoji.budget} screenKey="offer-budget"
          order={ORDER.offer}
          heading={copy.offer.budget.heading}
          line={copy.offer.budget.line(formatDate(nextPayment))}
          footer={footer}
        >
          <OfferPair>
            {[tier, cheaper].map((t) => (
              <OfferCard
                key={t.id}
                title={t.name}
                badge={t.id === tier.id ? copy.offer.budget.current : undefined}
                subheading={copy.offer.budget.price(formatMoney(t.monthlyPrice))}
                action={
                  <Button
                    type="button"
                    $variant={t.id === tier.id ? "outline" : "primary"}
                    aria-label={copy.offer.budget.chooseLabel(t.name)}
                    onClick={() => {
                      setSwitchedTo(t.id);
                      go("plan");
                    }}
                  >
                    {copy.offer.budget.choose}
                  </Button>
                }
              />
            ))}
          </OfferPair>
        </Template>
      );
    }

    case "plan": {
      // After Dribbble's "Confirm your cancellation": what's left of this payment, then what the plan
      // gives them, then confirm. Chose their current plan: confirming keeps it.
      const staying = switched.id === tier.id;
      const daysLeft = daysBetween(DEMO_TODAY, nextPayment);
      return (
        <Template
          onBack={back}
          backLabel={shared.back}
          emoji={staying ? copy.emoji.active : copy.emoji.plan} screenKey={staying ? "plan-keep" : "plan-change"}
          order={ORDER.plan}
          heading={staying ? copy.plan.keepHeading : copy.plan.heading}
          footer={
            staying ? (
              <Button type="button" onClick={() => go("kept")}>
                {copy.plan.confirmKeep(tier.name)}
              </Button>
            ) : (
              <>
                {keep("outline")}
                <Button type="button" onClick={() => go("switched")}>
                  {copy.plan.confirm}
                </Button>
              </>
            )
          }
        >
          <InfoPanel>{copy.plan.daysLeft(daysLeft, tier.name)}</InfoPanel>
          <Stack>
            <Lead>
              {staying
                ? copy.plan.keep(tier.name, formatMoney(tier.monthlyPrice))
                : copy.plan.change(switched.name, formatDate(nextPayment), formatMoney(switched.monthlyPrice))}
            </Lead>
            <BenefitList items={tierBenefits[switched.id] ?? []} />
          </Stack>
        </Template>
      );
    }

    case "switched":
      return (
        <Template
          onBack={back}
          backLabel={shared.back}
          emoji={undone ? copy.emoji.active : copy.emoji.switched} screenKey={step} order={ORDER[step]}
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
        />
      );

    case "unsubscribed":
      return (
        <Template
          onBack={back}
          backLabel={shared.back}
          emoji={undone ? copy.emoji.resubscribed : copy.emoji.unsubscribed} screenKey={step} order={ORDER[step]}
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
                  onClick={() => setUndone(true)}
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
          onBack={back}
          backLabel={shared.back}
          emoji={copy.emoji.confirm} screenKey={step} order={ORDER[step]}
          heading={copy.confirm.heading}
          line={copy.confirm.whatEnds}
          // Keeping is the filled button, on the left like every step; cancelling is the red outline, right.
          footer={
            <>
              {keep("primary")}
              <Button
                type="button"
                $variant="danger-outline"
                onClick={() => go("cancelled")}
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
      // "Keep membership": nothing changed, so a thank-you, a little confetti, and no actions.
      return (
        <Template onBack={back} backLabel={shared.back} emoji={copy.emoji.active} screenKey={step} order={ORDER[step]} heading={copy.active.heading} line={copy.active.thanks}>
          <Confetti />
        </Template>
      );

    case "cancelled": {
      // From when they joined to the month their membership ends (it runs to the end of this month).
      const dates = copy.cancelled.dates(formatMonthYear(demoMember.memberSince), formatMonthYear(DEMO_TODAY));
      return (
        <Template onBack={back} backLabel={shared.back} emoji={copy.emoji.cancelled} wave screenKey={step} order={ORDER[step]} heading={copy.cancelled.heading} line={copy.cancelled.thanks}>
          <YearsCard
            value={copy.cancelled.years(wholeYears(demoMember.memberSince, DEMO_TODAY))}
            caption={copy.cancelled.yearsCaption}
            dates={dates}
            // The way back in. Rejoining opens "active again", confetti and all.
            rejoin={
              <>
                <Note>{copy.cancelled.rejoinQuestion}</Note>
                <Button type="button" $variant="ghost" onClick={() => go("kept")}>
                  {copy.cancelled.rejoin}
                </Button>
              </>
            }
          />
        </Template>
      );
    }
  }
}
