"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { keyframes, styled } from "next-yak";
import { ArrowLeft, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";
import { RadioCard, RadioCardGroup } from "@/components/ui/RadioGroup";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Textarea } from "@/components/ui/Textarea";
import { celebrate } from "@/lib/celebrate";
import { OUTSIDE, intakeCopy as copy, locationChoices, timeChoices, topicChoices, wayChoices } from "../copy";
import { submitIntake } from "../actions";
import { EMAIL_PATTERN, toSubmission } from "../submit";
import { QUESTION_COUNT, emptyAnswers, type ContactField, type IntakeAnswers, type Step } from "../types";
import { CheckCardGroup } from "./CheckCardGroup";
import { Envelope } from "./Envelope";
import { Goose } from "./Goose";

/*
 * The intake form as a doodled letter (prototype, 8 Oct 2026): a closed envelope opens into the welcome
 * letter, every step sits on a sheet of paper, and the confirmation is a celebrating goose. Kit components
 * keep their behaviour; this page only re-points --color-bg and --color-bg-hover at the paper so they sit on it.
 */

/** Steps that show the progress bar, in order. */
const FLOW: Step[] = ["contact", "topics", "ways", "location", "time", "hopes"];
const HEADING_ID = "intake-heading";
const HINT_ID = "intake-hint";

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

const Hint = styled.p`
  margin: 0;
  font-size: var(--text-md);
  color: var(--color-text-muted);
  max-width: 60ch;
`;

const Count = styled.p`
  margin: 0;
  min-height: 1.4em;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
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
function contactErrorsIn(a: IntakeAnswers): Partial<Record<ContactField, string>> {
  const errors: Partial<Record<ContactField, string>> = {};
  if (!a.firstName.trim()) errors.firstName = copy.errors.firstName;
  if (!a.lastName.trim()) errors.lastName = copy.errors.lastName;
  const email = a.email.trim();
  if (!email) errors.email = copy.errors.emailMissing;
  else if (!EMAIL_PATTERN.test(email)) errors.email = copy.errors.emailInvalid;
  return errors;
}

export function IntakeForm() {
  const [step, setStep] = useState<Step>("envelope");
  const [answers, setAnswers] = useState<IntakeAnswers>(emptyAnswers);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [contactErrors, setContactErrors] = useState<Partial<Record<ContactField, string>>>({});
  // One id per page load, sent again on every retry so a repeated save is the same submission.
  const [submissionId] = useState(() => crypto.randomUUID());
  const firstRender = useRef(true);

  const set = <K extends keyof IntakeAnswers>(key: K, value: IntakeAnswers[K]) => setAnswers((a) => ({ ...a, [key]: value }));

  // Move focus to each step's heading so screen readers start there.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    document.getElementById(HEADING_ID)?.focus();
    if (step === "done") celebrate();
  }, [step]);

  const index = FLOW.indexOf(step);
  const inFlow = index >= 0;
  const questionNumber = index; // contact is 0, topics is 1 … hopes is 5

  function previous() {
    setSaveError(null);
    setStep(index > 0 ? FLOW[index - 1] : "welcome");
  }

  // The form's action: Next on every step but the last, which saves. A client action keeps `pending` for the SubmitButton.
  async function advance() {
    if (step === "welcome") return setStep("contact");
    if (step === "contact") {
      // The only required step: without these three there is nobody to attach the answers to.
      const errors = contactErrorsIn(answers);
      setContactErrors(errors);
      if (Object.keys(errors).length > 0) return;
      return setStep("topics");
    }
    if (inFlow && step !== "hopes") return setStep(FLOW[index + 1]);
    if (step !== "hopes") return;

    setSaveError(null);
    let result: { status: string; message?: string };
    try {
      result = await submitIntake(toSubmission(submissionId, answers));
    } catch {
      result = { status: "error" };
    }
    if (result.status !== "success") return setSaveError(result.message ?? copy.submitFailed);
    setStep("done");
  }

  function leave() {
    setStep("left");
  }

  const empty =
    (step === "topics" && answers.topics.length === 0) ||
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
        <Envelope
          name={copy.envelope.fallbackName}
          copy={{ ...copy.envelope, letterTitle: copy.welcome.heading }}
          onOpened={() => setStep("welcome")}
        />
      </Page>
    );
  }

  return (
    <Page>
      <Sheet>
        <Logos>
          <Image src="/brand/sdc-logo-transparent.png" alt={copy.logos.sdc} width={800} height={628} loading="eager" />
          <Image src="/brand/ride-for-refuge-logo.png" alt={copy.logos.rideForRefuge} width={568} height={456} loading="eager" />
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
              <Button type="button" $size="lg" $variant="outline" onClick={() => setStep("contact")}>
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
                    <Field
                      label={copy.contact.emailLabel}
                      hint={copy.contact.emailHint}
                      required
                      error={contactErrors.email}
                    >
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
                  <Hint id={HINT_ID}>{copy.topics.hint}</Hint>
                  <CheckCardGroup
                    name="topics"
                    labelledBy={HEADING_ID}
                    describedBy={HINT_ID}
                    options={topicChoices}
                    value={answers.topics}
                    onChange={(v) => set("topics", v)}
                    otherValue={answers.topicsOther}
                    onOtherChange={(v) => set("topicsOther", v)}
                    otherLabel={copy.topics.otherLabel}
                  />
                  <Count aria-live="polite">{answers.topics.includes("not-sure") ? copy.notSureNote : ""}</Count>
                </>
              )}

              {step === "ways" && (
                <>
                  <Heading id={HEADING_ID} tabIndex={-1}>
                    {copy.ways.heading}
                  </Heading>
                  <Hint id={HINT_ID}>{copy.ways.hint}</Hint>
                  <CheckCardGroup
                    name="ways"
                    labelledBy={HEADING_ID}
                    describedBy={HINT_ID}
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
                  <Hint id={HINT_ID}>{copy.location.hint}</Hint>
                  <Choices
                    name="location"
                    aria-labelledby={HEADING_ID}
                    aria-describedby={HINT_ID}
                    value={answers.location}
                    onValueChange={(v) => set("location", v)}
                  >
                    {locationChoices.map((c) => (
                      <RadioCard key={c.id} value={c.id}>
                        <CardText>{c.label}</CardText>
                      </RadioCard>
                    ))}
                  </Choices>
                  {answers.location === OUTSIDE && (
                    <Field label={copy.location.outsideLabel} hint={copy.location.outsideHint}>
                      {(props) => (
                        <Input
                          {...props}
                          name="locationOther"
                          value={answers.locationOther}
                          maxLength={60}
                          autoComplete="off"
                          autoFocus
                          onChange={(e) => set("locationOther", e.target.value)}
                        />
                      )}
                    </Field>
                  )}
                </>
              )}

              {step === "time" && (
                <>
                  <Heading id={HEADING_ID} tabIndex={-1}>
                    {copy.time.heading}
                  </Heading>
                  <Hint id={HINT_ID}>{copy.time.hint}</Hint>
                  <Choices
                    name="time"
                    aria-labelledby={HEADING_ID}
                    aria-describedby={HINT_ID}
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
                  <Field label={copy.hopes.label} hint={copy.hopes.hint}>
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
