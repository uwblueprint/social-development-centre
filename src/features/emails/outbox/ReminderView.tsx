"use client";

import Link from "next/link";
import { styled } from "next-yak";
import { MailCheck } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListPage, ListPageHeader } from "@/components/patterns/ListPage";
import { PageLoading } from "@/components/patterns/PageLoading";
import { RouteError } from "@/components/patterns/RouteError";
import { ADMINS } from "../model";
import { useEmails } from "../store";
import { buildBatches, dayLabelInline, pastDueText, plural } from "./helpers";

const Note = styled.p`
  margin: 0;
  max-width: 600px;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  line-height: var(--leading-body);
`;

const Mail = styled.article`
  width: 100%;
  max-width: 600px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-raised);
  overflow: hidden;
`;

const Head = styled.dl`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-1) var(--space-3);
  margin: 0;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  font-size: var(--text-sm);

  dt {
    color: var(--color-text-muted);
  }
  dd {
    margin: 0;
    min-width: 0;
    overflow-wrap: anywhere;
  }
`;

const MailBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  font-size: var(--text-md);
  line-height: var(--leading-body);
  overflow-wrap: anywhere;

  p,
  ul {
    margin: 0;
  }
  ul {
    padding-left: var(--space-5);
  }
`;

const Cta = styled(Link)`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-weight: var(--weight-medium);
  text-decoration: none;

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

const Label = styled.h2`
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
`;

const Block = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
`;

/** The two reminder emails the admin gets, rendered from the current Outbox. Design deliverable from the Outbox PRD. */
export function ReminderView() {
  const api = useEmails();
  const load = api.usePageLoad();
  const now = api.now;

  if (load.status === "loading") return <PageLoading title="Reminder email" />;
  if (load.status === "error") {
    return (
      <RouteError
        title="We couldn’t load the reminder email."
        body="Your data is safe; this is a loading problem."
        escalation={{ text: "If it keeps happening, tell an SDC admin." }}
        retryLabel="Try again"
        onRetry={load.retry}
      />
    );
  }

  const review = buildBatches(
    api,
    api.waitingForYou.filter(
      (s) => s.status === "waiting-review" && !s.couldntSend,
    ),
    now,
  ).sort((a, b) => b.maxPastDue - a.maxPastDue);
  const failed = buildBatches(
    api,
    api.waitingForYou.filter((s) => s.couldntSend),
    now,
  );
  const reviewTotal = review.reduce((n, b) => n + b.sends.length, 0);
  const failedTotal = failed.reduce((n, b) => n + b.sends.length, 0);

  return (
    <ListPage>
      <ListPageHeader title="Reminder email" />
      <Note>
        These are the emails {ADMINS.me} gets when something in the Outbox needs
        her. At most one review reminder goes out a day, and an email already
        listed in an earlier reminder isn’t listed again.
      </Note>

      {reviewTotal === 0 && failedTotal === 0 && (
        <EmptyState
          icon={MailCheck}
          title="No reminder would go out today"
          description="Nothing is waiting for review and nothing failed to send."
        />
      )}

      {reviewTotal > 0 && (
        <Block aria-labelledby="reminder-review">
          <Label id="reminder-review">Emails waiting for review</Label>
          <Mail>
            <Head>
              <dt>From</dt>
              <dd>{api.state.settings.senderName}</dd>
              <dt>To</dt>
              <dd>{ADMINS.me}</dd>
              <dt>Subject</dt>
              <dd>{plural(reviewTotal, "email")} waiting for your review</dd>
            </Head>
            <MailBody>
              <p>Hi {ADMINS.me},</p>
              <p>
                {plural(reviewTotal, "email")}{" "}
                {reviewTotal === 1 ? "is" : "are"} waiting for your review. They
                won’t send until you approve them.
              </p>
              <ul>
                {review.map((b) => (
                  <li key={b.key}>
                    {b.name}: {plural(b.sends.length, "recipient")},{" "}
                    {b.maxPastDue > 0
                      ? pastDueText(b.maxPastDue)
                      : `due ${dayLabelInline(b.day, now)}`}
                  </li>
                ))}
              </ul>
              <Cta href="/emails-pm-prototype/outbox">Review in the Outbox</Cta>
            </MailBody>
          </Mail>
        </Block>
      )}

      {failedTotal > 0 && (
        <Block aria-labelledby="reminder-failed">
          <Label id="reminder-failed">Emails that couldn’t send</Label>
          <Mail>
            <Head>
              <dt>From</dt>
              <dd>{api.state.settings.senderName}</dd>
              <dt>To</dt>
              <dd>{ADMINS.me}</dd>
              <dt>Subject</dt>
              <dd>{plural(failedTotal, "email")} couldn’t send</dd>
            </Head>
            <MailBody>
              <p>Hi {ADMINS.me},</p>
              <p>
                We tried to send {plural(failedTotal, "email")} for 24 hours and
                couldn’t. You can try again or choose not to send{" "}
                {failedTotal === 1 ? "it" : "them"}.
              </p>
              <ul>
                {failed.map((b) => (
                  <li key={b.key}>
                    {b.name}: {plural(b.sends.length, "recipient")}
                  </li>
                ))}
              </ul>
              <Cta href="/emails-pm-prototype/outbox">Open the Outbox</Cta>
            </MailBody>
          </Mail>
        </Block>
      )}
    </ListPage>
  );
}
