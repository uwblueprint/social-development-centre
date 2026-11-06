"use client";

import { useState } from "react";
import { styled } from "next-yak";
import { ChevronDown, ChevronRight, Mail, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { type AutomaticEmail, displayName, summarize } from "../_data";
import { Page, PageTitle } from "./parts";

/*
 * Who: the admin, about the 10th visit. She knows what automatic emails are and comes to check what's
 * running, find the one that does X, or add one. So the summary is the content, the default
 * ("sends automatically") goes unsaid, and only the exception that creates work for her is tagged.
 * One list, no cards; Trash is a quiet line at the bottom.
 */

const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-4);
  align-items: center;
  justify-content: space-between;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
`;

const SectionLabel = styled.h2`
  margin: 0 0 var(--space-1);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-text-muted);
`;

/* The whole row opens the email: the name button's ::after stretches over it. The ⋯ menu sits above. */
const Row = styled.div`
  position: relative;
  display: flex;
  gap: var(--space-4);
  align-items: center;
  padding: var(--space-3) var(--space-2);
  margin: 0 calc(var(--space-2) * -1);
  border-radius: var(--radius-md);
  transition: background-color var(--duration) var(--ease);

  &:hover,
  &:focus-within {
    background: var(--color-bg-hover);
  }

  /* Inset hairline between rows; it hides next to a hovered row so only the fill shows. */
  & + &::before {
    content: "";
    position: absolute;
    top: 0;
    left: var(--space-2);
    right: var(--space-2);
    border-top: 1px solid var(--color-border);
  }
  &:hover + &::before,
  &:focus-within + &::before,
  &:hover::before,
  &:focus-within::before {
    border-top-color: transparent;
  }
`;

const RowMain = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const NameButton = styled(Button)`
  position: static;
  align-self: flex-start;
  height: auto;
  padding: 0;
  font-size: var(--text-md);
  text-align: left;
  white-space: normal;

  &&:hover,
  &&:active {
    background: transparent;
    transform: none;
  }
  &&:focus-visible {
    box-shadow: none;
  }

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: var(--radius-md);
  }
  &:focus-visible::after {
    box-shadow: var(--focus-ring);
  }
`;

const Summary = styled.span`
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;

const RowSide = styled.div`
  position: relative;
  z-index: 1;
  flex: none;
  display: flex;
  gap: var(--space-2);
  align-items: center;
`;

/* Hidden until the row is hovered or focused; always there on touch screens. */
const MoreButton = styled(Button)`
  opacity: 0;
  transition: opacity var(--duration) var(--ease);

  ${Row}:hover &,
  ${Row}:focus-within &,
  &[data-state="open"] {
    opacity: 1;
  }
  @media (hover: none) {
    opacity: 1;
  }
`;

const Quiet = styled.p`
  margin: 0;
  padding: var(--space-3) 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const TrashToggle = styled(Button)`
  align-self: flex-start;
  margin-left: calc(var(--space-2) * -1);
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
  const [trashOpen, setTrashOpen] = useState(false);
  const published = emails.filter((e) => e.state === "published");
  const drafts = emails.filter((e) => e.state === "draft");
  const trash = emails.filter((e) => e.state === "trash");

  const row = (e: AutomaticEmail) => (
    <Row key={e.id}>
      <RowMain>
        <NameButton $variant="ghost" onClick={() => onOpen(e.id)}>
          {displayName(e)}
        </NameButton>
        <Summary>{summarize(e)}</Summary>
      </RowMain>
      <RowSide>
        {e.mode === "review" && e.state !== "trash" && <Tag>Waits for approval</Tag>}
        {e.state === "trash" ? (
          <Button $variant="outline" $size="sm" onClick={() => onRestore(e)}>
            Restore
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <MoreButton $variant="ghost" $size="sm" aria-label={`More actions for ${displayName(e)}`}>
                <Icon icon={MoreHorizontal} />
              </MoreButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onDuplicate(e)}>Duplicate</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onTrash(e)}>Move to trash</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </RowSide>
    </Row>
  );

  return (
    <Page>
      <Header>
        <PageTitle>Automatic emails</PageTitle>
        <Button onClick={onCreate}>
          <Icon icon={Plus} />
          New automatic email
        </Button>
      </Header>

      {emails.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No automatic emails yet"
          description="Set up an email once and it sends itself, like a thank-you when someone joins or a check-in a month later."
          action={<Button onClick={onCreate}>Create your first automatic email</Button>}
        />
      ) : (
        <List>
          <Section aria-labelledby="published-label">
            <SectionLabel id="published-label">Published</SectionLabel>
            {published.length ? published.map(row) : <Quiet>Nothing is sending yet. Publish a draft to turn it on.</Quiet>}
          </Section>
          {drafts.length > 0 && (
            <Section aria-labelledby="drafts-label">
              <SectionLabel id="drafts-label">Drafts</SectionLabel>
              {drafts.map(row)}
            </Section>
          )}
          {trash.length > 0 && (
            <Section aria-label="Trash">
              <TrashToggle
                $variant="ghost"
                $size="sm"
                aria-expanded={trashOpen}
                aria-controls="trash-list"
                onClick={() => setTrashOpen((o) => !o)}
              >
                <Icon icon={trashOpen ? ChevronDown : ChevronRight} />
                {`Trash (${trash.length})`}
              </TrashToggle>
              {trashOpen && <div id="trash-list">{trash.map(row)}</div>}
            </Section>
          )}
        </List>
      )}
    </Page>
  );
}
