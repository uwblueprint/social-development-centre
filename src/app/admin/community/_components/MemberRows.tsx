"use client";

import { styled } from "next-yak";
import { Badge } from "@/components/ui/Badge";
import { TruncatedText } from "@/components/ui/TruncatedText";
import type { TableColumn, TableColumnFilter } from "@/components/ui/Table";
import { formatDateTime, formatRelative } from "@/lib/date";
import type { Member, MemberStatus } from "../_data/types";
import { communityCopy as copy } from "../_copy";
import { CopyEmail } from "./CopyEmail";
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

/* Block-level, so the truncating text inside has the cell's width to clip to. */
const Dimmable = styled.span<{ $muted?: boolean }>`
  display: block;
  min-width: 0;
  color: ${({ $muted }) => ($muted ? "var(--color-text-muted)" : "inherit")};
`;

const Muted = styled.span`
  color: var(--color-text-muted);
`;

const Nowrap = styled.time`
  white-space: nowrap;
`;

const Clicks = styled.span`
  font-variant-numeric: tabular-nums;
`;

/** Every status is a text label; the color only supports it. */
const STATUS_VARIANT: Record<MemberStatus, "success" | "warning" | "info" | "neutral"> = {
  active: "success",
  inactive: "warning",
  never_clicked: "neutral",
  onboarding_incomplete: "info",
  invited: "info",
  unsubscribed: "neutral",
};

export function StatusBadge({ status }: { status: MemberStatus }) {
  return <Badge $variant={STATUS_VARIANT[status]}>{copy.status[status]}</Badge>;
}

/**
 * Community table columns: Name (sticky), Email (sticky; click to copy), Status (one badge, with the
 * Status filter in its header), Clicks (primary-action clicks), Last email, Sent (relative time, full
 * date on hover) and a trailing ⋯ menu. Unsubscribed people's name and email are dimmed.
 * Every column has a fixed width, so a long name, email or subject ends in an ellipsis instead of
 * widening the table: Name and Last email show the full text in a tooltip when cut off; Email truncates
 * in the middle (the domain stays) and still copies the whole address.
 * `now` is the server's render time, so relative dates match on server and client.
 */
export function memberColumns(now: string, statusFilter: TableColumnFilter): TableColumn<Member>[] {
  return [
    {
      key: "name",
      header: copy.table.headerName,
      sortKey: "name",
      width: "200px",
      render: (member) => (
        <Dimmable $muted={!member.subscribed}>
          <TruncatedText tooltip>{member.name ?? copy.table.noName}</TruncatedText>
        </Dimmable>
      ),
    },
    {
      key: "email",
      header: copy.table.headerEmail,
      sortKey: "email",
      width: "240px",
      render: (member) => (
        <Dimmable $muted={!member.subscribed}>
          <CopyEmail email={member.email} truncate />
        </Dimmable>
      ),
    },
    {
      key: "status",
      header: copy.table.headerStatus,
      filter: statusFilter,
      width: "208px",
      render: (member) => <StatusBadge status={member.status} />,
    },
    {
      key: "clicks",
      header: copy.table.headerClicks,
      sortKey: "clicks",
      defaultSortDirection: "desc",
      align: "right",
      width: "96px",
      render: (member) => <Clicks>{member.ctaClicks}</Clicks>,
    },
    {
      key: "lastEmail",
      header: copy.table.headerLastEmail,
      width: "240px",
      isEmpty: (member) => !member.lastEmail,
      render: (member) =>
        member.lastEmail ? (
          <TruncatedText tooltip>{member.lastEmail.subject}</TruncatedText>
        ) : (
          <Muted>{copy.table.noLastEmail}</Muted>
        ),
    },
    {
      key: "sent",
      header: copy.table.headerSent,
      sortKey: "sent",
      defaultSortDirection: "desc",
      width: "112px",
      isEmpty: (member) => !member.lastEmail,
      render: (member) =>
        member.lastEmail ? (
          <Nowrap dateTime={member.lastEmail.sentAt} title={formatDateTime(member.lastEmail.sentAt)}>
            {formatRelative(member.lastEmail.sentAt, now)}
          </Nowrap>
        ) : (
          <Muted>{copy.table.noLastEmail}</Muted>
        ),
    },
    {
      key: "actions",
      header: <VisuallyHidden>{copy.table.headerActions}</VisuallyHidden>,
      align: "right",
      width: "56px",
      render: (member) => <MemberRowActions member={member} />,
    },
  ];
}
