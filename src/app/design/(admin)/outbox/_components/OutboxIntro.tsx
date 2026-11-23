"use client";

import type * as React from "react";
import { keyframes, styled } from "next-yak";
import { ArrowUpRight, CalendarDays, Send, UserCheck, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SEND_TIME } from "../_data";

/*
 * The empty Outbox's teaching moment. With nothing scheduled, the calendar is a blank grid, which says
 * nothing about what the page is for. This card sits over the grid and explains, in the order it happens,
 * how an email gets here and what you can do before it goes out, then points to where emails are set up.
 *
 * Motion plays once, when the card first appears: the card rises in, then the three steps follow one by
 * one, so the eye reads them as a sequence. Nothing loops. Reduced motion is handled globally.
 */

const AUTOMATIC_EMAILS_HREF = "/design/automatic-emails";

const STEPS: { icon: LucideIcon; title: string; detail: string }[] = [
  {
    icon: UserCheck,
    title: "A member matches an automatic email",
    detail: "Say someone joins, or their membership is up for renewal.",
  },
  {
    icon: CalendarDays,
    title: "Their email shows up here on its day",
    detail: "Up to 30 days ahead, so you can read it, change it, or stop it.",
  },
  {
    icon: Send,
    title: `It goes out at ${SEND_TIME} that morning`,
    detail: "Unless it needs your OK first. Those wait in For review.",
  },
];

const riseIn = keyframes`
  from {
    opacity: 0;
    translate: 0 var(--enter-offset);
  }
`;

/* Covers the grid and centres the card on it. The grid stays visible behind, faded: it's what the steps describe. */
const Overlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: var(--z-raised);
  display: grid;
  place-items: center;
  padding: var(--space-5);
  background: color-mix(in srgb, var(--color-bg) 60%, transparent);
`;

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
  max-width: calc(var(--list-pane-width) + var(--space-8));
  padding: var(--space-5);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  animation: ${riseIn} var(--duration-enter) var(--ease-out) both;
`;

const Heading = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const Title = styled.h3`
  margin: 0;
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
`;

const Lead = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
`;

const Steps = styled.ol`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin: 0;
  padding: 0;
  list-style: none;
`;

/* Each step follows the one before it; --i is its place in the sequence. */
const Step = styled.li`
  display: grid;
  grid-template-columns: var(--space-6) minmax(0, 1fr);
  gap: var(--space-3);
  align-items: start;
  animation: ${riseIn} var(--duration-enter) var(--ease-out) both;
  animation-delay: calc(var(--duration-slow) * (var(--i) + 1));
`;

/* The step's icon in a soft circle. The order comes from the list (an <ol>), not from numbers. */
const StepIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--space-6);
  height: var(--space-6);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text-muted);
`;

const StepText = styled.span`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  /* Centres the first line on the 32px icon. */
  padding-top: calc((var(--space-6) - 1lh) / 2);
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
`;

const StepDetail = styled.span`
  color: var(--color-text-muted);
`;

const Action = styled.div`
  animation: ${riseIn} var(--duration-enter) var(--ease-out) both;
  animation-delay: calc(var(--duration-slow) * 4);
`;

export function OutboxIntro() {
  return (
    <Overlay>
      <Panel aria-labelledby="outbox-intro-title">
        <Heading>
          <Title id="outbox-intro-title">Nothing&apos;s going out yet</Title>
          <Lead>Automatic emails wait here until they send, so you can check them first. Here&apos;s how it works.</Lead>
        </Heading>
        <Steps>
          {STEPS.map((step, i) => (
            <Step key={step.title} style={{ "--i": i } as React.CSSProperties}>
              <StepIcon aria-hidden="true">
                <Icon icon={step.icon} size={16} />
              </StepIcon>
              <StepText>
                <span>{step.title}</span>
                <StepDetail>{step.detail}</StepDetail>
              </StepText>
            </Step>
          ))}
        </Steps>
        <Action>
          <Button
            $variant="primary"
            aria-label="Set up automatic emails, opens in a new tab"
            onClick={() => window.open(AUTOMATIC_EMAILS_HREF, "_blank", "noopener,noreferrer")}
          >
            Set up automatic emails
            <Icon icon={ArrowUpRight} size={16} />
          </Button>
        </Action>
      </Panel>
    </Overlay>
  );
}
