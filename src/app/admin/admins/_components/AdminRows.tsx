"use client";

import { styled } from "next-yak";
import { CircleAlert, CircleCheck, RotateCw, Send, UserMinus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DisabledReason } from "@/components/ui/DisabledReason";
import { Icon } from "@/components/ui/Icon";
import type { TableColumn } from "@/components/ui/Table";
import { Tooltip } from "@/components/ui/Tooltip";
import { TruncatedText } from "@/components/ui/TruncatedText";
import { formatDate, formatDateTime } from "@/lib/date";
import { CopyEmail } from "../../community/_components/CopyEmail";
import { adminsCopy as copy } from "../_copy";
import type { AdminRecord, AdminStatus } from "../_data/types";

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

const NameCell = styled.span`
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
  min-width: 0;
`;

/* Block-level, so the truncating text inside has the cell's width. People who haven't accepted yet are grey. */
const Dimmable = styled.span<{ $muted?: boolean }>`
  display: block;
  min-width: 0;
  color: ${({ $muted }) => ($muted ? "var(--color-text-muted)" : "inherit")};
`;

const Muted = styled.span`
  color: var(--color-text-muted);
`;

const You = styled.span`
  flex-shrink: 0;
  color: var(--color-text-muted);
`;

const Nowrap = styled.time`
  white-space: nowrap;
`;

const ActionsCell = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
  /* The cell's right padding is cancelled so the last button ends at the table's edge, in line with the header's buttons. */
  margin-right: calc(var(--space-3) * -1);
`;

/** The same colors and icons as the Partners people list: pending is neutral, not delivered is danger. */
const STATUS: Record<AdminStatus, { variant: "success" | "neutral" | "danger"; icon: typeof Send }> = {
  active: { variant: "success", icon: CircleCheck },
  invited: { variant: "neutral", icon: Send },
  not_sent: { variant: "danger", icon: CircleAlert },
};

export function StatusBadge({ status }: { status: AdminStatus }) {
  const s = STATUS[status];
  return (
    <Badge $variant={s.variant}>
      <Icon icon={s.icon} size={12} />
      {copy.status[status]}
    </Badge>
  );
}

export interface AdminRowHandlers {
  currentEmail: string;
  /** Only one admin is left, so nobody can be removed. */
  onlyOneAdmin: boolean;
  /** Resend is blocked for this admin for a minute after the last send. */
  resendBlocked: (admin: AdminRecord) => boolean;
  onResend: (admin: AdminRecord) => void;
  onCheckEmail: (admin: AdminRecord) => void;
  onRemove: (admin: AdminRecord) => void;
}

/**
 * Row actions sit on the row, not in a ⋯ menu: a row has at most two, so a menu would hide one or two
 * choices behind an extra click. Invited and Not sent rows have a labelled Resend invite button (a Not
 * sent row opens the Check the email address dialog first); every row has an icon button to remove them.
 */
function RowActions({ admin, h }: { admin: AdminRecord; h: AdminRowHandlers }) {
  const blocked = admin.status === "invited" && h.resendBlocked(admin);

  const resend = (
    <Button
      type="button"
      $variant="secondary"
      $size="sm"
      disabled={blocked}
      onClick={() => (admin.status === "not_sent" ? h.onCheckEmail(admin) : h.onResend(admin))}
    >
      <Icon icon={RotateCw} size={14} />
      {copy.table.resend}
    </Button>
  );
  const remove = (
    <Button
      type="button"
      $variant="ghost"
      $size="sm"
      disabled={h.onlyOneAdmin}
      aria-label={copy.table.removeLabel(admin.name)}
      onClick={() => h.onRemove(admin)}
    >
      <Icon icon={UserMinus} size={16} />
      {h.onlyOneAdmin && <VisuallyHidden>{copy.remove.lastAdminReason}</VisuallyHidden>}
    </Button>
  );

  return (
    <ActionsCell>
      {admin.status !== "active" &&
        (blocked ? <DisabledReason reason={copy.resend.cooldownReason}>{resend}</DisabledReason> : resend)}
      {h.onlyOneAdmin ? (
        <DisabledReason reason={copy.remove.lastAdminReason}>{remove}</DisabledReason>
      ) : (
        <Tooltip content={copy.remove.menu}>{remove}</Tooltip>
      )}
    </ActionsCell>
  );
}

/** Name ("Name (You)" for your own row; frozen), Email, Added on, Status and the row's actions. */
export function adminColumns(h: AdminRowHandlers): TableColumn<AdminRecord>[] {
  return [
    {
      key: "name",
      header: copy.table.headerName,
      width: "200px",
      render: (admin) => (
        <Dimmable $muted={admin.status !== "active"}>
          <NameCell>
            <TruncatedText tooltip>{admin.name}</TruncatedText>
            {admin.email === h.currentEmail && <You>{copy.table.you}</You>}
          </NameCell>
        </Dimmable>
      ),
    },
    {
      key: "email",
      header: copy.table.headerEmail,
      width: "260px",
      render: (admin) => (
        <Dimmable $muted={admin.status !== "active"}>
          <CopyEmail email={admin.email} truncate />
        </Dimmable>
      ),
    },
    {
      key: "added",
      header: copy.table.headerAdded,
      width: "128px",
      // Only people who accepted the invite have a date; an invited person shows a dash.
      render: (admin) =>
        admin.addedAt ? (
          <Nowrap dateTime={admin.addedAt} title={formatDateTime(admin.addedAt)}>
            {formatDate(admin.addedAt)}
          </Nowrap>
        ) : (
          <Muted>
            <span aria-hidden="true">{copy.table.noDate}</span>
            <VisuallyHidden>{copy.table.notAccepted}</VisuallyHidden>
          </Muted>
        ),
    },
    {
      key: "status",
      header: copy.table.headerStatus,
      width: "140px",
      render: (admin) => <StatusBadge status={admin.status} />,
    },
    {
      key: "actions",
      header: <VisuallyHidden>{copy.table.headerActions}</VisuallyHidden>,
      align: "right",
      render: (admin) => <RowActions admin={admin} h={h} />,
    },
  ];
}
