"use client";

import { useState } from "react";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { Collapsible } from "@/components/ui/Collapsible";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { unsubscribeCopy as shared } from "../unsubscribe/copy";
import {
  DEMO_TODAY,
  RESTART_REMINDER_DAYS,
  addDays,
  addMonths,
  addPause,
  demoMember,
  formatDate,
  formatMoney,
  formatMonthYear,
  membershipReasons,
  pauseUnits,
  tierById,
  tiers,
  type CutOffPolicy,
  type MembershipReason,
  type MembershipStatus,
  type PauseUnit,
} from "../unsubscribe/data";
import {
  Body,
  ChoiceText,
  FollowUp,
  Lead,
  Note,
  OptionList,
  Options,
  PauseFields,
  Question,
  Stack,
  StatusLine,
  Template,
  UndoLine,
  done,
  isWholeNumber,
  useFocusHeadingOn,
} from "../unsubscribe/parts";
import { cancelCopy as copy } from "./copy";

/*
 * The cancel-membership flow, its own path: footer link 2 in every SDC email ("Pause or cancel
 * membership") and "Cancel membership" on the unsubscribed page both open it. Three steps, as the
 * "Unsub flow" FigJam board has them:
 *
 * 1. "Before you go": one optional question, "What's the main reason you're cancelling?". Each answer
 *    slides open one alternative (unsubscribe from emails, a lower tier or a pause, a pause, a
 *    thank-you). "Continue to cancel" is always visible: the question never blocks cancelling.
 * 2. "Cancel your membership?": what cancelling means, an optional note, then cancel or keep.
 * 3. "We're sorry to see you go": thanks, the confirmation email, and whether to keep getting emails.
 *
 * Built from the same parts as the email flow (../unsubscribe/parts.tsx). Client state only.
 */

export type CancelStep = "reasons" | "confirm" | "cancelled";

export interface CancelFlowStart {
  step: CancelStep;
  reason: MembershipReason | null;
  /** reasons: paused (with break), switched (with budget), unsubscribed (with emails). */
  state: string | null;
  /** Still subscribed to emails. False skips the email question after cancelling. */
  subscribed: boolean;
  policy: CutOffPolicy;
  tierId: string;
}

/** The lower tiers, as one bordered list like the answers above them. */
const TierRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
`;

const TierTop = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-2);
`;

const TierName = styled(ChoiceText)`
  font-weight: var(--weight-medium);
`;

/** The pause form under "Pause instead". Padding keeps focus rings inside the slide's clip. */
const Inset = styled.div<{ $spaced: boolean }>`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: ${({ $spaced }) => ($spaced ? "var(--space-3)" : "0")} var(--space-1) var(--space-1);
`;

export function CancelFlow({ start }: { start: CancelFlowStart }) {
  const tier = tierById(start.tierId);
  const nextPayment = demoMember.nextPaymentDate;
  const since = formatMonthYear(demoMember.memberSince);
  const st = start.state;

  const [step, setStep] = useState<CancelStep>(start.step);
  const [subscribed, setSubscribed] = useState(start.subscribed && st !== "unsubscribed");
  const [resubscribed, setResubscribed] = useState(false);
  const [membership, setMembership] = useState<MembershipStatus>(st === "paused" ? "paused" : "active");

  const [reason, setReason] = useState<MembershipReason | null>(
    start.reason ?? (st === "paused" ? "break" : st === "switched" ? "budget" : st === "unsubscribed" ? "emails" : null),
  );
  const lowerTiers = tiers.filter((t) => t.monthlyPrice < tier.monthlyPrice).reverse();
  const [switchedTo, setSwitchedTo] = useState<string | null>(st === "switched" ? (lowerTiers[0]?.id ?? null) : null);
  const [stayed, setStayed] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(lowerTiers.length === 0);
  const [pauseCount, setPauseCount] = useState("1");
  const [pauseUnit, setPauseUnit] = useState<PauseUnit>("months");
  const [pauseError, setPauseError] = useState<string>();
  const [restarted, setRestarted] = useState(false);
  const [note, setNote] = useState("");
  const [emailsAnswer, setEmailsAnswer] = useState<"kept" | "unsubscribed" | null>(null);
  const [askedAboutEmails, setAskedAboutEmails] = useState(subscribed);

  useFocusHeadingOn(step);

  const validCount = isWholeNumber(pauseCount);
  const restartDate = validCount ? addPause(DEMO_TODAY, Number(pauseCount), pauseUnit) : DEMO_TODAY;

  function pause() {
    if (!validCount) return setPauseError(copy.reasons.pauseLengthError);
    setPauseError(undefined);
    setMembership("paused");
    setRestarted(false);
  }

  /* The pause form, shared by "It's too expensive right now" (under "Pause instead") and "I need a break". */
  const pauseForm = (
    <>
      {membership !== "paused" && (
        <>
          <PauseFields>
            <Field label={copy.reasons.pauseLength} error={pauseError}>
              {(props) => (
                <Input
                  {...props}
                  name="pause-count"
                  inputMode="numeric"
                  value={pauseCount}
                  onChange={(e) => {
                    setPauseCount(e.target.value);
                    setPauseError(undefined);
                  }}
                />
              )}
            </Field>
            <Field label={copy.reasons.pauseUnit}>
              {(props) => (
                <Select
                  {...props}
                  value={pauseUnit}
                  onValueChange={(v) => setPauseUnit(v as PauseUnit)}
                  options={pauseUnits.map((u) => ({ value: u, label: copy.reasons.pauseUnits[u] }))}
                />
              )}
            </Field>
          </PauseFields>
          {/* After Disney+: the restart date updates as they type, before they press Pause. */}
          <Lead aria-live="polite">{validCount ? copy.reasons.restartsOn(formatDate(restartDate)) : null}</Lead>
          <Body>{copy.reasons.whatHappens}</Body>
        </>
      )}
      {membership === "paused" ? (
        done(copy.reasons.paused)
      ) : (
        <Button type="button" $size="lg" onClick={pause}>
          {copy.reasons.pause}
        </Button>
      )}
      {membership === "paused" && (
        <>
          <Lead>
            {copy.reasons.pausedBody(
              formatDate(restartDate),
              formatMoney(tier.monthlyPrice),
              formatDate(addDays(restartDate, -RESTART_REMINDER_DAYS)),
            )}
          </Lead>
          <UndoLine>
            <Note>{copy.reasons.restartQuestion}</Note>
            <Button
              type="button"
              $variant="ghost"
              onClick={() => {
                setMembership("active");
                setRestarted(true);
              }}
            >
              {copy.reasons.restartNow}
            </Button>
          </UndoLine>
        </>
      )}
      {membership === "active" && restarted && <StatusLine>{copy.reasons.restarted}</StatusLine>}
    </>
  );

  /* "It's too expensive right now": the tiers below theirs, then a pause. */
  const switched = switchedTo ? tierById(switchedTo) : null;
  const budget = (
    <>
      {lowerTiers.length > 0 && (
        <>
          <Body>{copy.reasons.lowerTierBody(tier.name, formatMoney(tier.monthlyPrice), formatDate(nextPayment))}</Body>
          <OptionList>
            {lowerTiers
              .filter((t) => !switched || t.id === switched.id)
              .map((t) => (
                <TierRow key={t.id}>
                  <TierTop>
                    <TierName>{t.name}</TierName>
                    <ChoiceText>
                      <strong>{formatMoney(t.monthlyPrice)}</strong> {copy.reasons.perMonth}
                    </ChoiceText>
                  </TierTop>
                  <Body>{copy.reasons.tierIncludes[t.id]}</Body>
                  {switched?.id === t.id ? (
                    done(copy.reasons.switched(t.name))
                  ) : (
                    <Button
                      type="button"
                      $variant="outline"
                      $size="lg"
                      onClick={() => {
                        setSwitchedTo(t.id);
                        setStayed(false);
                      }}
                    >
                      {copy.reasons.switchTo(t.name)}
                    </Button>
                  )}
                </TierRow>
              ))}
          </OptionList>
          {switched ? (
            <>
              <Lead>{copy.reasons.switchedBody(formatDate(nextPayment), formatMoney(switched.monthlyPrice))}</Lead>
              <UndoLine>
                <Note>{copy.reasons.switchBackQuestion}</Note>
                <Button
                  type="button"
                  $variant="ghost"
                  onClick={() => {
                    setSwitchedTo(null);
                    setStayed(true);
                  }}
                >
                  {copy.reasons.switchBack(tier.name)}
                </Button>
              </UndoLine>
            </>
          ) : (
            stayed && <StatusLine>{copy.reasons.stayed(tier.name)}</StatusLine>
          )}
        </>
      )}
      {/* One block, so the closed slide adds no gap under "Pause instead". */}
      {!switched && (
        <div>
          {lowerTiers.length > 0 && (
            <UndoLine>
              <Note>{copy.reasons.pauseInsteadQuestion}</Note>
              <Button
                type="button"
                $variant="ghost"
                aria-expanded={pauseOpen}
                aria-controls="pause-instead"
                onClick={() => setPauseOpen((o) => !o)}
              >
                {copy.reasons.pauseInstead}
              </Button>
            </UndoLine>
          )}
          <Collapsible open={pauseOpen}>
            <FollowUp id="pause-instead">
              <Inset $spaced={lowerTiers.length > 0}>{pauseForm}</Inset>
            </FollowUp>
          </Collapsible>
        </div>
      )}
    </>
  );

  switch (step) {
    case "reasons":
      return (
        <Template
          screenKey="reasons"
          heading={copy.reasons.heading}
          line={copy.reasons.line(since)}
          // Always visible: the question never stands between someone and cancelling.
          actions={
            <Button type="button" $variant="danger-outline" $size="lg" onClick={() => setStep("confirm")}>
              {copy.reasons.continueToCancel}
            </Button>
          }
        >
          <Options
            id="cancel-question"
            question={copy.reasons.question}
            value={reason}
            onChange={setReason}
            options={membershipReasons.map((r) => ({
              value: r,
              label: copy.reasons.options[r],
              followUp:
                r === "emails" ? (
                  <>
                    <Body>{copy.reasons.emailsBody}</Body>
                    {subscribed ? (
                      <Button
                        type="button"
                        $size="lg"
                        onClick={() => {
                          setSubscribed(false);
                          setResubscribed(false);
                        }}
                      >
                        {copy.reasons.emailsAction}
                      </Button>
                    ) : (
                      done(shared.unsubscribed)
                    )}
                    {subscribed && resubscribed && <StatusLine>{shared.resubscribed}</StatusLine>}
                    {!subscribed && (
                      <UndoLine>
                        <Note>{shared.undoUnsubscribe}</Note>
                        <Button
                          type="button"
                          $variant="ghost"
                          onClick={() => {
                            setSubscribed(true);
                            setResubscribed(true);
                          }}
                        >
                          {shared.resubscribe}
                        </Button>
                      </UndoLine>
                    )}
                  </>
                ) : r === "budget" ? (
                  budget
                ) : r === "break" ? (
                  pauseForm
                ) : (
                  <Body>{copy.reasons.thanks}</Body>
                ),
            }))}
          />
        </Template>
      );

    case "confirm":
      return (
        <Template
          screenKey="confirm"
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
                  setStep("cancelled");
                }}
              >
                {shared.cancelMembership}
              </Button>
              <Button type="button" $variant="outline" $size="lg" onClick={() => setStep("reasons")}>
                {copy.confirm.keepMembership}
              </Button>
            </>
          }
        >
          <Stack>
            <Lead>{copy.confirm.noMoreCharges}</Lead>
            <Lead>
              {start.policy === "end-of-period"
                ? copy.confirm.endsAtPeriodEnd(formatDate(addDays(nextPayment, -1)))
                : copy.confirm.endsToday}
            </Lead>
            <Lead>{copy.confirm.notRefundable(formatDate(addMonths(nextPayment, -1)))}</Lead>
            <Lead>{copy.confirm.rejoin}</Lead>
            <Field label={copy.confirm.noteLabel}>
              {(props) => (
                <Textarea {...props} name="note" rows={3} maxLength={600} value={note} onChange={(e) => setNote(e.target.value)} />
              )}
            </Field>
          </Stack>
        </Template>
      );

    case "cancelled":
      return (
        <Template
          screenKey="cancelled"
          heading={copy.cancelled.heading}
          line={copy.cancelled.line(since)}
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
