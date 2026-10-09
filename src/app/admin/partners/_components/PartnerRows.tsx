"use client";

import type * as React from "react";
import { styled } from "next-yak";
import { Archive, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { TableColumn, TableColumnFilter } from "@/components/ui/Table";
import { TruncatedText } from "@/components/ui/TruncatedText";
import { invitationCopy, partnersCopy } from "../_copy";
import type { AdminPartnerOrganization, PartnerPerson } from "../_data/types";
import { formatDateTimeTitle, formatRelativeCell, formatShortDateCell } from "../_lib/format";
import { InvitationBadge } from "./ContactRowParts";
import { CopyableEmail } from "./CopyableEmail";
import { HealthBadge } from "./HealthBadge";

const copy = partnersCopy.table;

/** A header filter (the Table column's `filter`). */
export type HeaderFilter = TableColumnFilter;

/* One line per row: cells never wrap; long text truncates (TruncatedText shows the rest on hover). */
const NameLine = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  max-width: 100%;
  white-space: nowrap;
`;

const TagLine = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  white-space: nowrap;
`;

/* The Organization cell opens that organization's panel (Organizations view). */
/* Reads as the cell's text; a ghost hover fill shows it opens the organization. Padding is cancelled by
   an equal negative margin so the name lines up with the other cells. */
const OrganizationLink = styled(Button)`
  min-width: 0;
  max-width: 100%;
  height: auto;
  min-height: 24px;
  margin: 0 calc(var(--space-1) * -1);
  padding: 0 var(--space-1);
  justify-content: flex-start;
  font-size: var(--text-sm);
  font-weight: var(--weight-regular);
`;

const Badged = styled.span`
  flex: none;
  display: inline-flex;
`;

const Muted = styled.span`
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
`;

const Chevron = styled.span`
  display: inline-flex;
  color: var(--color-text-muted);
`;

/** Marks every row as opening a panel (with the row's hover and focus treatment). */
const chevronColumn = <T,>(): TableColumn<T> => ({
  key: "open",
  header: "",
  align: "right",
  width: "48px",
  render: () => (
    <Chevron aria-hidden="true">
      <Icon icon={ChevronRight} size={16} />
    </Chevron>
  ),
});

const RemovedBadge = () => (
  <Badge $variant="outline">
    <Icon icon={Archive} size={12} />
    {partnersCopy.badges.removed}
  </Badge>
);

/**
 * Organizations: Organization (Status filter; removed ones say so), Health (filter; hidden when no row has a
 * tag), People, Published, Last posted. Every column sorts on the server; `sortKey`s match ORGANIZATION_SORT_KEYS.
 */
export function organizationColumns(
  filters: { status: HeaderFilter; health: HeaderFilter },
  now: string,
): TableColumn<AdminPartnerOrganization>[] {
  return [
    {
      key: "organization",
      header: copy.headerOrganization,
      sortKey: "name",
      filter: filters.status,
      width: "280px",
      render: (org) => (
        <NameLine>
          <TruncatedText tooltip>{org.name}</TruncatedText>
          {org.status === "removed" && (
            <Badged>
              <RemovedBadge />
            </Badged>
          )}
        </NameLine>
      ),
    },
    {
      key: "health",
      header: copy.headerHealth,
      sortKey: "health",
      filter: filters.health,
      isEmpty: (org) => !org.health,
      width: "180px",
      render: (org) => (org.health ? <HealthBadge tag={org.health.tag} /> : null),
    },
    {
      key: "people",
      header: copy.headerPeople,
      sortKey: "people",
      defaultSortDirection: "desc",
      align: "right",
      render: (org) => org.contacts.length,
    },
    {
      key: "published",
      header: copy.headerPublished,
      sortKey: "published",
      defaultSortDirection: "desc",
      align: "right",
      render: (org) => org.opportunityCount,
    },
    {
      key: "lastPosted",
      header: copy.headerLastPosted,
      sortKey: "lastPosted",
      defaultSortDirection: "desc",
      render: (org) =>
        org.lastPostedAt ? (
          <time dateTime={org.lastPostedAt} title={formatDateTimeTitle(org.lastPostedAt)}>
            {formatRelativeCell(org.lastPostedAt, now)}
          </time>
        ) : (
          <Muted>{copy.never}</Muted>
        ),
    },
    chevronColumn(),
  ];
}

/** "Expires Oct 2" / "Expired Oct 2" (no year in the current year); nothing when there's no expiry. */
function invitationDateCell(person: PartnerPerson, now: string): string | null {
  const expiresAt = person.invitation?.expiresAt;
  if (!expiresAt) return null;
  const date = formatShortDateCell(expiresAt, now);
  if (person.invitationState === "pending") return invitationCopy.expires(date);
  if (person.invitationState === "expired") return invitationCopy.expiredOn(date);
  return null;
}

/**
 * People: Name (sticky), Email (click to copy), Organization (filter; opens its panel), Tags (filter; hidden
 * when no row has one): an invitation state with its date, or Removed with its date, on one line; then the
 * row's ⋯ menu. Rows don't open a panel. Sort keys match PERSON_SORT_KEYS.
 */
export function personColumns(
  filters: { organization: HeaderFilter; tags: HeaderFilter },
  options: {
    now: string;
    onOpenOrganization: (organizationId: string) => void;
    renderActions: (person: PartnerPerson) => React.ReactNode;
  },
): TableColumn<PartnerPerson>[] {
  const { now, onOpenOrganization, renderActions } = options;
  return [
    {
      key: "name",
      header: copy.headerName,
      sortKey: "name",
      width: "160px",
      render: (person) => <TruncatedText tooltip>{person.name}</TruncatedText>,
    },
    {
      key: "email",
      header: copy.headerEmail,
      sortKey: "email",
      width: "250px",
      render: (person) => <CopyableEmail email={person.email} />,
    },
    {
      key: "organization",
      header: copy.headerOrganization,
      sortKey: "organization",
      filter: filters.organization,
      width: "200px",
      render: (person) => (
        <OrganizationLink
          type="button"
          $variant="ghost"
          aria-label={partnersCopy.person.openOrganization(person.organization.name)}
          onClick={() => onOpenOrganization(person.organization.id)}
        >
          <TruncatedText tooltip>{person.organization.name}</TruncatedText>
        </OrganizationLink>
      ),
    },
    {
      key: "tags",
      header: copy.headerTags,
      sortKey: "tags",
      filter: filters.tags,
      isEmpty: (person) => !person.tag,
      render: (person) => {
        const date =
          person.tag === "removed" ? person.removedAt && formatShortDateCell(person.removedAt, now) : invitationDateCell(person, now);
        return (
          <TagLine>
            {person.tag === "removed" ? <RemovedBadge /> : <InvitationBadge state={person.invitationState} />}
            {date && <Muted>· {date}</Muted>}
          </TagLine>
        );
      },
    },
    { key: "actions", header: "", align: "right", width: "72px", render: renderActions },
  ];
}
