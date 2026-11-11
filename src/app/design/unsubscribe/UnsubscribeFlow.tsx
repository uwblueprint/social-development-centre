"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { styled } from "next-yak";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { RadioCard } from "@/components/ui/RadioGroup";
import { Textarea } from "@/components/ui/Textarea";
import { OTHER, intakeCopy, topicChoices, wayChoices } from "@/features/intake/copy";
import { CheckCardGroup } from "@/features/intake/components/CheckCardGroup";
import {
  PaperActions,
  PaperCardText,
  PaperChoices,
  PaperHeading,
  PaperLead,
  PaperLogos,
  PaperPage,
  PaperSheet,
  PaperStep,
} from "@/features/intake/components/Paper";
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
} from "./data";

/*
 * Email preferences (A1–A4) and pause/cancel membership (B1–B5), reached from the two footer links in
 * every SDC email. One screen at a time on the intake form's paper sheet. Client state only: saving,
 * pausing and cancelling just move to that screen's confirmation. The real feature does each of those
 * on the server and updates the member's record (see the doc's "System behavior on finish").
 *
 * Built from the intake form's pieces (Paper.tsx, CheckCardGroup, the kit's RadioCard). The three
 * things the intake form has no equivalent for are defined here and listed in ./README.md.
 *
 * Two rules from the doc hold on every screen: "Unsubscribe from all emails" (A1–A3) and "Cancel
 * membership" (B1–B4) are always visible as real buttons, and reason questions are optional.
 */

const HEADING_ID = "unsubscribe-heading";

/* ---- New here (see README.md): the intake form has no equivalent ---- */

/** A sub-question under the step's heading, where one screen asks more than one thing (A3, A4, B1, B3, B5). */
const Question = styled.h2`
  margin: 0;
  font-size: var(--text-md);
  font-weight: var(--weight-bold);
  line-height: var(--leading-heading);
`;

/**
 * A choice that moves to another screen (A1, B1, B2): the whole card is the button. The intake form's
 * cards only select; these navigate, so they're kit Buttons shaped like its cards, with a chevron.
 */
const NavCard = styled(Button)`
  justify-content: space-between;
  gap: var(--space-3);
  width: 100%;
  height: auto;
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  font-size: var(--text-md);
  line-height: var(--leading-ui);
  text-align: left;
  white-space: normal;
`;

/**
 * A short result line that replaces the button just pressed. Focus moves to it, so keyboard and
 * screen-reader users aren't dropped back at the top of the page when the button disappears.
 */
function StatusLine({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <PaperLead ref={ref} role="status" tabIndex={-1}>
      {children}
    </PaperLead>
  );
}

/* ---- Layout only ---- */

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

/* A line of text with a button after it, e.g. "Unsubscribed by mistake? Resubscribe". */
const Inline = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
`;

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const listFormat = new Intl.ListFormat("en-CA", { style: "long", type: "conjunction" });

export interface FlowStart {
  screen: Screen;
  /** Open the screen's saved/confirmed state (A2, A3, B2, B3). */
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
  const [emails, setEmails] = useState<EmailStatus>(start.screen === "A4" ? "unsubscribed" : "subscribed");
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
  const [topics, setTopics] = useState(demoMember.topics);
  const [topicsOther, setTopicsOther] = useState(demoMember.topicsOther);
  const [ways, setWays] = useState(demoMember.ways);
  const [waysOther, setWaysOther] = useState(demoMember.waysOther);
  const [pause, setPause] = useState<PauseMonths>(1);
  const [reason, setReason] = useState("");
  const [reasonSent, setReasonSent] = useState(false);
  const [note, setNote] = useState("");

  // Small follow-ups that stay on the same screen.
  const [membershipKept, setMembershipKept] = useState(false);
  const [emailsKept, setEmailsKept] = useState(false);
  const [restarted, setRestarted] = useState(false);

  // Move focus to each screen's heading so screen readers start there, as the intake form does.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    document.getElementById(HEADING_ID)?.focus();
  }, [screen, done]);

  const tier = tierById(tierId);
  const lower = lowerTier(tierId);
  const isMember = membership === "active" || membership === "paused";
  const nextPayment = demoMember.nextPaymentDate;

  function go(next: Screen) {
    // The unsubscribe happens on arrival at A4: that screen reports the result, it doesn't ask again.
    if (next === "A4") {
      setEmails("unsubscribed");
      setReason("");
      setReasonSent(false);
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

  function pauseMembership() {
    setMembership("paused");
    setRestarted(false);
    setDone(true);
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
    setScreen("A1");
    setDone(false);
  }

  const heading = (text: string) => (
    <PaperHeading id={HEADING_ID} tabIndex={-1}>
      {text}
    </PaperHeading>
  );

  const navCard = (label: string, onClick: () => void) => (
    <NavCard type="button" $variant="outline" onClick={onClick}>
      <span>{label}</span>
      <Icon icon={ChevronRight} size={20} />
    </NavCard>
  );

  const unsubscribeAll = (label: string = copy.a1.unsubscribeAll) => (
    <Button type="button" $variant="danger-outline" $size="lg" onClick={() => go("A4")}>
      {label}
    </Button>
  );

  const cancelButton = (label: string = copy.b1.cancelMembership) => (
    <Button type="button" $variant="danger-outline" $size="lg" onClick={() => go("B4")}>
      {label}
    </Button>
  );

  // Back is offered on in-between screens; end states (A4, B5), confirmations and B4 (whose "Keep my
  // membership" already goes back) don't get one.
  const canGoBack = history.length > 0 && !done && screen !== "A4" && screen !== "B4" && screen !== "B5";

  /*
   * Each screen fills `body` and `actions`. Actions sit in the intake form's sticky bar, in its order:
   * Back first, the main action last (it stretches to fill the row).
   */
  let body: ReactNode;
  let actions: ReactNode = null;
  switch (screen) {
    case "A1":
      body = (
        <>
          {heading(copy.a1.heading)}
          <PaperLead>{copy.a1.subtext(demoMember.email)}</PaperLead>
          <Stack>
            {navCard(copy.a1.tooMany, () => go("A2"))}
            {navCard(copy.a1.notRelevant, () => go("A3"))}
            {navCard(copy.a1.noMore, () => go("A4"))}
          </Stack>
        </>
      );
      actions = unsubscribeAll();
      break;

    case "A2": {
      if (done) {
        body = (
          <>
            {heading(copy.a2.savedHeading)}
            <PaperLead>{copy.a2.savedBody(lowerFirst(copy.a2.choices[fewer]))}</PaperLead>
          </>
        );
        actions = unsubscribeAll();
        break;
      }
      const choices = fewerEmailChoices.filter((c) => isMember || !c.membersOnly);
      body = (
        <>
          {heading(copy.a2.heading)}
          <PaperLead id="a2-body">{copy.a2.body}</PaperLead>
          <PaperChoices
            name="fewer"
            aria-labelledby="a2-body"
            value={fewer}
            onValueChange={(v) => setFewer(v as FewerEmailChoice)}
          >
            {choices.map((c) => (
              <RadioCard key={c.id} value={c.id}>
                <PaperCardText>{copy.a2.choices[c.id]}</PaperCardText>
              </RadioCard>
            ))}
          </PaperChoices>
        </>
      );
      actions = (
        <>
          {unsubscribeAll(copy.a2.unsubscribeInstead)}
          <Button type="button" $size="lg" onClick={() => setDone(true)}>
            {copy.a2.save}
          </Button>
        </>
      );
      break;
    }

    case "A3": {
      if (done) {
        const picked = topicChoices.filter((c) => topics.includes(c.id)).map((c) => lowerFirst(c.label));
        if (topics.includes(OTHER) && topicsOther.trim()) picked.push(topicsOther.trim());
        body = (
          <>
            {heading(copy.a3.savedHeading)}
            {picked.length > 0 && <PaperLead>{copy.a3.savedBody(listFormat.format(picked))}</PaperLead>}
          </>
        );
        actions = unsubscribeAll();
        break;
      }
      body = (
        <>
          {heading(copy.a3.heading)}
          <PaperLead>{copy.a3.body}</PaperLead>
          <Stack>
            <Question id="a3-topics">{copy.a3.topicsQuestion}</Question>
            <CheckCardGroup
              name="topics"
              labelledBy="a3-topics"
              options={topicChoices}
              value={topics}
              onChange={setTopics}
              otherValue={topicsOther}
              onOtherChange={setTopicsOther}
              otherLabel={intakeCopy.topics.otherLabel}
            />
          </Stack>
          <Stack>
            <Question id="a3-ways">{copy.a3.waysQuestion}</Question>
            <CheckCardGroup
              name="ways"
              labelledBy="a3-ways"
              options={wayChoices}
              value={ways}
              onChange={setWays}
              otherValue={waysOther}
              onOtherChange={setWaysOther}
              otherLabel={intakeCopy.ways.otherLabel}
            />
          </Stack>
        </>
      );
      actions = (
        <>
          {unsubscribeAll(copy.a3.unsubscribeInstead)}
          <Button type="button" $size="lg" onClick={() => setDone(true)}>
            {copy.a3.save}
          </Button>
        </>
      );
      break;
    }

    case "A4": {
      // Membership lines only while the membership is active: after a cancel (B5 → A4) they'd be wrong.
      const activeMember = membership === "active";
      body = (
        <>
          {heading(copy.a4.heading)}
          <PaperLead>{copy.a4.body}</PaperLead>
          {activeMember && (
            <>
              <PaperLead>{copy.a4.requiredNotices}</PaperLead>
              <PaperLead id="a4-membership" tabIndex={-1}>
                {copy.a4.membership(tier.name, formatDate(nextPayment), formatMoney(tier.monthlyPrice))}
              </PaperLead>
            </>
          )}
          <Inline>
            <PaperLead>{copy.a4.undoQuestion}</PaperLead>
            <Button type="button" $variant="ghost" onClick={resubscribe}>
              {copy.a4.resubscribe}
            </Button>
          </Inline>
          <Stack>
            <Question id="a4-reason">{copy.a4.reasonQuestion}</Question>
            {reasonSent ? (
              <StatusLine>{copy.notInDoc.reasonThanks}</StatusLine>
            ) : (
              <>
                <PaperChoices name="reason" aria-labelledby="a4-reason" value={reason} onValueChange={setReason}>
                  {unsubscribeReasons.map((r) => (
                    <RadioCard key={r} value={r}>
                      <PaperCardText>{copy.a4.reasons[r]}</PaperCardText>
                    </RadioCard>
                  ))}
                </PaperChoices>
                <Inline>
                  <Button type="button" $variant="secondary" $size="lg" onClick={() => setReasonSent(true)}>
                    {copy.a4.send}
                  </Button>
                </Inline>
              </>
            )}
          </Stack>
        </>
      );
      if (activeMember && !membershipKept) {
        actions = (
          <>
            {cancelButton(copy.a4.cancelMembership)}
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
          </>
        );
      }
      break;
    }

    case "B1":
      body = (
        <>
          {heading(copy.b1.heading)}
          <PaperLead>
            {copy.b1.summary(tier.name, formatMoney(tier.monthlyPrice), formatDate(nextPayment))}
          </PaperLead>
          <Stack role="group" aria-labelledby="b1-question">
            <Question id="b1-question">{copy.b1.question}</Question>
            {navCard(copy.b1.tooManyEmails, () => go("A2"))}
            {navCard(copy.b1.costsTooMuch, () => go("B2"))}
            {navCard(copy.b1.needBreak, () => go("B3"))}
            {navCard(copy.b1.notInvolved, () => go("B4"))}
          </Stack>
        </>
      );
      actions = cancelButton();
      break;

    case "B2":
      if (done) {
        body = (
          <>
            {heading(copy.b2.switchedHeading(tier.name))}
            <PaperLead>{copy.b2.switchedBody(formatDate(nextPayment), formatMoney(tier.monthlyPrice))}</PaperLead>
          </>
        );
        actions = cancelButton();
        break;
      }
      body = (
        <>
          {heading(copy.b2.heading)}
          <PaperLead>{copy.b2.body}</PaperLead>
          <Stack>
            {lower &&
              navCard(copy.b2.switchTier(lower.name, formatMoney(lower.monthlyPrice), lower.whatChanges), switchTier)}
            {navCard(copy.b2.pause, () => go("B3"))}
          </Stack>
        </>
      );
      actions = cancelButton(copy.b2.cancelMembership);
      break;

    case "B3": {
      if (done) {
        const restart = addMonths(DEMO_TODAY, pause);
        body = (
          <>
            {heading(copy.b3.pausedHeading)}
            <PaperLead>
              {copy.b3.pausedBody(
                formatDate(restart),
                formatMoney(tier.monthlyPrice),
                formatDate(addDays(restart, -RESTART_REMINDER_DAYS)),
              )}
            </PaperLead>
            {restarted ? (
              <StatusLine>{copy.notInDoc.restarted}</StatusLine>
            ) : (
              <Inline>
                <PaperLead>{copy.b3.restartQuestion}</PaperLead>
                <Button
                  type="button"
                  $variant="ghost"
                  onClick={() => {
                    setMembership("active");
                    setRestarted(true);
                  }}
                >
                  {copy.b3.restartNow}
                </Button>
              </Inline>
            )}
          </>
        );
        actions = cancelButton();
        break;
      }
      body = (
        <>
          {heading(copy.b3.heading)}
          <Stack>
            <Question id="b3-question">{copy.b3.question}</Question>
            <PaperChoices
              name="pause"
              aria-labelledby="b3-question"
              value={String(pause)}
              onValueChange={(v) => setPause(Number(v) as PauseMonths)}
            >
              {pauseMonths.map((n) => (
                <RadioCard key={n} value={String(n)}>
                  <PaperCardText>{copy.b3.months(n)}</PaperCardText>
                </RadioCard>
              ))}
            </PaperChoices>
          </Stack>
          <PaperLead>{copy.b3.whatHappens}</PaperLead>
        </>
      );
      actions = (
        <>
          {cancelButton(copy.b3.cancelInstead)}
          <Button type="button" $size="lg" onClick={pauseMembership}>
            {copy.b3.pause}
          </Button>
        </>
      );
      break;
    }

    case "B4":
      body = (
        <>
          {heading(copy.b4.heading)}
          <PaperLead>{copy.b4.noMoreCharges}</PaperLead>
          <PaperLead>
            {start.policy === "end-of-period"
              ? copy.b4.endsAtPeriodEnd(formatDate(addDays(nextPayment, -1)))
              : copy.b4.endsToday}
          </PaperLead>
          <PaperLead>{copy.b4.notRefundable(formatDate(addMonths(nextPayment, -1)))}</PaperLead>
          <PaperLead>{copy.b4.rejoin}</PaperLead>
          <Field label={copy.b4.noteLabel}>
            {(props) => (
              <Textarea {...props} name="note" rows={3} maxLength={600} value={note} onChange={(e) => setNote(e.target.value)} />
            )}
          </Field>
        </>
      );
      // "Cancel membership" is this screen's main action (last, so it fills the row), danger-outline like every cancel.
      actions = (
        <>
          <Button type="button" $variant="outline" $size="lg" onClick={history.length > 0 ? back : () => go("B1")}>
            {copy.b4.keepMembership}
          </Button>
          <Button type="button" $variant="danger-outline" $size="lg" onClick={cancelMembership}>
            {copy.b4.cancelMembership}
          </Button>
        </>
      );
      break;

    case "B5": {
      const askAboutEmails = emails === "subscribed" && !emailsKept;
      body = (
        <>
          {heading(copy.b5.heading)}
          <PaperLead>{copy.b5.body(demoMember.email)}</PaperLead>
          {emailsKept && <StatusLine>{copy.notInDoc.emailsKept}</StatusLine>}
          {askAboutEmails && <Question>{copy.b5.emailQuestion}</Question>}
        </>
      );
      if (askAboutEmails) {
        actions = (
          <>
            {unsubscribeAll(copy.b5.unsubscribeAll)}
            <Button type="button" $size="lg" onClick={() => setEmailsKept(true)}>
              {copy.b5.keepEmails}
            </Button>
          </>
        );
      }
      break;
    }
  }

  return (
    <PaperPage>
      <PaperSheet>
        <PaperLogos>
          <Image src="/brand/sdc-logo-transparent.png" alt={intakeCopy.logos.sdc} width={800} height={628} loading="eager" />
        </PaperLogos>
        <PaperStep key={`${screen}-${done}`}>{body}</PaperStep>
        {(canGoBack || actions) && (
          <PaperActions>
            {canGoBack && (
              <Button type="button" $variant="outline" $size="lg" onClick={back}>
                <Icon icon={ArrowLeft} size={16} />
                {copy.notInDoc.back}
              </Button>
            )}
            {actions}
          </PaperActions>
        )}
      </PaperSheet>
    </PaperPage>
  );
}
