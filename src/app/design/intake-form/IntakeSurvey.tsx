"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { keyframes, styled } from "next-yak";
import { CircleAlert, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Progress } from "@/components/ui/Progress";
import { RadioCard, RadioCardGroup } from "@/components/ui/RadioGroup";
import { Textarea } from "@/components/ui/Textarea";
import { CheckCardGroup } from "@/features/intake/components/CheckCardGroup";
import { OtherChoice } from "@/features/intake/components/OtherChoice";
import { celebrate } from "@/lib/celebrate";
import {
  OTHER,
  defaultWelcome,
  demoContact,
  emptyAnswers,
  fillWelcome,
  questions,
  textAnswerLabel,
  textAnswerPlaceholder,
  type IntakeAnswers,
  type Question,
} from "./survey";

/*
 * The intake form in the portal's own look (Switzer, SDC green, Taupe), one question per screen.
 * There is no contact step: the person comes from the invitation's contact record. Every question is
 * optional, so Next always works.
 */

type Step = "welcome" | Question["id"] | "done" | "unsubscribe" | "unsubscribed";

const HEADING_ID = "intake-heading";
const QUESTION_COUNT = questions.length;

const fadeUp = keyframes`
  from {
    opacity: 0;
    translate: 0 var(--enter-offset);
  }
`;

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
  max-width: 37rem;
  min-height: 100dvh;
  margin: 0 auto;
  padding: var(--space-5) var(--space-4) 0;
`;

const Logo = styled.div`
  img {
    display: block;
    width: auto;
    height: var(--space-8);
  }
  @media (max-height: 45rem) {
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
  font-variant-numeric: tabular-nums;
`;

const StepBody = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-5);
  animation: ${fadeUp} var(--duration-enter) var(--ease-out) both;
`;

const Head = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const Heading = styled.h1`
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  letter-spacing: var(--tracking-tight);
  color: var(--color-brand-heading);
  text-wrap: balance;

  &:focus {
    outline: none;
  }
`;

const Hint = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const Letter = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  color: var(--color-text-muted);

  p {
    margin: 0;
    max-width: 60ch;
  }
  b {
    color: var(--color-text);
    font-weight: var(--weight-medium);
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
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  color: var(--color-text);
`;

/* Single-choice questions: one option per line, as in the multi-choice cards' "Other". */
const Choices = styled(RadioCardGroup)`
  grid-template-columns: 1fr;
  gap: var(--space-3);
`;

const CardText = styled.span`
  /* Leave room for the card's check at the end. */
  padding-right: var(--space-6);
  font-size: var(--text-md);
  line-height: var(--leading-ui);
`;

const Alert = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-danger-border);
  border-radius: var(--radius-md);
  background: var(--color-danger-subtle);
  font-size: var(--text-sm);

  > svg {
    flex-shrink: 0;
    margin-top: 2px;
    color: var(--color-danger);
  }
  p {
    flex: 1;
    margin: 0;
    color: var(--color-text-muted);
  }
  strong {
    display: block;
    color: var(--color-text);
    font-weight: var(--weight-medium);
  }
`;

/* Stays in view on a phone, so the next step is never below a long list. */
const Actions = styled.div`
  position: sticky;
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: auto;
  padding: var(--space-3) 0 var(--space-4);
  background: var(--color-bg);
`;

const ButtonRow = styled.div`
  display: flex;
  gap: var(--space-3);

  > :last-child {
    flex: 1;
  }
`;

const Prototype = styled.div`
  display: flex;
  justify-content: center;
`;

const Footer = styled.div`
  display: flex;
  justify-content: center;
  padding: var(--space-2) 0 var(--space-4);
  border-top: 1px solid var(--color-border);
`;

const Done = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding-bottom: var(--space-8);
  text-align: center;
  animation: ${fadeUp} var(--duration-enter) var(--ease-out) both;

  > svg {
    color: var(--color-success);
  }
  > p {
    margin: 0;
    max-width: 30rem;
    color: var(--color-text-muted);
  }
`;

const stepOrder: Step[] = ["welcome", ...questions.map((q) => q.id), "done"];

export function IntakeSurvey() {
  const [step, setStep] = useState<Step>("welcome");
  const [answers, setAnswers] = useState<IntakeAnswers>(emptyAnswers);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const lastStep = useRef<Step>("welcome");
  const firstRender = useRef(true);

  const question = questions.find((q) => q.id === step);
  const questionNumber = question ? questions.indexOf(question) + 1 : 0;
  const isLast = questionNumber === QUESTION_COUNT;

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    document.getElementById(HEADING_ID)?.focus({ preventScroll: true });
    if (step === "done") celebrate();
  }, [step]);

  function moveTo(next: Step) {
    if (next !== "unsubscribe" && next !== "unsubscribed") lastStep.current = next;
    setStep(next);
  }
  const go = (offset: number) => moveTo(stepOrder[stepOrder.indexOf(step) + offset]);

  function submit() {
    if (sending) return;
    setSending(true);
    setFailed(false);
    // Demo: stands in for saving the answers.
    window.setTimeout(() => {
      setSending(false);
      if (simulateFailure) setFailed(true);
      else moveTo("done");
    }, 900);
  }

  function restart() {
    setAnswers(emptyAnswers());
    setFailed(false);
    setSimulateFailure(false);
    moveTo("welcome");
  }

  const choices = (id: string) => answers.choices[id] ?? [];
  const setChoices = (id: string, next: string[]) => setAnswers((a) => ({ ...a, choices: { ...a.choices, [id]: next } }));
  const setOther = (id: string, text: string) => setAnswers((a) => ({ ...a, other: { ...a.other, [id]: text } }));
  const setText = (id: string, text: string) => setAnswers((a) => ({ ...a, text: { ...a.text, [id]: text } }));
  const welcome = (text: string) => fillWelcome(text, demoContact, QUESTION_COUNT);

  return (
    <Page data-design-public="">
      <Logo>
        <Image
          src="/brand/sdc-logo-transparent.png"
          alt="Social Development Centre Waterloo Region"
          width={800}
          height={628}
          loading="eager"
        />
      </Logo>

      {question && (
        <ProgressBlock>
          <Progress value={questionNumber} max={QUESTION_COUNT} aria-label="Survey progress" />
          <ProgressText>
            Question {questionNumber} of {QUESTION_COUNT}
          </ProgressText>
        </ProgressBlock>
      )}

      {step === "welcome" && (
        <StepBody key={step}>
          <Heading id={HEADING_ID} tabIndex={-1}>
            {welcome(defaultWelcome.heading)}
          </Heading>
          <Letter>
            <Greeting>
              <Hello>{welcome(defaultWelcome.greeting)}</Hello>
              <p>{welcome(defaultWelcome.intro)}</p>
            </Greeting>
            <p>
              {welcome(defaultWelcome.askBefore)}
              <b>{welcome(defaultWelcome.askBold)}</b>
              {welcome(defaultWelcome.askAfter)}
            </p>
            <p>
              <em>{welcome(defaultWelcome.privacy)}</em>
            </p>
            <p>
              <em>
                {defaultWelcome.signOff}
                <br />
                {defaultWelcome.signature}
              </em>
            </p>
          </Letter>
          <Actions>
            <Button type="button" $size="lg" onClick={() => go(1)}>
              Get started
            </Button>
          </Actions>
        </StepBody>
      )}

      {question && (
        <StepBody key={step}>
          <Head>
            <Heading id={HEADING_ID} tabIndex={-1}>
              {question.heading}
            </Heading>
            {question.hint && <Hint id={`${question.id}-hint`}>{question.hint}</Hint>}
          </Head>

          {question.kind === "many" && (
            <CheckCardGroup
              name={question.id}
              labelledBy={HEADING_ID}
              describedBy={question.hint ? `${question.id}-hint` : undefined}
              options={question.options ?? []}
              value={choices(question.id)}
              onChange={(next) => setChoices(question.id, next)}
              otherValue={answers.other[question.id] ?? ""}
              onOtherChange={(text) => setOther(question.id, text)}
              otherLabel={question.otherLabel ?? ""}
            />
          )}

          {question.kind === "one" && (
            <Choices
              name={question.id}
              aria-labelledby={HEADING_ID}
              aria-describedby={question.hint ? `${question.id}-hint` : undefined}
              value={choices(question.id)[0] ?? ""}
              onValueChange={(value) => setChoices(question.id, [value])}
            >
              {(question.options ?? []).map((option) => (
                <RadioCard key={option.id} value={option.id}>
                  <CardText>{option.label}</CardText>
                </RadioCard>
              ))}
              <OtherChoice
                kind="radio"
                name={question.id}
                checked={choices(question.id)[0] === OTHER}
                text={answers.other[question.id] ?? ""}
                onTextChange={(text) => setOther(question.id, text)}
                textLabel={question.otherLabel ?? ""}
              />
            </Choices>
          )}

          {question.kind === "text" && (
            <Field label={textAnswerLabel}>
              {(props) => (
                <Textarea
                  {...props}
                  name={question.id}
                  rows={5}
                  maxLength={1000}
                  placeholder={textAnswerPlaceholder}
                  value={answers.text[question.id] ?? ""}
                  onChange={(e) => setText(question.id, e.target.value)}
                />
              )}
            </Field>
          )}

          <Actions>
            <ButtonRow>
              <Button type="button" $size="lg" $variant="secondary" onClick={() => go(-1)}>
                Back
              </Button>
              <Button type="button" $size="lg" aria-busy={sending || undefined} onClick={() => (isLast ? submit() : go(1))}>
                {isLast ? (sending ? "Submitting…" : "Submit answers") : "Next"}
              </Button>
            </ButtonRow>
            {isLast && failed && (
              <Alert role="alert">
                <Icon icon={CircleAlert} />
                <p>
                  <strong>We couldn’t send your answers.</strong>
                  Check your connection and try again. Your answers are still here.
                </p>
                <Button type="button" $size="sm" $variant="outline" onClick={submit}>
                  Try again
                </Button>
              </Alert>
            )}
            {isLast && (
              <Prototype>
                <Checkbox
                  label="Prototype: simulate a failed submission"
                  checked={simulateFailure}
                  onCheckedChange={(next) => setSimulateFailure(next === true)}
                />
              </Prototype>
            )}
          </Actions>
        </StepBody>
      )}

      {step === "done" && (
        <Done>
          <Icon icon={CircleCheck} size={64} />
          <Heading id={HEADING_ID} tabIndex={-1}>
            Thanks for sharing!
          </Heading>
          <p>Your answers will help us improve what we share with you as a member.</p>
          <Button type="button" $variant="ghost" onClick={restart}>
            Start over (prototype)
          </Button>
        </Done>
      )}

      {step === "unsubscribe" && (
        <StepBody key={step}>
          <Head>
            <Heading id={HEADING_ID} tabIndex={-1}>
              Stop SDC invitations?
            </Heading>
            <Hint>We won’t email you about SDC membership again.</Hint>
          </Head>
          <Actions>
            <ButtonRow>
              <Button type="button" $size="lg" $variant="secondary" onClick={() => moveTo(lastStep.current)}>
                Keep me in
              </Button>
              <Button type="button" $size="lg" onClick={() => moveTo("unsubscribed")}>
                Unsubscribe
              </Button>
            </ButtonRow>
          </Actions>
        </StepBody>
      )}

      {step === "unsubscribed" && (
        <StepBody key={step}>
          <Head>
            <Heading id={HEADING_ID} tabIndex={-1}>
              You’re unsubscribed
            </Heading>
            <Hint>You won’t receive any more SDC membership invitations. If you change your mind, contact the SDC team.</Hint>
          </Head>
          <Actions>
            <Button type="button" $size="lg" $variant="secondary" onClick={restart}>
              Start over (prototype)
            </Button>
          </Actions>
        </StepBody>
      )}

      {step !== "done" && step !== "unsubscribe" && step !== "unsubscribed" && (
        <Footer>
          <Button type="button" $size="sm" $variant="ghost" onClick={() => moveTo("unsubscribe")}>
            Unsubscribe
          </Button>
        </Footer>
      )}
    </Page>
  );
}
