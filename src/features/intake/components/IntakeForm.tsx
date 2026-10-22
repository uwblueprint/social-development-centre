"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { keyframes, styled } from "next-yak";
import { ArrowLeft, CircleAlert, CircleCheck, Clock } from "lucide-react";
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

const Page = styled.div<{ $tint?: boolean }>`
  min-height: 100dvh;
  background: ${({ $tint }) => ($tint ? "var(--color-success-subtle)" : "var(--color-bg)")};
  color: var(--color-text);
  line-height: var(--leading-body);
  transition: background-color var(--duration-slow) var(--ease);
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
  max-width: 40rem;
  min-height: 100dvh;
  margin: 0 auto;
  padding: var(--space-5) var(--space-4) 0;

  @media (min-width: 640px) {
    padding: var(--space-6) var(--space-5) 0;
  }
`;

const Brand = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text-muted);
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
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  letter-spacing: var(--tracking-tight);
  text-wrap: balance;
  overflow-wrap: anywhere;

  &:focus {
    outline: none;
  }
`;

const Eyebrow = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const Lead = styled.p`
  margin: 0;
  font-size: var(--text-md);
  color: var(--color-text-muted);
  max-width: 60ch;
`;

const Hint = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  max-width: 60ch;
`;

const Count = styled.p`
  margin: 0;
  min-height: 1.4em;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const Tile = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--space-7);
  height: var(--space-7);
  border-radius: var(--radius-lg);
  background: var(--color-bg-hover);
  color: var(--color-text);
`;

const Fields = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const CardText = styled.span`
  /* Leave room for the card's check in the corner. */
  padding-right: var(--space-5);
  font-size: var(--text-sm);
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
  flex-direction: column;
  gap: var(--space-3);
  margin: 0 calc(var(--space-4) * -1);
  padding: var(--space-3) var(--space-4) var(--space-4);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg);

  @media (min-width: 640px) {
    margin: 0 calc(var(--space-5) * -1);
    padding: var(--space-3) var(--space-5) var(--space-4);
  }
`;

const ActionRow = styled.div`
  display: flex;
  gap: var(--space-2);

  > :last-child {
    flex: 1;
  }
`;

const Footer = styled.div`
  display: flex;
  justify-content: center;
  padding: var(--space-3) 0 var(--space-5);
  border-top: 1px solid var(--color-border);
`;

const Centered = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  padding: var(--space-6) 0;
  text-align: center;
  animation: ${fadeUp} var(--duration-enter) var(--ease) both;
`;

const DoneIcon = styled.span`
  display: inline-flex;
  color: var(--color-success);
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
  const [step, setStep] = useState<Step>("welcome");
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

  return (
    <Page $tint={step === "done"}>
      <Column>
        <Brand>{copy.brand}</Brand>

        {inFlow && (
          <ProgressBlock>
            <Progress value={questionNumber} max={QUESTION_COUNT} aria-label={copy.progressLabel} />
            <ProgressText>{step === "contact" ? copy.progressContact : copy.progressQuestion(questionNumber, QUESTION_COUNT)}</ProgressText>
          </ProgressBlock>
        )}

        {(step === "done" || step === "left") && (
          <Centered>
            <DoneIcon>
              <Icon icon={step === "done" ? CircleCheck : Clock} size={64} />
            </DoneIcon>
            <Heading id={HEADING_ID} tabIndex={-1}>
              {step === "done" ? copy.done.heading : copy.left.heading}
            </Heading>
            <Lead>{step === "done" ? copy.done.body : copy.left.body}</Lead>
            {step === "left" && (
              /* Nothing was saved and the page is open to anyone, so the way back in is this button. */
              <Button type="button" $size="lg" $variant="outline" onClick={() => setStep("contact")}>
                {copy.left.restart}
              </Button>
            )}
          </Centered>
        )}

        {step !== "done" && step !== "left" && (
          <Body {...formAction} noValidate autoComplete="on">
            <StepBody key={step}>
              {step === "welcome" && (
                <>
                  <Tile>
                    <Icon icon={copy.welcomeIcon} size={24} />
                  </Tile>
                  <Eyebrow>{copy.title}</Eyebrow>
                  <Heading id={HEADING_ID} tabIndex={-1}>
                    {copy.welcome.heading}
                  </Heading>
                  {copy.welcome.body.map((p) => (
                    <Lead key={p}>{p}</Lead>
                  ))}
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
                    otherPlaceholder={copy.otherPlaceholder}
                  />
                  <Count aria-live="polite">
                    {answers.topics.includes("not-sure") ? copy.notSureNote : answers.topics.length > 0 ? copy.selected(answers.topics.length) : ""}
                  </Count>
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
                    otherPlaceholder={copy.otherPlaceholder}
                  />
                  <Count aria-live="polite">{answers.ways.length > 0 ? copy.selected(answers.ways.length) : ""}</Count>
                </>
              )}

              {step === "location" && (
                <>
                  <Heading id={HEADING_ID} tabIndex={-1}>
                    {copy.location.heading}
                  </Heading>
                  <Hint id={HINT_ID}>{copy.location.hint}</Hint>
                  <RadioCardGroup
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
                  </RadioCardGroup>
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
                  <RadioCardGroup
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
                  </RadioCardGroup>
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
              <ActionRow>
                {step !== "welcome" && (
                  <Button type="button" $variant="outline" $size="lg" onClick={previous}>
                    <Icon icon={ArrowLeft} size={16} />
                    {copy.back}
                  </Button>
                )}
                <SubmitButton $size="lg" $variant={empty ? "secondary" : undefined}>
                  {nextLabel}
                </SubmitButton>
              </ActionRow>
            </Actions>

            {step === "welcome" && (
              <Footer>
                <Button type="button" $variant="ghost" onClick={leave}>
                  {copy.welcome.leave}
                </Button>
              </Footer>
            )}
          </Body>
        )}
      </Column>
    </Page>
  );
}
