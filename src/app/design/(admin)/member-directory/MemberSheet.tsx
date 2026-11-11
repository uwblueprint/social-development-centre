"use client";

import * as React from "react";
import { styled } from "next-yak";
import {
  Banknote,
  CalendarCheck,
  ChevronDown,
  CircleCheck,
  Clock,
  Copy,
  Ellipsis,
  Mail,
  Pencil,
  Plus,
  Tag as TagIcon,
  Trash2,
  User,
  UserPlus,
  X,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/Collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Icon } from "@/components/ui/Icon";
import { CreatableCombobox } from "@/components/ui/CreatableCombobox";
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { SearchField } from "@/components/ui/SearchField";
import { ToggleGroupItem } from "@/components/ui/ToggleGroup";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  formatDate,
  formatMoney,
  fullName,
  kindLabel,
  endHeadline,
  methodLabel,
  statusLabel,
  totalPaid,
  type ActivityKind,
  type Member,
  type Payment,
  type TagColor,
} from "./data";
import { PillToggle } from "./PillToggle";

/* ---------- layout ---------- */

const Panel = styled(SheetContent)`
  /* Section cards' fill; overlays, milestone dots and activity dot rings read it too so they match. */
  --section-bg: var(--color-surface);
`;

/*
 * A text-only action: muted at rest, full text colour on hover, no fill or padding, the same size as a
 * section title. The kit Button has no variant like this yet (its doc says text-like actions use ghost).
 * The ::after keeps the pointer target close to 24px (WCAG 2.5.8) without changing the layout.
 */
const QuietButton = styled(Button)`
  && {
    position: relative;
    height: auto;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    line-height: var(--leading-body);
  }
  &&:hover:not(:disabled) {
    background: transparent;
    color: var(--color-text);
  }
  &::after {
    content: "";
    position: absolute;
    inset: calc(var(--space-1) * -1);
  }
`;

/* The × inside a tag while editing: takes the tag's own colour, so a tag looks the same in both modes. */
const RemoveTag = styled(QuietButton)`
  &&&,
  &&&:hover:not(:disabled) {
    color: inherit;
    line-height: 1;
  }
`;

/*
 * Controls that appear when the person points at (or tabs into) the nearest `[data-reveal]` area: copy in
 * the header, edit on payments. Always visible on touch screens.
 */
const Reveal = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  opacity: 0;
  transition: opacity var(--duration) var(--ease);

  [data-reveal]:hover &,
  [data-reveal]:focus-within & {
    opacity: 1;
  }

  @media (hover: none) {
    opacity: 1;
  }
`;

/*
 * A revealed group that floats over the right end of its line instead of taking space, so it can cover text
 * underneath. It paints `--reveal-bg` (set by the surface it sits on) to hide what it covers.
 * The line it sits in needs `position: relative`.
 */
const RevealOverlay = styled(Reveal)`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  gap: var(--space-3);
  padding-left: var(--space-3);
  background: var(--reveal-bg);
`;

/* The name row is 32px (it holds the ⋯ and close buttons); the header's 8px gap makes about 12px under the name. */
const Email = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
`;

/* The header's own gap is 8px; 4px more makes the 12px between email, tags and the ended line. */
const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-1);
`;

/* The tag picker and Done wrap together, so Done never sits alone on a line. */
const TagEntry = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  max-width: 100%;
`;

const TagField = styled.span`
  width: calc(var(--space-8) * 3);
  max-width: 100%;
`;

/* 20px between sections. */
const Body = styled(SheetBody)`
  display: flex;
  flex-direction: column;
  gap: calc(var(--space-4) + var(--space-1));
`;

const Section = styled.section`
  --reveal-bg: var(--section-bg);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  background: var(--section-bg);
`;

const SectionHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-bottom: var(--space-1);

  /* A section with nothing under its header (an empty note) keeps 16px top and bottom. */
  &:last-child {
    margin-bottom: 0;
  }
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
  gap: var(--space-3);
`;

const Muted = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
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

const Big = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-2);
`;

/* The same size as the member's name in the panel title. */
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

/* How long is left on a membership, with its end date small underneath. */
const Countdown = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const CountdownDate = styled.time`
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
`;

/* Activity: circle, line, circle. The title sits on the dot's centre line. */
const Timeline = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
`;

/*
 * Each entry's dot is centred on the whole entry (title and the line under it). An opened email keeps its dot
 * at the top. The connector runs through every row behind the dots; each dot's ring (section colour) cuts the
 * 4px gaps, so the line meets every dot wherever it sits. 8px above and below each row makes the 16px gap.
 */
const TimelineItem = styled.li`
  position: relative;
  display: grid;
  grid-template-columns: var(--space-6) minmax(0, 1fr) auto;
  column-gap: var(--space-3);
  padding: var(--space-2) 0;

  &:first-child {
    padding-top: 0;
  }
  &:last-child {
    padding-bottom: 0;
  }
  &:has([data-state="open"]) > :first-child {
    align-self: start;
  }

  &::before {
    content: "";
    position: absolute;
    left: calc(var(--space-6) / 2);
    top: 0;
    bottom: 0;
    width: 1px;
    transform: translateX(-50%);
    background: var(--color-border);
  }
  /* First row: start inside its dot. Last row: stop inside its dot (24px = 8px padding + half a dot). */
  &:first-child::before {
    top: var(--space-4);
  }
  &:last-child::before {
    bottom: auto;
    height: calc(var(--space-2) + var(--space-4));
  }
  &:only-child::before {
    display: none;
  }
`;

/* Colour per kind of thing, in every view. Payments are gold (the warning palette's amber). */
type Tone = "email" | "referral" | "event" | "danger" | "payment";

const TONE_COLOR: Record<Tone, string> = {
  email: "category-1",
  referral: "category-2",
  event: "category-5",
  danger: "danger",
  payment: "warning",
};

const TimelineDot = styled.span<{ $tone?: Tone }>`
  position: relative;
  z-index: var(--z-raised);
  align-self: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 var(--space-1) var(--section-bg);
  width: var(--space-6);
  height: var(--space-6);
  border-radius: var(--radius-full);
  border: 1px solid ${({ $tone }) => ($tone ? `var(--color-${TONE_COLOR[$tone]}-border)` : "var(--color-border)")};
  background: ${({ $tone }) => ($tone ? `var(--color-${TONE_COLOR[$tone]}-subtle)` : "var(--color-surface-raised)")};
  color: ${({ $tone }) => ($tone ? `var(--color-${TONE_COLOR[$tone]})` : "var(--color-text-muted)")};
`;

/*
 * 14px medium, like the section titles, so the cards' headings aren't smaller than the rows inside them.
 * 24px lines with 4px on top: the first line's centre sits on the 32px dot's centre (16px), and a long
 * title wraps at normal spacing. An email's chevron follows the last word.
 */
const TimelineTitle = styled.div`
  padding-top: var(--space-1);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  line-height: var(--space-5);
  overflow-wrap: anywhere;

  & > svg {
    margin-left: var(--space-1);
    vertical-align: middle;
  }
`;

const TimelineSub = styled.div`
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

/* A payment's date, with its edit pencil floating over it on hover. */
const DateCell = styled.span`
  position: relative;
  align-self: start;
  display: block;
`;

/* An email row spans to the date column, so its preview runs the full width. */
const EmailCollapsible = styled(Collapsible)`
  grid-column: 2 / 4;
  grid-row: 1;

  & ~ time {
    grid-column: 3;
    grid-row: 1;
    pointer-events: none;
  }
`;

const EmailTrigger = styled(CollapsibleTrigger)`
  all: unset;
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding-right: calc(var(--space-8) + var(--space-5));
  cursor: pointer;
  border-radius: var(--radius-sm);

  &:focus-visible {
    box-shadow: var(--focus-ring);
  }
  &[data-state="open"] svg {
    transform: rotate(180deg);
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
`;

/* "Answered <date>" over the intake answers, 8px apart like the answer rows. */
const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

/* A multiple-choice answer: one choice per line. */
const AnswerList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

function Answers({ items }: { items: string[] }) {
  return (
    <AnswerList>
      {items.map((a) => (
        <li key={a}>{a}</li>
      ))}
    </AnswerList>
  );
}

const Details = styled.dl`
  display: grid;
  /* Labels only as wide as the longest one, so the answers get the rest. */
  grid-template-columns: max-content minmax(0, 1fr);
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

/** One line on the activity timeline: a stored activity item, or one of the member's payments. */
interface Row {
  id: string;
  kind: ActivityKind | "payment";
  title: string;
  at: string;
  detail?: string;
  body?: string;
  payment?: Payment;
}

const ICONS: Record<Row["kind"], LucideIcon> = {
  email: Mail,
  referral: UserPlus,
  event: CalendarCheck,
  joined: User,
  tag: TagIcon,
  ended: Clock,
  status: CircleCheck,
  payment: Banknote,
};

const TONES: Partial<Record<Row["kind"], Tone>> = { email: "email", referral: "referral", event: "event", ended: "danger", payment: "payment" };

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
function SectionAction({
  icon,
  iconSize = 14,
  children,
  onClick,
}: {
  icon?: LucideIcon;
  iconSize?: number;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <QuietButton type="button" $variant="ghost" onClick={onClick}>
      {children}
      {icon && <Icon icon={icon} size={iconSize} />}
    </QuietButton>
  );
}

function IconAction({ label, icon, size = 14, onClick }: { label: string; icon: LucideIcon; size?: number; onClick: () => void }) {
  return (
    <Tooltip content={label} pinOnClick={false}>
      <QuietButton type="button" $variant="ghost" aria-label={label} onClick={onClick}>
        <Icon icon={icon} size={size} />
      </QuietButton>
    </Tooltip>
  );
}

/* ---------- the panel ---------- */

export interface MemberSheetActions {
  onEditNote: () => void;
  onEditDetails: () => void;
  onChangeMembership: () => void;
  onRecordPayment: () => void;
  onEditPayment: (payment: Payment) => void;
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
  actions,
  onStep,
}: {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tagColors: Record<string, TagColor>;
  allTags: string[];
  actions: MemberSheetActions;
  /** Arrow keys step through the list while the panel is open. */
  onStep: (direction: 1 | -1) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <Panel
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
        {member && <MemberPanel key={member.id} member={member} tagColors={tagColors} allTags={allTags} actions={actions} />}
      </Panel>
    </Sheet>
  );
}

function MemberPanel({
  member: m,
  tagColors,
  allTags,
  actions,
}: {
  member: Member;
  tagColors: Record<string, TagColor>;
  allTags: string[];
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
              <DropdownMenuItem onSelect={actions.onEditDetails}>
                <Icon icon={Pencil} size={16} />
                Edit member
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem $variant="danger" onSelect={actions.onDelete}>
                <Icon icon={Trash2} size={16} />
                Delete member
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      >
        <SheetTitle>{fullName(m)}</SheetTitle>
        <Email data-reveal="">
          {m.email}
          <Reveal>
            <IconAction label="Copy email" icon={Copy} onClick={() => actions.onCopy(m.email, "Email copied")} />
          </Reveal>
        </Email>
        <TagsRow member={m} tagColors={tagColors} allTags={allTags} onSetTags={actions.onSetTags} />
      </SheetHeader>
      <Body>
        <Section aria-label="Note">
          <SectionHeader title="Note">
            <SectionAction icon={m.note ? Pencil : Plus} onClick={actions.onEditNote}>
              {m.note ? "Edit" : "Add"}
            </SectionAction>
          </SectionHeader>
          {m.note && (
            <div>
              <NoteText>{m.note.text}</NoteText>
              <Meta>
                Last updated: {formatDate(m.note.updatedAt)} · {m.note.by}
              </Meta>
            </div>
          )}
        </Section>
        <MembershipSection member={m} onChange={actions.onChangeMembership} />
        <Section aria-label="Payments">
          <SectionHeader title="Payments">
            <SectionAction icon={Plus} onClick={actions.onRecordPayment}>
              Record
            </SectionAction>
          </SectionHeader>
          <Big>
            <BigNumber>{formatMoney(totalPaid(m))}</BigNumber>
            <BigLabel>Total payment</BigLabel>
          </Big>
        </Section>
        <ActivitySection member={m} onEditPayment={actions.onEditPayment} />
        <Section aria-label="Intake form">
          <SectionHeader title="Intake form" />
          {m.intake ? (
            <Stack>
              <Muted>Answered {formatDate(m.intake.answeredAt)}</Muted>
              <Details>
                {!!m.intake.interests?.length && (<><dt>Interests</dt><dd><Answers items={m.intake.interests} /></dd></>)}
                {!!m.intake.ways?.length && (<><dt>Involvement</dt><dd><Answers items={m.intake.ways} /></dd></>)}
                {m.intake.location && (<><dt>Location</dt><dd>{m.intake.location}</dd></>)}
                {m.intake.time && (<><dt>Availability</dt><dd>{m.intake.time}</dd></>)}
                {m.intake.hopes && (<><dt>What they hope for</dt><dd>{m.intake.hopes}</dd></>)}
              </Details>
            </Stack>
          ) : (
            <Muted>Not answered yet.</Muted>
          )}
        </Section>
      </Body>
    </>
  );
}

/*
 * Status, subscription and tags in one row. Edit adds a × to each tag (same size and colour as before) and the
 * tag picker, open as a field: type to filter existing tags or create one. A typed name matching an existing tag
 * (any case) reuses it.
 */
/** A tag at its real size, with a × to remove it. */
export function RemovableBadge({ name, color, onRemove }: { name: string; color?: TagColor; onRemove: () => void }) {
  return (
    <Badge $category={color}>
      {name}
      <RemoveTag type="button" $variant="ghost" aria-label={`Remove ${name}`} onClick={onRemove}>
        <Icon icon={X} size={12} />
      </RemoveTag>
    </Badge>
  );
}

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
  const options = allTags.filter((t) => !m.tags.includes(t)).map((t) => ({ value: t, label: t }));

  function add(name: string) {
    const existing = allTags.find((t) => t.toLowerCase() === name.toLowerCase()) ?? name;
    if (!m.tags.some((t) => t.toLowerCase() === existing.toLowerCase())) onSetTags([...m.tags, existing]);
  }

  return (
    <Chips data-reveal="">
      <Badge $variant={m.status === "ended" ? "danger" : m.status === "waiting" ? "warning" : "success"}>{statusLabel[m.status]}</Badge>
      <Badge $variant={m.subscribed ? "success" : "danger"}>{m.subscribed ? "Subscribed" : "Unsubscribed"}</Badge>
      {m.tags.map((t) =>
        editing ? (
          <RemovableBadge key={t} name={t} color={tagColors[t]} onRemove={() => onSetTags(m.tags.filter((x) => x !== t))} />
        ) : (
          <Badge key={t} $category={tagColors[t]}>
            {t}
          </Badge>
        ),
      )}
      {editing ? (
        <TagEntry>
          <TagField>
            <CreatableCombobox
              inline
              autoFocus
              aria-label="Add a tag"
              options={options}
              existingFieldName="tag"
              createFieldName="newTag"
              placeholder="Select or create a tag"
              createLabel={(q) => `Create “${q}”`}
              onValueChange={(value) => value && add(value.kind === "existing" ? value.value : value.label.trim())}
            />
          </TagField>
          <QuietButton
            type="button"
            $variant="ghost"
            onClick={() => setEditing(false)}
          >
            Done
          </QuietButton>
        </TagEntry>
      ) : (
        <Reveal>
          <IconAction label="Edit tags" icon={Pencil} onClick={() => setEditing(true)} />
        </Reveal>
      )}
    </Chips>
  );
}

function MembershipSection({ member: m, onChange }: { member: Member; onChange: () => void }) {
  return (
    <Section aria-label="Membership">
      <SectionHeader title="Membership" badge={<Badge>{kindLabel[m.kind]}</Badge>}>
        <SectionAction icon={Pencil} onClick={onChange}>
          Change
        </SectionAction>
      </SectionHeader>
      <Countdown>
        <BigNumber>{endHeadline(m.endsAt)}</BigNumber>
        <CountdownDate dateTime={m.endsAt}>on {formatDate(m.endsAt)}</CountdownDate>
      </Countdown>
    </Section>
  );
}

type ActivityView = "all" | "email" | "member";

const PAGE = 12;

/* Activity's icons (dots, chevrons) are a step up from the 14px used in other sections. */
const ACTIVITY_ICON = 16;

/** Payments join the stored activity as their own rows. */
function activityRows(m: Member): Row[] {
  const payments: Row[] = m.payments.map((p) => ({
    id: p.id,
    kind: "payment",
    title: `Paid ${formatMoney(p.amount)}`,
    at: p.date,
    detail: [methodLabel[p.method], p.giftFor ? `Gift for ${p.giftFor}` : "", p.note ?? ""].filter(Boolean).join(" · "),
    payment: p,
  }));
  /* Newest first; on the same day, "Joined" goes last since everything else follows it. */
  const joined = (r: Row) => (r.kind === "joined" ? 1 : 0);
  return [...m.activity, ...payments].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : joined(a) - joined(b)));
}

function ActivitySection({ member: m, onEditPayment }: { member: Member; onEditPayment: (payment: Payment) => void }) {
  const [view, setView] = React.useState<ActivityView>("all");
  const [q, setQ] = React.useState("");
  const [shown, setShown] = React.useState(PAGE);
  const needle = q.trim().toLowerCase();
  const everything = activityRows(m);
  const all = everything
    .filter((a) => (view === "email" ? a.kind === "email" : view === "member" ? a.kind !== "email" : true))
    .filter((a) => !needle || [a.title, a.detail, a.body].some((t) => t?.toLowerCase().includes(needle)));
  const rows = all.slice(0, shown);
  const more = Math.min(PAGE, all.length - rows.length);
  return (
    <Section aria-label="Activity">
      <SectionHeader title="Activity">
        <PillToggle
          type="single"
          value={view}
          onValueChange={(v) => {
            if (!v) return;
            setView(v as ActivityView);
            setShown(PAGE);
          }}
          aria-label="Show"
        >
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="email">Emails</ToggleGroupItem>
          <ToggleGroupItem value="member">Member activity</ToggleGroupItem>
        </PillToggle>
      </SectionHeader>
      {everything.length > PAGE && (
        <SearchField
          aria-label="Search activity"
          placeholder="Search activity"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onSearch={(v) => {
            setQ(v);
            setShown(PAGE);
          }}
        />
      )}
      {rows.length ? (
        <Timeline>
          {rows.map((a) => (
            <ActivityRow key={a.id} item={a} onEditPayment={onEditPayment} />
          ))}
        </Timeline>
      ) : (
        <Muted>{needle ? `No activity matches “${q.trim()}”.` : "Nothing yet."}</Muted>
      )}
      {more > 0 && (
        <div>
          <SectionAction icon={ChevronDown} iconSize={ACTIVITY_ICON} onClick={() => setShown((n) => n + PAGE)}>
            Show {more} more
          </SectionAction>
        </div>
      )}
    </Section>
  );
}

function ActivityRow({ item: a, onEditPayment }: { item: Row; onEditPayment: (payment: Payment) => void }) {
  const date = <TimelineDate dateTime={a.at}>{formatDate(a.at)}</TimelineDate>;
  return (
    <TimelineItem data-reveal={a.payment ? "" : undefined}>
      <TimelineDot $tone={TONES[a.kind]}>
        <Icon icon={ICONS[a.kind]} size={ACTIVITY_ICON} />
      </TimelineDot>
      {a.kind === "email" ? (
        <EmailCollapsible>
          <EmailTrigger>
            <TimelineTitle>
              {a.title}
              <Icon icon={ChevronDown} size={ACTIVITY_ICON} />
            </TimelineTitle>
            {a.detail && <TimelineSub>{a.detail}</TimelineSub>}
          </EmailTrigger>
          <CollapsibleContent>
            <EmailPreview>{a.body}</EmailPreview>
          </CollapsibleContent>
        </EmailCollapsible>
      ) : (
        <div>
          <TimelineTitle>{a.title}</TimelineTitle>
          {a.detail && <TimelineSub>{a.detail}</TimelineSub>}
        </div>
      )}
      {a.payment ? (
        <DateCell>
          {date}
          <RevealOverlay>
            <IconAction label="Edit payment" icon={Pencil} size={ACTIVITY_ICON} onClick={() => onEditPayment(a.payment!)} />
          </RevealOverlay>
        </DateCell>
      ) : (
        date
      )}
    </TimelineItem>
  );
}
