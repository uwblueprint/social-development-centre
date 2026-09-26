"use client";

import { styled } from "next-yak";
import { Badge } from "@/components/ui/Badge";
import type { TableColumn } from "@/components/ui/Table";
import { partnersCopy as copy } from "../_copy";
import type { PartnerOrganization, PartnerPerson, PendingInvitation } from "../_data/types";
import { formatDate, summarizeNames } from "../_lib/format";
import { InvitationRowActions } from "./InvitationRowActions";

const NameLine = styled.span`
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
`;

const PersonCell = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Muted = styled.span`
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
`;

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

/** Organizations table columns: Organization (+ "Invitation pending" until any contact accepts), Contacts, Email, Opportunities. */
export const organizationColumns: TableColumn<PartnerOrganization>[] = [
  {
    key: "organization",
    header: copy.table.headerOrganization,
    render: (org) => (
      <NameLine>
        {org.name}
        {org.status === "pending" && <Badge $variant="warning">{copy.badges.invitationPending}</Badge>}
      </NameLine>
    ),
  },
  {
    key: "contacts",
    header: copy.table.headerContacts,
    render: (org) => summarizeNames(org.contacts.map((c) => c.name)),
  },
  {
    key: "email",
    header: copy.table.headerEmail,
    render: (org) => org.contacts[0]?.email,
  },
  {
    key: "opportunities",
    header: copy.table.headerOpportunities,
    align: "right",
    render: (org) => copy.table.opportunities(org.opportunityCount),
  },
];

/** People table columns (active contacts only): Name, Email, Organization. */
export const personColumns: TableColumn<PartnerPerson>[] = [
  { key: "name", header: copy.table.headerName, render: (person) => person.name },
  { key: "email", header: copy.table.headerEmail, render: (person) => person.email },
  { key: "organization", header: copy.table.headerOrganization, render: (person) => person.organization.name },
];

/** "Not delivered" wins over "Expired": the person never got a link to expire. */
function invitationBadge(invitation: PendingInvitation) {
  if (invitation.invitation.sendError) return <Badge $variant="warning">{copy.badges.notDelivered}</Badge>;
  if (invitation.expired) return <Badge $variant="warning">{copy.badges.expired}</Badge>;
  return null;
}

/** Invitations table columns: Name + email (+ problem badge), Organization, Sent, Expires, ⋯ menu. */
export const invitationColumns: TableColumn<PendingInvitation>[] = [
  {
    key: "name",
    header: copy.table.headerName,
    render: (invitation) => (
      <PersonCell>
        <NameLine>
          {invitation.name}
          {invitationBadge(invitation)}
        </NameLine>
        <Muted>{invitation.email}</Muted>
      </PersonCell>
    ),
  },
  { key: "organization", header: copy.table.headerOrganization, render: (invitation) => invitation.organization.name },
  { key: "sent", header: copy.table.headerSent, render: (invitation) => formatDate(invitation.invitation.sentAt) },
  { key: "expires", header: copy.table.headerExpires, render: (invitation) => formatDate(invitation.invitation.expiresAt) },
  {
    key: "actions",
    header: <VisuallyHidden>{copy.table.headerActions}</VisuallyHidden>,
    align: "right",
    render: (invitation) => <InvitationRowActions invitation={invitation} />,
  },
];

/** Removed organizations table columns: Organization, Contacts, Removed. */
export const removedColumns: TableColumn<PartnerOrganization>[] = [
  { key: "organization", header: copy.table.headerOrganization, render: (org) => org.name },
  {
    key: "contacts",
    header: copy.table.headerContacts,
    render: (org) => summarizeNames(org.contacts.map((c) => c.name)),
  },
  {
    key: "removed",
    header: copy.table.headerRemoved,
    render: (org) => (org.removedAt ? formatDate(org.removedAt) : null),
  },
];
