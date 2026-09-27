"use client";

import * as React from "react";
import { styled } from "next-yak";
import { RotateCw } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorIcon } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import type { SentEmail } from "../_data/types";
import { communityCopy as copy } from "../_copy";
import { formatDate, formatShortDate } from "../_lib/format";
import { getMemberEmailHtml, getMemberEmails } from "../_lib/emailHistoryAction";

/*
 * Every email body gets this fixed height, loaded or not, so the list never
 * jumps as bodies arrive. `sandbox=""` (the strictest sandbox: no scripts,
 * forms or same-origin access) keeps an arbitrary sent email safe to render,
 * but also means this window can't read the frame's `scrollHeight` to size it
 * exactly, so the frame scrolls within this height instead.
 */
const BODY_HEIGHT = "360px";

/** Start loading a body when it's within this distance of the visible area. */
const PRELOAD_MARGIN = "400px 0px";

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const SectionHeading = styled.h3`
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text);
`;

const Count = styled.span`
  font-weight: var(--weight-regular);
  color: var(--color-text-muted);
`;

const List = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
`;

const Item = styled.li`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

const ItemHeader = styled.div`
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  min-width: 0;
`;

const Subject = styled.h4`
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  line-height: var(--leading-ui);
  color: var(--color-text);
  overflow-wrap: anywhere;
`;

const SentDate = styled.time`
  flex-shrink: 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
`;

const Frame = styled.iframe`
  display: block;
  width: 100%;
  height: ${BODY_HEIGHT};
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
`;

const Placeholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  height: ${BODY_HEIGHT};
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const StatusLine = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

/** A load failure: icon and message in the danger color (never color alone), with Try again on its own line. */
const ErrorBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
`;

const ErrorMessage = styled.p`
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-danger);
`;

/** The nearest scrolling ancestor, so bodies preload just before they scroll into the panel. */
function scrollParent(el: HTMLElement): HTMLElement | null {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") return node;
  }
  return null;
}

type BodyState = { status: "waiting" | "loading" | "error" } | { status: "ready"; html: string };

/** One email's rendered body. Fetched and rendered only once it's near the visible area; kept after that. */
function EmailBody({ memberId, email }: { memberId: string; email: SentEmail }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [body, setBody] = React.useState<BodyState>({ status: "waiting" });

  const load = React.useCallback(() => {
    setBody({ status: "loading" });
    getMemberEmailHtml(memberId, email.id).then(
      (html) => setBody(html === null ? { status: "error" } : { status: "ready", html }),
      () => setBody({ status: "error" }),
    );
  }, [memberId, email.id]);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || body.status !== "waiting") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          load();
        }
      },
      { root: scrollParent(el), rootMargin: PRELOAD_MARGIN },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [body.status, load]);

  if (body.status === "ready") {
    return <Frame title={copy.emails.previewTitle(email.subject)} srcDoc={body.html} sandbox="" />;
  }

  return (
    <Placeholder ref={ref} data-email-placeholder={body.status}>
      {body.status === "error" ? (
        <>
          {copy.emails.bodyError}
          <Button type="button" $variant="secondary" $size="sm" onClick={load}>
            <Icon icon={RotateCw} size={16} />
            {copy.emails.retry}
          </Button>
        </>
      ) : (
        copy.emails.bodyLoading
      )}
    </Placeholder>
  );
}

/**
 * The member panel's Emails section: every email sent to this person, newest
 * first, all expanded. Each shows its subject, short sent date and (if it
 * not delivered) a Not delivered badge, then its body, which loads lazily.
 */
export function MemberEmails({ memberId, subscribed }: { memberId: string; subscribed: boolean }) {
  const [emails, setEmails] = React.useState<SentEmail[] | null>(null);
  const [error, setError] = React.useState(false);
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    getMemberEmails(memberId).then(
      (result) => !cancelled && setEmails(result),
      () => !cancelled && setError(true),
    );
    return () => {
      cancelled = true;
    };
  }, [memberId, attempt]);

  function retry() {
    setError(false);
    setAttempt((n) => n + 1);
  }

  return (
    <Section aria-labelledby="member-emails-heading">
      <SectionHeading id="member-emails-heading">
        {copy.emails.heading}
        {emails && emails.length > 0 && <Count>{copy.emails.count(emails.length)}</Count>}
      </SectionHeading>

      {error ? (
        <ErrorBlock>
          <ErrorMessage role="alert">
            <ErrorIcon />
            <span>{copy.emails.loadError}</span>
          </ErrorMessage>
          <Button type="button" $variant="secondary" $size="sm" onClick={retry}>
            <Icon icon={RotateCw} size={16} />
            {copy.emails.retry}
          </Button>
        </ErrorBlock>
      ) : emails === null ? (
        <StatusLine role="status">{copy.emails.loading}</StatusLine>
      ) : emails.length === 0 ? (
        <StatusLine>{subscribed ? copy.emails.empty : copy.emails.emptyUnsubscribed}</StatusLine>
      ) : (
        <List>
          {emails.map((email) => (
            <Item key={email.id}>
              <ItemHeader>
                <Subject>{email.subject}</Subject>
                {email.status === "not-delivered" && <Badge $variant="danger">{copy.emails.notDeliveredBadge}</Badge>}
                <SentDate dateTime={email.sentAt} title={formatDate(email.sentAt)}>
                  {formatShortDate(email.sentAt)}
                </SentDate>
              </ItemHeader>
              <EmailBody memberId={memberId} email={email} />
            </Item>
          ))}
        </List>
      )}
    </Section>
  );
}
