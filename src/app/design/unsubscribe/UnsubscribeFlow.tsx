"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { styled } from "next-yak";
import { ArrowLeft, ChevronRight, CircleCheck, CirclePause, MailCheck, MailX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { RadioGroup, RadioGroupOption } from "@/components/ui/RadioGroup";
import { Separator } from "@/components/ui/Separator";
import { Textarea } from "@/components/ui/Textarea";
import {
  AuthActions,
  AuthColumn,
  AuthHeading,
  AuthScreen,
  Footnote,
  IconWell,
  SdcLogo,
} from "@/features/auth/AuthScreen";
import { unsubscribeCopy as copy } from "./copy";
import {
  DEMO_TODAY,
  RESTART_REMINDER_DAYS,
  addDays,
  addMonths,
  demoMember,
  fewerEmailChoices,
  formatDate,
  formatMoney,
  lowerTier,
  pauseMonths,
  tierById,
  unsubscribeReasons,
  type CutOffPolicy,
  type EmailStatus,
  type FewerEmailChoice,
  type MembershipStatus,
  type PauseMonths,
  type Screen,
  type UnsubscribeReason,
} from "./data";

/*
 * Email preferences (A1, A2, A4) and pause/cancel membership (B1–B5), reached from the two footer links
 * in every SDC email. Built on Jesse's unsubscribe page (origin/jesse/email-links): the sign-in screen's
 * calm centered column, logo, green heading and full-width buttons, from src/features/auth/AuthScreen.
 * Client state only: saving, pausing and cancelling just move to that screen's confirmation.
 *
 * Changes from Jesse's page: the first screen offers "fewer emails" or "unsubscribe from all" instead of
 * a single Unsubscribe, and the "why" is a multi-select survey instead of a dropdown.
 *
 * Two rules from the doc hold: "Unsubscribe from all" (A1, A2) and "Cancel membership" (B1–B4) are
 * always visible as real buttons, and reason questions are optional.
 */

/* ---- New here (see README.md): AuthScreen has no equivalent ---- */

/** A sub-question inside the column: the survey on A4, B1's reasons, B3's length, B5's email question. */
const Question = styled.h2`
  margin: 0;
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
`;

/** A choice that moves to another screen (B1, B2): the whole row is the button, with a chevron. */
const NavCard = styled(Button)`
  justify-content: space-between;
  gap: var(--space-3);
  width: 100%;
  height: auto;
  padding: var(--space-3);
  font-size: var(--text-md);
  line-height: var(--leading-ui);
  text-align: left;
  white-space: normal;
`;

/**
 * A short result line that replaces the button just pressed. Focus moves to it, so keyboard and
 * screen-reader users aren't dropped at the top of the page when the button disappears.
 */
function StatusLine({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <Footnote ref={ref} role="status" tabIndex={-1}>
      {children}
    </Footnote>
  );
}

/* ---- Layout only ---- */

/** Left-aligned content (questions, choices) at the column's full width. */
const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;
`;

const Choices = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const paragraphs = (...lines: (string | false)[]) => lines.filter(Boolean).join("\n\n");

export interface FlowStart {
  screen: Screen;
  /** Open the screen's follow-up state: saved (A2, B2, B3) or resubscribed (A4). */
  done: boolean;
  /** A paying member. False shows the subscriber-only versions (A2 without notices, A4 without membership lines). */
  isMember: boolean;
  policy: CutOffPolicy;
  tierId: string;
}

export function UnsubscribeFlow({ start }: { start: FlowStart }) {
  const startTier = tierById(start.tierId);

  const [screen, setScreen] = useState<Screen>(start.screen);
  const [done, setDone] = useState(start.done);
  const [history, setHistory] = useState<Screen[]>([]);

  // The member's record as these screens change it.
  const [emails, setEmails] = useState<EmailStatus>(
    start.screen === "A4" && !start.done ? "unsubscribed" : "subscribed",
  );
  const [membership, setMembership] = useState<MembershipStatus>(() => {
    if (!start.isMember) return "none";
    if (start.screen === "B5") return "cancelled";
    if (start.screen === "B3" && start.done) return "paused";
    return "active";
  });
  const [tierId, setTierId] = useState(() =>
    start.screen === "B2" && start.done ? (lowerTier(startTier.id) ?? startTier).id : startTier.id,
  );

  // Answers.
  const [fewer, setFewer] = useState<FewerEmailChoice>("monthly");
  const [pause, setPause] = useState<PauseMonths>(1);
  const [reasons, setReasons] = useState<UnsubscribeReason[]>([]);
  const [reasonsSent, setReasonsSent] = useState(false);
  const [note, setNote] = useState("");

  // Small follow-ups that stay on the same screen.
  const [membershipKept, setMembershipKept] = useState(false);
  const [emailsKept, setEmailsKept] = useState(false);
  const [restarted, setRestarted] = useState(false);

  // A new screen replaces the old one, so move focus to its heading for screen readers (as Jesse's page does).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    document.querySelector<HTMLElement>("main h1")?.focus();
  }, [screen, done]);

  const tier = tierById(tierId);
  const lower = lowerTier(tierId);
  const isMember = membership === "active" || membership === "paused";
  const nextPayment = demoMember.nextPaymentDate;

  function go(next: Screen) {
    // The unsubscribe happens on arrival at A4: that screen reports the result, it doesn't ask again.
    if (next === "A4") {
      setEmails("unsubscribed");
      setReasons([]);
      setReasonsSent(false);
    }
    setHistory((h) => [...h, screen]);
    setScreen(next);
    setDone(false);
  }

  function back() {
    const previous = history.at(-1);
    if (!previous) return;
    setHistory((h) => h.slice(0, -1));
    setScreen(previous);
    setDone(false);
  }

  function switchTier() {
    if (!lower) return;
    setTierId(lower.id);
    setHistory((h) => [...h, screen]);
    setScreen("B2");
    setDone(true);
  }

  function cancelMembership() {
    setMembership("cancelled");
    setEmailsKept(false);
    setHistory([]);
    setScreen("B5");
    setDone(false);
  }

  function resubscribe() {
    setEmails("subscribed");
    setHistory([]);
    setScreen("A4");
    setDone(true);
  }

  const navCard = (label: string, onClick: () => void) => (
    <NavCard type="button" $variant="outline" onClick={onClick}>
      <span>{label}</span>
      <Icon icon={ChevronRight} size={20} />
    </NavCard>
  );

  const unsubscribeAll = (label: string) => (
    <Button type="button" $variant="danger-outline" $size="lg" onClick={() => go("A4")}>
      {label}
    </Button>
  );

  const cancelButton = (label: string = copy.b1.cancelMembership) => (
    <Button type="button" $variant="danger-outline" $size="lg" onClick={() => go("B4")}>
      {label}
    </Button>
  );

  // Back on in-between screens; end states, confirmations and B4 (whose "Keep my membership" already
  // goes back) don't get one.
  const canGoBack = history.length > 0 && !done && screen !== "A4" && screen !== "B4" && screen !== "B5";
  const backButton = canGoBack && (
    <Button type="button" $variant="ghost" $size="lg" onClick={back}>
      <Icon icon={ArrowLeft} size={16} />
      {copy.notInDoc.back}
    </Button>
  );

  /*
   * Each screen fills `top` (logo or icon), `heading`, `body` (left-aligned content) and `actions`
   * (full-width buttons, the main action first).
   */
  let top: ReactNode = <SdcLogo />;
  let heading: ReactNode;
  let body: ReactNode = null;
  let actions: ReactNode = null;

  switch (screen) {
    case "A1":
      heading = <AuthHeading title={copy.a1.heading} description={copy.a1.subtext(demoMember.email)} />;
      actions = (
        <>
          <Button type="button" $size="lg" onClick={() => go("A2")}>
            {copy.a1.fewerEmails}
          </Button>
          {unsubscribeAll(copy.a1.unsubscribeAll)}
        </>
      );
      break;

    case "A2": {
      if (done) {
        top = <IconWell icon={MailCheck} tone="brand" />;
        heading = (
          <AuthHeading
            title={copy.a2.savedHeading}
            description={copy.a2.savedBody(lowerFirst(copy.a2.choices[fewer]))}
          />
        );
        actions = unsubscribeAll(copy.a2.unsubscribeInstead);
        break;
      }
      const choices = fewerEmailChoices.filter((c) => isMember || !c.membersOnly);
      heading = <AuthHeading title={copy.a2.heading} />;
      body = (
        <Stack>
          <Question id="a2-question">{copy.a2.body}</Question>
          <RadioGroup
            name="fewer"
            aria-labelledby="a2-question"
            value={fewer}
            onValueChange={(v) => setFewer(v as FewerEmailChoice)}
          >
            {choices.map((c) => (
              <RadioGroupOption key={c.id} value={c.id} label={copy.a2.choices[c.id]} />
            ))}
          </RadioGroup>
        </Stack>
      );
      actions = (
        <>
          <Button type="button" $size="lg" onClick={() => setDone(true)}>
            {copy.a2.save}
          </Button>
          {unsubscribeAll(copy.a2.unsubscribeInstead)}
          {backButton}
        </>
      );
      break;
    }

    case "A4": {
      if (done) {
        top = <IconWell icon={MailCheck} tone="brand" />;
        heading = <AuthHeading title={copy.notInDoc.resubscribedHeading} description={copy.notInDoc.resubscribedBody} />;
        break;
      }
      // Membership lines only while the membership is active: after a cancel (B5 → A4) they'd be wrong.
      const activeMember = membership === "active";
      top = <IconWell icon={MailX} tone="neutral" />;
      heading = (
        <AuthHeading title={copy.a4.heading} description={paragraphs(copy.a4.body, activeMember && copy.a4.requiredNotices)} />
      );
      body = (
        <Stack role="group" aria-labelledby="a4-reason">
          <Question id="a4-reason">{copy.a4.reasonQuestion}</Question>
          {reasonsSent ? (
            <StatusLine>{copy.notInDoc.reasonThanks}</StatusLine>
          ) : (
            <>
              <Choices>
                {unsubscribeReasons.map((r) => (
                  <Checkbox
                    key={r}
                    name="reason"
                    value={r}
                    label={copy.a4.reasons[r]}
                    checked={reasons.includes(r)}
                    onCheckedChange={(on) =>
                      setReasons((rs) => (on === true ? [...rs, r] : rs.filter((x) => x !== r)))
                    }
                  />
                ))}
              </Choices>
              <Button type="button" $size="lg" onClick={() => setReasonsSent(true)}>
                {copy.a4.send}
              </Button>
            </>
          )}
        </Stack>
      );
      actions = (
        <>
          <Button type="button" $variant="outline" $size="lg" onClick={resubscribe}>
            {copy.a4.resubscribe}
          </Button>
          {activeMember && (
            <>
              <Separator />
              <Footnote id="a4-membership" tabIndex={-1}>
                {copy.a4.membership(tier.name, formatDate(nextPayment), formatMoney(tier.monthlyPrice))}
              </Footnote>
              {!membershipKept && (
                <>
                  <Button
                    type="button"
                    $variant="outline"
                    $size="lg"
                    onClick={() => {
                      setMembershipKept(true);
                      document.getElementById("a4-membership")?.focus();
                    }}
                  >
                    {copy.a4.keepMembership}
                  </Button>
                  {cancelButton(copy.a4.cancelMembership)}
                </>
              )}
            </>
          )}
        </>
      );
      break;
    }

    case "B1":
      heading = (
        <AuthHeading
          title={copy.b1.heading}
          description={copy.b1.summary(tier.name, formatMoney(tier.monthlyPrice), formatDate(nextPayment))}
        />
      );
      body = (
        <Stack role="group" aria-labelledby="b1-question">
          <Question id="b1-question">{copy.b1.question}</Question>
          {navCard(copy.b1.tooManyEmails, () => go("A2"))}
          {navCard(copy.b1.costsTooMuch, () => go("B2"))}
          {navCard(copy.b1.needBreak, () => go("B3"))}
          {navCard(copy.b1.notInvolved, () => go("B4"))}
        </Stack>
      );
      actions = cancelButton();
      break;

    case "B2":
      if (done) {
        top = <IconWell icon={CircleCheck} tone="brand" />;
        heading = (
          <AuthHeading
            title={copy.b2.switchedHeading(tier.name)}
            description={copy.b2.switchedBody(formatDate(nextPayment), formatMoney(tier.monthlyPrice))}
          />
        );
        actions = cancelButton();
        break;
      }
      heading = <AuthHeading title={copy.b2.heading} description={copy.b2.body} />;
      body = (
        <Stack>
          {lower && navCard(copy.b2.switchTier(lower.name, formatMoney(lower.monthlyPrice), lower.whatChanges), switchTier)}
          {navCard(copy.b2.pause, () => go("B3"))}
        </Stack>
      );
      actions = (
        <>
          {cancelButton(copy.b2.cancelMembership)}
          {backButton}
        </>
      );
      break;

    case "B3": {
      if (done) {
        const restart = addMonths(DEMO_TODAY, pause);
        top = <IconWell icon={CirclePause} tone="neutral" />;
        heading = (
          <AuthHeading
            title={copy.b3.pausedHeading}
            description={copy.b3.pausedBody(
              formatDate(restart),
              formatMoney(tier.monthlyPrice),
              formatDate(addDays(restart, -RESTART_REMINDER_DAYS)),
            )}
          />
        );
        actions = (
          <>
            {restarted ? (
              <StatusLine>{copy.notInDoc.restarted}</StatusLine>
            ) : (
              <>
                <Footnote>{copy.b3.restartQuestion}</Footnote>
                <Button
                  type="button"
                  $variant="outline"
                  $size="lg"
                  onClick={() => {
                    setMembership("active");
                    setRestarted(true);
                  }}
                >
                  {copy.b3.restartNow}
                </Button>
              </>
            )}
            {cancelButton()}
          </>
        );
        break;
      }
      heading = <AuthHeading title={copy.b3.heading} description={copy.b3.whatHappens} />;
      body = (
        <Stack>
          <Question id="b3-question">{copy.b3.question}</Question>
          <RadioGroup
            name="pause"
            aria-labelledby="b3-question"
            value={String(pause)}
            onValueChange={(v) => setPause(Number(v) as PauseMonths)}
          >
            {pauseMonths.map((n) => (
              <RadioGroupOption key={n} value={String(n)} label={copy.b3.months(n)} />
            ))}
          </RadioGroup>
        </Stack>
      );
      actions = (
        <>
          <Button
            type="button"
            $size="lg"
            onClick={() => {
              setMembership("paused");
              setRestarted(false);
              setDone(true);
            }}
          >
            {copy.b3.pause}
          </Button>
          {cancelButton(copy.b3.cancelInstead)}
          {backButton}
        </>
      );
      break;
    }

    case "B4":
      heading = (
        <AuthHeading
          title={copy.b4.heading}
          description={paragraphs(
            copy.b4.noMoreCharges,
            start.policy === "end-of-period"
              ? copy.b4.endsAtPeriodEnd(formatDate(addDays(nextPayment, -1)))
              : copy.b4.endsToday,
            copy.b4.notRefundable(formatDate(addMonths(nextPayment, -1))),
            copy.b4.rejoin,
          )}
        />
      );
      body = (
        <Stack>
          <Field label={copy.b4.noteLabel}>
            {(props) => (
              <Textarea {...props} name="note" rows={3} maxLength={600} value={note} onChange={(e) => setNote(e.target.value)} />
            )}
          </Field>
        </Stack>
      );
      // Cancelling is this screen's point, so it comes first; danger-outline like every cancel.
      actions = (
        <>
          <Button type="button" $variant="danger-outline" $size="lg" onClick={cancelMembership}>
            {copy.b4.cancelMembership}
          </Button>
          <Button type="button" $variant="outline" $size="lg" onClick={history.length > 0 ? back : () => go("B1")}>
            {copy.b4.keepMembership}
          </Button>
        </>
      );
      break;

    case "B5": {
      const askAboutEmails = emails === "subscribed" && !emailsKept;
      top = <IconWell icon={CircleCheck} tone="neutral" />;
      heading = <AuthHeading title={copy.b5.heading} description={copy.b5.body(demoMember.email)} />;
      if (emailsKept) actions = <StatusLine>{copy.notInDoc.emailsKept}</StatusLine>;
      if (askAboutEmails) {
        body = (
          <Stack>
            <Question>{copy.b5.emailQuestion}</Question>
          </Stack>
        );
        actions = (
          <>
            <Button type="button" $size="lg" onClick={() => setEmailsKept(true)}>
              {copy.b5.keepEmails}
            </Button>
            {unsubscribeAll(copy.b5.unsubscribeAll)}
          </>
        );
      }
      break;
    }
  }

  return (
    <AuthScreen>
      <AuthColumn $wide key={`${screen}-${done}`}>
        {top}
        {heading}
        {body}
        {actions && <AuthActions>{actions}</AuthActions>}
      </AuthColumn>
    </AuthScreen>
  );
}
