"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { keyframes, styled } from "next-yak";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Collapsible, CollapsibleContent } from "@/components/ui/Collapsible";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { RadioGroup, RadioGroupOption } from "@/components/ui/RadioGroup";
import { Select } from "@/components/ui/Select";
import { Separator } from "@/components/ui/Separator";
import { Textarea } from "@/components/ui/Textarea";
import { AuthActions, AuthColumn, AuthHeading, AuthScreen, LinkButton, SdcLogo } from "@/features/auth/AuthScreen";
import { unsubscribeCopy as copy } from "./copy";
import {
  DEMO_TODAY,
  RESTART_REMINDER_DAYS,
  addDays,
  addMonths,
  addPause,
  demoMember,
  emailReasons,
  emailTypes,
  formatDate,
  formatMoney,
  membershipReasons,
  pauseUnits,
  tierById,
  type CutOffPolicy,
  type EmailReason,
  type EmailType,
  type MembershipReason,
  type MembershipStatus,
  type PauseUnit,
  type Screen,
} from "./data";

/*
 * The email page (A4) and the pause/cancel membership pages (B1, B4, B5), reached from the two footer
 * links in every SDC email. The flow follows the "Unsub flow" FigJam board; the look is Jesse's
 * unsubscribe page (origin/jesse/email-links), built from src/features/auth/AuthScreen. Client state
 * only: saving, pausing and cancelling just show their result.
 *
 * Three patterns hold on every screen (see README.md):
 * 1. One template: logo, green heading (with at most one short line under it), content, actions.
 *    The column sits at the top of the page, so nothing above a change ever moves.
 * 2. "What's going on?" is one bordered list of answers. Choosing one slides open its follow-up
 *    under it (and closes the last one's); there are no extra screens for follow-ups.
 * 3. The button a person presses changes its text to the result ("Your preference is saved",
 *    "You're unsubscribed", "Your membership is paused") and stops doing anything. An undo, when there
 *    is one, is a muted line with a text button under it.
 *
 * Two rules from the doc hold: Unsubscribe and "Cancel membership" are always visible, and every
 * question is optional.
 */

/* ---- Template ---- */

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
`;

/** Each new screen fades in (reduced motion is handled globally). Key it by screen. */
const Column = styled(AuthColumn)`
  animation: ${fadeIn} var(--duration) var(--ease);
`;

/**
 * The green heading, sized to the width it has: full size in the 440px column, smaller as the
 * screen narrows (about 23px on a 360px phone). A container query, so every screen gets it from
 * the template. For devs: this belongs in AuthHeading itself (src/features/auth/AuthScreen.tsx).
 */
const Heading = styled.div`
  container-type: inline-size;
  width: 100%;

  & h1 {
    font-size: clamp(var(--text-lg), 7cqi, var(--text-xl));
  }
`;

/** Content under the heading: left-aligned, full width. */
const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;
`;

/** A question above a list of answers. */
const Question = styled.h2`
  margin: 0;
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
`;

/** Small print, left-aligned. Muted, 4.5:1. */
const Note = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);

  &:focus {
    outline: none;
  }
`;

/** A follow-up's description: smaller than the answer above it, so the answer reads first. */
const Body = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
`;

/** A message the page is about, at body size (the membership line after unsubscribing). */
const Lead = styled.p`
  margin: 0;
  font-size: var(--text-md);
  line-height: var(--leading-ui);
  color: var(--color-text);

  &:focus {
    outline: none;
  }
`;

/* ---- Pattern 2: answers with follow-ups ---- */

/** One bordered group of answers, divided by 1px lines (no shadow: shadows are for overlays). */
const OptionList = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);

  > * + * {
    border-top: 1px solid var(--color-border);
  }
`;

/** A follow-up slides open at the slower height duration, the token for "things with real distance". */
const FollowUp = styled(CollapsibleContent)`
  &&[data-state] {
    animation-duration: var(--duration-slow);
  }
`;

/** A follow-up's contents, inset under its answer. Padding also keeps focus rings inside the clip. */
const FollowUpBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-1) var(--space-3) var(--space-3);
  animation: ${fadeIn} var(--duration-slow) var(--ease);
`;

/** A checkbox or answer label at body size; the kit's labels are form-label size. */
const ChoiceText = styled.span`
  font-size: var(--text-md);
  line-height: var(--leading-ui);
  color: var(--color-text);
`;

const Choices = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

interface Option<T extends string> {
  value: T;
  label: string;
  followUp?: ReactNode;
}

function Options<T extends string>({
  id,
  question,
  options,
  value,
  onChange,
}: {
  id: string;
  question: string;
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <Stack>
      <Question id={id}>{question}</Question>
      <RadioGroup aria-labelledby={id} value={value ?? ""} onValueChange={(v) => onChange(v as T)}>
        <OptionList>
          {options.map((o) => (
            <div key={o.value}>
              <RadioGroupOption value={o.value} label={<ChoiceText>{o.label}</ChoiceText>} />
              {o.followUp && (
                <Collapsible open={value === o.value}>
                  <FollowUp>
                    <FollowUpBody>{o.followUp}</FollowUpBody>
                  </FollowUp>
                </Collapsible>
              )}
            </div>
          ))}
        </OptionList>
      </RadioGroup>
    </Stack>
  );
}

/* ---- Pattern 3: results ---- */

/**
 * A pressed button's result: same place, its text says what happened, and it does nothing more.
 * aria-disabled on the secondary style, not `disabled`: the kit fades disabled buttons below 4.5:1,
 * and this text needs reading. No disabled reason (design: the label explains it). It's a plain kit
 * Button (a function, not a component) so React updates the pressed button in place and focus stays
 * on it; no transition, so it doesn't fade through the old button's colours.
 */
const done = (label: string) => (
  <Button type="button" $variant="secondary" $size="lg" aria-disabled="true" style={{ transition: "none" }}>
    <Icon icon={Check} size={16} />
    {label}
  </Button>
);

/** "Unsubscribed by mistake? Resubscribe": a muted line with a text button. */
const UndoLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
`;

/**
 * A result line that replaces a button that's gone (Resubscribe, Restart). Fades in and takes focus,
 * so keyboard and screen-reader users aren't dropped at the top of the page.
 */
function StatusLine({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <FadingNote ref={ref} role="status" tabIndex={-1}>
      {children}
    </FadingNote>
  );
}

const FadingNote = styled(Note)`
  animation: ${fadeIn} var(--duration) var(--ease);
`;

/** The pause length: a number and a unit side by side, wrapping on a narrow phone. */
const PauseFields = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);

  > * {
    flex: 1 1 8rem;
  }
`;

/* ---- The flow ---- */

export interface FlowStart {
  screen: Screen;
  emailReason: EmailReason | null;
  membershipReason: MembershipReason | null;
  /** A4: saved | unsubscribed | resubscribed. B1: paused | unsubscribed. */
  state: string | null;
  /** A paying member. False shows A4 for someone who only subscribes. */
  isMember: boolean;
  policy: CutOffPolicy;
  tierId: string;
}

const isWholeNumber = (s: string) => /^[1-9]\d*$/.test(s.trim());

export function UnsubscribeFlow({ start }: { start: FlowStart }) {
  const tier = tierById(start.tierId);
  const nextPayment = demoMember.nextPaymentDate;
  const st = start.state;

  const [screen, setScreen] = useState<Screen>(start.screen);
  const [history, setHistory] = useState<Screen[]>([]);

  // The member's record as these pages change it.
  const [subscribed, setSubscribed] = useState(st !== "unsubscribed");
  const [membership, setMembership] = useState<MembershipStatus>(() => {
    if (!start.isMember) return "none";
    if (start.screen === "B5") return "cancelled";
    if (start.screen === "B1" && st === "paused") return "paused";
    return "active";
  });

  // Email page.
  const [emailReason, setEmailReason] = useState<EmailReason | null>(
    start.emailReason ?? (st === "saved" ? "too-many" : null),
  );
  const [ticked, setTicked] = useState<EmailType[]>(st === "saved" ? ["monthly"] : [...emailTypes]);
  const [saved, setSaved] = useState(st === "saved");
  const [resubscribed, setResubscribed] = useState(st === "resubscribed");

  // Membership page.
  const [membershipReason, setMembershipReason] = useState<MembershipReason | null>(
    start.membershipReason ?? (st === "paused" ? "break" : st === "unsubscribed" && start.screen === "B1" ? "emails" : null),
  );
  const [pauseCount, setPauseCount] = useState("1");
  const [pauseUnit, setPauseUnit] = useState<PauseUnit>("months");
  const [pauseError, setPauseError] = useState<string>();
  const [restarted, setRestarted] = useState(false);
  const [note, setNote] = useState("");

  // Cancelled page: the answer to "Want to keep hearing about SDC's work?".
  const [emailsAnswer, setEmailsAnswer] = useState<"kept" | "unsubscribed" | null>(null);
  const [askedAboutEmails, setAskedAboutEmails] = useState(subscribed);

  // A new screen replaces the old one, so move focus to its heading for screen readers.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    document.querySelector<HTMLElement>("main h1")?.focus();
  }, [screen]);

  // On the email page, unsubscribing turns the page into "You're unsubscribed": move focus to that heading.
  const firstSubscribedRender = useRef(true);
  useEffect(() => {
    if (firstSubscribedRender.current) {
      firstSubscribedRender.current = false;
      return;
    }
    if (screen === "A4" && !subscribed) document.querySelector<HTMLElement>("main h1")?.focus();
  }, [subscribed]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeMember = membership === "active";
  const restartDate = isWholeNumber(pauseCount) ? addPause(DEMO_TODAY, Number(pauseCount), pauseUnit) : DEMO_TODAY;

  function go(next: Screen) {
    setHistory((h) => [...h, screen]);
    setScreen(next);
  }
  function back() {
    const previous = history.at(-1);
    if (!previous) return;
    setHistory((h) => h.slice(0, -1));
    setScreen(previous);
  }

  function unsubscribe() {
    setSubscribed(false);
    setResubscribed(false);
    setSaved(false);
  }
  function resubscribe() {
    setSubscribed(true);
    setTicked([...emailTypes]);
    setResubscribed(true);
  }
  function tick(type: EmailType, on: boolean) {
    setTicked((ts) => (on ? emailTypes.filter((t) => t === type || ts.includes(t)) : ts.filter((t) => t !== type)));
    // "Saved" describes what was saved; once the ticks change, Save is live again.
    setSaved(false);
  }
  function save() {
    // Saving with nothing ticked is unsubscribing.
    if (ticked.length === 0) return unsubscribe();
    setSubscribed(true);
    setResubscribed(false);
    setSaved(true);
  }
  function pause() {
    if (!isWholeNumber(pauseCount)) return setPauseError(copy.membership.pauseLengthError);
    setPauseError(undefined);
    setMembership("paused");
    setRestarted(false);
  }
  function cancelMembership() {
    setMembership("cancelled");
    setAskedAboutEmails(subscribed);
    setEmailsAnswer(null);
    setHistory([]);
    setScreen("B5");
  }

  const cancelButton = (
    <Button type="button" $variant="danger-outline" $size="lg" onClick={() => go("B4")}>
      {copy.cancelMembership}
    </Button>
  );
  const undoUnsubscribe = (
    <UndoLine>
      <Note>{copy.undoUnsubscribe}</Note>
      <Button type="button" $variant="ghost" onClick={resubscribe}>
        {copy.resubscribe}
      </Button>
    </UndoLine>
  );

  /* The pause form, shared by "It costs too much right now" and "I need a break". */
  const pauseForm = (
    <>
      {membership !== "paused" && (
        <>
          <PauseFields>
            <Field label={copy.membership.pauseLength} error={pauseError}>
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
            <Field label={copy.membership.pauseUnit}>
              {(props) => (
                <Select
                  {...props}
                  value={pauseUnit}
                  onValueChange={(v) => setPauseUnit(v as PauseUnit)}
                  options={pauseUnits.map((u) => ({ value: u, label: copy.membership.pauseUnits[u] }))}
                />
              )}
            </Field>
          </PauseFields>
          <Body>{copy.membership.whatHappens}</Body>
        </>
      )}
      {membership === "paused" ? (
        done(copy.membership.paused)
      ) : (
        <Button type="button" $size="lg" onClick={pause}>
          {copy.membership.pause}
        </Button>
      )}
      {membership === "paused" && (
        <>
          <Body>
            {copy.membership.pausedBody(
              formatDate(restartDate),
              formatMoney(tier.monthlyPrice),
              formatDate(addDays(restartDate, -RESTART_REMINDER_DAYS)),
            )}
          </Body>
          <UndoLine>
            <Note>{copy.membership.restartQuestion}</Note>
            <Button
              type="button"
              $variant="ghost"
              onClick={() => {
                setMembership("active");
                setRestarted(true);
              }}
            >
              {copy.membership.restartNow}
            </Button>
          </UndoLine>
        </>
      )}
      {membership === "active" && restarted && <StatusLine>{copy.membership.restarted}</StatusLine>}
    </>
  );

  /* Each screen fills the template: heading, an optional line under it, content and actions. */
  let heading = "";
  let line: string | undefined;
  let content: ReactNode = null;
  let actions: ReactNode = null;

  switch (screen) {
    case "A4": {
      // Unsubscribing turns this page into "You're unsubscribed": the question slides closed, and
      // resubscribing slides it open again.
      heading = subscribed ? copy.emails.heading : copy.unsubscribed;
      content = (
        <Collapsible open={subscribed} style={{ width: "100%" }}>
          <FollowUp>
            <Options
              id="emails-question"
              question={copy.emails.question}
              value={emailReason}
              onChange={setEmailReason}
              options={emailReasons.map((r) => ({
                value: r,
                label: copy.emails.reasons[r],
                followUp:
                  r === "too-many" ? (
                    <>
                      <Body>{copy.emails.typesQuestion}</Body>
                      <Choices role="group" aria-label={copy.emails.typesQuestion}>
                        {emailTypes.map((t) => (
                          <Checkbox
                            key={t}
                            name="emails"
                            value={t}
                            label={<ChoiceText>{copy.emails.types[t]}</ChoiceText>}
                            checked={ticked.includes(t)}
                            onCheckedChange={(on) => tick(t, on === true)}
                          />
                        ))}
                      </Choices>
                      {saved ? (
                        done(copy.emails.saved)
                      ) : (
                        <Button type="button" $size="lg" onClick={save}>
                          {copy.emails.save}
                        </Button>
                      )}
                    </>
                  ) : r === "not-relevant" ? (
                    <>
                      <Body>{copy.emails.interestsBody}</Body>
                      <LinkButton href="/intake-form" $variant="outline">
                        {copy.emails.interestsLink}
                      </LinkButton>
                    </>
                  ) : undefined,
              }))}
            />
          </FollowUp>
        </Collapsible>
      );
      actions = subscribed ? (
        <>
          <Button type="button" $variant="danger-outline" $size="lg" onClick={unsubscribe}>
            {copy.unsubscribe}
          </Button>
          {/* After resubscribing, the confirmation replaces the note about what unsubscribing does. */}
          {resubscribed ? <StatusLine>{copy.resubscribed}</StatusLine> : <Note>{copy.emails.unsubscribeNote(activeMember)}</Note>}
        </>
      ) : (
        <>
          {/* FigJam: after unsubscribing, members hear their membership is still active. */}
          {activeMember && (
            <>
              <Lead>
                {copy.emails.membership(tier.name, formatDate(nextPayment), formatMoney(tier.monthlyPrice))}
              </Lead>
              <Button type="button" $size="lg" onClick={() => go("A5")}>
                {copy.emails.soundsGood}
              </Button>
              {cancelButton}
              <Separator />
            </>
          )}
          {/* The undo comes last, under everything else. */}
          {undoUnsubscribe}
        </>
      );
      break;
    }

    // "Sounds good": nothing left to do.
    case "A5":
      heading = copy.unsubscribed;
      line = copy.emails.closeTab;
      break;

    case "B1": {
      heading = copy.membership.heading;
      line = copy.membership.summary(tier.name, formatMoney(tier.monthlyPrice), formatDate(nextPayment));
      content = (
        <Options
          id="membership-question"
          question={copy.membership.question}
          value={membershipReason}
          onChange={setMembershipReason}
          options={membershipReasons.map((r) => ({
            value: r,
            label: copy.membership.reasons[r],
            followUp:
              r === "emails" ? (
                <>
                  <Body>{copy.membership.emailsBody}</Body>
                  {subscribed ? (
                    <Button type="button" $size="lg" onClick={unsubscribe}>
                      {copy.membership.emailsAction}
                    </Button>
                  ) : (
                    done(copy.unsubscribed)
                  )}
                  {subscribed && resubscribed && <StatusLine>{copy.resubscribed}</StatusLine>}
                  {!subscribed && undoUnsubscribe}
                </>
              ) : r === "budget" ? (
                <>
                  <Body>{copy.membership.budgetBody}</Body>
                  {pauseForm}
                </>
              ) : r === "break" ? (
                pauseForm
              ) : (
                <Body>{copy.membership.thanks}</Body>
              ),
          }))}
        />
      );
      actions = cancelButton;
      break;
    }

    case "B4":
      heading = copy.cancel.heading;
      content = (
        <Stack>
          <Lead>{copy.cancel.noMoreCharges}</Lead>
          <Lead>
            {start.policy === "end-of-period"
              ? copy.cancel.endsAtPeriodEnd(formatDate(addDays(nextPayment, -1)))
              : copy.cancel.endsToday}
          </Lead>
          <Lead>{copy.cancel.notRefundable(formatDate(addMonths(nextPayment, -1)))}</Lead>
          <Lead>{copy.cancel.rejoin}</Lead>
          <Field label={copy.cancel.noteLabel}>
            {(props) => (
              <Textarea {...props} name="note" rows={3} maxLength={600} value={note} onChange={(e) => setNote(e.target.value)} />
            )}
          </Field>
        </Stack>
      );
      actions = (
        <>
          <Button type="button" $variant="danger-outline" $size="lg" onClick={cancelMembership}>
            {copy.cancelMembership}
          </Button>
          <Button type="button" $variant="outline" $size="lg" onClick={history.length > 0 ? back : () => go("B1")}>
            {copy.cancel.keepMembership}
          </Button>
        </>
      );
      break;

    case "B5":
      heading = copy.cancelled.heading;
      line = `${copy.cancelled.thanks} ${copy.cancelled.confirmationSent(demoMember.email)}`;
      // Only ask about emails if they were still subscribed when they cancelled.
      if (askedAboutEmails) {
        content = (
          <Stack>
            <Question>{copy.cancelled.emailQuestion}</Question>
          </Stack>
        );
        // Each button keeps its place, so the one pressed keeps focus as it turns into its result.
        actions = (
          <>
            {emailsAnswer === "kept" ? (
              done(copy.cancelled.emailsKept)
            ) : emailsAnswer === null ? (
              <Button type="button" $size="lg" onClick={() => setEmailsAnswer("kept")}>
                {copy.cancelled.keepEmails}
              </Button>
            ) : null}
            {emailsAnswer === "unsubscribed" ? (
              done(copy.unsubscribed)
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
                {copy.unsubscribe}
              </Button>
            ) : null}
          </>
        );
      }
      break;
  }

  return (
    <AuthScreen>
      <Column $wide key={screen}>
        <SdcLogo />
        <Heading>
          <AuthHeading title={heading} description={line} />
        </Heading>
        {content}
        {actions && <AuthActions>{actions}</AuthActions>}
      </Column>
    </AuthScreen>
  );
}
