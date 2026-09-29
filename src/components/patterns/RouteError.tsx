"use client";

import { styled } from "next-yak";
import { CircleAlert, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

const Page = styled.div`
  display: grid;
  place-items: center;
  min-height: 100dvh;
  padding: var(--space-7) var(--space-5);
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  max-width: 32rem;
  text-align: center;
`;

/* Stands where the 404's illustration does; swap for an illustration when one is supplied. */
const IconWrap = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin-bottom: var(--space-2);
  border-radius: var(--radius-full);
  background: var(--color-danger-subtle);
  color: var(--color-danger);
`;

const Text = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
`;

const Title = styled.h1`
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  letter-spacing: var(--tracking-tight);
  color: var(--color-text);
`;

const Body = styled.p`
  margin: 0;
  font-size: var(--text-md);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
`;

const MailLink = styled.a`
  color: var(--color-text);
  text-decoration: underline;
  text-underline-offset: 2px;
  border-radius: var(--radius-sm);

  &:hover {
    text-decoration-thickness: 2px;
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

export type RouteEscalation = {
  /** e.g. "If it keeps happening, email". Ends the sentence itself when there's no `email`. */
  text: string;
  /** Admins: where to escalate. Shown as a mailto link once it's a real address. */
  email?: string;
};

/**
 * What a route's error.tsx shows when its page fails to load, centred in the content area like the 404:
 * an alert icon, the page's h1 naming what didn't load, then one description line: why (a loading problem,
 * data is safe) and where to escalate if it keeps happening (admins email BSF; partners tell an SDC admin); then Try again.
 * Never shows the raw error. See docs/patterns/ListPage.md, "Error boundaries".
 */
export function RouteError({
  title,
  body,
  escalation,
  retryLabel,
  onRetry,
}: {
  title: string;
  body: string;
  escalation: RouteEscalation;
  retryLabel: string;
  /** Next's `retry` from error.tsx: fetches and renders the segment again. */
  onRetry: () => void;
}) {
  const { text, email } = escalation;
  return (
    <Page>
      <Content>
        <IconWrap aria-hidden="true">
          <Icon icon={CircleAlert} size={28} />
        </IconWrap>
        <Text role="alert">
          <Title>{title}</Title>
          <Body>
            {body} {text}
            {email && (
              <>
                {" "}
                {email.includes("@") ? <MailLink href={`mailto:${email}`}>{email}</MailLink> : email}.
              </>
            )}
          </Body>
        </Text>
        <Button type="button" $variant="secondary" onClick={onRetry}>
          <Icon icon={RotateCw} size={16} />
          {retryLabel}
        </Button>
      </Content>
    </Page>
  );
}
