"use client";

import { styled } from "next-yak";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { ListRow } from "@/components/ui/ListRow";
import type { PartnerOrganization, PartnerPerson } from "../_data/types";
import { formatDate, summarizeNames } from "../_lib/format";

const Main = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const TopLine = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`;

const Name = styled.span`
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SubLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Meta = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  text-align: right;
  white-space: nowrap;
`;

const Chevron = styled.span`
  flex-shrink: 0;
  display: inline-flex;
  color: var(--color-text-subtle);
`;

export function OrganizationRow({ org, onOpen }: { org: PartnerOrganization; onOpen: () => void }) {
  return (
    <ListRow type="button" onClick={onOpen}>
      <Main>
        <TopLine>
          <Name>{org.name}</Name>
          {org.status === "pending" && <Badge $variant="neutral">Pending</Badge>}
        </TopLine>
        <SubLine>
          <span>{summarizeNames(org.contacts.map((c) => c.name))}</span>
          {org.contacts[0] && <span>{org.contacts[0].email}</span>}
        </SubLine>
      </Main>
      <Meta>{org.opportunityCount === 1 ? "1 opportunity" : `${org.opportunityCount} opportunities`}</Meta>
      <Chevron aria-hidden="true">
        <Icon icon={ChevronRight} size={16} />
      </Chevron>
    </ListRow>
  );
}

export function PersonRow({ person, onOpen }: { person: PartnerPerson; onOpen: () => void }) {
  return (
    <ListRow type="button" onClick={onOpen}>
      <Main>
        <TopLine>
          <Name>{person.name}</Name>
          {person.status === "pending" && <Badge $variant="neutral">Pending</Badge>}
        </TopLine>
        <SubLine>
          <span>{person.email}</span>
        </SubLine>
      </Main>
      <Meta>
        <span>{person.organization.name}</span>
        {person.status === "pending" &&
          person.invitation &&
          (person.invitation.sendError ? <span>Invitation not sent</span> : <span>Expires {formatDate(person.invitation.expiresAt)}</span>)}
      </Meta>
      <Chevron aria-hidden="true">
        <Icon icon={ChevronRight} size={16} />
      </Chevron>
    </ListRow>
  );
}

export function RemovedRow({ org, onOpen }: { org: PartnerOrganization; onOpen: () => void }) {
  return (
    <ListRow type="button" onClick={onOpen}>
      <Main>
        <TopLine>
          <Name>{org.name}</Name>
        </TopLine>
        <SubLine>
          <span>{summarizeNames(org.contacts.map((c) => c.name))}</span>
        </SubLine>
      </Main>
      <Meta>{org.removedAt && <span>Removed {formatDate(org.removedAt)}</span>}</Meta>
      <Chevron aria-hidden="true">
        <Icon icon={ChevronRight} size={16} />
      </Chevron>
    </ListRow>
  );
}
