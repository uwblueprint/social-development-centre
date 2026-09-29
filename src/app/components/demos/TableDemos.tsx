"use client";

import { useState } from "react";
import { styled } from "next-yak";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { Table } from "@/components/ui/Table";
import type { TableColumn, TableSort } from "@/components/ui/Table";
import { TruncatedEmail, TruncatedText } from "@/components/ui/TruncatedText";

interface DemoMember {
  id: string;
  name: string | null;
  email: string;
  subscribed: boolean;
  addedAt: string;
}

const TABLE_ROWS: DemoMember[] = [
  { id: "1", name: "Amara Okafor", email: "amara@example.org", subscribed: true, addedAt: "2026-01-14" },
  { id: "2", name: null, email: "grace@example.org", subscribed: true, addedAt: "2026-02-02" },
  { id: "3", name: "Luis Romero", email: "luis@example.org", subscribed: false, addedAt: "2025-11-30" },
];

const TABLE_COLUMNS: TableColumn<DemoMember>[] = [
  { key: "name", header: "Name", render: (m) => (m.name ? m.name : <span style={{ color: "var(--color-text-muted)" }}>No name</span>) },
  { key: "email", header: "Email", render: (m) => m.email },
  { key: "status", header: "Status", render: (m) => (!m.subscribed ? <Badge $variant="outline">Unsubscribed</Badge> : null) },
  { key: "added", header: "Added", render: (m) => new Date(m.addedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) },
];

export function TableDemo() {
  return (
    <Table
      columns={TABLE_COLUMNS}
      rows={TABLE_ROWS}
      getRowId={(m) => m.id}
      onRowClick={() => {}}
      aria-label="Members"
    />
  );
}

const SORTABLE_COLUMNS: TableColumn<DemoMember>[] = [
  { ...TABLE_COLUMNS[0], sortKey: "name" },
  { ...TABLE_COLUMNS[1], sortKey: "email" },
  TABLE_COLUMNS[2],
  { ...TABLE_COLUMNS[3], sortKey: "added", defaultSortDirection: "desc" },
];

/** Sorts in the browser for the demo; list pages sort on the server via `useListSort()`. */
function sortMembers(rows: DemoMember[], sort: TableSort) {
  const value = (m: DemoMember) => (sort.key === "name" ? (m.name ?? "") : sort.key === "email" ? m.email : m.addedAt);
  const sorted = [...rows].sort((a, b) => value(a).localeCompare(value(b)));
  return sort.direction === "asc" ? sorted : sorted.reverse();
}

/** Shows `sortPending` and `busy` the way a server sort does: the chosen column is active at once (spinner), the rows follow. */
export function SortableTableDemo() {
  const [sort, setSort] = useState<TableSort>({ key: "added", direction: "desc" });
  const [rowsSort, setRowsSort] = useState<TableSort>(sort);
  const busy = sort !== rowsSort;
  return (
    <Table
      columns={SORTABLE_COLUMNS}
      rows={sortMembers(TABLE_ROWS, rowsSort)}
      getRowId={(m) => m.id}
      onRowClick={() => {}}
      sort={sort}
      onSortChange={(next) => {
        setSort(next);
        setTimeout(() => setRowsSort(next), 900); // a pretend server round trip
      }}
      busy={busy}
      sortPending={busy}
      aria-label="Members, sortable"
    />
  );
}

interface DemoPartnerPerson {
  id: string;
  name: string;
  organization: string;
  email: string;
  role: "Owner" | "Poster";
  status: "Active" | "Invited";
  city: string;
  tags: string[];
}

const PARTNER_PEOPLE: DemoPartnerPerson[] = [
  { id: "1", name: "Amara Okafor", organization: "Northside Community Food Bank and Kitchen", email: "amara.okafor.coordinator@northsidefood.org", role: "Owner", status: "Active", city: "Toronto", tags: [] },
  { id: "2", name: "Luis Romero", organization: "Riverbend Youth Collective", email: "luis@riverbend.org", role: "Poster", status: "Invited", city: "Hamilton", tags: [] },
  { id: "3", name: "Grace Liu", organization: "Eastside Newcomer Services", email: "grace@eastside.org", role: "Poster", status: "Active", city: "Mississauga", tags: [] },
  { id: "4", name: "Samir Haddad", organization: "Northside Food Bank", email: "samir@northsidefood.org", role: "Poster", status: "Invited", city: "Toronto", tags: [] },
];

const Nowrap = styled.span`
  white-space: nowrap;
`;

/* Narrower than the table so it scrolls sideways and the frozen columns show. */
const ScrollDemoFrame = styled.div`
  max-width: calc(var(--space-8) * 8);
`;

/** Filters in column headers, the first two columns frozen, and an all-empty Tags column hidden. */
export function FilterTableDemo() {
  const [status, setStatus] = useState<string[]>([]);
  const [role, setRole] = useState<string[]>([]);
  const countOf = (key: "status" | "role", value: string) => PARTNER_PEOPLE.filter((p) => p[key] === value).length;
  const rows = PARTNER_PEOPLE.filter(
    (p) => (status.length === 0 || status.includes(p.status)) && (role.length === 0 || role.includes(p.role)),
  );
  const columns: TableColumn<DemoPartnerPerson>[] = [
    { key: "name", header: "Name", render: (p) => <Nowrap>{p.name}</Nowrap> },
    { key: "organization", header: "Organization", width: "200px", render: (p) => <TruncatedText tooltip>{p.organization}</TruncatedText> },
    { key: "email", header: "Email", width: "220px", render: (p) => <TruncatedEmail email={p.email} /> },
    {
      key: "role",
      header: "Role",
      render: (p) => p.role,
      filter: {
        label: "Role",
        options: ["Owner", "Poster"].map((v) => ({ value: v, label: v, count: countOf("role", v) })),
        selected: role,
        onChange: setRole,
      },
    },
    {
      key: "status",
      header: "Status",
      render: (p) => <Badge $variant={p.status === "Active" ? "success" : "neutral"}>{p.status}</Badge>,
      filter: {
        label: "Status",
        options: ["Active", "Invited"].map((v) => ({ value: v, label: v, count: countOf("status", v) })),
        selected: status,
        onChange: setStatus,
      },
    },
    { key: "city", header: "City", render: (p) => p.city },
    { key: "tags", header: "Tags", render: (p) => p.tags.join(", "), isEmpty: (p) => p.tags.length === 0 },
  ];
  return (
    <ScrollDemoFrame>
      <Table
        columns={columns}
        rows={rows}
        getRowId={(p) => p.id}
        onRowClick={() => {}}
        stickyColumns={2}
        aria-label="Partner people, filterable"
        empty={<EmptyState icon={Search} title="No people match these filters" description="Clear a filter to see more people." />}
      />
    </ScrollDemoFrame>
  );
}

export function PaginationDemo() {
  const [page, setPage] = useState(2);
  const total = 962;
  const pageSize = 50;
  return (
    <Pagination
      page={page}
      pageCount={Math.ceil(total / pageSize)}
      pageSize={pageSize}
      total={total}
      onPageChange={setPage}
    />
  );
}
