"use client";

import { styled } from "next-yak";
import { Badge } from "@/components/ui/Badge";
import type { TableColumn } from "@/components/ui/Table";
import type { Member } from "../_data/types";
import { communityCopy as copy } from "../_copy";
import { formatDate, formatDateTime, formatRelative } from "../_lib/format";
import { CopyEmailButton } from "./CopyEmailButton";
import { MemberRowActions } from "./MemberRowActions";

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
`;

const NameLine = styled.span<{ $muted?: boolean }>`
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  color: ${({ $muted }) => ($muted ? "var(--color-text-muted)" : "var(--color-text)")};
`;

const EmailCell = styled.span<{ $muted?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  overflow-wrap: anywhere;
  color: ${({ $muted }) => ($muted ? "var(--color-text-muted)" : "inherit")};

  button {
    opacity: 0;
  }
  &:hover button,
  &:focus-within button {
    opacity: 1;
  }
  /* No hover on touch screens: keep the copy button visible. */
  @media (hover: none) {
    button {
      opacity: 1;
    }
  }
`;

const Muted = styled.span`
  color: var(--color-text-muted);
`;

const Subject = styled.span`
  display: block;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SentAt = styled.time`
  white-space: nowrap;
`;

/**
 * Community table columns: Name (dimmed + an "Unsubscribed" badge for unsubscribed
 * people, who only appear in General search results),
 * Email (hover-reveal copy button), Last email (subject, or "—"), Sent (relative time, full date
 * on hover, or "—"), Added, and a trailing row-actions ⋯ menu. Name, Email, Sent and Added sort
 * (server-side); their `sortKey`s match `MEMBER_SORT_KEYS`.
 */
export const memberColumns: TableColumn<Member>[] = [
  {
    key: "name",
    header: copy.table.headerName,
    sortKey: "name",
    render: (member) => (
      <NameLine $muted={!member.subscribed}>
        {member.name ?? copy.table.noName}
        {!member.subscribed && <Badge>{copy.table.unsubscribedLabel}</Badge>}
      </NameLine>
    ),
  },
  {
    key: "email",
    header: copy.table.headerEmail,
    sortKey: "email",
    render: (member) => (
      <EmailCell $muted={!member.subscribed}>
        {member.email}
        <CopyEmailButton email={member.email} />
      </EmailCell>
    ),
  },
  {
    key: "lastEmail",
    header: copy.table.headerLastEmail,
    render: (member) =>
      member.lastEmail ? (
        <Subject title={member.lastEmail.subject}>{member.lastEmail.subject}</Subject>
      ) : (
        <Muted>{copy.table.noLastEmail}</Muted>
      ),
  },
  {
    key: "sent",
    header: copy.table.headerSent,
    sortKey: "sent",
    defaultSortDirection: "desc",
    render: (member) =>
      member.lastEmail ? (
        <SentAt dateTime={member.lastEmail.sentAt} title={formatDateTime(member.lastEmail.sentAt)}>
          {formatRelative(member.lastEmail.sentAt)}
        </SentAt>
      ) : (
        <Muted>{copy.table.noLastEmail}</Muted>
      ),
  },
  {
    key: "added",
    header: copy.table.headerAdded,
    sortKey: "added",
    defaultSortDirection: "desc",
    render: (member) => formatDate(member.addedAt),
  },
  {
    key: "actions",
    header: <VisuallyHidden>{copy.table.headerActions}</VisuallyHidden>,
    align: "right",
    render: (member) => <MemberRowActions member={member} />,
  },
];
