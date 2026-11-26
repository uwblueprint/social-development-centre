"use client";

import * as React from "react";
import { styled } from "next-yak";
import { CalendarDays, CircleCheck, Copy, Mail, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Separator } from "@/components/ui/Separator";
import { AppToastProvider, useToast } from "@/components/ui/Toast";
import { celebrate } from "@/lib/celebrate";
import { Lanyard } from "./Lanyard";
import { MemberCard } from "./MemberCard";
import { useSavedDetails } from "../checkout";
import { PLANS } from "../plans";

/*
 * The thank-you page PayPal returns them to once they've paid: welcome, what they paid, what happens
 * next, and their own link to invite others. Placeholder content.
 */

/* The content, to the right of the photo panel: centred in its column, 560px at most. */
/* The content on the left, their membership card on its lanyard in a column on the right; stacked on smaller screens. */
const Page = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 560px) minmax(0, 320px);
  justify-content: center;
  align-items: start;
  gap: var(--space-8);
  min-height: 100vh;
  padding: var(--space-8) var(--space-6);

  @media (max-width: 959px) {
    grid-template-columns: minmax(0, 560px);
    gap: var(--space-7);
  }
  @media (max-width: 599px) {
    padding: var(--space-6) var(--space-4) var(--space-7);
  }
`;

const Wide = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  width: 100%;
`;

/*
 * The card's column. It reaches up past the page's top padding so the lanyard hangs from the top edge of
 * the window, and stays put while the content scrolls.
 */
const CardColumn = styled.aside`
  position: sticky;
  top: 0;
  margin-top: calc(var(--space-8) * -1);
  display: flex;
  justify-content: center;

  @media (max-width: 959px) {
    position: static;
    margin-top: 0;
  }
`;

/** The month they joined, e.g. "Nov 2026". */
const SINCE = new Intl.DateTimeFormat("en-CA", { month: "short", year: "numeric" });

const Head = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);

  & > svg {
    color: var(--color-success);
  }
`;

const Title = styled.h1`
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  color: var(--color-text);
`;

const Lede = styled.p`
  margin: 0;
  font-size: var(--text-md);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;

const Summary = styled.dl`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-2) var(--space-3);
  margin: 0;
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);

  & dt {
    color: var(--color-text-muted);
  }
  & dd {
    margin: 0;
    color: var(--color-text);
  }
`;

const SectionTitle = styled.h2`
  margin: 0 0 var(--space-3);
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  color: var(--color-text);
`;

/* A line under a section heading: pulled up close to it, with room before what follows. */
const SectionLede = styled.p`
  margin: calc(var(--space-2) * -1) 0 var(--space-4);
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
`;

const NextSteps = styled.ol`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin: 0;
  padding: 0;
  list-style: none;
`;

const NextStep = styled.li`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--space-3);
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);

  & > span:first-child {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-full);
    background: var(--color-mention-subtle);
    color: var(--color-mention);
  }
  & strong {
    display: block;
    font-weight: var(--weight-medium);
    color: var(--color-text);
  }
`;

const ShareRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-2);

  @media (max-width: 399px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const SHARE_LINK = "sdcwr.org/join?ref=placeholder";

export function Welcome({ planId }: { planId?: string }) {
  return (
    <AppToastProvider>
      <WelcomeBody planId={planId} />
    </AppToastProvider>
  );
}

function WelcomeBody({ planId }: { planId?: string }) {
  const { toast } = useToast();
  const person = useSavedDetails();
  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[0];

  // They've just paid and become a member: one burst of confetti as the page opens (the app's shared
  // celebration, in token colours; skipped for people who ask for reduced motion).
  React.useEffect(() => {
    celebrate();
  }, []);

  return (
    <Page data-design-public="">
      <Wide>
        <Head>
          <Icon icon={CircleCheck} size={32} />
          <Title>Welcome to SDC{person.firstName ? `, ${person.firstName}` : ""}!</Title>
          <Lede>Your payment has been processed, thank you for joining!</Lede>
        </Head>

        <Summary>
          <dt>Membership</dt>
          <dd>{plan.name}</dd>
          <dt>Paid with PayPal</dt>
          <dd>${plan.price}</dd>
          <dt>Renews</dt>
          <dd>Placeholder date</dd>
        </Summary>

        <section aria-labelledby="next-steps">
          <SectionTitle id="next-steps">What happens next</SectionTitle>
          <NextSteps>
            <NextStep>
              <span>
                <Icon icon={Mail} />
              </span>
              <span>
                <strong>Check your email</strong>
                We sent your receipt and a sign-in link to {person.email || "your email address"}.
              </span>
            </NextStep>
            <NextStep>
              <span>
                <Icon icon={UsersRound} />
              </span>
              <span>
                <strong>Sign in to your member area</strong>
                See what&rsquo;s happening and update your details.
              </span>
            </NextStep>
            <NextStep>
              <span>
                <Icon icon={CalendarDays} />
              </span>
              <span>
                <strong>Come to an event</strong>
                Meet other members at an upcoming workshop or community event.
              </span>
            </NextStep>
          </NextSteps>
        </section>

        <Separator />

        <section aria-labelledby="share">
          <SectionTitle id="share">Know someone who&rsquo;d join?</SectionTitle>
          <SectionLede>Share this invite link to them</SectionLede>
          <Field label="Referral link">
            {(p) => (
              <ShareRow>
                <Input {...p} readOnly value={SHARE_LINK} />
                <Button type="button" $variant="outline" onClick={() => toast({ title: "Link copied" })}>
                  <Icon icon={Copy} />
                  Copy link
                </Button>
              </ShareRow>
            )}
          </Field>
        </section>
      </Wide>
      <CardColumn aria-label="Your membership card">
        {/* Their membership card on a lanyard: grab it and pull, and it springs back. */}
        <Lanyard>
          <MemberCard
            name={[person.firstName, person.lastName].filter(Boolean).join(" ") || "New member"}
            tier={plan.name}
            since={SINCE.format(new Date())}
          />
        </Lanyard>
      </CardColumn>
    </Page>
  );
}
