"use client";

import { styled } from "next-yak";
import { Mail, MoreHorizontal, Plus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { type AutomaticEmail, GROUPS, STATE_META, displayName, summarize } from "../_data";
import { Muted, Page, PageHeader, PageTitle, Row, RowMain, RowSide, SectionTitle } from "./parts";

const Group = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const GroupHeading = styled.div`
  display: flex;
  gap: var(--space-2);
  align-items: center;
`;

/** Opens the email: reads as the row's title, sized like one. */
const NameButton = styled(Button)`
  align-self: flex-start;
  height: auto;
  padding: 0;
  font-size: var(--text-md);
  text-align: left;

  &:hover {
    background: transparent;
    text-decoration: underline;
  }
`;

const Summary = styled.div`
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;

const EmptyGroup = styled.div`
  padding: var(--space-4) var(--space-5);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

export function EmailList({
  emails,
  onCreate,
  onOpen,
  onDuplicate,
  onRestore,
  onTrash,
}: {
  emails: AutomaticEmail[];
  onCreate: () => void;
  onOpen: (id: string) => void;
  onDuplicate: (e: AutomaticEmail) => void;
  onRestore: (e: AutomaticEmail) => void;
  onTrash: (e: AutomaticEmail) => void;
}) {
  return (
    <Page>
      <PageHeader>
        <div>
          <PageTitle>Automatic emails</PageTitle>
          <Muted>Emails that send themselves when something happens to a member.</Muted>
        </div>
        <Button onClick={onCreate}>
          <Icon icon={Plus} />
          New automatic email
        </Button>
      </PageHeader>

      {emails.length === 0 ? (
        <Card>
          <EmptyState
            icon={Mail}
            title="No automatic emails yet"
            description="Set up an email once and it sends itself, like a thank-you when someone joins or a check-in a month later."
            action={<Button onClick={onCreate}>Create your first automatic email</Button>}
          />
        </Card>
      ) : (
        GROUPS.map((g) => {
          const items = emails.filter((e) => e.state === g.key);
          return (
            <Group key={g.key} aria-labelledby={`group-${g.key}`}>
              <GroupHeading>
                <SectionTitle id={`group-${g.key}`}>{g.title}</SectionTitle>
                <Badge>{items.length}</Badge>
              </GroupHeading>
              <Card>
                {items.length === 0 && <EmptyGroup>{g.emptyText}</EmptyGroup>}
                {items.map((e) => (
                  <Row key={e.id}>
                    <RowMain>
                      <NameButton $variant="ghost" onClick={() => onOpen(e.id)}>
                        {displayName(e)}
                      </NameButton>
                      <Summary>{summarize(e)}</Summary>
                    </RowMain>
                    <RowSide>
                      <Badge $variant="outline">
                        {e.mode === "auto" ? "Sends automatically" : "Review before sending"}
                      </Badge>
                      <Badge $variant={STATE_META[e.state].variant}>{STATE_META[e.state].label}</Badge>
                      {e.state === "trash" ? (
                        <Button $variant="outline" $size="sm" onClick={() => onRestore(e)}>
                          Restore
                        </Button>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button $variant="ghost" $size="sm" aria-label={`More actions for ${displayName(e)}`}>
                              <Icon icon={MoreHorizontal} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => onDuplicate(e)}>Duplicate</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onTrash(e)}>Move to trash</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </RowSide>
                  </Row>
                ))}
              </Card>
            </Group>
          );
        })
      )}
    </Page>
  );
}
