"use client";

import { styled } from "next-yak";
import { Badge } from "@/components/ui/Badge";
import type { TableColumn } from "@/components/ui/Table";
import type { Member } from "../_data/types";
import { formatDate } from "../_lib/format";

const Name = styled.span<{ $muted?: boolean }>`
  color: ${({ $muted }) => ($muted ? "var(--color-text-muted)" : "var(--color-text)")};
`;

const Email = styled.span`
  overflow-wrap: anywhere;
`;

/** Community table columns: Name (or "No name", muted), Email, Status (Unsubscribed badge only), Added. */
export const memberColumns: TableColumn<Member>[] = [
  {
    key: "name",
    header: "Name",
    render: (member) => <Name $muted={!member.name}>{member.name ?? "No name"}</Name>,
  },
  {
    key: "email",
    header: "Email",
    render: (member) => <Email>{member.email}</Email>,
  },
  {
    key: "status",
    header: "Status",
    render: (member) => (!member.subscribed ? <Badge $variant="outline">Unsubscribed</Badge> : null),
  },
  {
    key: "added",
    header: "Added",
    render: (member) => formatDate(member.addedAt),
  },
];
