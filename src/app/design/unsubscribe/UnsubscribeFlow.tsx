"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { styled } from "next-yak";
import { ArrowLeft, Check, ChevronRight, CircleCheck, CircleMinus, CirclePause, MailX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { RadioGroup, RadioGroupOption } from "@/components/ui/RadioGroup";
import { Separator } from "@/components/ui/Separator";
import { Textarea } from "@/components/ui/Textarea";
import { AuthActions, AuthColumn, AuthScreen, Footnote, IconWell, SdcLogo } from "@/features/auth/AuthScreen";
import { unsubscribeCopy as copy } from "./copy";
import {
  DEMO_TODAY,
  RESTART_REMINDER_DAYS,
  addDays,
  addMonths,
  demoMember,
  emailTypes,
  formatDate,
  formatMoney,
  lowerTier,
  pauseMonths,
  tierById,
  type CutOffPolicy,
  type EmailResult,
  type EmailType,
  type MembershipStatus,
  type UnsubscribeReason,
  type PauseMonths,
  type Screen,
  unsubscribeReasons,
} from "./data";

/*
 * Unsubscribe (A4), email preferences (A1) and pause/cancel membership (B1–B5), reached from the
 * two footer links in every SDC email. Built on Jesse's unsubscribe page (origin/jesse/email-links):
 * the sign-in screen's calm centered column, logo and full-width buttons, from
 * src/features/auth/AuthScreen. Client state only: saving, pausing and cancelling just show their
 * confirmation.
 *
 * Design choices on top of Jesse's page:
 * - No visible headings. Each screen keeps an h1 for screen readers (focus moves to it on each new
 *   screen), and result screens start their text with what the heading used to say.
 * - A1: tick the email types you want, then save. Saving turns the Save button into "Your preference
 *   is saved" until a tick changes. Unsubscribing (or saving with nothing ticked) opens A4.
 * - A4, the unsubscribe page, laid out after Luma's: the reasons (multi-select) in a card, then
 *   Unsubscribe. Opening it never unsubscribes. The result replaces the button, with an undo under it,
 *   then the way to stay ("fewer emails").
 *
 * Two rules from the doc hold: "Unsubscribe from all" (A1) and "Cancel membership" (B1–B4) are always
 * visible as real buttons, and the membership reason question is optional.
 */

/* ---- New here (see README.md): AuthScreen has no equivalent ---- */

/** The screen's h1, for screen readers only (design removed visible headings). Focus moves here. */
const HiddenHeading = styled.h1`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
`;

/** The screen's text under the logo or icon: AuthHeading's description, without the title. */
const Lead = styled.p`
  margin: 0;
  color: var(--color-text-muted);
  text-align: center;
  white-space: pre-line;
`;

/** A question inside the column: A1's email types, B1's reasons, B3's length, B5's email question. */
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

/** A checkbox's label at body size, like the radio options: the kit's Checkbox label is form-label size. */
const ChoiceText = styled.span`
  font-size: var(--text-md);
  line-height: var(--leading-ui);
  color: var(--color-text);
`;

/** The organization's name in A4's card, under "Unsubscribe from". */
const CardName = styled.p`
  margin: 0;
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  line-height: var(--leading-ui);
`;

/**
 * A4's result, in place of the Unsubscribe button: a success tint, a check icon and the words (never
 * color alone). Takes focus when it appears.
 */
function SuccessMessage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <SuccessBox ref={ref} role="status" tabIndex={-1}>
      <SuccessIcon icon={CircleCheck} size={20} />
      {children}
    </SuccessBox>
  );
}

const SuccessBox = styled.p`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  padding: var(--space-3);
  border: 1px solid var(--color-success-border);
  border-radius: var(--radius-md);
  background: var(--color-success-subtle);
  color: var(--color-text);

  &:focus {
    outline: none;
  }
`;

const SuccessIcon = styled(Icon)`
  flex-shrink: 0;
  color: var(--color-success);
`;

/** Small print, left-aligned with the content above it. */
const Note = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
`;

/* ---- Layout only ---- */

/** Left-aligned content (questions, choices) at the column's full width. */
const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;
`;

/** Text with a button after it on one line: "Unsubscribed by mistake? Resubscribe". */
const Inline = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
`;

const Choices = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const paragraphs = (...lines: (string | false)[]) => lines.filter(Boolean).join("\n\n");

export interface FlowStart {
  screen: Screen;
  /** Open B2's or B3's confirmed state. */
  done: boolean;
  /** Open A1 with this confirmation showing. */
  emailResult: EmailResult | null;
  /** A paying member. False shows the subscriber-only version of A4 (no membership lines). */
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
  const [emailsWanted, setEmailsWanted] = useState<EmailType[]>(() => {
    if (start.screen === "A4" && start.done) return [];
    if (start.emailResult === "saved") return ["monthly"];
    return [...emailTypes];
  });
  const [emailResult, setEmailResult] = useState<EmailResult | null>(start.emailResult);
  const [membership, setMembership] = useState<MembershipStatus>(() => {
    if (!start.isMember) return "none";
    if (start.screen === "B5") return "cancelled";
    if (start.screen === "B3" && start.done) return "paused";
    return "active";
  });
  const [tierId, setTierId] = useState(() =>
    start.screen === "B2" && start.done ? (lowerTier(startTier.id) ?? startTier).id : startTier.id,
  );
  const subscribed = emailsWanted.length > 0;

  // Answers.
  const [ticked, setTicked] = useState<EmailType[]>(emailsWanted);
  const [reasons, setReasons] = useState<UnsubscribeReason[]>([]);
  const [pause, setPause] = useState<PauseMonths>(1);
  const [note, setNote] = useState("");

  // Small follow-ups that stay on the same screen.
  const [emailsKept, setEmailsKept] = useState(false);
  const [restarted, setRestarted] = useState(false);

  // A new screen replaces the old one, so move focus to its (hidden) heading for screen readers.
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
  const nextPayment = demoMember.nextPaymentDate;

  function go(next: Screen) {
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

  /* A1's results. Saving with nothing ticked is unsubscribing, which opens A4. */
  function save(types: EmailType[]) {
    if (types.length === 0) return unsubscribe();
    setEmailsWanted(types);
    setEmailResult("saved");
  }
  /** Opens A4. Nothing is unsubscribed until its button is pressed. */
  function unsubscribe() {
    setEmailResult(null);
    go("A4");
  }
  /** A4's button. The reasons go with it. */
  function confirmUnsubscribe() {
    setEmailsWanted([]);
    setTicked([]);
    setEmailResult(null);
  }
  /** A4's undo: back to everything, on the same page. */
  function resubscribe() {
    setEmailsWanted([...emailTypes]);
    setTicked([...emailTypes]);
    setEmailResult("resubscribed");
  }
  /** A4 → A1 to pick fewer emails. If they'd unsubscribed, start from everything ticked. */
  function pickFewer() {
    if (!subscribed) setTicked([...emailTypes]);
    setEmailResult(null);
    setHistory([]);
    setScreen("A1");
    setDone(false);
  }
  function tick(type: EmailType, on: boolean) {
    setTicked((ts) => (on ? emailTypes.filter((t) => t === type || ts.includes(t)) : ts.filter((t) => t !== type)));
    // "Saved" describes what was saved; once the ticks change, Save is live again.
    setEmailResult(null);
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

  const navCard = (label: string, onClick: () => void) => (
    <NavCard type="button" $variant="outline" onClick={onClick}>
      <span>{label}</span>
      <Icon icon={ChevronRight} size={20} />
    </NavCard>
  );

  const cancelButton = (label: string = copy.b1.cancelMembership) => (
    <Button type="button" $variant="danger-outline" $size="lg" onClick={() => go("B4")}>
      {label}
    </Button>
  );

  // Back on in-between screens; end states (A4, B5), confirmations and B4 (whose "Keep my membership" already
  // goes back) don't get one.
  const canGoBack = history.length > 0 && !done && screen !== "A4" && screen !== "B4" && screen !== "B5";
  const backButton = canGoBack && (
    <Button type="button" $variant="ghost" $size="lg" onClick={back}>
      <Icon icon={ArrowLeft} size={16} />
      {copy.notInDoc.back}
    </Button>
  );

  /*
   * Each screen fills `top` (logo or icon), `title` (the hidden h1), `lead` (the centered text),
   * `body` (left-aligned content) and `actions` (full-width buttons, the main action first).
   */
  let top: ReactNode = <SdcLogo />;
  let title = "";
  let lead = "";
  let body: ReactNode = null;
  let actions: ReactNode = null;

  switch (screen) {
    case "A1": {
      const saved = emailResult === "saved";
      title = copy.a1.heading;
      lead = copy.a1.subtext(demoMember.email);
      body = (
        <Stack role="group" aria-labelledby="a1-question">
          <Question id="a1-question">{copy.a1.question}</Question>
          <Choices>
            {emailTypes.map((t) => (
              <Checkbox
                key={t}
                name="emails"
                value={t}
                label={<ChoiceText>{copy.a1.types[t]}</ChoiceText>}
                checked={ticked.includes(t)}
                onCheckedChange={(on) => tick(t, on === true)}
              />
            ))}
          </Choices>
        </Stack>
      );
      actions = (
        <>
          {/*
            After saving, the button says so and does nothing until a tick changes. aria-disabled on the
            secondary style, not `disabled`: the kit fades disabled buttons below 4.5:1, and this text
            needs reading. No disabled reason (design): the label explains it.
          */}
          {saved ? (
            <Button type="button" $variant="secondary" $size="lg" aria-disabled="true">
              <Icon icon={Check} size={16} />
              {copy.a1.saved}
            </Button>
          ) : (
            <Button type="button" $size="lg" onClick={() => save(ticked)}>
              {copy.a1.save}
            </Button>
          )}
          <Button type="button" $variant="danger-outline" $size="lg" onClick={unsubscribe}>
            {copy.a1.unsubscribeAll}
          </Button>
          {emailResult === "resubscribed" && (
            <StatusLine>{`${copy.notInDoc.resubscribedHeading}. ${copy.notInDoc.resubscribedBody}`}</StatusLine>
          )}
        </>
      );
      break;
    }

    case "A4": {
      // Membership lines only while the membership is active: after a cancel (B5 → A4) they'd be wrong.
      const activeMember = membership === "active";
      top = <IconWell icon={MailX} tone="neutral" />;
      title = copy.a4.heading;
      lead = copy.a1.subtext(demoMember.email);
      body = (
        <Stack>
          <Card>
            <CardContent>
              <CardDescription>{subscribed ? copy.a4.cardLabel : copy.a4.cardLabelDone}</CardDescription>
              <CardName>{copy.a4.org}</CardName>
            </CardContent>
            <Separator />
            <CardContent>
              <Stack role="group" aria-labelledby="a4-reason">
                <Question id="a4-reason">{copy.a4.reasonQuestion}</Question>
                <Choices>
                  {unsubscribeReasons.map((r) => (
                    <Checkbox
                      key={r}
                      name="reason"
                      value={r}
                      label={<ChoiceText>{copy.a4.reasons[r]}</ChoiceText>}
                      checked={reasons.includes(r)}
                      onCheckedChange={(on) =>
                        setReasons((rs) => (on === true ? [...rs, r] : rs.filter((x) => x !== r)))
                      }
                    />
                  ))}
                </Choices>
              </Stack>
            </CardContent>
          </Card>
          {subscribed ? (
            <>
              <Button type="button" $size="lg" onClick={confirmUnsubscribe}>
                <Icon icon={CircleMinus} size={16} />
                {copy.a4.confirm}
              </Button>
              <Note>{copy.a4.confirmNote(activeMember)}</Note>
              {emailResult === "resubscribed" && (
                <StatusLine>{`${copy.notInDoc.resubscribedHeading}. ${copy.notInDoc.resubscribedBody}`}</StatusLine>
              )}
            </>
          ) : (
            <>
              <SuccessMessage>{copy.a4.done}</SuccessMessage>
              <Inline>
                <Note>{copy.a4.undoQuestion}</Note>
                <Button type="button" $variant="ghost" onClick={resubscribe}>
                  {copy.a4.resubscribe}
                </Button>
              </Inline>
            </>
          )}
          <Separator />
          {navCard(copy.a4.fewerEmails, pickFewer)}
        </Stack>
      );
      if (activeMember) {
        actions = (
          <>
            <Note>{copy.a4.membership(tier.name, formatDate(nextPayment), formatMoney(tier.monthlyPrice))}</Note>
            {cancelButton(copy.a4.cancelMembership)}
          </>
        );
      }
      break;
    }

    case "B1":
      title = copy.b1.heading;
      lead = copy.b1.summary(tier.name, formatMoney(tier.monthlyPrice), formatDate(nextPayment));
      body = (
        <Stack role="group" aria-labelledby="b1-question">
          <Question id="b1-question">{copy.b1.question}</Question>
          {navCard(copy.b1.tooManyEmails, () => go("A1"))}
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
        title = copy.b2.switchedHeading(tier.name);
        lead = paragraphs(`${title}.`, copy.b2.switchedBody(formatDate(nextPayment), formatMoney(tier.monthlyPrice)));
        actions = cancelButton();
        break;
      }
      title = copy.b2.heading;
      lead = copy.b2.body;
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
        title = copy.b3.pausedHeading;
        lead = paragraphs(
          `${title}.`,
          copy.b3.pausedBody(
            formatDate(restart),
            formatMoney(tier.monthlyPrice),
            formatDate(addDays(restart, -RESTART_REMINDER_DAYS)),
          ),
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
      title = copy.b3.heading;
      lead = copy.b3.whatHappens;
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
      title = copy.b4.heading;
      lead = paragraphs(
        copy.b4.noMoreCharges,
        start.policy === "end-of-period"
          ? copy.b4.endsAtPeriodEnd(formatDate(addDays(nextPayment, -1)))
          : copy.b4.endsToday,
        copy.b4.notRefundable(formatDate(addMonths(nextPayment, -1))),
        copy.b4.rejoin,
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
      const askAboutEmails = subscribed && !emailsKept;
      top = <IconWell icon={CircleCheck} tone="neutral" />;
      title = copy.b5.heading;
      lead = paragraphs(`${title}.`, copy.b5.body(demoMember.email));
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
            <Button type="button" $variant="danger-outline" $size="lg" onClick={unsubscribe}>
              {copy.b5.unsubscribeAll}
            </Button>
          </>
        );
      }
      break;
    }
  }

  return (
    <AuthScreen>
      <AuthColumn $wide key={`${screen}-${done}`}>
        <HiddenHeading tabIndex={-1}>{title}</HiddenHeading>
        {top}
        {lead && <Lead>{lead}</Lead>}
        {body}
        {actions && <AuthActions>{actions}</AuthActions>}
      </AuthColumn>
    </AuthScreen>
  );
}
