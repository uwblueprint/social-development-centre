"use client";

import { styled } from "next-yak";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import type { TableColumn } from "@/components/ui/Table";
import { partnersCopy } from "../_copy";
import type { PartnerOrganization, PartnerPerson } from "../_data/types";
import { formatDate, summarizeNames } from "../_lib/format";
import { InvitationBadge, invitationDateText } from "./ContactRowParts";

const copy = partnersCopy.table;

const NameLine = styled.span`
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
`;

const Stack = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Muted = styled.span`
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
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

const peopleColumn: TableColumn<PartnerOrganization> = {
  key: "people",
  header: copy.headerPeople,
  render: (org) => summarizeNames(org.contacts.map((c) => c.name)),
};

/** Organizations, Active: Organization (+ Awaiting response until anyone accepts), People, Email, Opportunities. */
export const organizationColumns: TableColumn<PartnerOrganization>[] = [
  {
    key: "organization",
    header: copy.headerOrganization,
    render: (org) => (
      <NameLine>
        {org.name}
        {org.status === "pending" && <Badge $variant="neutral">{partnersCopy.badges.awaitingResponse}</Badge>}
      </NameLine>
    ),
  },
  peopleColumn,
  { key: "email", header: copy.headerEmail, render: (org) => org.contacts[0]?.email },
  {
    key: "opportunities",
    header: copy.headerOpportunities,
    align: "right",
    render: (org) => copy.opportunities(org.opportunityCount),
  },
  chevronColumn(),
];

/** Organizations, Removed: Organization, People, Removed. */
export const removedOrganizationColumns: TableColumn<PartnerOrganization>[] = [
  { key: "organization", header: copy.headerOrganization, render: (org) => org.name },
  peopleColumn,
  { key: "removed", header: copy.headerRemoved, render: (org) => (org.removedAt ? formatDate(org.removedAt) : null) },
  chevronColumn(),
];

/** People, Active: Name (+ invitation state and date), Email, Organization. */
export const personColumns: TableColumn<PartnerPerson>[] = [
  {
    key: "name",
    header: copy.headerName,
    render: (person) => {
      const date = invitationDateText(person);
      return (
        <Stack>
          <NameLine>
            {person.name}
            <InvitationBadge state={person.invitationState} />
          </NameLine>
          {date && <Muted>{date}</Muted>}
        </Stack>
      );
    },
  },
  { key: "email", header: copy.headerEmail, render: (person) => person.email },
  { key: "organization", header: copy.headerOrganization, render: (person) => person.organization.name },
  chevronColumn(),
];

/** People, Removed: Name, Email, Organization, Removed. */
export const removedPersonColumns: TableColumn<PartnerPerson>[] = [
  { key: "name", header: copy.headerName, render: (person) => person.name },
  { key: "email", header: copy.headerEmail, render: (person) => person.email },
  { key: "organization", header: copy.headerOrganization, render: (person) => person.organization.name },
  { key: "removed", header: copy.headerRemoved, render: (person) => (person.removedAt ? formatDate(person.removedAt) : null) },
  chevronColumn(),
];
