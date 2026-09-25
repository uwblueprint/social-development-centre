"use client";

import { styled } from "next-yak";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { ListRow } from "@/components/ui/ListRow";
import type { Member } from "../_data/types";
import { formatDate } from "../_lib/format";

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

const Name = styled.span<{ $muted?: boolean }>`
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: ${({ $muted }) => ($muted ? "var(--color-text-muted)" : "var(--color-text)")};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Email = styled.span`
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Meta = styled.div`
  flex-shrink: 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
`;

const Chevron = styled.span`
  flex-shrink: 0;
  display: inline-flex;
  color: var(--color-text-subtle);
`;

export function MemberRow({ member, onOpen }: { member: Member; onOpen: () => void }) {
  return (
    <ListRow type="button" onClick={onOpen}>
      <Main>
        <TopLine>
          <Name $muted={!member.name}>{member.name ?? "No name"}</Name>
          {!member.subscribed && <Badge $variant="outline">Unsubscribed</Badge>}
        </TopLine>
        <Email>{member.email}</Email>
      </Main>
      <Meta>Added {formatDate(member.addedAt)}</Meta>
      <Chevron aria-hidden="true">
        <Icon icon={ChevronRight} size={16} />
      </Chevron>
    </ListRow>
  );
}
