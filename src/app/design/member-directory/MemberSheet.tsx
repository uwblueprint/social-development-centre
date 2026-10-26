"use client";

import * as React from "react";
import { css, keyframes, styled } from "next-yak";
import {
  CalendarCheck,
  ChevronDown,
  CircleCheck,
  Clock,
  Copy,
  Ellipsis,
  Gift,
  Link,
  Lock,
  Mail,
  Pencil,
  Plus,
  Tag as TagIcon,
  Trash2,
  User,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CreatableCombobox } from "@/components/ui/CreatableCombobox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Icon } from "@/components/ui/Icon";
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { RemovableTag } from "@/components/ui/Tag";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  TODAY,
  addMonths,
  diffDays,
  formatDate,
  formatMoney,
  fullName,
  kindLabel,
  membershipYear,
  methodLabel,
  statusLabel,
  totalPaid,
  type ActivityItem,
  type ActivityKind,
  type Member,
  type Note,
  type Payment,
  type TagColor,
} from "./data";

/* ---------- layout ---------- */

const Head = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
`;

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-1);
  min-width: 0;
`;

/* Edit and copy appear when the person points at the header, and always on touch screens. */
const HoverAction = styled.span`
  display: inline-flex;
  opacity: 0;
  transition: opacity var(--duration) var(--ease);

  *:hover > &,
  &:focus-within {
    opacity: 1;
  }

  @media (hover: none) {
    opacity: 1;
  }
`;

const Email = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
`;

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-3);
`;

const Body = styled(SheetBody)`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
`;

/* Each section is a soft surface; items inside sit on raised cards. */
const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
`;

const SectionHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
`;

const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text);
`;

const SectionActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-1);
`;

const Muted = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const Cards = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

const flash = keyframes`
  from { background: var(--color-success-subtle); border-color: var(--color-success-border); }
  to { background: var(--color-surface-raised); border-color: var(--color-border); }
`;

const ItemCard = styled.div<{ $flash?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-3) var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-raised);
  ${({ $flash }) =>
    $flash &&
    css`
      animation: ${flash} calc(var(--duration-slow) * 6) var(--ease);
    `}

  & > [data-hover] {
    opacity: 0;
    transition: opacity var(--duration) var(--ease);
  }
  &:hover > [data-hover],
  &:focus-within > [data-hover] {
    opacity: 1;
  }
  @media (hover: none) {
    & > [data-hover] {
      opacity: 1;
    }
  }
`;

const Grow = styled.div`
  flex: 1;
  min-width: 0;
`;

const Meta = styled.div`
  margin-top: var(--space-1);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const NoteText = styled.div`
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

const Range = styled.p`
  margin: calc(var(--space-1) * -1) 0 0;
  font-size: var(--text-sm);
  color: var(--color-text);
`;

const Big = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-2);
`;

const BigNumber = styled.span`
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  font-variant-numeric: tabular-nums;
`;

const BigLabel = styled.span`
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: var(--tracking-prose);
`;

/* Membership year: one line, a dot per milestone, label above and date below. */
const Milestones = styled.ol`
  position: relative;
  height: calc(var(--space-7) + var(--space-3));
  margin: var(--space-2) var(--space-1) 0;
  padding: 0;
  list-style: none;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: calc(var(--space-5) - 1px);
    height: 2px;
    background: var(--color-border);
  }
`;

const Progress = styled.span`
  position: absolute;
  left: 0;
  top: calc(var(--space-5) - 1px);
  height: 2px;
  background: var(--color-text-subtle);
`;

const Milestone = styled.li<{ $state: "past" | "next" | "future"; $edge: "first" | "last" | "mid" }>`
  position: absolute;
  top: 0;
  display: flex;
  flex-direction: column;
  align-items: ${({ $edge }) => ($edge === "first" ? "flex-start" : $edge === "last" ? "flex-end" : "center")};
  gap: var(--space-1);
  transform: translateX(${({ $edge }) => ($edge === "first" ? "calc(var(--space-1) * -1)" : $edge === "last" ? "calc(-100% + var(--space-1))" : "-50%")});
  white-space: nowrap;
  font-size: var(--text-xs);

  & > span:first-child {
    color: ${({ $state }) => ($state === "next" ? "var(--color-success)" : "var(--color-text-muted)")};
  }
  & > span:last-child {
    color: ${({ $state }) => ($state === "past" ? "var(--color-text-muted)" : "var(--color-text)")};
    font-variant-numeric: tabular-nums;
  }
`;

const Dot = styled.span<{ $state: "past" | "next" | "future" }>`
  width: var(--space-2);
  height: var(--space-2);
  margin: calc(var(--space-1) / 2) 0;
  border-radius: var(--radius-full);
  background: ${({ $state }) =>
    $state === "past" ? "var(--color-text-subtle)" : $state === "next" ? "var(--color-success)" : "var(--color-surface)"};
  box-shadow: ${({ $state }) => ($state === "future" ? "inset 0 0 0 2px var(--color-text-subtle)" : "0 0 0 3px var(--color-surface)")};
`;

const PayTop = styled.div`
  display: flex;
  align-items: baseline;
  gap: var(--space-2);

  & > b {
    font-weight: var(--weight-medium);
    font-variant-numeric: tabular-nums;
  }
  & > span {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }
  & > time {
    margin-left: auto;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    font-variant-numeric: tabular-nums;
  }
`;

/* Activity: circle, line, circle. The title sits on the dot's centre line. */
const Timeline = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
`;

const TimelineItem = styled.li`
  position: relative;
  display: grid;
  grid-template-columns: var(--space-6) minmax(0, 1fr) auto;
  column-gap: var(--space-3);
  padding-bottom: var(--space-4);

  &:last-child {
    padding-bottom: 0;
  }
  &:not(:last-child)::before {
    content: "";
    position: absolute;
    left: calc(var(--space-6) / 2);
    top: calc(var(--space-6) + var(--space-1));
    bottom: var(--space-1);
    width: 1px;
    background: var(--color-border);
  }
`;

type Tone = "email" | "referral" | "event" | "danger" | undefined;

const TimelineDot = styled.span<{ $tone: Tone }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--space-6);
  height: var(--space-6);
  border-radius: var(--radius-full);
  border: 1px solid
    ${({ $tone }) =>
      $tone === "email"
        ? "var(--color-category-1-border)"
        : $tone === "referral"
          ? "var(--color-category-2-border)"
          : $tone === "event"
            ? "var(--color-category-5-border)"
            : $tone === "danger"
              ? "var(--color-danger-border)"
              : "var(--color-border)"};
  background: ${({ $tone }) =>
    $tone === "email"
      ? "var(--color-category-1-subtle)"
      : $tone === "referral"
        ? "var(--color-category-2-subtle)"
        : $tone === "event"
          ? "var(--color-category-5-subtle)"
          : $tone === "danger"
            ? "var(--color-danger-subtle)"
            : "var(--color-surface-raised)"};
  color: ${({ $tone }) =>
    $tone === "email"
      ? "var(--color-category-1)"
      : $tone === "referral"
        ? "var(--color-category-2)"
        : $tone === "event"
          ? "var(--color-category-5)"
          : $tone === "danger"
            ? "var(--color-danger)"
            : "var(--color-text-muted)"};
`;

const TimelineTitle = styled.div`
  font-weight: var(--weight-medium);
  line-height: var(--space-6);
  overflow-wrap: anywhere;
`;

const TimelineSub = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const TimelineDate = styled.time`
  font-size: var(--text-xs);
  line-height: var(--space-6);
  color: var(--color-text-muted);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
`;

/* An email row spans to the date column, so its preview runs the full width. */
const EmailDetails = styled.details`
  grid-column: 2 / 4;
  grid-row: 1;

  & > summary {
    padding-right: calc(var(--space-8) + var(--space-5));
    list-style: none;
    cursor: pointer;
  }
  & > summary::-webkit-details-marker {
    display: none;
  }
  &[open] > summary svg {
    transform: rotate(180deg);
  }
  & ~ time {
    grid-column: 3;
    grid-row: 1;
    pointer-events: none;
  }
`;

const EmailPreview = styled.div`
  margin-top: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-raised);
  font-size: var(--text-xs);
  line-height: var(--leading-body);
  white-space: pre-wrap;
  overflow-wrap: anywhere;

  & > strong {
    display: block;
    margin-bottom: var(--space-1);
    font-weight: var(--weight-medium);
  }
`;

const Details = styled.dl`
  display: grid;
  grid-template-columns: minmax(0, 10rem) minmax(0, 1fr);
  gap: var(--space-2) var(--space-4);
  margin: 0;
  font-size: var(--text-sm);

  & > dt {
    color: var(--color-text-muted);
  }
  & > dd {
    margin: 0;
    overflow-wrap: anywhere;
  }

  @media (max-width: 480px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
    & > dd {
      margin-bottom: var(--space-2);
    }
  }
`;

/* ---------- small pieces ---------- */

const ICONS: Record<ActivityKind, LucideIcon> = {
  email: Mail,
  referral: UserPlus,
  event: CalendarCheck,
  joined: User,
  tag: TagIcon,
  ended: Clock,
  status: CircleCheck,
};

const TONES: Partial<Record<ActivityKind, Tone>> = { email: "email", referral: "referral", event: "event", ended: "danger" };

function SectionHeader({ title, badge, children }: { title: string; badge?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <SectionHead>
      <SectionTitle>
        {title}
        {badge}
      </SectionTitle>
      {children && <SectionActions>{children}</SectionActions>}
    </SectionHead>
  );
}

/** A quiet section action: label first, icon after. */
function SectionAction({ icon, children, onClick }: { icon?: LucideIcon; children: React.ReactNode; onClick: () => void }) {
  return (
    <Button type="button" $variant="ghost" $size="sm" onClick={onClick}>
      {children}
      {icon && <Icon icon={icon} size={16} />}
    </Button>
  );
}

function IconAction({ label, icon, onClick }: { label: string; icon: LucideIcon; onClick: () => void }) {
  return (
    <Tooltip content={label} pinOnClick={false}>
      <Button type="button" $variant="ghost" $size="sm" aria-label={label} onClick={onClick}>
        <Icon icon={icon} size={16} />
      </Button>
    </Tooltip>
  );
}

/* ---------- the panel ---------- */

export interface MemberSheetActions {
  onAddNote: () => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (note: Note) => void;
  onEditDetails: () => void;
  onChangeMembership: () => void;
  onRecordPayment: () => void;
  onEditPayment: (payment: Payment) => void;
  onGift: () => void;
  onDelete: () => void;
  onSetTags: (tags: string[]) => void;
  onCopy: (text: string, message: string) => void;
}

export function MemberSheet({
  member,
  open,
  onOpenChange,
  tagColors,
  allTags,
  flashPaymentId,
  actions,
  onStep,
}: {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tagColors: Record<string, TagColor>;
  allTags: string[];
  flashPaymentId: string | null;
  actions: MemberSheetActions;
  /** Arrow keys step through the list while the panel is open. */
  onStep: (direction: 1 | -1) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        aria-describedby={undefined}
        onKeyDown={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest("input, textarea, [role=combobox], [role=menu], [role=listbox]")) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            onStep(1);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            onStep(-1);
          }
        }}
      >
        {member && (
          <MemberPanel
            key={member.id}
            member={member}
            tagColors={tagColors}
            allTags={allTags}
            flashPaymentId={flashPaymentId}
            actions={actions}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function MemberPanel({
  member: m,
  tagColors,
  allTags,
  flashPaymentId,
  actions,
}: {
  member: Member;
  tagColors: Record<string, TagColor>;
  allTags: string[];
  flashPaymentId: string | null;
  actions: MemberSheetActions;
}) {
  return (
    <>
      <SheetHeader
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" $variant="ghost" $size="sm" aria-label="More actions">
                <Icon icon={Ellipsis} size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => actions.onCopy(`https://sdc.example/me/${m.id}`, "Private link copied")}>
                <Icon icon={Lock} size={16} />
                Copy their private link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={actions.onDelete}>
                <Icon icon={Trash2} size={16} />
                Delete person
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      >
        <Head>
          <NameRow>
            <SheetTitle>{fullName(m)}</SheetTitle>
            <HoverAction>
              <IconAction label="Edit details" icon={Pencil} onClick={actions.onEditDetails} />
            </HoverAction>
          </NameRow>
          <Email>
            {m.email}
            <HoverAction>
              <IconAction label="Copy email" icon={Copy} onClick={() => actions.onCopy(m.email, "Email copied")} />
            </HoverAction>
          </Email>
        </Head>
        <TagsRow member={m} tagColors={tagColors} allTags={allTags} onSetTags={actions.onSetTags} />
      </SheetHeader>
      <Body>
        <NotesSection member={m} actions={actions} />
        <MembershipSection member={m} onChange={actions.onChangeMembership} />
        <PaymentsSection member={m} flashPaymentId={flashPaymentId} actions={actions} />
        <ActivitySection member={m} />
        <Section aria-label="Intake form">
          <SectionHeader title="Intake form">{m.intake && <Muted>Answered {formatDate(m.intake.answeredAt)}</Muted>}</SectionHeader>
          {m.intake ? (
            <Details>
              {m.intake.interests && (<><dt>Interests</dt><dd>{m.intake.interests}</dd></>)}
              {m.intake.location && (<><dt>Location</dt><dd>{m.intake.location}</dd></>)}
              {m.intake.time && (<><dt>Time they can give</dt><dd>{m.intake.time}</dd></>)}
              {m.intake.hopes && (<><dt>What they hope for</dt><dd>{m.intake.hopes}</dd></>)}
            </Details>
          ) : (
            <Muted>Not answered yet.</Muted>
          )}
        </Section>
        <Section aria-label="Referrals">
          <SectionHeader title="Referrals" badge={m.referrals.length ? <Badge>{m.referrals.length}</Badge> : undefined}>
            <SectionAction icon={Link} onClick={() => actions.onCopy(`https://sdc.example/join?by=${m.id}`, "Invite link copied")}>
              Copy invite link
            </SectionAction>
          </SectionHeader>
          {m.referredBy || m.referrals.length ? (
            <Details>
              {m.referredBy && (<><dt>Referred by</dt><dd>{m.referredBy}</dd></>)}
              {m.referrals.length > 0 && (<><dt>People they referred</dt><dd>{m.referrals.join(", ")}</dd></>)}
            </Details>
          ) : (
            <Muted>None yet.</Muted>
          )}
        </Section>
        <Section aria-label="Other details">
          <SectionHeader title="Other details" />
          <Details>
            <dt>How they joined</dt>
            <dd>{m.howJoined}</dd>
            {m.address && (<><dt>Address</dt><dd>{m.address}</dd></>)}
          </Details>
        </Section>
      </Body>
    </>
  );
}

/* Status, subscription and tags in one row. Edit turns the tags removable and adds a "select or create" field. */
function TagsRow({
  member: m,
  tagColors,
  allTags,
  onSetTags,
}: {
  member: Member;
  tagColors: Record<string, TagColor>;
  allTags: string[];
  onSetTags: (tags: string[]) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [picker, setPicker] = React.useState(0);
  const options = allTags.filter((t) => !m.tags.includes(t)).map((t) => ({ value: t, label: t }));
  return (
    <Chips>
      <Badge $variant={m.status === "ended" ? "danger" : m.status === "waiting" ? "warning" : "success"}>{statusLabel[m.status]}</Badge>
      <Badge $variant={m.subscribed ? "success" : "danger"}>{m.subscribed ? "Subscribed" : "Unsubscribed"}</Badge>
      {editing
        ? m.tags.map((t) => (
            <RemovableTag key={t} onRemove={() => onSetTags(m.tags.filter((x) => x !== t))}>
              {t}
            </RemovableTag>
          ))
        : m.tags.map((t) => (
            <Badge key={t} $category={tagColors[t]}>
              {t}
            </Badge>
          ))}
      {editing ? (
        <>
          <CreatableCombobox
            key={picker}
            aria-label="Add a tag"
            options={options}
            existingFieldName="tag"
            createFieldName="newTag"
            placeholder="Select or create a tag"
            searchPlaceholder="Select or create a tag"
            createLabel={(q) => `Create “${q}”`}
            onValueChange={(value) => {
              if (!value) return;
              const name = value.kind === "existing" ? value.value : value.label.trim();
              if (name && !m.tags.some((t) => t.toLowerCase() === name.toLowerCase())) onSetTags([...m.tags, name]);
              setPicker((n) => n + 1);
              setEditing(false);
            }}
          />
          <Button type="button" $variant="ghost" $size="sm" onClick={() => setEditing(false)}>
            Done
          </Button>
        </>
      ) : (
        <HoverAction>
          <IconAction label="Edit tags" icon={Pencil} onClick={() => setEditing(true)} />
        </HoverAction>
      )}
    </Chips>
  );
}

function NotesSection({ member: m, actions }: { member: Member; actions: MemberSheetActions }) {
  const notes = [...m.notes].sort((a, b) => (a.at < b.at ? 1 : -1));
  return (
    <Section aria-label="Notes">
      <SectionHeader title="Notes">
        <SectionAction icon={Plus} onClick={actions.onAddNote}>Add</SectionAction>
      </SectionHeader>
      {notes.length ? (
        <Cards>
          {notes.map((n) => (
            <ItemCard key={n.id}>
              <Grow>
                <NoteText>{n.text}</NoteText>
                <Meta>
                  {formatDate(n.at)} · {n.by}
                </Meta>
              </Grow>
              <SectionActions data-hover="">
                <IconAction label="Edit note" icon={Pencil} onClick={() => actions.onEditNote(n)} />
                <IconAction label="Delete note" icon={Trash2} onClick={() => actions.onDeleteNote(n)} />
              </SectionActions>
            </ItemCard>
          ))}
        </Cards>
      ) : (
        <Muted>Birthdays, family news, what they care about.</Muted>
      )}
    </Section>
  );
}

function MembershipSection({ member: m, onChange }: { member: Member; onChange: () => void }) {
  const { start, renewed } = membershipYear(m);
  const ends = m.endsAt;
  const span = Math.max(1, diffDays(start, ends));
  const at = (d: string) => Math.min(100, Math.max(0, (diffDays(start, d) / span) * 100));
  const points: [string, string][] = [
    [renewed ? "Renewed" : "Joined", start],
    ["3 months", addMonths(start, 3)],
    ["6 months", addMonths(start, 6)],
    ["9 months", addMonths(start, 9)],
    [ends < TODAY ? "Ended" : "Ends", ends],
  ];
  const shown = points.filter((p, i) => i === 0 || i === points.length - 1 || p[1] < ends);
  const next = shown.find((p) => p[1] > TODAY);
  return (
    <Section aria-label="Membership">
      <SectionHeader title="Membership" badge={<Badge>{kindLabel[m.kind]}</Badge>}>
        <SectionAction icon={Pencil} onClick={onChange}>Change</SectionAction>
      </SectionHeader>
      <Range>
        {formatDate(start)} – {formatDate(ends)}
      </Range>
      <Milestones aria-label="Membership year">
        <Progress style={{ width: `${at(TODAY)}%` }} />
        {shown.map((p, i) => {
          const state = p[1] <= TODAY ? "past" : p === next ? "next" : "future";
          return (
            <Milestone
              key={p[0]}
              $state={state}
              $edge={i === 0 ? "first" : i === shown.length - 1 ? "last" : "mid"}
              style={{ left: `${at(p[1])}%` }}
              aria-current={state === "next" ? "step" : undefined}
            >
              <span>{p[0]}</span>
              <Dot $state={state} />
              <span>{formatDate(p[1], false)}</span>
            </Milestone>
          );
        })}
      </Milestones>
    </Section>
  );
}

function PaymentsSection({ member: m, flashPaymentId, actions }: { member: Member; flashPaymentId: string | null; actions: MemberSheetActions }) {
  const payments = [...m.payments].sort((a, b) => (a.date < b.date ? 1 : -1));
  return (
    <Section aria-label="Payments">
      <SectionHeader title="Payments">
        <SectionAction icon={Gift} onClick={actions.onGift}>Gift</SectionAction>
        <SectionAction icon={Plus} onClick={actions.onRecordPayment}>Record</SectionAction>
      </SectionHeader>
      <Big>
        <BigNumber>{formatMoney(totalPaid(m))}</BigNumber>
        <BigLabel>Total</BigLabel>
      </Big>
      {payments.length ? (
        <Cards>
          {payments.map((p) => {
            const extra = [p.giftFor ? `Gift for ${p.giftFor}` : "", p.note ?? ""].filter(Boolean).join(" · ");
            return (
              <ItemCard key={p.id} $flash={p.id === flashPaymentId}>
                <Grow>
                  <PayTop>
                    <b>{formatMoney(p.amount)}</b>
                    <span>{methodLabel[p.method]}</span>
                    <time dateTime={p.date}>{formatDate(p.date)}</time>
                  </PayTop>
                  {extra && <Meta>{extra}</Meta>}
                </Grow>
                <SectionActions data-hover="">
                  <IconAction label="Edit payment" icon={Pencil} onClick={() => actions.onEditPayment(p)} />
                </SectionActions>
              </ItemCard>
            );
          })}
        </Cards>
      ) : (
        <Muted>No payments yet.</Muted>
      )}
    </Section>
  );
}

type ActivityView = "all" | "email" | "member";

function ActivitySection({ member: m }: { member: Member }) {
  const [view, setView] = React.useState<ActivityView>("all");
  const [showAll, setShowAll] = React.useState(false);
  const all = [...m.activity]
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
    .filter((a) => (view === "email" ? a.kind === "email" : view === "member" ? a.kind !== "email" : true));
  const rows = showAll ? all : all.slice(0, 12);
  return (
    <Section aria-label="Activity">
      <SectionHeader title="Activity">
        <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as ActivityView)} aria-label="Show">
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="email">Emails</ToggleGroupItem>
          <ToggleGroupItem value="member">Member activity</ToggleGroupItem>
        </ToggleGroup>
      </SectionHeader>
      {rows.length ? (
        <Timeline>
          {rows.map((a) => (
            <ActivityRow key={a.id} item={a} colour={view === "all"} />
          ))}
        </Timeline>
      ) : (
        <Muted>Nothing yet.</Muted>
      )}
      {all.length > rows.length && (
        <div>
          <Button type="button" $variant="ghost" $size="sm" onClick={() => setShowAll(true)}>
            Show all {all.length}
            <Icon icon={ChevronDown} size={16} />
          </Button>
        </div>
      )}
    </Section>
  );
}

/* Colour only on "All": one colour per kind of thing. */
function ActivityRow({ item: a, colour }: { item: ActivityItem; colour: boolean }) {
  const tone = colour ? TONES[a.kind] : undefined;
  return (
    <TimelineItem>
      <TimelineDot $tone={tone}>
        <Icon icon={ICONS[a.kind]} size={16} />
      </TimelineDot>
      {a.kind === "email" ? (
        <EmailDetails>
          <summary>
            <TimelineTitle>{a.title}</TimelineTitle>
            <TimelineSub>
              {a.detail}
              {a.opened ? " · Opened" : ""}
              <Icon icon={ChevronDown} size={16} />
            </TimelineSub>
          </summary>
          <EmailPreview>
            <strong>{a.title}</strong>
            {a.body}
          </EmailPreview>
        </EmailDetails>
      ) : (
        <div>
          <TimelineTitle>{a.title}</TimelineTitle>
          {a.detail && <TimelineSub>{a.detail}</TimelineSub>}
        </div>
      )}
      <TimelineDate dateTime={a.at}>{formatDate(a.at)}</TimelineDate>
    </TimelineItem>
  );
}
