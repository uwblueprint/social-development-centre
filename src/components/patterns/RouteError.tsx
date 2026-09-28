"use client";

import { styled } from "next-yak";
import { CircleAlert, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-7) var(--space-6);
  text-align: center;

  @media (max-width: 767px) {
    padding: var(--space-6) var(--space-4);
  }
`;

const IconWrap = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background: var(--color-danger-subtle);
  color: var(--color-danger);
`;

const Text = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
`;

const Title = styled.h1`
  margin: 0;
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  color: var(--color-text);
`;

const Body = styled.p`
  margin: 0;
  max-width: 48ch;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
`;

/**
 * What a route's error.tsx shows when its page fails to load: an alert icon, the page's h1 naming what
 * didn't load, why (a loading problem, data is safe), an optional contact line, and Try again.
 * Never shows the raw error. See docs/patterns/ListPage.md, "Error boundaries".
 */
export function RouteError({
  title,
  body,
  contact,
  retryLabel,
  onRetry,
}: {
  title: string;
  body: string;
  /** Partner portal: who to contact if it keeps happening. */
  contact?: string;
  retryLabel: string;
  /** Next's `retry` from error.tsx: fetches and renders the segment again. */
  onRetry: () => void;
}) {
  return (
    <Wrapper>
      <IconWrap aria-hidden="true">
        <Icon icon={CircleAlert} size={22} />
      </IconWrap>
      <Text role="alert">
        <Title>{title}</Title>
        <Body>{body}</Body>
        {contact && <Body>{contact}</Body>}
      </Text>
      <Button type="button" $variant="secondary" onClick={onRetry}>
        <Icon icon={RotateCw} size={16} />
        {retryLabel}
      </Button>
    </Wrapper>
  );
}
