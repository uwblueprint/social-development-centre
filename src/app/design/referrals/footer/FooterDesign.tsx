"use client";

import * as React from "react";
import { styled } from "next-yak";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup";

/*
 * The "Invite a friend" line in the footer of every SDC email (PM notes, Nov 2026; backend: PR #65,
 * "Footer: add Refer a friend → /refer/<token> next to Unsubscribe"). Shown inside a placeholder email
 * so the copy is judged where members will read it. The options are for the PM to pick from; the
 * design-review bar is not part of the email.
 */

interface FooterOption {
  id: string;
  label: string;
  lead: string;
  link: string;
  tail?: string;
}

/** Draft copy for the PM. "Invite a friend" matches the page title (../copy.ts). */
const OPTIONS: FooterOption[] = [
  { id: "care", label: "A · Know someone", lead: "Know someone who'd care about this?", link: "Invite a friend" },
  { id: "invite", label: "B · Invite", lead: "", link: "Invite a friend", tail: " to join SDC" },
  { id: "share", label: "C · Enjoying these", lead: "Enjoying these updates?", link: "Share SDC with a friend" },
];

const Page = styled.main`
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-7) var(--space-6) var(--space-8);

  @media (max-width: 599px) {
    padding: var(--space-6) var(--space-4) var(--space-7);
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
  margin: var(--space-2) 0 0;
  font-size: var(--text-md);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;

const Review = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-text-muted);

  & > div {
    max-width: 100%;
    overflow-x: auto;
  }
`;

/* A placeholder email, roughly the width of an email client's reading pane. */
const Email = styled.article`
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-raised);
  overflow: hidden;
`;

const EmailHead = styled.div`
  padding: var(--space-4) var(--space-6);
  background: var(--sdc-800);
  color: var(--taupe-50);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
`;

const EmailBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-6);
  font-size: var(--text-md);
  line-height: var(--leading-body);
  color: var(--color-text);

  & p {
    margin: 0;
  }
  & h2 {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: var(--weight-medium);
  }
`;

const Placeholder = styled.p`
  && {
    color: var(--color-text-muted);
  }
`;

/* The footer: refer line on top, then why they get this email, the sender's address and Unsubscribe. */
const EmailFooter = styled.footer`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-5) var(--space-6);
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
  text-align: center;

  & p {
    margin: 0;
  }
  & a {
    color: var(--color-mention);
    font-weight: var(--weight-medium);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
`;

const ReferLine = styled.p`
  && {
    font-size: var(--text-md);
    color: var(--color-text);
  }
`;

const Notes = styled.ul`
  margin: 0;
  padding-left: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;

export function FooterDesign() {
  const [optionId, setOptionId] = React.useState(OPTIONS[0].id);
  const option = OPTIONS.find((o) => o.id === optionId) ?? OPTIONS[0];

  return (
    <Page>
      <header>
        <Title>Email footer: Invite a friend</Title>
        <Lede>Every email SDC sends a member ends with a way to invite a friend, next to Unsubscribe.</Lede>
      </header>

      <Review>
        <span id="footer-option">Design review: copy option</span>
        <ToggleGroup
          type="single"
          value={optionId}
          onValueChange={(v) => v && setOptionId(v)}
          aria-labelledby="footer-option"
        >
          {OPTIONS.map((o) => (
            <ToggleGroupItem key={o.id} value={o.id}>
              {o.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Review>

      <Email aria-label="Example SDC email">
        <EmailHead>Social Development Centre Waterloo Region</EmailHead>
        <EmailBody>
          <h2>Thanks for joining, Maya</h2>
          <Placeholder>
            Placeholder email body. This is where an automatic email&rsquo;s message goes, for example a thank-you
            after joining or a check-in a month later.
          </Placeholder>
          <p>The team at SDC</p>
        </EmailBody>
        <EmailFooter>
          <ReferLine>
            {option.lead && `${option.lead} `}
            <a href="/design/referrals">{option.link}</a>
            {option.tail}
          </ReferLine>
          <p>
            You&rsquo;re getting this email because you&rsquo;re a member of the Social Development Centre Waterloo
            Region, 23 Water St N, Kitchener ON.
          </p>
          <p>
            <a href="/design/referrals">Unsubscribe</a>
          </p>
        </EmailFooter>
      </Email>

      <Notes>
        <li>The invite line sits above the legal footer so it reads as an invitation, not small print.</li>
        <li>
          The link opens the member&rsquo;s own Invite a friend page (<code>/refer/&lt;token&gt;</code>). A forwarded
          email&rsquo;s link still belongs to the original member.
        </li>
        <li>Option A is the recommendation: it explains why to invite someone, and its link matches the page title.</li>
      </Notes>
    </Page>
  );
}
