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
import { ScrollArea } from "@/components/ui/ScrollArea";

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

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
`;

const FaqAnswer = styled.p`
  margin: 0;
  line-height: 1.6;
`;

const TagScrollArea = styled(ScrollArea)`
  height: 180px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
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

const TAGS = Array.from({ length: 20 }, (_, i) => `topic-${i + 1}`);

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

export function DisplayDemos() {
  const [showMore, setShowMore] = useState(false);

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
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>68%</span>
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
            <CardTitle>Popular tags</CardTitle>
            <CardDescription>Scroll to see all topics covered this quarter.</CardDescription>
          </CardHeader>
          <CardContent>
            <TagScrollArea>
              <TagList>
                {TAGS.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </TagList>
            </TagScrollArea>
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
