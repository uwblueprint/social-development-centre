"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { keyframes, styled } from "next-yak";
import { ArrowLeft, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";
import { RadioCard, RadioCardGroup } from "@/components/ui/RadioGroup";
import { Select } from "@/components/ui/Select";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Textarea } from "@/components/ui/Textarea";
import { celebrate } from "@/lib/celebrate";
import {
  intakeForms,
  locationChoices,
  timeChoices,
  topicChoices,
  wayChoices,
  type IntakeFormSource,
} from "../copy";
import {
  INTAKE_PAGE_KEYS,
  type IntakePageKey,
  type IntakePageVisitPayload,
  type IntakeVisitAnswer,
  type IntakeVisitExit,
} from "../analytics";
import { submitIntake } from "../actions";
import { EMAIL_PATTERN, toSubmission } from "../submit";
import { QUESTION_COUNT, emptyAnswers, type ContactField, type IntakeAnswers, type Step } from "../types";
import { CheckCardGroup } from "./CheckCardGroup";
import { Envelope } from "./Envelope";
import { Goose } from "./Goose";
import { TopicRanking } from "./TopicRanking";

/*
 * The intake form as a doodled letter (prototype, 8 Oct 2026): a closed envelope opens into the welcome
 * letter, every step sits on a sheet of paper, and the confirmation is a celebrating goose. Kit components
 * keep their behaviour; this page only re-points --color-bg and --color-bg-hover at the paper so they sit on it.
 */

/** Steps that show the progress bar, in order. */
const FLOW: Step[] = ["contact", "topics", "ways", "location", "time", "hopes"];
const HEADING_ID = "intake-heading";

interface VisitClock {
  pageKey: IntakePageKey;
  startedAt: number;
  activeMs: number;
  activeSince: number | null;
  firstAnswerMs: number | null;
  lastAnswerMs: number | null;
}

function isTrackedPage(step: Step): step is IntakePageKey {
  return INTAKE_PAGE_KEYS.some((pageKey) => pageKey === step);
}

function answersForPage(
  pageKey: IntakePageKey,
  answers: IntakeAnswers,
  submissionId: string,
  source: IntakeFormSource,
): IntakeVisitAnswer[] {
  const submission = toSubmission(submissionId, source, answers);
  const result: IntakeVisitAnswer[] = [];
  const add = (field: string, value: string | string[]) => {
    if (value.length > 0) result.push({ field, value });
  };

  if (pageKey === "topics") {
    if (submission.topics.length > 0) result.push({ field: "topics", value: submission.topics });
    add("topicsOther", submission.topicsOther);
  } else if (pageKey === "ways") {
    add("ways", submission.ways);
    add("waysOther", submission.waysOther);
  } else if (pageKey === "location") {
    add("location", submission.location);
  } else if (pageKey === "time") {
    add("timeAvailable", submission.timeAvailable);
  } else if (pageKey === "hopes") {
    add("hopes", submission.hopes);
  }

  return result;
}

function isSkippedQuestion(step: Step, answers: IntakeAnswers): boolean {
  return (
    (step === "topics" && Object.values(answers.topicRanks).every((rank) => rank === null)) ||
    (step === "ways" && answers.ways.length === 0) ||
    (step === "location" && answers.location === "") ||
    (step === "time" && answers.time === "")
  );
}

const fadeUp = keyframes`
  from {
    opacity: 0;
    translate: 0 var(--enter-offset);
  }
`;
const sheetIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(var(--space-6)) scale(0.96);
  }
`;

const Page = styled.div`
  --color-bg: var(--intake-paper);
  --color-bg-hover: var(--intake-paper-tint);
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background-color: var(--intake-desk);
  background-image: radial-gradient(var(--intake-desk-dot) 1px, transparent 1.2px);
  background-size: var(--space-5) var(--space-5);
  color: var(--color-text);
  font-family: var(--font-intake-body);
  line-height: var(--leading-body);
`;

/* The letter: a hand-drawn sheet on the desk. On a phone it fills the screen instead. */
const Sheet = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
  max-width: 40rem;
  min-height: calc(100dvh - var(--space-4) * 2);
  margin: var(--space-4) auto;
  padding: var(--space-5) var(--space-5) 0;
  border: 2px solid var(--intake-ink);
  border-radius: var(--radius-intake-sheet);
  background: var(--intake-paper);
  box-shadow: var(--shadow-intake-sheet);
  animation: ${sheetIn} var(--duration-enter) var(--ease-spring) both;

  @media (max-width: 40rem) {
    min-height: 100dvh;
    margin: 0;
    padding: var(--space-4) var(--space-4) 0;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }
`;

const Logos = styled.div`
  display: flex;
  align-items: flex-end;
  gap: var(--space-6);

  img {
    width: auto;
    height: var(--space-8);
  }
  @media (max-height: 45rem), (max-width: 40rem) {
    img {
      height: var(--space-7);
    }
  }
`;

const ProgressBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  /* Clear of the logos above (review, 22 Oct 2026). */
  margin-top: var(--space-2);
`;

const ProgressText = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const Body = styled.form`
  display: flex;
  flex: 1;
  flex-direction: column;
`;

const StepBody = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-4);
  padding-bottom: var(--space-5);
  animation: ${fadeUp} var(--duration-enter) var(--ease) both;
`;

const Heading = styled.h1`
  margin: 0;
  font-family: var(--font-intake-display);
  font-size: var(--text-xl);
  font-weight: var(--weight-regular);
  line-height: var(--leading-heading);
  overflow-wrap: anywhere;

  &:focus {
    outline: none;
  }
`;

const Letter = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  color: var(--color-text-muted);
  font-size: var(--text-md);

  p {
    margin: 0;
    max-width: 60ch;
  }
  b {
    color: var(--color-text);
    font-weight: var(--weight-bold);
  }
  em {
    font-style: italic;
  }
`;

const Greeting = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const Hello = styled.p`
  color: var(--color-text);
  font-weight: var(--weight-bold);
`;

const Lead = styled.p`
  margin: 0;
  font-size: var(--text-md);
  color: var(--color-text-muted);
  max-width: 60ch;
`;

const Fields = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

/* One column, as in the letter design: each place or amount of time on its own line. */
const Choices = styled(RadioCardGroup)`
  grid-template-columns: 1fr;
  gap: var(--space-3);
`;

const CardText = styled.span`
  /* Leave room for the card's check in the corner. */
  padding-right: var(--space-6);
  font-size: var(--text-md);
  line-height: var(--leading-ui);
`;

const Alert = styled.p`
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  margin: 0;
  padding: var(--space-3);
  border: 1px solid var(--color-danger-border);
  border-radius: var(--radius-md);
  background: var(--color-danger-subtle);
  color: var(--color-danger);
  font-size: var(--text-sm);

  svg {
    flex-shrink: 0;
    margin-top: 2px;
  }
`;

/* Stays in view on a phone, so the next step is never below a long list. */
const Actions = styled.div`
  position: sticky;
  bottom: 0;
  display: flex;
  gap: var(--space-2);
  margin: 0 calc(var(--space-5) * -1);
  padding: var(--space-3) var(--space-5) var(--space-4);
  background: var(--intake-paper);

  > :last-child {
    flex: 1;
  }
  @media (max-width: 40rem) {
    margin: 0 calc(var(--space-4) * -1);
    padding: var(--space-3) var(--space-4) var(--space-4);
  }
`;

const Footer = styled.div`
  display: flex;
  justify-content: center;
  padding: var(--space-2) 0 var(--space-4);
  border-top: 1px solid var(--color-border);
`;

/* The confirmation stays on the sheet, under the logos, so the letter keeps its corners to the end. */
const Celebration = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding-bottom: var(--space-6);
  text-align: center;

  > p {
    margin: 0;
    max-width: 36rem;
    font-size: var(--text-md);
    color: var(--color-text-muted);
  }
  > :last-child {
    margin-top: var(--space-4);
  }
`;

/** Empty means "not answered yet"; the details step is the only one that must be filled in. */
function contactErrorsIn(
  a: IntakeAnswers,
  copy: (typeof intakeForms)[IntakeFormSource],
): Partial<Record<ContactField, string>> {
  const errors: Partial<Record<ContactField, string>> = {};
  if (!a.firstName.trim()) errors.firstName = copy.errors.firstName;
  if (!a.lastName.trim()) errors.lastName = copy.errors.lastName;
  const email = a.email.trim();
  if (!email) errors.email = copy.errors.emailMissing;
  else if (!EMAIL_PATTERN.test(email)) errors.email = copy.errors.emailInvalid;
  return errors;
}

export function IntakeForm({ source }: { source: IntakeFormSource }) {
  const copy = intakeForms[source];
  const [step, setStep] = useState<Step>("envelope");
  const [answers, setAnswers] = useState<IntakeAnswers>(emptyAnswers);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [contactErrors, setContactErrors] = useState<Partial<Record<ContactField, string>>>({});
  // One id per page load, sent again on every retry so a repeated save is the same submission.
  const [submissionId] = useState(() => crypto.randomUUID());
  const [personId] = useState(() => crypto.randomUUID());
  const answersRef = useRef(answers);
  const visitRef = useRef<VisitClock | null>(null);
  const firstRender = useRef(true);

  const sendPageVisit = useCallback((payload: IntakePageVisitPayload, useBeacon = false) => {
    const body = JSON.stringify(payload);
    if (useBeacon) {
      const queued = navigator.sendBeacon("/api/intake/page-visits", new Blob([body], { type: "application/json" }));
      if (!queued) console.error("Could not queue intake page visit");
      return;
    }

    void fetch("/api/intake/page-visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    })
      .then((response) => {
        if (!response.ok) console.error("Could not record intake page visit:", response.status);
      })
      .catch((error: unknown) => console.error("Could not record intake page visit:", error));
  }, []);

  const finishPageVisit = useCallback((pageKey: IntakePageKey, leftVia: IntakeVisitExit, useBeacon = false) => {
    const clock = visitRef.current;
    if (!clock || clock.pageKey !== pageKey) return;
    visitRef.current = null;

    const endedAt = performance.now();
    const totalMs = Math.max(0, Math.round(endedAt - clock.startedAt));
    const activeMs = Math.min(
      totalMs,
      Math.max(0, Math.round(clock.activeMs + (clock.activeSince === null ? 0 : endedAt - clock.activeSince))),
    );
    const email = answersRef.current.email.trim().toLowerCase();
    const payload: IntakePageVisitPayload = {
      person_id: personId,
      from: source,
      key_id: EMAIL_PATTERN.test(email) ? email : null,
      page_key: pageKey,
      total_ms: totalMs,
      active_ms: activeMs,
      first_answer_ms: clock.firstAnswerMs,
      last_answer_ms: clock.lastAnswerMs,
      left_via: leftVia,
      answers: answersForPage(pageKey, answersRef.current, submissionId, source),
    };
    sendPageVisit(payload, useBeacon);
  }, [personId, sendPageVisit, source, submissionId]);

  function moveTo(nextStep: Step, leftVia: IntakeVisitExit = "next") {
    if (isTrackedPage(step)) finishPageVisit(step, leftVia);
    setStep(nextStep);
  }

  const set = <K extends keyof IntakeAnswers>(key: K, value: IntakeAnswers[K]) => {
    const nextAnswers = { ...answersRef.current, [key]: value };
    answersRef.current = nextAnswers;
    setAnswers(nextAnswers);

    const clock = visitRef.current;
    if (clock) {
      const answerMs = Math.round(performance.now() - clock.startedAt);
      clock.firstAnswerMs ??= answerMs;
      clock.lastAnswerMs = answerMs;
    }
  };

  // Move focus to each step's heading so screen readers start there.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    document.getElementById(HEADING_ID)?.focus();
    if (step === "done") celebrate();
  }, [step]);

  useEffect(() => {
    const currentStep = step;
    if (!isTrackedPage(currentStep)) return;
    const pageKey: IntakePageKey = currentStep;

    function startClock() {
      const startedAt = performance.now();
      visitRef.current = {
        pageKey,
        startedAt,
        activeMs: 0,
        activeSince: document.visibilityState === "visible" ? startedAt : null,
        firstAnswerMs: null,
        lastAnswerMs: null,
      };
    }
    startClock();

    function onVisibilityChange() {
      const clock = visitRef.current;
      if (!clock || clock.pageKey !== pageKey) return;
      const changedAt = performance.now();
      if (document.visibilityState === "hidden" && clock.activeSince !== null) {
        clock.activeMs += changedAt - clock.activeSince;
        clock.activeSince = null;
      } else if (document.visibilityState === "visible" && clock.activeSince === null) {
        clock.activeSince = changedAt;
      }
    }

    function onPageHide() {
      finishPageVisit(pageKey, "exit", true);
    }

    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted && visitRef.current === null) startClock();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [finishPageVisit, step]);

  const index = FLOW.indexOf(step);
  const inFlow = index >= 0;
  const questionNumber = index; // contact is 0, topics is 1 … hopes is 5

  function previous() {
    setSaveError(null);
    moveTo(index > 0 ? FLOW[index - 1] : "welcome", "back");
  }

  // The form's action: Next on every step but the last, which saves. A client action keeps `pending` for the SubmitButton.
  async function advance() {
    if (step === "welcome") return moveTo("contact");
    if (step === "contact") {
      // The only required step: without these three there is nobody to attach the answers to.
      const errors = contactErrorsIn(answers, copy);
      setContactErrors(errors);
      if (Object.keys(errors).length > 0) return;
      return moveTo("topics");
    }
    if (step === "topics") return moveTo(FLOW[index + 1], isSkippedQuestion(step, answers) ? "skip" : "next");
    if (isTrackedPage(step) && step !== "hopes") return moveTo(FLOW[index + 1], isSkippedQuestion(step, answers) ? "skip" : "next");
    if (step !== "hopes") return;

    setSaveError(null);
    let result: { status: string; message?: string };
    try {
      result = await submitIntake(toSubmission(submissionId, source, answers));
    } catch {
      result = { status: "error" };
    }
    if (result.status !== "success") return setSaveError(result.message ?? copy.submitFailed);
    moveTo("done", "submit");
  }

  function leave() {
    moveTo("left", "not_interested");
  }

  const empty =
    (step === "topics" && Object.values(answers.topicRanks).every((rank) => rank === null)) ||
    (step === "ways" && answers.ways.length === 0) ||
    (step === "location" && answers.location === "") ||
    (step === "time" && answers.time === "");

  const nextLabel = step === "welcome" ? copy.welcome.start : step === "hopes" ? copy.submit : empty ? copy.skip : copy.next;

  /*
   * React resets a form once it has run the form's `action`, and that reset reaches the selection
   * controls: they report it back through onCheckedChange/onValueChange, which clears answers the
   * person already gave (text inputs are unaffected, because React re-renders them from state).
   * So only the last step uses a form action — it saves, which is what SubmitButton needs to show
   * its spinner, it holds no selection controls, and the flow leaves for "done" straight after.
   * Every other step just navigates, so it submits without an action and nothing is reset.
   */
  const formAction =
    step === "hopes"
      ? { action: advance }
      : {
          onSubmit: (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            void advance();
          },
        };

  if (step === "envelope") {
    return (
      <Page>
        <Envelope copy={{ ...copy.envelope, letterTitle: copy.welcome.heading }} onOpened={() => moveTo("welcome")} />
      </Page>
    );
  }

  return (
    <Page>
      <Sheet>
        <Logos>
          <Image src="/brand/sdc-logo-transparent.png" alt={copy.logos.sdc} width={800} height={628} loading="eager" />
          {copy.showRideForRefugeLogo && (
            <Image src="/brand/ride-for-refuge-logo.png" alt={copy.logos.rideForRefuge} width={568} height={456} loading="eager" />
          )}
        </Logos>

        {inFlow && (
          <ProgressBlock>
            <Progress value={questionNumber} max={QUESTION_COUNT} aria-label={copy.progressLabel} />
            <ProgressText>{step === "contact" ? copy.progressContact : copy.progressQuestion(questionNumber, QUESTION_COUNT)}</ProgressText>
          </ProgressBlock>
        )}

        {step === "done" && (
          <Celebration>
            <Goose label={copy.done.goose} />
            <Heading id={HEADING_ID} tabIndex={-1}>
              {copy.done.heading}
            </Heading>
            <p>{copy.done.body}</p>
          </Celebration>
        )}

        {step === "left" && (
          <StepBody>
            <Heading id={HEADING_ID} tabIndex={-1}>
              {copy.left.heading}
            </Heading>
            <Lead>{copy.left.body}</Lead>
            {/* Nothing was saved and the page is open to anyone, so the way back in is this button. */}
            <Actions>
              <Button type="button" $size="lg" $variant="outline" onClick={() => moveTo("contact")}>
                {copy.left.restart}
              </Button>
            </Actions>
          </StepBody>
        )}

        {step !== "done" && step !== "left" && (
          <Body {...formAction} noValidate autoComplete="on">
            <StepBody key={step}>
              {step === "welcome" && (
                <>
                  <Heading id={HEADING_ID} tabIndex={-1}>
                    {copy.welcome.heading}
                  </Heading>
                  <Letter>
                    <Greeting>
                      <Hello>{copy.welcome.greeting}</Hello>
                      <p>{copy.welcome.invitation}</p>
                      <p>{copy.welcome.benefits}</p>
                    </Greeting>
                    <p>
                      {copy.welcome.askBefore}
                      <b>{copy.welcome.askBold}</b>
                      {copy.welcome.askAfter}
                    </p>
                    <p>
                      <em>{copy.welcome.privacy}</em>
                    </p>
                    <p>
                      <em>
                        {copy.welcome.signOff}
                        <br />
                        {copy.welcome.signature}
                      </em>
                    </p>
                  </Letter>
                </>
              )}

              {step === "contact" && (
                <>
                  <Heading id={HEADING_ID} tabIndex={-1}>
                    {copy.contact.heading}
                  </Heading>
                  <Lead>{copy.contact.body}</Lead>
                  <Fields>
                    <Field label={copy.contact.firstNameLabel} required error={contactErrors.firstName}>
                      {(props) => (
                        <Input
                          {...props}
                          name="firstName"
                          value={answers.firstName}
                          maxLength={60}
                          autoComplete="given-name"
                          onChange={(e) => set("firstName", e.target.value)}
                        />
                      )}
                    </Field>
                    <Field label={copy.contact.lastNameLabel} required error={contactErrors.lastName}>
                      {(props) => (
                        <Input
                          {...props}
                          name="lastName"
                          value={answers.lastName}
                          maxLength={60}
                          autoComplete="family-name"
                          onChange={(e) => set("lastName", e.target.value)}
                        />
                      )}
                    </Field>
                    <Field label={copy.contact.emailLabel} required error={contactErrors.email}>
                      {(props) => (
                        <Input
                          {...props}
                          type="email"
                          name="email"
                          value={answers.email}
                          maxLength={254}
                          inputMode="email"
                          autoComplete="email"
                          onChange={(e) => set("email", e.target.value)}
                        />
                      )}
                    </Field>
                  </Fields>
                </>
              )}

              {step === "topics" && (
                <>
                  <Heading id={HEADING_ID} tabIndex={-1}>
                    {copy.topics.heading}
                  </Heading>
                  <TopicRanking
                    choices={topicChoices}
                    answers={answers}
                    hint={copy.topics.rankingHint}
                    otherLabel={copy.topics.otherLabel}
                    onOrderChange={(orderedIds) => {
                      set("topicRanks", Object.fromEntries(orderedIds.map((id, index) => [id, index + 1])));
                    }}
                    onOtherChange={(v) => set("topicsOther", v)}
                  />
                </>
              )}

              {step === "ways" && (
                <>
                  <Heading id={HEADING_ID} tabIndex={-1}>
                    {copy.ways.heading}
                  </Heading>
                  <CheckCardGroup
                    name="ways"
                    labelledBy={HEADING_ID}
                    options={wayChoices}
                    value={answers.ways}
                    onChange={(v) => set("ways", v)}
                    otherValue={answers.waysOther}
                    onOtherChange={(v) => set("waysOther", v)}
                    otherLabel={copy.ways.otherLabel}
                  />
                </>
              )}

              {step === "location" && (
                <>
                  <Heading id={HEADING_ID} tabIndex={-1}>
                    {copy.location.heading}
                  </Heading>
                  <Field label={copy.location.heading}>
                    {(props) => (
                      <Select
                        {...props}
                        name="location"
                        options={locationChoices.map((choice) => ({ value: choice.id, label: choice.label }))}
                        value={answers.location}
                        placeholder="Select your location"
                        onValueChange={(value) => set("location", value)}
                      />
                    )}
                  </Field>
                </>
              )}

              {step === "time" && (
                <>
                  <Heading id={HEADING_ID} tabIndex={-1}>
                    {copy.time.heading}
                  </Heading>
                  <Choices
                    name="time"
                    aria-labelledby={HEADING_ID}
                    value={answers.time}
                    onValueChange={(v) => set("time", v)}
                  >
                    {timeChoices.map((c) => (
                      <RadioCard key={c.id} value={c.id}>
                        <CardText>{c.label}</CardText>
                      </RadioCard>
                    ))}
                  </Choices>
                </>
              )}

              {step === "hopes" && (
                <>
                  <Heading id={HEADING_ID} tabIndex={-1}>
                    {copy.hopes.heading}
                  </Heading>
                  <Field label={copy.hopes.label}>
                    {(props) => (
                      <Textarea
                        {...props}
                        name="hopes"
                        rows={5}
                        maxLength={600}
                        placeholder={copy.hopes.placeholder}
                        value={answers.hopes}
                        onChange={(e) => set("hopes", e.target.value)}
                      />
                    )}
                  </Field>
                  {saveError && (
                    <Alert role="alert">
                      <Icon icon={CircleAlert} size={16} />
                      <span>{saveError}</span>
                    </Alert>
                  )}
                </>
              )}
            </StepBody>

            <Actions>
              {step !== "welcome" && (
                <Button type="button" $variant="outline" $size="lg" onClick={previous}>
                  <Icon icon={ArrowLeft} size={16} />
                  {copy.back}
                </Button>
              )}
              <SubmitButton $size="lg" $variant={empty ? "secondary" : undefined}>
                {nextLabel}
              </SubmitButton>
            </Actions>
          </Body>
        )}

        {/* "Maybe later" is offered once, on the welcome letter. */}
        {step === "welcome" && (
          <Footer>
            <Button type="button" $variant="ghost" onClick={leave}>
              {copy.welcome.leave}
            </Button>
          </Footer>
        )}
      </Sheet>
    </Page>
  );
}
