"use client";

import type * as React from "react";
import { RotateCw } from "lucide-react";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { BrandIllustration } from "./BrandIllustration";

/** Offline copy. */
export const offlineCopy = {
  title: "Goose stole your wifi.",
  body: "Please reconnect to the internet and try again.",
  retry: "Try again",
  illustration: "A goose running off with a wifi signal",
  /** The non-blocking notices. */
  wentOffline: "You're offline. You can keep reading; changes need a connection.",
  backOnline: "You're back online.",
};

/* Illustration, then the title and message as one tight group, then the action: even spacing between the three. */
const Content = styled.div<{ $page?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-5);
  max-width: 32rem;
  margin: 0 auto;
  padding: ${({ $page }) => ($page ? "var(--space-7) var(--space-5)" : "var(--space-2) var(--space-3) var(--space-3)")};
  text-align: center;
`;

const Text = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

/* The 404's sizes: title xl, message md. */
const Title = styled.h1`
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  letter-spacing: var(--tracking-tight);
`;

const Body = styled.p<{ $page?: boolean }>`
  margin: 0;
  font-size: ${({ $page }) => ($page ? "var(--text-md)" : "var(--text-sm)")};
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;

/* Full page (a page that can't load offline): the 404's ground fills the content area so the square melts in. */
const Page = styled.div`
  display: grid;
  place-items: center;
  min-height: 100%;
  background: var(--illustration-page-bg);
`;

/**
 * Offline, in the 404's style. As a dialog when an action needs the server (people keep their place and
 * their draft); as a full page only when the page they asked for can't load. `page` picks the full-page ground.
 */
/** `title` replaces the page heading, e.g. with a DialogTitle when shown in a dialog. */
export function OfflineState({ onRetry, title, page = false }: { onRetry: () => void; title?: React.ReactNode; page?: boolean }) {
  const content = (
    <Content $page={page}>
      <BrandIllustration src="/illustrations/offline.svg" label={offlineCopy.illustration} />
      <Text>
        {title ?? <Title>{offlineCopy.title}</Title>}
        <Body $page={page}>{offlineCopy.body}</Body>
      </Text>
      <Button type="button" $variant="primary" onClick={onRetry}>
        <Icon icon={RotateCw} size={16} />
        {offlineCopy.retry}
      </Button>
    </Content>
  );
  return page ? <Page>{content}</Page> : content;
}
