"use client";

import { styled } from "next-yak";
import { Archive, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import type { TableColumn, TableColumnFilter } from "@/components/ui/Table";
import { partnersCopy } from "../_copy";
import type { AdminPartnerOrganization, PartnerPerson } from "../_data/types";
import { formatDate, formatDateTimeTitle, formatRelativeCell } from "../_lib/format";
import { InvitationBadge, invitationDateText } from "./ContactRowParts";
import { CopyableEmail } from "./CopyableEmail";
import { HealthBadge } from "./HealthBadge";

const copy = partnersCopy.table;

/** A header filter (the Table column's `filter`). */
export type HeaderFilter = TableColumnFilter;

const NameLine = styled.span`
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
`;

const Stack = styled.span`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
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
      render: (org) => (
        <NameLine>
          {org.name}
          {org.status === "removed" && <RemovedBadge />}
        </NameLine>
      ),
    },
    {
      key: "health",
      header: copy.headerHealth,
      sortKey: "health",
      filter: filters.health,
      isEmpty: (org) => !org.health,
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

/**
 * People: Name (sticky), Email (click to copy), Organization (filter), Tags (filter; hidden when no row has
 * one): an invitation state with its date, or Removed with its date. Sort keys match PERSON_SORT_KEYS.
 */
export function personColumns(filters: { organization: HeaderFilter; tags: HeaderFilter }): TableColumn<PartnerPerson>[] {
  return [
    { key: "name", header: copy.headerName, sortKey: "name", render: (person) => person.name },
    { key: "email", header: copy.headerEmail, sortKey: "email", render: (person) => <CopyableEmail email={person.email} /> },
    {
      key: "organization",
      header: copy.headerOrganization,
      sortKey: "organization",
      filter: filters.organization,
      render: (person) => person.organization.name,
    },
    {
      key: "tags",
      header: copy.headerTags,
      sortKey: "tags",
      filter: filters.tags,
      isEmpty: (person) => !person.tag,
      render: (person) => {
        if (person.tag === "removed") {
          return (
            <Stack>
              <RemovedBadge />
              {person.removedAt && <Muted>{formatDate(person.removedAt)}</Muted>}
            </Stack>
          );
        }
        const date = invitationDateText(person);
        return (
          <Stack>
            <InvitationBadge state={person.invitationState} />
            {date && <Muted>{date}</Muted>}
          </Stack>
        );
      },
    },
    chevronColumn(),
  ];
}
