"use client";

import * as React from "react";
import Link from "next/link";
import { css, styled } from "next-yak";
import { CircleAlert } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { SDC_CONTACT_EMAIL } from "@/lib/contact";
import { partnerCopy } from "../../_copy";
import type { Blocked } from "../_data/actions";

const copy = partnerCopy.organization.blocked;

/** Lets any action on the page report that it couldn't run (signed out, or access ended). */
export const ReportBlockedContext = React.createContext<(blocked: Blocked) => void>(() => {});
export const useReportBlocked = () => React.useContext(ReportBlockedContext);

const Box = styled.div`
  display: flex;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
  background: var(--color-danger-subtle);
  color: var(--color-text);
  font-size: var(--text-sm);
  line-height: var(--leading-body);

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

const IconSlot = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  padding-top: 2px;
  color: var(--color-danger);
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
`;

const Text = styled.p`
  margin: 0;
`;

const linkStyles = css`
  color: var(--color-text);
  text-decoration: underline;
  text-underline-offset: 2px;
  border-radius: var(--radius-sm);
  overflow-wrap: anywhere;

  &:hover {
    text-decoration-thickness: 2px;
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

const SignInLink = styled(Link)`
  ${linkStyles}
`;

const MailLink = styled.a`
  ${linkStyles}
`;

/**
 * Persistent message (not a toast) when a change couldn't be saved because the person was signed out or
 * their organization lost access. Nothing was saved; it gives the way forward. Takes focus when it appears.
 */
export function BlockedNotice({ blocked }: { blocked: Blocked }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    ref.current?.focus();
  }, [blocked]);

  const hasAddress = SDC_CONTACT_EMAIL.includes("@");
  return (
    <Box ref={ref} tabIndex={-1} role="alert">
      <IconSlot aria-hidden="true">
        <Icon icon={CircleAlert} size={18} />
      </IconSlot>
      <Body>
        {blocked === "signedOut" ? (
          <>
            <Text>{copy.signedOut}</Text>
            <Text>
              <SignInLink href="/login/partner">{copy.signIn}</SignInLink>
            </Text>
          </>
        ) : (
          <>
            <Text>{copy.accessEnded}</Text>
            <Text>
              {copy.contactLabel}{" "}
              {hasAddress ? <MailLink href={`mailto:${SDC_CONTACT_EMAIL}`}>{SDC_CONTACT_EMAIL}</MailLink> : SDC_CONTACT_EMAIL}
            </Text>
          </>
        )}
      </Body>
    </Box>
  );
}
