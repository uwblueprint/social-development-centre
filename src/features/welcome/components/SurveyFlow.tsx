"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { signOut } from "@/features/auth/actions";
import { celebrate } from "@/lib/celebrate";
import { usePageVisitMetrics } from "@/lib/form-analytics";
import { trackSurveyEvent } from "../analytics";
import { OUTSIDE, locationChoices, surveyCopy as copy, timeChoices, topicChoices, wayChoices } from "../copy";
import { submitSurvey } from "../actions";
import { toSubmission } from "../submit";
import { QUESTION_COUNT, emptyAnswers, type Step, type SurveyAnswers } from "../types";
import { CheckCardGroup } from "./CheckCardGroup";

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

/* The signed-in email is identity, not an answer, so it reads as a label and a value rather than
   a disabled input: nothing here is editable, and no <label for> points at non-input text. */
const SignedIn = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const SignedInLabel = styled.span`
  font-size: var(--text-sm);
  color: var(--color-text-subtle);
`;

const SignedInEmail = styled.p`
  margin: 0;
  font-size: var(--text-md);
  color: var(--color-text);
  overflow-wrap: anywhere;
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

export function SurveyFlow({ email, initialName }: { email: string; initialName: string }) {
  const [step, setStep] = useState<Step>("welcome");
  const [answers, setAnswers] = useState<SurveyAnswers>({ ...emptyAnswers, name: initialName });
  const [saveError, setSaveError] = useState(false);
  // One id per page load, sent again on every retry so a repeated save is the same submission.
  const [submissionId] = useState(() => crypto.randomUUID());
  const router = useRouter();
  const firstRender = useRef(true);
  const pageMetrics = usePageVisitMetrics({ linkToken: submissionId, pageKey: step });

  const set = <K extends keyof SurveyAnswers>(key: K, value: SurveyAnswers[K]) => {
    if (key === "topics" || key === "ways" || key === "location" || key === "time") {
      pageMetrics.recordAnswer(key, value);
    }
    setAnswers((a) => ({ ...a, [key]: value }));
  };

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

  function previous() {
    setSaveError(false);
    void pageMetrics.finish("back");
    setStep(index > 0 ? FLOW[index - 1] : "welcome");
  }

  // The form's action: Next on every step but the last, which saves. A client action keeps `pending` for the SubmitButton.
  async function advance() {
    if (step === "welcome") {
      void pageMetrics.finish("next");
      return setStep("contact");
    }
    if (step === "contact") {
      void pageMetrics.finish("next");
      return setStep("topics");
    }
    if (inFlow && step !== "hopes") {
      void pageMetrics.finish("next");
      return setStep(FLOW[index + 1]);
    }
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
    void pageMetrics.finish("submit");
    setStep("done");
  }

  function leave() {
    trackSurveyEvent({ name: "survey_left" });
    void pageMetrics.finish("close");
    setStep("left");
  }

  const empty =
    (step === "topics" && answers.topics.length === 0) ||
    (step === "ways" && answers.ways.length === 0) ||
    (step === "location" && answers.location === "") ||
    (step === "time" && answers.time === "");

  const nextLabel = step === "welcome" ? copy.welcome.start : step === "hopes" ? copy.submit : empty ? copy.skip : copy.next;

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
            {step === "done" ? (
              <Button type="button" $size="lg" onClick={() => router.push("/")}>
                {copy.done.next}
              </Button>
            ) : (
              /* "Come back any time" is only true if they leave: the gate would otherwise send
                 them straight back here, so this screen's way out is signing out. */
              <form action={signOut.bind(null, "member")}>
                <SubmitButton $size="lg" $variant="outline">
                  {copy.left.signOut}
                </SubmitButton>
              </form>
            )}
          </Centered>
        )}

        {step !== "done" && step !== "left" && (
          <Body action={advance} noValidate autoComplete="on">
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
                    <Field label={copy.contact.nameLabel} hint={copy.contact.nameHint}>
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
                      <span>{copy.submitFailed}</span>
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
