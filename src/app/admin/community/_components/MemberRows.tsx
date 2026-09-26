"use client";

import { styled } from "next-yak";
import { MailX } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { Tooltip } from "@/components/ui/Tooltip";
import type { TableColumn } from "@/components/ui/Table";
import type { Member } from "../_data/types";
import { communityCopy as copy } from "../_copy";
import { formatDate, formatRelative } from "../_lib/format";
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
  gap: var(--space-1);
  color: ${({ $muted }) => ($muted ? "var(--color-text-muted)" : "var(--color-text)")};
`;

const UnsubscribedIcon = styled.span`
  display: inline-flex;
  color: var(--color-text-muted);
`;

const EmailCell = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  overflow-wrap: anywhere;

  button {
    opacity: 0;
  }
  &:hover button,
  &:focus-within button {
    opacity: 1;
  }
`;

const Muted = styled.span`
  color: var(--color-text-muted);
`;

const LastEmailCell = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 220px;
`;

const Subject = styled.span`
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RelativeDate = styled.span`
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

/**
 * Community table columns: Name (dimmed + a MailX glyph when unsubscribed),
 * Email (hover-reveal copy button), Last email (subject + relative date, or
 * "—"), Added, and a trailing row-actions ⋯ menu.
 */
export const memberColumns: TableColumn<Member>[] = [
  {
    key: "name",
    header: copy.table.headerName,
    render: (member) => (
      <NameLine $muted={!member.subscribed}>
        {member.name ?? copy.table.noName}
        {!member.subscribed && (
          <Tooltip content={copy.table.unsubscribedLabel}>
            <UnsubscribedIcon tabIndex={0}>
              <Icon icon={MailX} size={14} />
              <VisuallyHidden>{copy.table.unsubscribedLabel}</VisuallyHidden>
            </UnsubscribedIcon>
          </Tooltip>
        )}
      </NameLine>
    ),
  },
  {
    key: "email",
    header: copy.table.headerEmail,
    render: (member) => (
      <EmailCell>
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
        <LastEmailCell>
          <Subject title={member.lastEmail.subject}>{member.lastEmail.subject}</Subject>
          <RelativeDate>{formatRelative(member.lastEmail.sentAt)}</RelativeDate>
        </LastEmailCell>
      ) : (
        <Muted>{copy.table.noLastEmail}</Muted>
      ),
  },
  {
    key: "added",
    header: copy.table.headerAdded,
    render: (member) => formatDate(member.addedAt),
  },
  {
    key: "actions",
    header: <VisuallyHidden>{copy.table.headerActions}</VisuallyHidden>,
    align: "right",
    render: (member) => <MemberRowActions member={member} />,
  },
];
