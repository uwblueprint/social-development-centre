"use client";

import { styled } from "next-yak";
import { Badge } from "@/components/ui/Badge";
import type { TableColumn } from "@/components/ui/Table";
import { KIND_LABEL } from "../catalog";
import { copy } from "../copy";
import { formatWhen } from "../format";
import type { Opportunity, OpportunityTab } from "../types";
import { KindIcon } from "./KindIcon";

const TitleCell = styled.span`
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  min-width: 0;
`;

const IconSlot = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  padding-top: 2px;
  color: var(--color-text-muted);
`;

const TitleText = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const TitleLine = styled.span`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
`;

/* Long titles truncate in the table and wrap in the panel. */
const Title = styled.span`
  display: block;
  max-width: 44ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Muted = styled.span`
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const Nowrap = styled.span`
  white-space: nowrap;
`;

const shortDate = new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric" });
const shortDateYear = new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", year: "numeric" });
const shortTime = new Intl.DateTimeFormat("en-CA", { hour: "numeric", minute: "2-digit" });

/** "2:14 p.m." today, "Sep 24" this year, "Sep 24, 2025" before that. */
export function formatUpdated(iso: string, now = new Date()): string {
  const d = new Date(iso);
  if (d.toDateString() === now.toDateString()) return shortTime.format(d);
  return d.getFullYear() === now.getFullYear() ? shortDate.format(d) : shortDateYear.format(d);
}

/** The text status for a listing: always a word, never color alone. */
export function statusLabel(o: Opportunity): string {
  if (o.status === "draft") return copy.panel.statusDraft;
  if (o.status === "live") return copy.panel.statusLive;
  return o.closedReason === "ended" ? copy.panel.statusEnded : copy.panel.statusClosed;
}

/**
 * Opportunity table columns. There is no status column (the tab is the status); the Closed tab
 * alone shows an Ended/Closed badge, since it mixes both reasons.
 */
export function opportunityColumns(scope: "admin" | "partner", tab: OpportunityTab): TableColumn<Opportunity>[] {
  const columns: TableColumn<Opportunity>[] = [
    {
      key: "opportunity",
      header: copy.table.opportunity,
      render: (o) => (
        <TitleCell>
          <IconSlot>
            <KindIcon kind={o.kind} />
          </IconSlot>
          <TitleText>
            <TitleLine>
              <Title title={o.title}>{o.title}</Title>
              {tab === "closed" && (
                <Badge $variant="outline">{o.closedReason === "ended" ? copy.table.ended : copy.table.closed}</Badge>
              )}
            </TitleLine>
            <Muted>{KIND_LABEL[o.kind]}</Muted>
          </TitleText>
        </TitleCell>
      ),
    },
  ];
  if (scope === "admin") {
    columns.push({ key: "organization", header: copy.table.organization, render: (o) => <Nowrap>{o.organization.name}</Nowrap> });
  }
  columns.push(
    { key: "date", header: copy.table.date, render: (o) => <Nowrap>{formatWhen(o)}</Nowrap> },
    { key: "updated", header: copy.table.updated, render: (o) => <Nowrap>{formatUpdated(o.updatedAt)}</Nowrap> },
  );
  return columns;
}
