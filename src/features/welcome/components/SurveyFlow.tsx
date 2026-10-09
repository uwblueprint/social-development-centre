"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
import { signOut } from "@/features/auth/actions";
import { celebrate } from "@/lib/celebrate";
import { trackSurveyEvent } from "../analytics";
import { OTHER, locationChoices, surveyCopy as copy, timeChoices, topicChoices, wayChoices } from "../copy";
import { submitSurvey } from "../actions";
import { toSubmission } from "../submit";
import { QUESTION_COUNT, emptyAnswers, type Step, type SurveyAnswers } from "../types";
import { CheckCardGroup } from "./CheckCardGroup";
import { Envelope } from "./Envelope";
import { Goose } from "./Goose";
import { OtherChoice } from "./OtherChoice";

/*
 * The survey as a doodled letter (prototype, 8 Oct 2026): a closed envelope opens into the welcome letter,
 * every step sits on a sheet of paper, and the confirmation is a celebrating goose. Kit components keep
 * their behaviour; this page only re-points --color-bg and --color-bg-hover at the paper so they sit on it.
 */

/** Steps that show the progress bar, in order. */
const FLOW: Step[] = ["contact", "topics", "ways", "location", "time", "hopes"];
const HEADING_ID = "survey-heading";
const HINT_ID = "survey-hint";

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
  --color-bg: var(--survey-paper);
  --color-bg-hover: var(--survey-paper-tint);
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background-color: var(--survey-desk);
  background-image: radial-gradient(var(--survey-desk-dot) 1px, transparent 1.2px);
  background-size: var(--space-5) var(--space-5);
  color: var(--color-text);
  font-family: var(--font-survey-body);
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
  border: 2px solid var(--survey-ink);
  border-radius: var(--radius-survey-sheet);
  background: var(--survey-paper);
  box-shadow: var(--shadow-survey-sheet);
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
  font-family: var(--font-survey-display);
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

const Fields = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

/* The signed-in email is identity, not an answer, so it reads as a label and a value rather than
   a disabled input: nothing here is editable, and no <label for> points at non-input text. */
const SignedIn = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const SignedInLabel = styled.span`
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const SignedInEmail = styled.p`
  margin: 0;
  font-size: var(--text-md);
  color: var(--color-text);
  overflow-wrap: anywhere;
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
  background: var(--survey-paper);

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

export function SurveyFlow({ email, initialName }: { email: string; initialName: string }) {
  const [step, setStep] = useState<Step>("envelope");
  const [answers, setAnswers] = useState<SurveyAnswers>({ ...emptyAnswers, name: initialName });
  const [saveError, setSaveError] = useState(false);
  // One id per page load, sent again on every retry so a repeated save is the same submission.
  const [submissionId] = useState(() => crypto.randomUUID());
  const router = useRouter();
  const firstRender = useRef(true);
  // Where "Keep me in" goes back to.
  const returnTo = useRef<Step>("welcome");

  const set = <K extends keyof SurveyAnswers>(key: K, value: SurveyAnswers[K]) => setAnswers((a) => ({ ...a, [key]: value }));

  // Each step: tell analytics (drop-off), then move focus to its heading so screen readers start there.
  useEffect(() => {
    trackSurveyEvent({ name: "survey_step_viewed", step });
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
  const firstName = answers.name.trim().split(/\s+/)[0] ?? "";

  function previous() {
    setSaveError(false);
    setStep(index > 0 ? FLOW[index - 1] : "welcome");
  }

  function opened() {
    trackSurveyEvent({ name: "survey_envelope_opened" });
    setStep("welcome");
  }

  // The form's action: Next on every step but the last, which saves. A client action keeps `pending` for the SubmitButton.
  async function advance() {
    if (step === "welcome") return setStep("contact");
    if (inFlow && step !== "hopes") return setStep(FLOW[index + 1]);
    if (step !== "hopes") return;

    setSaveError(false);
    let saved = false;
    try {
      saved = (await submitSurvey(toSubmission(submissionId, answers))).status === "success";
    } catch {
      saved = false;
    }
    if (!saved) return setSaveError(true);
    trackSurveyEvent({ name: "survey_submitted" });
    setStep("done");
  }

  function startUnsubscribe() {
    trackSurveyEvent({ name: "survey_unsubscribe_clicked" });
    returnTo.current = step;
    setStep("unsubscribe");
  }

  function confirmUnsubscribe() {
    trackSurveyEvent({ name: "survey_unsubscribed" });
    setStep("unsubscribed");
  }

  const nextLabel = step === "welcome" ? copy.welcome.start : step === "hopes" ? copy.submit : copy.next;

  if (step === "envelope") {
    return (
      <Page>
        <Envelope
          name={answers.name.trim() || copy.envelope.fallbackName}
          copy={{ ...copy.envelope, letterTitle: copy.welcome.heading }}
          onOpened={opened}
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
            <Button type="button" $size="lg" onClick={() => router.push("/")}>
              {copy.done.next}
            </Button>
          </Celebration>
        )}

        {step === "unsubscribe" && (
          <StepBody>
            <Heading id={HEADING_ID} tabIndex={-1}>
              {copy.unsubscribe.heading}
            </Heading>
            <Lead>{copy.unsubscribe.body}</Lead>
            <Actions>
              <Button type="button" $variant="outline" $size="lg" onClick={() => setStep(returnTo.current)}>
                {copy.unsubscribe.keep}
              </Button>
              <Button type="button" $size="lg" onClick={confirmUnsubscribe}>
                {copy.unsubscribe.confirm}
              </Button>
            </Actions>
          </StepBody>
        )}

        {step === "unsubscribed" && (
          <StepBody>
            <Heading id={HEADING_ID} tabIndex={-1}>
              {copy.unsubscribed.heading}
            </Heading>
            <Lead>{copy.unsubscribed.body}</Lead>
            {/* Signing out is the way off this page: the gate at / would otherwise send them straight back. */}
            <Actions>
              <form action={signOut.bind(null, "member")}>
                <SubmitButton $size="lg" $variant="outline">
                  {copy.unsubscribed.signOut}
                </SubmitButton>
              </form>
            </Actions>
          </StepBody>
        )}

        {step !== "done" && step !== "unsubscribe" && step !== "unsubscribed" && (
          <Body action={advance} noValidate autoComplete="on">
            <StepBody key={step}>
              {step === "welcome" && (
                <>
                  <Heading id={HEADING_ID} tabIndex={-1}>
                    {copy.welcome.heading}
                  </Heading>
                  <Letter>
                    <Greeting>
                      <Hello>{firstName ? copy.welcome.greeting(firstName) : copy.welcome.greetingNoName}</Hello>
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
                    <Field label={copy.contact.nameLabel}>
                      {(props) => (
                        <Input
                          {...props}
                          name="name"
                          value={answers.name}
                          autoComplete="name"
                          onChange={(e) => set("name", e.target.value)}
                        />
                      )}
                    </Field>
                    <SignedIn>
                      <SignedInLabel>{copy.contact.emailLabel}</SignedInLabel>
                      <SignedInEmail>{email}</SignedInEmail>
                    </SignedIn>
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
                    <OtherChoice
                      kind="radio"
                      name="location"
                      checked={answers.location === OTHER}
                      text={answers.locationOther}
                      onTextChange={(v) => set("locationOther", v)}
                      textLabel={copy.location.otherLabel}
                    />
                  </Choices>
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
                    <OtherChoice
                      kind="radio"
                      name="time"
                      checked={answers.time === OTHER}
                      text={answers.timeOther}
                      onTextChange={(v) => set("timeOther", v)}
                      textLabel={copy.time.otherLabel}
                    />
                  </Choices>
                </>
              )}

              {step === "hopes" && (
                <>
                  <Heading id={HEADING_ID} tabIndex={-1}>
                    {copy.hopes.heading}
                  </Heading>
                  <Hint>{copy.hopes.hint}</Hint>
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
                      <span>{copy.submitFailed}</span>
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
              {/* Every question can be left blank (letter prototype, 8 Oct 2026). */}
              <SubmitButton $size="lg">{nextLabel}</SubmitButton>
            </Actions>
          </Body>
        )}

        {/* Unsubscribe is offered once, on the welcome letter (letter prototype, 8 Oct 2026). */}
        {step === "welcome" && (
          <Footer>
            <Button type="button" $variant="ghost" onClick={startUnsubscribe}>
              {copy.unsubscribe.link}
            </Button>
          </Footer>
        )}
      </Sheet>
    </Page>
  );
}
