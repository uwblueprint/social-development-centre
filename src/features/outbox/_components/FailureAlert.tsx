"use client";

import { styled } from "next-yak";
import { AlertCircle } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { bodyOf, gmailComposeUrl, plainFor, SEND_TIME, subjectOf, type Send } from "../_data";
import { useOutboxData } from "../_outboxData";

const Alert = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-danger-border);
  border-radius: var(--radius-lg);
  background: var(--color-danger-subtle);
  color: var(--color-danger);
  font-size: var(--text-sm);

  /* A whole-pixel line, so the icon's box and the first line of text share one height and the icon lands on whole pixels. */
  --line: 20px;
  line-height: var(--line);
`;

/* As tall as the first line of text; the icon is centred in it. */
const IconBox = styled.span`
  flex: none;
  display: flex;
  align-items: center;
  height: var(--line);
`;

const AlertText = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  color: var(--color-text);

  & strong {
    color: var(--color-danger);
    font-weight: var(--weight-medium);
  }
`;

const ExternalLink = styled.a`
  align-self: flex-start;
  color: var(--color-text);
  font-weight: var(--weight-medium);
  text-decoration: underline;
  text-underline-offset: 2px;

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
    border-radius: var(--radius-sm);
  }
`;

/** Why an email couldn't send and what to do about it. */
export function FailureAlert({ send }: { send: Send }) {
  const { members, templates } = useOutboxData();
  const m = members[send.member];
  return (
    <Alert role="alert">
      <IconBox>
        <Icon icon={AlertCircle} size={16} />
      </IconBox>
      <AlertText>
        {send.fail === "admin" && (
          <>
            <strong>Not approved before its send day</strong>
            <span>Nobody approved it in time, so it didn&apos;t go out. Check the email below, then approve it to send it tomorrow at {SEND_TIME}.</span>
          </>
        )}
        {send.fail === "platform" && (
          <>
            <strong>We couldn&apos;t send this email</strong>
            <span>
              The problem is on our side, and it failed after a few tries. We&apos;ll try again tomorrow at {SEND_TIME}. If it can&apos;t wait, send it yourself from Gmail.
            </span>
            <ExternalLink href={gmailComposeUrl(m.email, plainFor(subjectOf(send, templates), m), plainFor(bodyOf(send, templates), m))} target="_blank" rel="noopener noreferrer">
              Send it from Gmail (opens in a new tab)
            </ExternalLink>
          </>
        )}
        {send.fail === "bounce" && (
          <>
            <strong>The email address {m.email} didn&apos;t work</strong>
            <span>It may have a typo, or the inbox may be closed. Check it with {m.first}, update it, then select Resend.</span>
          </>
        )}
      </AlertText>
    </Alert>
  );
}
