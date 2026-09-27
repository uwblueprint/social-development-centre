"use client";

import { useState } from "react";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { Separator } from "@/components/ui/Separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/Accordion";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/Collapsible";
import { Tag, SelectableTag, RemovableTag, TagList } from "@/components/ui/Tag";
import { EmptyState } from "@/components/ui/EmptyState";
import { List, ListRow } from "@/components/ui/ListRow";
import { Pagination } from "@/components/ui/Pagination";
import { Table } from "@/components/ui/Table";
import type { TableColumn, TableSort } from "@/components/ui/Table";
import { Building2, ChevronRight, Search, UserPlus, UsersRound } from "lucide-react";
import { ListEmptyState } from "@/components/patterns/ListPage";
import { Icon } from "@/components/ui/Icon";

const Grid = styled.div`
  display: grid;
  gap: var(--space-6);
  grid-template-columns: 1fr;

  @media (min-width: 860px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
`;

const AvatarGroup = styled.div`
  display: flex;

  & > * {
    margin-left: -8px;
    border: 2px solid var(--color-surface-raised) !important;
    position: relative;
  }
  & > *:first-child {
    margin-left: 0;
    z-index: 4;
  }
  & > *:nth-child(2) {
    z-index: 3;
  }
  & > *:nth-child(3) {
    z-index: 2;
  }
  & > *:nth-child(4) {
    z-index: 1;
  }
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
`;

const BadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
`;

const FaqAnswer = styled.p`
  margin: 0;
  line-height: 1.6;
`;

const TagSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const TagSectionLabel = styled.p`
  margin: 0;
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const CollapsibleCard = styled.div`
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
`;

const CollapsibleBody = styled.div`
  padding-top: var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.6;
`;

const TOPICS = [
  "Literacy",
  "Mentorship",
  "Food security",
  "Housing",
  "Youth programs",
  "Seniors",
  "Newcomer services",
  "Employment",
  "Mental health",
  "Volunteering",
  "Community events",
  "Advocacy",
];

const FAQ = [
  {
    q: "Who can join the community program?",
    a: "Anyone in the region is welcome. We run cohorts every quarter and prioritize first-time participants, though returning members are always encouraged to re-enroll.",
  },
  {
    q: "Is there a cost to participate?",
    a: "The core program is free, funded through community grants. Optional workshops may carry a small materials fee, always disclosed up front.",
  },
  {
    q: "How is progress tracked?",
    a: "Facilitators log milestones after each session, and participants can view their own progress and upcoming sessions from their dashboard at any time.",
  },
];

const SAMPLE_ROWS = [
  { name: "Northside Food Bank", meta: "6 opportunities" },
  { name: "Riverbend Youth Collective", meta: "3 opportunities" },
  { name: "Eastside Newcomer Services", meta: "11 opportunities" },
];

export function ListRowDemo() {
  return (
    <List style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
      {SAMPLE_ROWS.map((row) => (
        <ListRow key={row.name} type="button" onClick={() => {}}>
          <span style={{ flex: 1, fontSize: "var(--text-sm)" }}>{row.name}</span>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{row.meta}</span>
          <Icon icon={ChevronRight} size={16} />
        </ListRow>
      ))}
    </List>
  );
}

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

/** Shows `busy` the way a server sort does: the chosen column is active at once, the rows follow. */
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
      aria-label="Members, sortable"
    />
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

export function EmptyStateDemo() {
  return (
    <Stack>
      <Card>
        <EmptyState
          icon={Building2}
          title="No partners yet"
          description="Invite an organization to give them access to their opportunities."
          action={<Button $size="sm">Invite partner</Button>}
        />
      </Card>
      <Card>
        <EmptyState icon={Search} title='No matches for "harbor"' description="Try a different organization name, contact name or email." />
      </Card>
      <ListEmptyStateDemo />
    </Stack>
  );
}

const noop = () => {};

/** ListEmptyState (src/components/patterns/ListPage.tsx) in each of its five variants. */
function ListEmptyStateDemo() {
  const truly = {
    icon: UsersRound,
    title: "No paying members yet",
    description: "Convert a general member to paying from their record, or add a paying member here.",
    action: (
      <Button type="button" $size="sm">
        <Icon icon={UserPlus} size={16} />
        Add member
      </Button>
    ),
  };
  return (
    <Grid>
      <Card>
        <ListEmptyState
          items="paying members"
          query="okafor"
          searchedFields="names and emails"
          onClearSearch={noop}
          elsewhere={{ count: 3, scope: "General members", onShow: noop }}
          empty={truly}
        />
      </Card>
      <Card>
        <ListEmptyState items="members" query="zzz" searchedFields="names and emails" onClearSearch={noop} empty={truly} />
      </Card>
      <Card>
        <ListEmptyState items="jobs" filtered="closed jobs from Northside Food Bank" onClearFilters={noop} empty={truly} />
      </Card>
      <Card>
        <ListEmptyState
          items="jobs"
          query="tutor"
          searchedFields="titles and descriptions"
          filtered="closed jobs from Northside Food Bank"
          onClearSearch={noop}
          onClearFilters={noop}
          onClearSearchAndFilters={noop}
          empty={truly}
        />
      </Card>
      <Card>
        <ListEmptyState items="paying members" empty={truly} />
      </Card>
    </Grid>
  );
}

export function DisplayDemos() {
  const [showMore, setShowMore] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(["Literacy", "Mentorship"]);

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
    );
  };

  const removeTopic = (topic: string) => {
    setSelectedTopics((prev) => prev.filter((t) => t !== topic));
  };

  return (
    <Stack>
      <Grid>
        <Card>
          <CardHeader>
            <Row>
              <CardTitle>Community program</CardTitle>
              <Badge $variant="success">Active</Badge>
            </Row>
            <CardDescription>Neighborhood literacy initiative, spring cohort.</CardDescription>
          </CardHeader>
          <CardContent>
            <Stack style={{ gap: "var(--space-4)" }}>
              <MetaRow>
                <AvatarGroup>
                  <Avatar initials="AK" size="md" />
                  <Avatar initials="RM" size="md" />
                  <Avatar initials="TS" size="md" />
                  <Avatar initials="+8" size="md" />
                </AvatarGroup>
                <Badge $variant="outline">11 members</Badge>
              </MetaRow>
              <div>
                <Row style={{ marginBottom: "var(--space-2)" }}>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                    Enrollment goal
                  </span>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)" }}>68%</span>
                </Row>
                <Progress value={68} aria-label="Enrollment goal progress" />
              </div>
            </Stack>
          </CardContent>
          <CardFooter>
            <Button $size="sm">View program</Button>
            <Button $size="sm" $variant="secondary">
              Invite
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session details</CardTitle>
            <CardDescription>Browse information for the current cohort.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList aria-label="Session sections">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
              </TabsList>
              <TabsContent value="overview">
                <FaqAnswer>
                  This cohort meets weekly to build reading confidence through paired practice and
                  short group workshops led by trained volunteers.
                </FaqAnswer>
              </TabsContent>
              <TabsContent value="schedule">
                <FaqAnswer>
                  Sessions run every Tuesday and Thursday, 5:30&ndash;7:00pm, at the community
                  center. Makeup sessions are scheduled on request.
                </FaqAnswer>
              </TabsContent>
              <TabsContent value="resources">
                <FaqAnswer>
                  Printed workbooks, a shared reading list, and recorded workshop sessions are
                  available to every enrolled participant.
                </FaqAnswer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </Grid>

      <BadgeRow aria-label="Badge variants">
        <Badge>Neutral</Badge>
        <Badge $variant="primary">Primary</Badge>
        <Badge $variant="success">Active</Badge>
        <Badge $variant="warning">Invitation pending</Badge>
        <Badge $variant="danger">Bounced</Badge>
        <Badge $variant="outline">11 members</Badge>
      </BadgeRow>

      <Card>
        <CardHeader>
          <CardTitle>Frequently asked questions</CardTitle>
          <CardDescription>Answers for prospective participants and volunteers.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible defaultValue="item-0">
            {FAQ.map((item, i) => (
              <AccordionItem value={`item-${i}`} key={item.q}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>
                  <div>
                    <FaqAnswer>{item.a}</FaqAnswer>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Grid>
        <Card>
          <CardHeader>
            <CardTitle>Topics</CardTitle>
            <CardDescription>Pick the areas you&apos;d like to hear about.</CardDescription>
          </CardHeader>
          <CardContent>
            <Stack style={{ gap: "var(--space-4)" }}>
              <TagSection>
                <TagList role="group" aria-label="Available topics">
                  {TOPICS.map((topic) => (
                    <SelectableTag
                      key={topic}
                      selected={selectedTopics.includes(topic)}
                      onClick={() => toggleTopic(topic)}
                    >
                      {topic}
                    </SelectableTag>
                  ))}
                </TagList>
              </TagSection>
              <TagSection>
                <TagSectionLabel>Selected</TagSectionLabel>
                {selectedTopics.length > 0 ? (
                  <TagList>
                    {selectedTopics.map((topic) => (
                      <RemovableTag key={topic} onRemove={() => removeTopic(topic)}>
                        {topic}
                      </RemovableTag>
                    ))}
                  </TagList>
                ) : (
                  <Tag>None selected</Tag>
                )}
              </TagSection>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Volunteer notes</CardTitle>
            <CardDescription>Internal notes from the last coordination meeting.</CardDescription>
          </CardHeader>
          <CardContent>
            <Collapsible open={showMore} onOpenChange={setShowMore}>
              <CollapsibleCard>
                <Row>
                  <span style={{ fontSize: "var(--text-sm)" }}>
                    Attendance is up 12% since introducing evening slots.
                  </span>
                  <CollapsibleTrigger asChild>
                    <Button $size="sm" $variant="ghost">
                      {showMore ? "Show less" : "Show more"}
                    </Button>
                  </CollapsibleTrigger>
                </Row>
                <CollapsibleContent>
                  <CollapsibleBody>
                    <p style={{ margin: "0 0 var(--space-3)" }}>
                      We should recruit two more facilitators before the summer cohort opens, and
                      confirm the community center booking for July.
                    </p>
                    <Separator style={{ margin: "var(--space-3) 0" }} />
                    <p style={{ margin: 0 }}>
                      Action items were assigned to Amara and Devon; follow up at next week&apos;s
                      check-in.
                    </p>
                  </CollapsibleBody>
                </CollapsibleContent>
              </CollapsibleCard>
            </Collapsible>
          </CardContent>
        </Card>
      </Grid>
    </Stack>
  );
}
