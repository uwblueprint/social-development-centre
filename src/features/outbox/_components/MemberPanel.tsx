"use client";

import * as React from "react";
import { styled } from "next-yak";
import { CalendarDays, Clock, Mail, Tag as TagIcon, Users, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Tag, TagList } from "@/components/ui/Tag";
import { dayDate, joinedDay, monthYear, otherEmails, whyOf, type Send } from "../_data";
import { useOutboxData } from "../_outboxData";

/*
 * The panel beside an open email: who this member is, why they got this email, and what else they have.
 * It sits inside EmailView's container (the `container-type` on its Outer), so the side-by-side layout
 * below reacts to the pane's width, not the window's.
 *
 * Alignment: one strict two-column grid for every row. Column A is a 16px icon column, column B is the content,
 * --space-2 apart. Section headings start at column A's x (the panel's left edge); every content line starts at column B's x.
 * A row with no icon (a continuation line, a chip row under a condition, a note) leaves column A empty.
 * Text lines are --space-5 (24px) tall, a whole pixel, so the 16px icon centres on 4px, not a half pixel.
 * Tag chips are --pill-height (28px) tall, so the icon box of a chip row is 28px (centred on 6px).
 * Rows in a section are --space-2 apart; sections are split by a hairline with --space-4 above and below it.
 */

/* A quiet surface: no card. Sections are split by spacing and a hairline. Stacked, the whole panel is set off from the email by one too. */
const Panel = styled.aside`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
  font-size: var(--text-sm);
  line-height: var(--space-5);

  @container (min-width: 720px) {
    /* A vertical line the full height of both columns, with --space-5 before it (the grid gap) and after it. */
    box-sizing: border-box;
    align-self: stretch;
    padding-top: 0;
    padding-left: var(--space-5);
    border-top: 0;
    border-left: 1px solid var(--color-border);
  }
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;

  & + & {
    padding-top: var(--space-4);
    border-top: 1px solid var(--color-border);
  }
  & ul {
    margin: 0;
  }
`;

/* All three section headings: same size, weight, colour. They start at column A's x. */
const Heading = styled.h3`
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  line-height: var(--space-5);
  color: var(--color-text);
  overflow-wrap: anywhere;
`;

/* Rows sit --space-2 apart, in every section. */
const Rows = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
`;

/* One row of the grid: column A (icon or empty), column B (content). The same two columns everywhere. */
const Row = styled.div`
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr);
  column-gap: var(--space-2);
  min-width: 0;
  overflow-wrap: anywhere;
`;

const RowIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--space-5);
  color: var(--color-text-muted);
`;

/* Chips are 28px tall, so a row that starts with chips gets a 28px icon box. */
const ChipRowIcon = styled(RowIcon)`
  height: var(--pill-height);
`;

const RowText = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const Muted = styled.span`
  color: var(--color-text-muted);
`;

/* Said to screen readers where the icon says it to sighted people ("Who:", "When:"). */
const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

const Others = styled.ul`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: 0;
  list-style: none;
`;

/* The date and status are one muted line; the email's name sits under it in the text colour. */
const OtherMeta = styled.span`
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
`;

const OtherName = styled.span`
  display: block;
  overflow-wrap: anywhere;
`;

/* A text link that acts like a button: the kit button's box, padding and hover fill are taken off, so it reads as a link and starts at column B's x. */
const ShowAll = styled(Button)`
  align-self: flex-start;
  height: auto;
  min-height: 0;
  margin-top: var(--space-1);
  padding: 0;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--color-text);
  text-decoration: underline;
  text-underline-offset: 3px;

  &:hover:not(:disabled) {
    background: transparent;
    text-decoration-thickness: 2px;
  }
`;

/** More than this many tags and the rest sit behind "Show all". */
const TAGS_SHOWN = 8;

/** A row with an optional icon in column A; without one, column A stays empty so the content still starts in column B. */
function InfoRow({ icon, chips, children }: { icon?: LucideIcon; chips?: boolean; children: React.ReactNode }) {
  const Box = chips ? ChipRowIcon : RowIcon;
  return (
    <Row>
      <Box aria-hidden="true">{icon && <Icon icon={icon} size={16} />}</Box>
      <RowText>{children}</RowText>
    </Row>
  );
}

export function MemberPanel({ send, sends }: { send: Send; sends: Send[] }) {
  const { members, templates } = useOutboxData();
  const m = members[send.member];
  const headingId = React.useId();
  const { rule } = templates[send.template];
  const why = whyOf(send, m, rule);
  const other = otherEmails(send, sends);
  // The tags that explain this email come first, then the rest A to Z. Collapsed after TAGS_SHOWN; reset when another email opens.
  const matched = new Set([...why.who.flatMap((w) => w.tags), ...(rule.trigger.kind === "tag" ? [rule.trigger.tag] : [])]);
  const sortedTags = [...m.tags].sort((a, b) => Number(matched.has(b)) - Number(matched.has(a)) || a.localeCompare(b));
  const [expandedFor, setExpandedFor] = React.useState<string | null>(null);
  const expanded = expandedFor === send.id;
  const shownTags = expanded || sortedTags.length <= TAGS_SHOWN ? sortedTags : sortedTags.slice(0, TAGS_SHOWN);

  return (
    <Panel aria-labelledby={headingId}>
      <Section>
        <Heading id={headingId}>About {m.first || "this member"}</Heading>
        <Rows>
          <InfoRow icon={Mail}>{m.email}</InfoRow>
          {joinedDay(m) != null && <InfoRow icon={CalendarDays}>Member since {monthYear(dayDate(joinedDay(m)!))}</InfoRow>}
          {m.tags.length > 0 && (
            <InfoRow icon={TagIcon} chips>
              <TagList>
                {shownTags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </TagList>
              {sortedTags.length > TAGS_SHOWN && (
                <ShowAll $variant="ghost" $size="sm" aria-expanded={expanded} onClick={() => setExpandedFor(expanded ? null : send.id)}>
                  {expanded ? "Show fewer tags" : `Show all ${sortedTags.length} tags`}
                </ShowAll>
              )}
            </InfoRow>
          )}
        </Rows>
      </Section>

      <Section>
        <Heading>Why this email</Heading>
        <Rows>
          {why.who.map((w, i) => (
            <React.Fragment key={w.text}>
              <InfoRow icon={i === 0 ? Users : undefined}>
                <span>
                  {i === 0 && <VisuallyHidden>Who: </VisuallyHidden>}
                  {w.text}
                </span>
              </InfoRow>
              {w.tags.length > 0 && (
                <InfoRow chips>
                  <TagList>
                    {w.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </TagList>
                </InfoRow>
              )}
            </React.Fragment>
          ))}
          <InfoRow icon={Clock}>
            <span>
              <VisuallyHidden>When: </VisuallyHidden>
              {why.rule}
            </span>
            <Muted>{why.detail}</Muted>
          </InfoRow>
        </Rows>
      </Section>

      <Section>
        <Heading>Other emails over the next 30 days</Heading>
        {other.items.length === 0 ? (
          <InfoRow>No other emails over the next 30 days.</InfoRow>
        ) : (
          <Rows>
            <Others>
              {other.items.map((o) => (
                <li key={o.id}>
                  <InfoRow icon={Mail}>
                    <OtherMeta>
                      {o.date} · {o.status}
                    </OtherMeta>
                    <OtherName>{templates[o.template].name}</OtherName>
                  </InfoRow>
                </li>
              ))}
            </Others>
            {other.more > 0 && (
              <InfoRow>
                <Muted>and {other.more} more</Muted>
              </InfoRow>
            )}
          </Rows>
        )}
      </Section>
    </Panel>
  );
}
