"use client";

import * as React from "react";
import Image from "next/image";
import { styled } from "next-yak";
import paypalMark from "./paypal-mark.svg";
import { PhotoPanel, Split } from "./PhotoPanel";
import { Clouds } from "./Clouds";
import skyline from "./waterloo-skyline.png";
import { ArrowLeft, ArrowRight, Info, Lightbulb, Mail, Megaphone, UsersRound, Vote, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { saveDetails, useSavedDetails, withChannel, type JoinDetails } from "./checkout";
import { PLANS, WELCOME, type Channel, type PlanId } from "./plans";

/*
 * Join SDC: a "Why join" welcome, then one page for everything SDC needs: first name, last name, email
 * and the membership tier (a dropdown), then one button that hands over to PayPal to pay. PayPal sends
 * them back to the thank-you page (/design/membership/welcome), or back here with their details kept if
 * they cancel. Placeholder content.
 * It's a public, signed-out page, so `data-design-public` tells the design layout to drop the sidebar
 * block and give it the full width.
 */

type Screen = "why" | "details";

/* The form on the left, why join on the right, so the benefits stay in view while they fill it in.
   Stacked on phones, form first. */
const Page = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 440px) minmax(0, 360px);
  justify-content: center;
  align-items: start;
  /* Rows: Back, then the form and the benefits. Columns: form and benefits. */
  gap: var(--space-2) var(--space-8);
  align-content: start;
  flex: 1;
  padding: var(--space-8) var(--space-6);

  @media (max-width: 799px) {
    grid-template-columns: minmax(0, 440px);
  }
  @media (max-width: 599px) {
    padding: var(--space-6) var(--space-4) var(--space-7);
  }
`;

/* Back sits on its own row above both columns, so the benefits line up with the heading. */
const BackRow = styled.div`
  grid-column: 1 / -1;
`;

/* Top-aligned with the heading, and stays put while the form scrolls. */
const Aside = styled.aside`
  position: sticky;
  top: var(--space-8);

  @media (max-width: 799px) {
    position: static;
    margin-top: var(--space-5);
  }
`;

const DetailsForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
  max-width: 440px;
`;

/* Back sits just above the heading, top left. */
const StepHead = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
`;

const Title = styled.h1`
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  color: var(--color-text);

  &:focus {
    outline: none;
  }
`;

/*
 * Join page only: required fields get a red asterisk after the label instead of the kit's "(required)".
 * The asterisk is hidden from screen readers; the controls carry `required`, which they announce.
 * Not the kit's way (Field's `required` shows "(required)"): check with the design-system owner before
 * reusing it elsewhere.
 */
const Asterisk = styled.span`
  margin-left: var(--space-1);
  color: var(--color-danger);
`;

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Asterisk aria-hidden="true">*</Asterisk>
    </>
  );
}

/* First and last name side by side; stacked on phones. */
const NameRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);

  @media (max-width: 479px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

/* After cancelling on PayPal: says nothing was charged, and that their details are still here. */
const Notice = styled.p`
  display: flex;
  gap: var(--space-2);
  align-items: flex-start;
  margin: 0;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-secondary);
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text);

  & > svg {
    flex: none;
    margin-top: 2px;
    color: var(--color-text-muted);
  }
`;

const Pay = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-top: var(--space-2);
`;

/* PayPal's own mark (paypalobjects.com, unchanged), at icon size. Decorative: the label says PayPal. */
const PayPalMark = styled(Image)`
  flex: none;
`;

const TIER_OPTIONS = PLANS.map((p) => ({ value: p.id, label: `${p.name}: $${p.price} a year` }));

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Errors = Partial<Record<keyof JoinDetails, string>>;

function check(d: JoinDetails): Errors {
  const e: Errors = {};
  if (!d.firstName.trim()) e.firstName = "Enter your first name.";
  if (!d.lastName.trim()) e.lastName = "Enter your last name.";
  if (!d.email.trim()) e.email = "Enter your email address.";
  else if (!EMAIL.test(d.email.trim())) e.email = "Enter an email address like name@example.com.";
  if (!d.planId) e.planId = "Choose a membership tier.";
  return e;
}

/* ---------- Why join: split screen ---------- */

/* The photo panel (PhotoPanel.tsx) with the headline on the left, the benefits and the button on the right. */

const VisualTitle = styled.h1`
  margin: 0;
  max-width: 16ch;
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  color: var(--taupe-50);

  &:focus {
    outline: none;
  }
`;

const VisualLede = styled.p`
  margin: 0;
  max-width: 44ch;
  font-size: var(--text-md);
  line-height: var(--leading-body);
  color: var(--taupe-100);

  & strong {
    font-weight: var(--weight-medium);
    color: var(--taupe-50);
  }
`;

/* position: relative holds the clouds, which sit across its top behind the benefits. */
const Side = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-6);

  @media (max-width: 599px) {
    padding: var(--space-6) var(--space-4) var(--space-7);
  }
`;

/*
 * The line drawing of Waterloo Region's skyline from the referral page, along the bottom of the screen.
 * The PNG is a mask, so the lines take a token colour: quiet grey in light mode, white in dark mode.
 */
const SkylineLines = styled.div`
  width: calc(100% - 2 * var(--space-4));
  max-width: 1200px;
  margin: 0 auto;
  aspect-ratio: 1600 / 182;
  background-color: var(--color-border-strong);
  mask-position: center bottom;
  mask-size: contain;
  mask-repeat: no-repeat;
  pointer-events: none;

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) & {
      background-color: var(--taupe-50);
    }
  }
  :root[data-theme="dark"] & {
    background-color: var(--taupe-50);
  }

  /* On the welcome screen: pinned to the bottom of the right side, behind the content. */
  &[data-pinned] {
    position: absolute;
    left: var(--space-4);
    right: var(--space-4);
    bottom: 0;
    width: auto;
  }
`;

function Skyline({ pinned = false }: { pinned?: boolean }) {
  return (
    <SkylineLines
      aria-hidden="true"
      data-pinned={pinned ? "" : undefined}
      style={{ maskImage: `url(${skyline.src})`, WebkitMaskImage: `url(${skyline.src})` }}
    />
  );
}

/* The form screen: the form and benefits, then the skyline along the bottom of the window. */
const Screen = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const SideInner = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
  max-width: 440px;
`;

const Benefits = styled.ul`
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: var(--space-2) var(--space-5);
  list-style: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);

  & > li + li {
    border-top: 1px solid var(--color-border);
  }
`;

const Benefit = styled.li`
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  padding: var(--space-4) 0;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);

  & > svg {
    flex: none;
    margin-top: 1px;
    color: var(--color-primary);
  }
  & strong {
    display: block;
    margin-bottom: var(--space-1);
    font-weight: var(--weight-medium);
    color: var(--color-text);
  }
`;

const BENEFITS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Vote, title: "Vote for SDC's board", body: "Elect the board, or run for it yourself." },
  { icon: Megaphone, title: "Shape what SDC works on", body: "Help set SDC's direction on local issues." },
  { icon: UsersRound, title: "Meet people doing the work", body: "Connect with neighbours working for social justice." },
  { icon: Lightbulb, title: "Hear about it first", body: "Campaigns, workshops and community events." },
];

/* Beside the form: the heading inside the box, above the list. */
const BenefitsBox = styled.section`
  padding: var(--space-5) var(--space-5) var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);

  & > h2 {
    margin: 0;
    font-size: var(--text-md);
    font-weight: var(--weight-medium);
    line-height: var(--leading-heading);
    color: var(--color-text);
  }
`;

const BoxedList = styled(Benefits)`
  padding: 0;
  border: 0;
  border-radius: 0;
  background: none;
`;

/** The four benefits in one card, "Membership benefits" inside it: on the welcome screen and beside the form. */
function MembershipBenefits() {
  return (
    <BenefitsBox aria-labelledby="membership-benefits">
      <h2 id="membership-benefits">Membership benefits</h2>
      <BoxedList>
        {BENEFITS.map((b) => (
          <Benefit key={b.title}>
            <Icon icon={b.icon} size={20} />
            <span>
              <strong>{b.title}</strong>
              {b.body}
            </span>
          </Benefit>
        ))}
      </BoxedList>
    </BenefitsBox>
  );
}

export interface JoinPageProps {
  channel: Channel;
  /** The referral code from the link, carried through PayPal so the referrer is credited. */
  referralCode?: string;
  /** Back from PayPal without paying: open on the form, details kept, with a note. */
  cancelled?: boolean;
}

export function JoinPage({ channel, referralCode, cancelled = false }: JoinPageProps) {
  const welcome = WELCOME[channel];
  const saved = useSavedDetails();
  const [screen, setScreen] = React.useState<Screen>(cancelled ? "details" : "why");
  const [details, setDetails] = React.useState<JoinDetails | null>(null);
  const [errors, setErrors] = React.useState<Errors>({});
  const [leaving, setLeaving] = React.useState(false);
  // What's typed, or (before anything is typed) what was saved before going to PayPal. Otherwise the
  // form starts empty, even from a referral link: they type their own details.
  const start: JoinDetails = { firstName: "", lastName: "", email: "", planId: "" };
  const values = details ?? (cancelled ? saved : start);
  const plan = PLANS.find((p) => p.id === values.planId);
  const via = channel === "website" ? undefined : channel;

  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const firstRender = React.useRef(true);
  // After the first screen, each screen change moves focus to the new heading.
  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [screen]);

  function set<K extends keyof JoinDetails>(key: K, value: JoinDetails[K]) {
    setDetails({ ...values, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: undefined });
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const found = check(values);
    setErrors(found);
    const first = (Object.keys(found) as (keyof JoinDetails)[])[0];
    if (first) {
      document.getElementById(`join-${first}`)?.focus();
      return;
    }
    // Real flow: a server action creates the PayPal order for this tier and redirects to PayPal.
    saveDetails(values);
    setLeaving(true);
    window.location.assign(withChannel("/design/membership/paypal", { plan: values.planId, via, ref: referralCode }));
  }

  if (screen === "why") {
    return (
      <Split data-design-public="">
        <PhotoPanel>
          {/* An invitation: the envelope sits above the heading, white like the text on the photo. */}
          <Icon icon={Mail} size={32} />
          <VisualTitle ref={headingRef} tabIndex={-1}>
            {welcome.title}
          </VisualTitle>
          <VisualLede>
            {welcome.lede.split("{range}")[0]}
            <strong>
              ${PLANS[0].price} to ${PLANS[PLANS.length - 1].price} a year
            </strong>
            {welcome.lede.split("{range}")[1]}
          </VisualLede>
        </PhotoPanel>
        <Side>
          <Clouds />
          <Skyline pinned />
          <SideInner>
            <MembershipBenefits />
            <Button type="button" $size="lg" onClick={() => setScreen("details")}>
              Become a member
              <Icon icon={ArrowRight} />
            </Button>
          </SideInner>
        </Side>
      </Split>
    );
  }

  return (
    <Screen data-design-public="">
      <Clouds margins />
      <Page>
        <BackRow>
          <Button type="button" $variant="ghost" $size="sm" onClick={() => setScreen("why")}>
            <Icon icon={ArrowLeft} />
            Back
          </Button>
        </BackRow>
        <DetailsForm noValidate onSubmit={submit}>
          <StepHead>
            <Title ref={headingRef} tabIndex={-1}>
              Become an SDC member
            </Title>
          </StepHead>

          {cancelled && (
            <Notice role="status">
              <Icon icon={Info} />
              <span>Payment cancelled, so you haven&rsquo;t been charged. Your details are still here.</span>
            </Notice>
          )}

          <NameRow>
            <Field label={<RequiredLabel>First name</RequiredLabel>} error={errors.firstName}>
              {(p) => (
                <Input
                  {...p}
                  required
                  id="join-firstName"
                  name="firstName"
                  placeholder="e.g. Alex"
                  autoComplete="given-name"
                  value={values.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                />
              )}
            </Field>
            <Field label={<RequiredLabel>Last name</RequiredLabel>} error={errors.lastName}>
              {(p) => (
                <Input
                  {...p}
                  required
                  id="join-lastName"
                  name="lastName"
                  placeholder="e.g. Morgan"
                  autoComplete="family-name"
                  value={values.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                />
              )}
            </Field>
          </NameRow>
          <Field label={<RequiredLabel>Email address</RequiredLabel>} error={errors.email}>
            {(p) => (
              <Input
                {...p}
                required
                id="join-email"
                name="email"
                placeholder="e.g. alex@example.com"
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={(e) => set("email", e.target.value)}
              />
            )}
          </Field>
          <Field label={<RequiredLabel>Membership tier</RequiredLabel>} error={errors.planId}>
            {(p) => (
              <Select
                {...p}
                required
                id="join-planId"
                name="planId"
                options={TIER_OPTIONS}
                placeholder="Choose a tier"
                value={values.planId}
                onValueChange={(v) => {
                  // Radix reports "" when the value arrives after hydration; that isn't a choice.
                  if (v) set("planId", v as PlanId);
                }}
              />
            )}
          </Field>

          <Pay>
            <Button type="submit" $size="lg" disabled={leaving}>
              <PayPalMark src={paypalMark} alt="" width={20} height={20} />
              {plan ? `Pay $${plan.price} with PayPal` : "Pay with PayPal"}
            </Button>
          </Pay>
        </DetailsForm>
        <Aside>
          <MembershipBenefits />
        </Aside>
      </Page>
      <Skyline />
    </Screen>
  );
}
