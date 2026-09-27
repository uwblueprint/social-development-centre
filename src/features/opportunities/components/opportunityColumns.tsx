"use client";

import { styled } from "next-yak";
import { Badge } from "@/components/ui/Badge";
import type { TableColumn, TableColumnFilter } from "@/components/ui/Table";
import { TruncatedText } from "@/components/ui/TruncatedText";
import { formatRelative } from "@/lib/date";
import { KIND_CATEGORY, KIND_LABEL } from "../catalog";
import { copy } from "../copy";
import { formatWhen } from "../format";
import type { Opportunity, OpportunityTab } from "../types";
import { KindIcon } from "./KindIcon";

const TitleCell = styled.span`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;

  & > :first-child {
    flex: 0 1 auto;
    min-width: 0;
  }
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
  if (o.status === "published") return copy.panel.statusPublished;
  return copy.panel.statusClosed;
}

/** Why a closed listing is closed: Ended, Closed or Partner access removed. */
export function closedReasonLabel(o: Opportunity): string | undefined {
  if (o.status !== "closed") return undefined;
  return copy.panel.closedReason[o.closedReason ?? "closed"];
}

/** "Created today" or "Edited 3d ago": edited once it changed after it was created. */
export function formatLastChange(o: Opportunity, now: string): string {
  const relative = formatRelative(o.updatedAt, now);
  const when = relative === "Today" || relative === "Yesterday" ? relative.toLowerCase() : relative;
  return new Date(o.updatedAt).getTime() > new Date(o.createdAt).getTime() ? copy.table.edited(when) : copy.table.created(when);
}

/** The type as a colored tag: the kind's icon and label, one category color per kind (never color alone). */
export function KindBadge({ kind }: { kind: Opportunity["kind"] }) {
  return (
    <Badge $category={KIND_CATEGORY[kind]}>
      <KindIcon kind={kind} size={12} />
      {KIND_LABEL[kind]}
    </Badge>
  );
}

/**
 * Opportunity table columns, one line per row with fixed widths; long titles truncate with a tooltip.
 * There is no status column (the tab is the status); the Closed tab shows the closed reason as a badge,
 * since it mixes reasons. `now` (ISO, from the server) keeps the relative times hydration-safe.
 */
export function opportunityColumns(
  scope: "admin" | "partner",
  tab: OpportunityTab,
  now: string,
  filters: { type?: TableColumnFilter; organization?: TableColumnFilter } = {},
): TableColumn<Opportunity>[] {
  const columns: TableColumn<Opportunity>[] = [
    {
      key: "opportunity",
      header: copy.table.opportunity,
      sortKey: "title",
      render: (o) => (
        <TitleCell>
          <TruncatedText tooltip>{o.title}</TruncatedText>
          {tab === "closed" && <Badge $variant="outline">{closedReasonLabel(o)}</Badge>}
        </TitleCell>
      ),
    },
    {
      key: "type",
      header: copy.table.type,
      width: "164px",
      filter: filters.type,
      render: (o) => <KindBadge kind={o.kind} />,
    },
  ];
  if (scope === "admin") {
    columns.push({
      key: "organization",
      header: copy.table.organization,
      width: "200px",
      sortKey: "organization",
      filter: filters.organization,
      render: (o) => <TruncatedText tooltip>{o.organization.name}</TruncatedText>,
    });
  }
  columns.push(
    { key: "date", header: copy.table.date, width: "176px", sortKey: "date", render: (o) => <TruncatedText tooltip>{formatWhen(o)}</TruncatedText> },
    {
      key: "updated",
      header: copy.table.lastChange,
      width: "148px",
      sortKey: "updated",
      defaultSortDirection: "desc",
      render: (o) => <Nowrap>{formatLastChange(o, now)}</Nowrap>,
    },
  );
  return columns;
}
