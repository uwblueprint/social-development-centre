"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Ellipsis, MailX, Pencil, Plus, Trash2, UserMinus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Icon } from "@/components/ui/Icon";
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { RemovableTag, Tag, TagList } from "@/components/ui/Tag";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup";
import type { MemberDetail, Note, SendStatus, TagSummary, TimelineEntry } from "../types";
import { addMonths, formatDay, localDay, membershipYear } from "./dates";
import { TagPicker } from "./dialogs";

/* ---------- layout ---------- */

const Email = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
`;

const Chips = styled(TagList)`
  align-items: center;
  margin-top: var(--space-3);
`;

const Body = styled(SheetBody)`
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

const SectionHead = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
`;

const Muted = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

/* Rows separated by 1px lines (AGENTS.md: density). */
const Rows = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: var(--text-sm);

  & > li {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-2) 0;
  }
  & > li + li {
    border-top: 1px solid var(--color-border);
  }
`;

const Grow = styled.div`
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
`;

const NoteText = styled.div`
  white-space: pre-wrap;
`;

const Meta = styled.div`
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const When = styled.time`
  flex: none;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
`;

const Details = styled.dl`
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: var(--space-2) var(--space-4);
  margin: 0;
  font-size: var(--text-sm);

  & > dt {
    color: var(--color-text-muted);
  }
  & > dd {
    margin: 0;
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
  }
`;

/* ---------- the panel ---------- */

export interface MemberSheetActions {
  onAddNote: () => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (note: Note) => void;
  onChangeEnd: () => void;
  onAddTag: (choice: Parameters<React.ComponentProps<typeof TagPicker>["onChoose"]>[0]) => void;
  onRemoveTag: (tagId: string) => void;
  onUnsubscribe: () => void;
  onRemove: () => void;
}

export function MemberSheet({
  open,
  onOpenChange,
  member,
  name,
  tags,
  today,
  actions,
  onStep,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Null while it loads. */
  member: MemberDetail | null;
  /** From the list row, so the header shows straight away. */
  name: string;
  tags: TagSummary[];
  today: string;
  actions: MemberSheetActions;
  /** Up and down arrows step through the list while the panel is open. */
  onStep: (direction: 1 | -1) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        aria-describedby={undefined}
        onKeyDown={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest("input, textarea, [role=combobox], [role=menu], [role=listbox], [role=radiogroup], [role=group]")) return;
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            onStep(event.key === "ArrowDown" ? 1 : -1);
          }
        }}
      >
        <SheetHeader
          actions={
            member && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" $variant="ghost" $size="sm" aria-label="More actions">
                    <Icon icon={Ellipsis} size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {member.subscription !== "unsubscribed" && (
                    <DropdownMenuItem onSelect={actions.onUnsubscribe}>
                      <Icon icon={MailX} size={16} />
                      Unsubscribe from emails
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onSelect={actions.onRemove}>
                    <Icon icon={UserMinus} size={16} />
                    Remove from members
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )
          }
        >
          <SheetTitle>{name}</SheetTitle>
          {member && (
            <>
              {member.fullName && <Email>{member.email}</Email>}
              <TagsRow member={member} tags={tags} actions={actions} />
            </>
          )}
        </SheetHeader>
        <Body aria-busy={!member}>
          {member ? (
            <>
              <NotesSection notes={member.notes} actions={actions} />
              <MembershipSection member={member} today={today} onChange={actions.onChangeEnd} />
              <ActivitySection member={member} />
              <ReferralsSection member={member} />
            </>
          ) : (
            <Muted>Loading…</Muted>
          )}
        </Body>
      </SheetContent>
    </Sheet>
  );
}

const subscriptionBadge = {
  subscribed: { variant: "success", label: "Subscribed" },
  unsubscribed: { variant: "danger", label: "Unsubscribed" },
  bounced: { variant: "warning", label: "Email bounced" },
} as const;

/* Subscription and tags in one row. Edit tags makes them removable and adds a "select or create" field. */
function TagsRow({ member: m, tags, actions }: { member: MemberDetail; tags: TagSummary[]; actions: MemberSheetActions }) {
  const [editing, setEditing] = React.useState(false);
  const [picker, setPicker] = React.useState(0);
  const badge = subscriptionBadge[m.subscription];
  return (
    <Chips>
      <Badge $variant={badge.variant}>{badge.label}</Badge>
      {m.tags.map((t) =>
        editing ? (
          <RemovableTag key={t.id} onRemove={() => actions.onRemoveTag(t.id)}>
            {t.name}
          </RemovableTag>
        ) : (
          <Tag key={t.id}>{t.name}</Tag>
        ),
      )}
      {editing ? (
        <>
          <TagPicker
            key={picker}
            aria-label="Add a tag"
            tags={tags}
            exclude={m.tags.map((t) => t.id)}
            onChoose={(choice) => {
              if (!choice) return;
              actions.onAddTag(choice);
              setPicker((n) => n + 1);
            }}
          />
          <Button type="button" $variant="ghost" $size="sm" onClick={() => setEditing(false)}>
            Done
          </Button>
        </>
      ) : (
        <Button type="button" $variant="ghost" $size="sm" onClick={() => setEditing(true)}>
          <Icon icon={Pencil} size={16} />
          Edit tags
        </Button>
      )}
    </Chips>
  );
}

function NotesSection({ notes, actions }: { notes: Note[]; actions: MemberSheetActions }) {
  return (
    <Section aria-labelledby="notes-title">
      <SectionHead>
        <SectionTitle id="notes-title">Notes</SectionTitle>
        <Button type="button" $variant="ghost" $size="sm" onClick={actions.onAddNote}>
          <Icon icon={Plus} size={16} />
          Add note
        </Button>
      </SectionHead>
      {notes.length ? (
        <Rows>
          {notes.map((n) => (
            <li key={n.id}>
              <Grow>
                <NoteText>{n.body}</NoteText>
                <Meta>
                  {formatDay(localDay(n.createdAt))}
                  {n.createdBy && ` · ${n.createdBy}`}
                  {n.editedAt && " · Edited"}
                </Meta>
              </Grow>
              <Button type="button" $variant="ghost" $size="sm" aria-label="Edit note" onClick={() => actions.onEditNote(n)}>
                <Icon icon={Pencil} size={16} />
              </Button>
              <Button type="button" $variant="ghost" $size="sm" aria-label="Delete note" onClick={() => actions.onDeleteNote(n)}>
                <Icon icon={Trash2} size={16} />
              </Button>
            </li>
          ))}
        </Rows>
      ) : (
        <Muted>No notes yet. Add birthdays, family news, what they care about.</Muted>
      )}
    </Section>
  );
}

/* The client's #1 job: when the membership ends, and when the 3, 6 and 9-month check-ins land. */
function MembershipSection({ member: m, today, onChange }: { member: MemberDetail; today: string; onChange: () => void }) {
  const joined = localDay(m.joinedAt);
  const { start, renewed } = membershipYear(joined, m.endsAt);
  // Check-ins after the end date don't happen (a membership shortened by hand).
  const marks = (
    [
      [renewed ? "Renewed" : "Joined", start],
      ["3 months", addMonths(start, 3)],
      ["6 months", addMonths(start, 6)],
      ["9 months", addMonths(start, 9)],
    ] as [string, string][]
  ).filter(([, day], i) => i === 0 || day < m.endsAt);
  const next = [...marks.map(([, day]) => day), m.endsAt].find((day) => day > today);
  const date = (day: string) => (
    <>
      {formatDay(day)}
      {day === next && " (next)"}
    </>
  );
  return (
    <Section aria-labelledby="membership-title">
      <SectionHead>
        <SectionTitle id="membership-title">Membership</SectionTitle>
        <Button type="button" $variant="ghost" $size="sm" onClick={onChange}>
          <Icon icon={Pencil} size={16} />
          Change end date
        </Button>
      </SectionHead>
      <Details>
        {renewed && (
          <>
            <dt>First joined</dt>
            <dd>{formatDay(joined)}</dd>
          </>
        )}
        {marks.map(([label, day]) => (
            <React.Fragment key={label}>
              <dt>{label}</dt>
              <dd>{date(day)}</dd>
            </React.Fragment>
          ))}
        <dt>{m.endsAt < today ? "Ended" : "Ends"}</dt>
        <dd>{date(m.endsAt)}</dd>
      </Details>
    </Section>
  );
}

const sendStatus: Record<SendStatus, string> = {
  scheduled: "Scheduled",
  waiting_for_review: "Waiting for review",
  sent: "Sent",
  not_sent: "Not sent",
};

const unsubscribeHow: Record<string, string> = {
  self: "From an email’s unsubscribe link",
  admin: "By an admin",
  complaint: "Marked an email as spam",
  imported: "Imported from another tool",
};

/** What a timeline entry says. Notes have their own section, so they never reach here. */
function describe(t: TimelineEntry, m: MemberDetail): { title: string; detail?: string } {
  const referral = m.referrals.find((r) => r.id === t.referralId);
  const friend = referral ? (referral.name ?? referral.email) : "someone";
  switch (t.kind) {
    case "joined":
      return { title: "Joined", detail: m.referredBy ? `Referred by ${m.referredBy.name ?? m.referredBy.email}` : undefined };
    case "referred_someone":
      return { title: `Referred ${friend}` };
    case "referral_joined":
      return { title: `${friend} joined from their referral` };
    case "tag_added":
      return { title: `Tagged ${t.tagName}`, detail: t.by ? `By ${t.by}` : undefined };
    case "tag_removed":
      return { title: `Removed tag ${t.tagName}`, detail: t.by ? `By ${t.by}` : undefined };
    case "email":
      return { title: t.body ?? "Email", detail: t.emailStatus ? sendStatus[t.emailStatus] : undefined };
    case "unsubscribed":
      return { title: "Unsubscribed", detail: t.body ? unsubscribeHow[t.body] : undefined };
    case "resubscribed":
      return { title: "Resubscribed" };
    case "bounced":
      return { title: "An email bounced", detail: t.body ?? undefined };
    case "bounce_cleared":
      return { title: "Email address fixed" };
    default:
      return { title: t.kind };
  }
}

type ActivityView = "all" | "emails" | "member";

/* Newest first, exact dates, filterable by emails vs everything else (client, 23 Oct). */
function ActivitySection({ member: m }: { member: MemberDetail }) {
  const [view, setView] = React.useState<ActivityView>("all");
  const [showAll, setShowAll] = React.useState(false);
  const entries = m.timeline.filter(
    (t) => t.kind !== "note" && (view === "all" || (view === "emails") === (t.kind === "email")),
  );
  const shown = showAll ? entries : entries.slice(0, 15);
  return (
    <Section aria-labelledby="activity-title">
      <SectionHead>
        <SectionTitle id="activity-title">Activity</SectionTitle>
        <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as ActivityView)} aria-label="Show">
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="emails">Emails</ToggleGroupItem>
          <ToggleGroupItem value="member">Member activity</ToggleGroupItem>
        </ToggleGroup>
      </SectionHead>
      {shown.length ? (
        <Rows>
          {shown.map((t, i) => {
            const { title, detail } = describe(t, m);
            const day = localDay(t.at);
            return (
              <li key={`${t.at}-${t.kind}-${i}`}>
                <Grow>
                  {title}
                  {detail && <Meta>{detail}</Meta>}
                </Grow>
                <When dateTime={day}>{formatDay(day)}</When>
              </li>
            );
          })}
        </Rows>
      ) : (
        <Muted>{view === "emails" ? "No emails yet." : "Nothing yet."}</Muted>
      )}
      {entries.length > shown.length && (
        <div>
          <Button type="button" $variant="ghost" $size="sm" onClick={() => setShowAll(true)}>
            Show all {entries.length}
          </Button>
        </div>
      )}
    </Section>
  );
}

function ReferralsSection({ member: m }: { member: MemberDetail }) {
  return (
    <Section aria-labelledby="referrals-title">
      <SectionHead>
        <SectionTitle id="referrals-title">Referrals</SectionTitle>
      </SectionHead>
      {m.referredBy || m.referrals.length ? (
        <Details>
          {m.referredBy && (
            <>
              <dt>Referred by</dt>
              <dd>{m.referredBy.name ?? m.referredBy.email}</dd>
            </>
          )}
          {m.referrals.length > 0 && (
            <>
              <dt>People they referred</dt>
              <dd>{m.referrals.map((r) => `${r.name ?? r.email}${r.joinedAt ? " (joined)" : ""}`).join(", ")}</dd>
            </>
          )}
        </Details>
      ) : (
        <Muted>None yet.</Muted>
      )}
    </Section>
  );
}
