"use client";

import { styled } from "next-yak";
import { Badge } from "@/components/ui/Badge";
import type { TableColumn } from "@/components/ui/Table";
import type { PartnerOrganization, PartnerPerson } from "../_data/types";
import { formatDate, summarizeNames } from "../_lib/format";

const NameLine = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
`;

const Muted = styled.span`
  color: var(--color-text-muted);
`;

/** Organizations table columns: Organization (+ Pending badge), Contacts, Email, Opportunities. */
export const organizationColumns: TableColumn<PartnerOrganization>[] = [
  {
    key: "organization",
    header: "Organization",
    render: (org) => (
      <NameLine>
        {org.name}
        {org.status === "pending" && <Badge $variant="neutral">Pending</Badge>}
      </NameLine>
    ),
  },
  {
    key: "contacts",
    header: "Contacts",
    render: (org) => summarizeNames(org.contacts.map((c) => c.name)),
  },
  {
    key: "email",
    header: "Email",
    render: (org) => org.contacts[0]?.email ?? <Muted>—</Muted>,
  },
  {
    key: "opportunities",
    header: "Opportunities",
    align: "right",
    render: (org) => (org.opportunityCount === 1 ? "1 opportunity" : `${org.opportunityCount} opportunities`),
  },
];

/** People table columns: Name (+ Pending badge), Email, Organization, Invitation. */
export const personColumns: TableColumn<PartnerPerson>[] = [
  {
    key: "name",
    header: "Name",
    render: (person) => (
      <NameLine>
        {person.name}
        {person.status === "pending" && <Badge $variant="neutral">Pending</Badge>}
      </NameLine>
    ),
  },
  { key: "email", header: "Email", render: (person) => person.email },
  { key: "organization", header: "Organization", render: (person) => person.organization.name },
  {
    key: "invitation",
    header: "Invitation",
    render: (person) => {
      if (person.status !== "pending" || !person.invitation) return <Muted>—</Muted>;
      return person.invitation.sendError ? "Invitation not sent" : `Expires ${formatDate(person.invitation.expiresAt)}`;
    },
  },
];

/** Removed organizations table columns: Organization, Contacts, Removed. */
export const removedColumns: TableColumn<PartnerOrganization>[] = [
  { key: "organization", header: "Organization", render: (org) => org.name },
  {
    key: "contacts",
    header: "Contacts",
    render: (org) => summarizeNames(org.contacts.map((c) => c.name)),
  },
  {
    key: "removed",
    header: "Removed",
    render: (org) => (org.removedAt ? formatDate(org.removedAt) : <Muted>—</Muted>),
  },
];
