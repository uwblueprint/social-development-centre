"use client";

import { styled } from "next-yak";
import { CircleAlert, Clock, Send } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { invitationCopy } from "../_copy";
import type { PartnerContact } from "../_data/types";
import { formatDate } from "../_lib/format";

/*
 * Layout pieces for a person's row, shared by the admin Partners panels and the partner portal's Team
 * list (src/app/partner/organization/_components/TeamMemberRow.tsx), plus the invitation status both show.
 */

export const ContactRowFrame = styled.div<{ $highlighted?: boolean }>`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-1);
  border-radius: var(--radius-md);
  transition: background-color var(--duration) var(--ease);

  ${({ $highlighted }) => $highlighted && `background: var(--color-accent-subtle);`}

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

export const ContactInfo = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const ContactName = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text);
`;

export const ContactEmail = styled.p`
  margin: 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
`;

export const ContactMeta = styled.p`
  margin: 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

export const ContactMenuTrigger = styled(Button)`
  flex-shrink: 0;
`;

const StatusLine = styled.span`
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-2);
`;

/** The label for re-sending, by state: Resend invitation, Retry, or Send new invitation. */
export function resendLabel(state: NonNullable<PartnerContact["invitationState"]>) {
  return state === "notSent" ? invitationCopy.retry : state === "expired" ? invitationCopy.sendNew : invitationCopy.resend;
}

/** The badge for a pending person's invitation state (text, never colour alone). Nothing once they've accepted. */
export function InvitationBadge({ state }: { state: PartnerContact["invitationState"] }) {
  if (state === "notSent") {
    return (
      <Badge $variant="danger">
        <Icon icon={CircleAlert} size={12} />
        {invitationCopy.notSent}
      </Badge>
    );
  }
  if (state === "expired") {
    return (
      <Badge $variant="warning">
        <Icon icon={Clock} size={12} />
        {invitationCopy.expired}
      </Badge>
    );
  }
  if (state === "pending") {
    return (
      <Badge $variant="neutral">
        <Icon icon={Send} size={12} />
        {invitationCopy.pending}
      </Badge>
    );
  }
  return null;
}

/** "Expires {date}" under a pending invitation, "Expired {date}" under an expired one, nothing otherwise. */
export function invitationDateText(contact: Pick<PartnerContact, "invitation" | "invitationState">): string | null {
  const expiresAt = contact.invitation?.expiresAt;
  if (!expiresAt) return null;
  if (contact.invitationState === "pending") return invitationCopy.expires(formatDate(expiresAt));
  if (contact.invitationState === "expired") return invitationCopy.expiredOn(formatDate(expiresAt));
  return null;
}

/**
 * Badge plus date, and a Retry button for an invitation that was never delivered.
 * `onRetry` is omitted where the row has no room for it (tables use their row's panel instead).
 */
export function InvitationStatus({
  contact,
  onRetry,
}: {
  contact: Pick<PartnerContact, "invitation" | "invitationState" | "name">;
  onRetry?: () => void;
}) {
  if (!contact.invitationState) return null;
  const date = invitationDateText(contact);
  return (
    <StatusLine>
      <InvitationBadge state={contact.invitationState} />
      {date && <ContactMeta as="span">{date}</ContactMeta>}
      {contact.invitationState === "notSent" && onRetry && (
        <Button type="button" $variant="secondary" $size="sm" onClick={onRetry}>
          {invitationCopy.retry}
        </Button>
      )}
    </StatusLine>
  );
}
