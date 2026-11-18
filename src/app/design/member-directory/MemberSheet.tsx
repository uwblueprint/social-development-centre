"use client";

import * as React from "react";
import { styled } from "next-yak";
import {
  Banknote,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
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
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Tag } from "@/components/ui/Tag";
import { TagPicker } from "./TagPicker";
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
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { SearchField } from "@/components/ui/SearchField";
import { Tabs, TabsContent, TabsCount, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  formatDate,
  formatMoney,
  fullName,
  kindLabel,
  endHeadline,
  methodLabel,
  plural,
  TODAY,
  statusLabel,
  totalPaid,
  type ActivityKind,
  type Member,
  type Payment,
  type TagColor,
} from "./data";
import { inOwnWidget, isTyping, plain } from "./listKeys";
import {
  SLOW_SEARCH_FOR,
  SAVING_FOR,
  useLabDeferred,
  useLabDelay,
  useLabLoad,
  useStateLab,
  type StateLab,
} from "../_state-lab/useStateLab";
import { ConnectionBanner, InlineAlert, SectionFailed, SectionSkeleton, Skeleton, VisuallyHidden } from "./SheetStates";

/* Slow loading: how long each fetch in the panel takes (ms). A member's sections, an email's body, and the next older year of history. */
const MEMBER_LOAD_FOR = 1000;
const EMAIL_BODY_LOAD_FOR = 1500;
const MORE_LOAD_FOR = 1000;

/* ---------- layout ---------- */

const Panel = styled(SheetContent)`
  /* The sheet's own fill: reveal overlays and activity dot rings read it so they blend in. */
  --section-bg: var(--color-surface-raised);

  /* A little wider than the kit's 480px (PM request) so long names, tags and emails have room: 576px, full width on phones. */
  &&& {
    width: min(calc(var(--space-8) * 9), 100vw);
  }
  @media (max-width: 640px) {
    &&& {
      width: 100vw;
    }
  }
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
    line-height: var(--leading-ui);
  }
  &&:hover:not(:disabled) {
    background: transparent;
    color: var(--color-text);
  }
  /* Text actions read as links: underlined on hover and on keyboard focus. */
  &&:hover:not(:disabled),
  &&:focus-visible {
    text-decoration: underline;
    text-underline-offset: var(--space-1);
  }
  &::after {
    content: "";
    position: absolute;
    inset: calc(var(--space-1) * -1);
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

const Email = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
`;

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
`;

/* Long tag names wrap inside the pill instead of pushing the row wider than the panel. */
const WrappingTag = styled(Tag)`
  max-width: 100%;
  white-space: normal;
  overflow-wrap: anywhere;
`;

/* A message that takes its own full line in the wrapping chips row. */
const FullRow = styled.div`
  flex: 1 1 100%;
  min-width: 0;
`;

/* A long name wraps instead of running under the buttons. */
const Name = styled(SheetTitle)`
  overflow-wrap: anywhere;

  /* Focus lands here on open so a screen reader starts at the name; it isn't a control, so no ring. */
  &:focus {
    outline: none;
  }
`;

/* The tag picker and Done wrap together, so Done never sits alone on a line. */
const TagEntry = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
`;

const TagField = styled.span`
  flex: 1 1 auto;
  min-width: 0;
`;

/* The kit's body inset is kept; sections stack flat, separated by hairlines. */
const Body = styled(SheetBody)`
  display: flex;
  flex-direction: column;

  /* A banner or error above the sections sits --space-4 clear of them. */
  & > :not(section):not(:last-child) {
    margin-bottom: var(--space-4);
  }
`;

/* Flat section: a 1px --color-border divider with --space-5 above and below, no card inside the sheet. */
const Section = styled.section`
  --reveal-bg: var(--section-bg);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-5) 0;
  border-top: 1px solid var(--color-border);

  &:first-of-type {
    padding-top: 0;
    border-top: 0;
  }
  &:last-of-type {
    padding-bottom: 0;
  }
`;

const SectionHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
`;

const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
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
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;

const Meta = styled.div`
  margin-top: var(--space-2);
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
`;

const NoteText = styled.div`
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

const Big = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-2);
`;

/* A key figure is body-sized text, not a display size: --text-md regular, with a muted --text-xs label. */
const BigNumber = styled.span`
  font-size: var(--text-md);
  font-weight: var(--weight-regular);
  line-height: var(--leading-body);
  font-variant-numeric: tabular-nums;
`;

const BigLabel = styled.span`
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
`;

/* How long is left on a membership, with its end date small underneath. */
const Countdown = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const CountdownDate = styled.time`
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
`;

/* Activity: circle, line, circle. The title sits on the dot's centre line. */
const Timeline = styled.ol`
  /* One title line (--text-sm at --leading-body). */
  --timeline-line: calc(var(--text-sm) * var(--leading-body));
  /* The dot is 28px: roomy enough to read its icon. The title's first line is centred on it (see TimelineTitle). */
  --timeline-dot: calc(var(--space-6) - var(--space-1));
  margin: 0;
  padding: 0;
  list-style: none;
`;

/*
 * Each entry has a dot beside its title. The connector runs through every row behind the dots; each dot's
 * ring (the sheet colour) cuts the gaps, so the line meets every dot. --space-3 above and below each row (--space-5 between rows).
 */
const TimelineItem = styled.li`
  position: relative;
  display: grid;
  grid-template-columns: var(--timeline-dot) minmax(0, 1fr) auto;
  column-gap: var(--space-3);
  padding: var(--space-3) 0;

  &:first-child {
    padding-top: 0;
  }
  &:last-child {
    padding-bottom: 0;
  }

  &::before {
    content: "";
    position: absolute;
    left: calc(var(--timeline-dot) / 2);
    top: 0;
    bottom: 0;
    width: 1px;
    transform: translateX(-50%);
    background: var(--color-border);
  }
  /* First row: start inside its dot. Last row: stop inside its dot (row padding plus half a dot). */
  &:first-child::before {
    top: calc(var(--timeline-dot) / 2);
  }
  &:last-child::before {
    bottom: auto;
    height: calc(var(--space-3) + var(--timeline-dot) / 2);
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

/* A routine email's dot is smaller and neutral, so member actions stand out from automated mail. */
const TimelineDot = styled.span<{ $tone?: Tone; $quiet?: boolean }>`
  position: relative;
  z-index: var(--z-raised);
  align-self: start;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 var(--space-1) var(--section-bg);
  width: ${({ $quiet }) => ($quiet ? "calc(var(--timeline-dot) - var(--space-2))" : "var(--timeline-dot)")};
  height: ${({ $quiet }) => ($quiet ? "calc(var(--timeline-dot) - var(--space-2))" : "var(--timeline-dot)")};
  /* Centred in the dot column and on the title's first line. */
  justify-self: center;
  margin-top: ${({ $quiet }) => ($quiet ? "var(--space-1)" : "0")};
  border-radius: var(--radius-full);
  border: 1px solid ${({ $tone, $quiet }) => ($tone && !$quiet ? `var(--color-${TONE_COLOR[$tone]}-border)` : "var(--color-border)")};
  background: ${({ $tone, $quiet }) => ($tone && !$quiet ? `var(--color-${TONE_COLOR[$tone]}-subtle)` : "var(--color-surface-raised)")};
  color: ${({ $tone, $quiet }) => ($tone && !$quiet ? `var(--color-${TONE_COLOR[$tone]})` : "var(--color-text-muted)")};
`;

/*
 * A row title: --text-sm medium at body line height. An email's chevron follows the last word. The box is as tall
 * as the dot with the first line centred in it, so title and dot share a centre line. Routine emails are
 * regular weight and muted.
 */
const TimelineTitle = styled.div<{ $quiet?: boolean }>`
  box-sizing: border-box;
  min-height: var(--timeline-dot);
  padding-top: calc((var(--timeline-dot) - var(--timeline-line)) / 2);
  font-size: var(--text-sm);
  font-weight: ${({ $quiet }) => ($quiet ? "var(--weight-regular)" : "var(--weight-medium)")};
  line-height: var(--leading-body);
  color: ${({ $quiet }) => ($quiet ? "var(--color-text-muted)" : "inherit")};
  overflow-wrap: anywhere;
`;

/* The email chevron is text-sized (1em) and glued to the last word so it never wraps alone. */
const TitleTail = styled.span`
  white-space: nowrap;

  & > svg {
    width: 1em;
    height: 1em;
    margin-left: var(--space-1);
    vertical-align: middle;
  }
`;

const TimelineSub = styled.div`
  margin-top: 0;
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
`;

const TimelineDate = styled.time`
  align-self: start;
  font-size: var(--text-xs);
  line-height: var(--timeline-dot);
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

  /* Hover and keyboard focus underline the title, like a text link. */
  &:hover > :first-child,
  &:focus-visible > :first-child {
    text-decoration: underline;
    text-underline-offset: var(--space-1);
  }
  &:focus-visible {
    box-shadow: var(--focus-ring);
  }
  &[data-state="open"] svg {
    transform: rotate(180deg);
  }
`;

const EmailPreview = styled.div`
  margin-top: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-raised);
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

/* Previous rows stay on screen, dimmed, while the next ones load. */
const Refreshing = styled.div<{ $pending: boolean }>`
  opacity: ${({ $pending }) => ($pending ? 0.6 : 1)};
  transition: opacity var(--duration) var(--ease);
`;

/* A dot-sized circle that keeps the timeline's connector behind it, like a real dot. */
const SkeletonDot = styled(Skeleton)`
  position: relative;
  z-index: var(--z-raised);
  align-self: start;
  border-radius: var(--radius-full);
  box-shadow: 0 0 0 var(--space-1) var(--section-bg);
`;

const SkeletonText = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
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
  line-height: var(--leading-body);

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
  /** Emails only: which template SDC sent it from. */
  template?: string;
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
  busy = false,
}: {
  icon?: LucideIcon;
  iconSize?: number;
  children: React.ReactNode;
  onClick: () => void;
  /** A request is in flight: say so, and ignore further presses. */
  busy?: boolean;
}) {
  return (
    <QuietButton type="button" $variant="ghost" aria-disabled={busy || undefined} onClick={busy ? undefined : onClick}>
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
  /** The admin finished editing tags (pressed Done): the point where one Undo toast is shown. */
  onTagsDone?: () => void;
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
  hasPrev,
  hasNext,
}: {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tagColors: Record<string, TagColor>;
  allTags: string[];
  actions: MemberSheetActions;
  /** j and k, and the Previous and Next buttons, step through the list while the panel is open. */
  onStep: (direction: 1 | -1) => void;
  /** Whether the list has a member before or after this one, in its current sort and filter order. */
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const lab = useStateLab({
    data: [
      { id: "activity-failed", label: "Couldn't load activity", description: "Activity can't load; the rest of the panel works." },
      { id: "notes-failed", label: "Couldn't load the note", description: "The note can't load; the rest of the panel works." },
      { id: "intake-failed", label: "Couldn't load intake answers", description: "The intake answers can't load; the rest works." },
      { id: "email-body-failed", label: "Couldn't load an email", description: "Opening an email in the timeline fails; offer Try again in place" },
    ],
    notApplicable: ["readOnly", "rateLimited"],
  });
  const load = useLabLoad(lab);
  const waiting = load.loading || lab.loadFailed;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <Panel
        aria-describedby={undefined}
        data-member-sheet=""
        onOpenAutoFocus={(event) => {
          // Focus goes to the member's name, not the first control.
          event.preventDefault();
          (event.currentTarget as HTMLElement).querySelector<HTMLElement>("[data-member-title]")?.focus();
        }}
        onKeyDown={(event) => {
          if (event.defaultPrevented || !plain(event) || isTyping(event.target) || inOwnWidget(event.target)) return;
          if (event.key === "j") {
            event.preventDefault();
            onStep(1);
          } else if (event.key === "k") {
            event.preventDefault();
            onStep(-1);
          } else if ((event.key === "Delete" || event.key === "Backspace") && !event.shiftKey && !waiting) {
            event.preventDefault();
            actions.onDelete();
          }
        }}
      >
        {member && <MemberPanel key={member.id} member={member} hasPrev={hasPrev} hasNext={hasNext} onStep={onStep} tagColors={tagColors} allTags={allTags} actions={actions} lab={lab} load={load} />}
      </Panel>
    </Sheet>
  );
}

type SheetLab = StateLab<"activity-failed" | "notes-failed" | "intake-failed" | "email-body-failed">;
type Load = ReturnType<typeof useLabLoad>;

const LONG_WORD = "Wolfeschlegelsteinhausenbergerdorff";

/** The member as the State lab wants to show it: long text, or some fields missing. Untouched when neither is on. */
function labMember(m: Member, longText: boolean, partial: boolean, sectionEmpty: boolean): Member {
  let v = m;
  if (longText) {
    const long = `${LONG_WORD} ${LONG_WORD} ${LONG_WORD}`;
    v = {
      ...v,
      firstName: LONG_WORD,
      lastName: `${LONG_WORD}-${LONG_WORD}`,
      email: `${LONG_WORD.toLowerCase()}.${LONG_WORD.toLowerCase()}@a-very-long-organisation-name-for-community-development.example.org`,
      tags: [...v.tags, `${LONG_WORD}-${LONG_WORD}-${LONG_WORD}`],
      note: { text: `${long}. `.repeat(8), updatedAt: v.note?.updatedAt ?? v.activity[0]?.at ?? "", by: LONG_WORD },
      intake: {
        ...v.intake,
        answeredAt: v.intake?.answeredAt ?? v.activity[0]?.at ?? "",
        hopes: `${long} `.repeat(6),
        location: long,
        interests: [long, ...(v.intake?.interests ?? [])],
      },
      activity: v.activity.map((a, i) => (i === 0 ? { ...a, title: `${long} ${long}`, detail: long } : a)),
    };
  }
  if (partial) {
    v = {
      ...v,
      firstName: "",
      lastName: "",
      email: "",
      note: v.note ? { ...v.note, by: "" } : v.note,
      intake: v.intake ? { answeredAt: v.intake.answeredAt, location: v.intake.location ?? "Waterloo" } : v.intake,
    };
  }
  if (sectionEmpty) v = { ...v, note: undefined, intake: undefined };
  return v;
}

function MemberPanel({
  member,
  hasPrev,
  hasNext,
  onStep,
  tagColors,
  allTags,
  actions,
  lab,
  load,
}: {
  member: Member;
  hasPrev: boolean;
  hasNext: boolean;
  onStep: (direction: 1 | -1) => void;
  tagColors: Record<string, TagColor>;
  allTags: string[];
  actions: MemberSheetActions;
  lab: SheetLab;
  load: Load;
}) {
  const m = labMember(member, lab.longText, lab.partialData, lab.sectionEmpty);
  const loading = load.loading;
  const failed = lab.loadFailed && !loading;
  const noteFailed = lab.is("notes-failed");
  const activityFailed = lab.sectionFailed || lab.is("activity-failed");
  const intakeFailed = lab.is("intake-failed");
  const name = fullName(m) || "Unnamed member";
  // Slow loading: the header comes from list data, so it is instant. The sections are fetched, on first open
  // and again for each member stepped to (this panel is keyed by member, so the delay starts afresh).
  const fetching = useLabDelay(MEMBER_LOAD_FOR, lab.slowLoading);
  const sectionsLoading = loading || fetching;
  const waiting = sectionsLoading || failed;

  // A new member (j, k or the step buttons) replaces this panel, so focus follows to the new name.
  const title = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => {
    const panel = title.current?.closest("[data-member-sheet]");
    const active = document.activeElement;
    if (panel && (!active || active === document.body || panel.contains(active))) title.current?.focus();
  }, []);

  return (
    <>
      <SheetHeader
        aria-busy={loading || undefined}
        actions={
          <>
          {hasPrev && (
            <Button type="button" $variant="ghost" $size="sm" aria-label="Previous member" onClick={() => onStep(-1)}>
              <Icon icon={ChevronUp} size={16} />
            </Button>
          )}
          {hasNext && (
            <Button type="button" $variant="ghost" $size="sm" aria-label="Next member" onClick={() => onStep(1)}>
              <Icon icon={ChevronDown} size={16} />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" $variant="ghost" $size="sm" aria-label="More actions">
                <Icon icon={Ellipsis} size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={actions.onEditDetails} disabled={waiting}>
                <Icon icon={Pencil} size={16} />
                Edit member
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem $variant="danger" onSelect={actions.onDelete} disabled={waiting}>
                <Icon icon={Trash2} size={16} />
                Delete member
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </>
        }
      >
        {loading ? (
          <Name ref={title} tabIndex={-1} data-member-title="" aria-label="Loading member">
            <Skeleton aria-hidden="true" $width="60%" $height="var(--space-5)" />
          </Name>
        ) : failed ? (
          <Name ref={title} tabIndex={-1} data-member-title="">Member</Name>
        ) : (
          <Name ref={title} tabIndex={-1} data-member-title="">{name}</Name>
        )}
        {loading ? (
          <Stack aria-hidden="true">
            <Skeleton $width="75%" />
            <Skeleton $width="50%" $height="var(--space-5)" />
          </Stack>
        ) : failed ? null : (
          <>
            <Email data-reveal="">
              {m.email || <Muted>No email on file</Muted>}
              {m.email && (
                <Reveal>
                  <IconAction label="Copy email" icon={Copy} onClick={() => actions.onCopy(m.email, "Email copied")} />
                </Reveal>
              )}
            </Email>
            <TagsRow member={m} tagColors={tagColors} allTags={allTags} onSetTags={actions.onSetTags} onDone={actions.onTagsDone} lab={lab} />
          </>
        )}
      </SheetHeader>
      <Body aria-busy={sectionsLoading || undefined}>
        <ConnectionBanner offline={lab.offline} reconnecting={lab.reconnecting} sessionExpired={lab.sessionExpired} />
        {failed ? (
          <SectionFailed title="Couldn't load this member.">Something went wrong on our side. Try again in a moment.</SectionFailed>
        ) : sectionsLoading ? (
          <>
            <VisuallyHidden role="status">Loading member details</VisuallyHidden>
            {["Note", "Membership", "Payments", "Activity", "Intake form"].map((title) => (
              <Section key={title} aria-label={title}>
                <SectionHeader title={title} />
                <SectionSkeleton lines={title === "Activity" ? 4 : 2} takingLonger={load.takingLonger && title === "Note"} />
              </Section>
            ))}
          </>
        ) : (
          <>
            <Section aria-label="Note">
              <SectionHeader title="Note">
                {!noteFailed && (
                  <SectionAction icon={m.note ? Pencil : Plus} onClick={actions.onEditNote}>
                    {m.note ? "Edit" : "Add"}
                  </SectionAction>
                )}
              </SectionHeader>
              {noteFailed ? (
                <SectionFailed title="Couldn't load the note.">Try again to see it.</SectionFailed>
              ) : (
                m.note && (
                  <div>
                    <NoteText>{m.note.text}</NoteText>
                    <Meta>
                      Last updated: {formatDate(m.note.updatedAt)}
                      {m.note.by && ` · ${m.note.by}`}
                    </Meta>
                  </div>
                )
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
            <ActivitySection
              member={m}
              onEditPayment={actions.onEditPayment}
              failed={activityFailed}
              lab={lab}
              empty={lab.sectionEmpty}
              many={lab.manyItems}
              single={lab.singleItem}
            />
            <Section aria-label="Intake form">
              <SectionHeader title="Intake form" />
              {intakeFailed ? (
                <SectionFailed title="Couldn't load the intake answers.">Try again to see them.</SectionFailed>
              ) : m.intake ? (
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
          </>
        )}
      </Body>
    </>
  );
}

/** Why a tag change didn't go through. */
type TagIssue = "failed" | "conflict" | "validation" | "offline" | "session";

/*
 * Status, subscription and tags in one row. Edit adds a × to each tag (same size and colour as before) and the
 * tag picker, open as a field: type to filter existing tags or create one. A typed name matching an existing tag
 * (any case) reuses it.
 *
 * State lab: a change is applied at once, unless an action state is on. Then it is held as a draft: Saving keeps
 * it in flight for a few seconds (no double submit); the failures keep the draft and say what to do.
 */
function TagsRow({
  member: m,
  tagColors,
  allTags,
  onSetTags,
  onDone,
  lab,
}: {
  member: Member;
  tagColors: Record<string, TagColor>;
  allTags: string[];
  onSetTags: (tags: string[]) => void;
  onDone?: () => void;
  lab: SheetLab;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState<string[] | null>(null);
  const [issue, setIssue] = React.useState<TagIssue | null>(null);
  const [pending, setPending] = React.useState(false);
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const apply = (tags: string[]) => {
    window.clearTimeout(timer.current);
    onSetTags(tags);
    setDraft(null);
    setIssue(null);
    setPending(false);
  };

  const attempt = (tags: string[]) => {
    window.clearTimeout(timer.current);
    const next: TagIssue | null = lab.sessionExpired
      ? "session"
      : lab.offline
        ? "offline"
        : lab.validationError
          ? "validation"
          : lab.saveFailed
            ? "failed"
            : lab.conflict
              ? "conflict"
              : null;
    if (next) {
      setDraft(tags);
      setIssue(next);
      setPending(false);
    } else if (lab.saving) {
      setDraft(tags);
      setIssue(null);
      setPending(true);
      timer.current = window.setTimeout(() => apply(tags), SAVING_FOR);
    } else {
      apply(tags);
    }
  };

  const shown = draft ?? m.tags;
  const visible = lab.singleItem ? shown.slice(0, 1) : shown;
  const added = (draft ?? []).find((t) => !m.tags.includes(t)) ?? draft?.[0] ?? "";
  const discard = () => {
    setDraft(null);
    setIssue(null);
  };

  return (
    <Chips data-reveal="">
      <Badge $variant={m.status === "ended" ? "danger" : m.status === "waiting" ? "warning" : "success"}>{statusLabel[m.status]}</Badge>
      <Badge $variant={m.subscribed ? "success" : "danger"}>{m.subscribed ? "Subscribed" : "Unsubscribed"}</Badge>
      {editing ? (
        <TagEntry>
          <TagField>
            <TagPicker
              autoFocus
              aria-label="Add a tag"
              value={shown}
              options={allTags}
              colors={tagColors}
              onValueChange={(tags) => {
                if (!pending) attempt(tags);
              }}
              placeholder="Select or create a tag"
              createLabel={(q) => `Create “${q}”`}
            />
          </TagField>
          <QuietButton
            type="button"
            $variant="ghost"
            aria-disabled={pending || undefined}
            onClick={() => {
              if (!pending) {
                setEditing(false);
                onDone?.();
              }
            }}
          >
            {pending ? "Saving…" : "Done"}
          </QuietButton>
        </TagEntry>
      ) : (
        <>
          {visible.map((t) => (
            <WrappingTag key={t} color={tagColors[t]}>
              {t}
            </WrappingTag>
          ))}
          {pending ? (
            <Muted role="status">Saving tags…</Muted>
          ) : (
            <Reveal>
              <IconAction label="Edit tags" icon={Pencil} onClick={() => setEditing(true)} />
            </Reveal>
          )}
        </>
      )}
      {draft && issue && (
        <FullRow>
          {issue === "failed" && (
            <InlineAlert
              title="Couldn't save the tags."
              actions={[
                { label: "Try again", onClick: () => attempt(draft) },
                { label: "Discard changes", onClick: discard },
              ]}
            >
              Your changes are still here. Try again in a moment.
            </InlineAlert>
          )}
          {issue === "conflict" && (
            <InlineAlert
              tone="warning"
              title="Someone else changed these tags."
              actions={[
                { label: "Keep my tags", onClick: () => apply(draft) },
                { label: "Use their tags", onClick: discard },
              ]}
            >
              They updated this member while you were editing. Keep yours to replace theirs, or use theirs.
            </InlineAlert>
          )}
          {issue === "validation" && (
            <InlineAlert
              title="That tag name is too long."
              actions={[
                { label: "Edit tags", onClick: () => setEditing(true) },
                { label: "Discard changes", onClick: discard },
              ]}
            >
              Tag names can have up to 30 characters. Shorten “{added}” and try again.
            </InlineAlert>
          )}
          {issue === "offline" && (
            <InlineAlert tone="info" title="You're offline." actions={[{ label: "Try again", onClick: () => attempt(draft) }]}>
              Your changes are kept here. Reconnect, then try again.
            </InlineAlert>
          )}
          {issue === "session" && (
            <InlineAlert tone="warning" title="You've been signed out." actions={[{ label: "Try again", onClick: () => attempt(draft) }]}>
              Your changes are kept here. Sign in again, then try again.
            </InlineAlert>
          )}
        </FullRow>
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

/* The search field only appears once there is enough history to search. */
const SEARCH_MIN = 12;

/* Icon size for the activity dots and chevrons; routine emails get a smaller dot and icon. */
const ACTIVITY_ICON = 16;
const QUIET_ICON = 14;

/* The summary line appears once there is enough history to need it. */
const SUMMARY_MIN = 6;

/* Everything newer than this many months back is grouped by month; older items are grouped by year. */
const RECENT_MONTHS = 12;

/* A group folds 2 or more emails from the same template into one row; a single routine email stays a quiet row. */
const FOLD_FROM = 2;

/** Names for the email templates SDC sends (see `template` in demoHistory.ts). A template without a name is never folded. */
const TEMPLATE_LABELS: Record<string, string> = {
  "monthly-update": "Monthly member update",
  "event-invitation": "Event invitations",
  "event-reminder": "Event reminders",
  "volunteer-ask": "Volunteer requests",
  receipt: "Membership receipts",
  "renewal-reminder": "Renewal reminders",
  "renewal-thanks": "Renewal thank-yous",
  "agm-notice": "AGM notices",
};

/** A routine email: sent automatically from one of SDC's templates. Personal emails have no template. */
const isRoutine = (r: Row) => r.kind === "email" && !!r.template && !!TEMPLATE_LABELS[r.template];

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

/** One line in a group: a single row, or several emails from the same template folded into one expandable row. */
type Entry = { kind: "row"; row: Row } | { kind: "bundle"; key: string; template: string; rows: Row[] };

interface Group {
  key: string;
  label: string;
  /** Older than the last 12 months: grouped by year, and revealed one year at a time. */
  older: boolean;
  count: number;
  entries: Entry[];
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const monthIndex = (iso: string) => Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7)) - 1;

/** "Jan–Dec 2025" for a spread across months, "Oct 3–19, 2026" within one month, a plain date for one day. */
function rangeLabel(oldest: string, newest: string): string {
  if (oldest === newest) return formatDate(newest);
  const [ya, yb] = [Number(oldest.slice(0, 4)), Number(newest.slice(0, 4))];
  const [ma, mb] = [Number(oldest.slice(5, 7)) - 1, Number(newest.slice(5, 7)) - 1];
  if (ya === yb && ma === mb) return `${MONTH_SHORT[ma]} ${Number(oldest.slice(8, 10))}–${Number(newest.slice(8, 10))}, ${ya}`;
  if (ya === yb) return `${MONTH_SHORT[ma]}–${MONTH_SHORT[mb]} ${ya}`;
  return `${MONTH_SHORT[ma]} ${ya}–${MONTH_SHORT[mb]} ${yb}`;
}

/** Newest-first rows into month groups (last 12 months) and year groups (older). While searching, nothing is folded. */
function groupRows(rows: Row[], fold: boolean): Group[] {
  const recentFrom = monthIndex(TODAY) - (RECENT_MONTHS - 1);
  const groups: { key: string; label: string; older: boolean; rows: Row[] }[] = [];
  for (const r of rows) {
    const older = monthIndex(r.at) < recentFrom;
    const key = older ? `y:${r.at.slice(0, 4)}` : `m:${r.at.slice(0, 7)}`;
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) {
      g = { key, label: older ? r.at.slice(0, 4) : `${MONTH_NAMES[Number(r.at.slice(5, 7)) - 1]} ${r.at.slice(0, 4)}`, older, rows: [] };
      groups.push(g);
    }
    g.rows.push(r);
  }
  return groups.map((g) => {
    const byTemplate = new Map<string, Row[]>();
    if (fold) {
      for (const r of g.rows) {
        if (r.kind === "email" && r.template && TEMPLATE_LABELS[r.template]) byTemplate.set(r.template, [...(byTemplate.get(r.template) ?? []), r]);
      }
    }
    const entries: Entry[] = [];
    for (const r of g.rows) {
      const same = r.kind === "email" && r.template ? byTemplate.get(r.template) : undefined;
      if (!same || same.length < FOLD_FROM) entries.push({ kind: "row", row: r });
      else if (same[0] === r) entries.push({ kind: "bundle", key: `${g.key}|${r.template}`, template: r.template!, rows: same });
    }
    return { key: g.key, label: g.label, older: g.older, count: g.rows.length, entries };
  });
}

/* The activity panel: no top padding (the section's gap spaces it) and the same column rhythm as the section. */
const ActivityPanel = styled(TabsContent)`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: 0;
`;

/* The tab's count: muted and small, next to the label, in every state of the tab. */
const TabCount = styled(TabsCount)`
  font-size: var(--text-xs);
  font-variant-numeric: tabular-nums;
`;

const Group = styled.div`
  & + & {
    margin-top: var(--space-4);
  }
`;

/*
 * A group's label sticks to the top of the sheet's scroll area while its rows scroll under it (the sheet colour
 * hides them). It sits above the dots (--z-raised) so they pass beneath it. Each group has its own list, so the
 * connector line starts and ends inside each group: it breaks at every header.
 */
const GroupHeader = styled.h4`
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  margin: 0;
  /* Its own space: opaque, with room below so the first row starts clear of it. */
  padding: var(--space-2) 0 var(--space-3);
  background: var(--section-bg);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
`;

/* One quiet line of the gist, so the admin doesn't have to scroll for it. */
const Summary = styled(Muted)`
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
`;

/* Skeleton rows for the next year while it loads. */
const LoadingList = styled(Timeline)`
  margin-top: var(--space-4);
`;

/* The folded row's trigger: title on the left, date range on the right. On a phone the range moves under the title. */
const BundleTrigger = styled(CollapsibleTrigger)`
  all: unset;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  column-gap: var(--space-3);
  align-items: start;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
  border-radius: var(--radius-sm);

  &:hover > :first-child,
  &:focus-visible > :first-child {
    text-decoration: underline;
    text-underline-offset: var(--space-1);
  }
  &:focus-visible {
    box-shadow: var(--focus-ring);
  }
  &[data-state="open"] svg {
    transform: rotate(180deg);
  }

  @media (max-width: 480px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const BundleDate = styled.span`
  font-size: var(--text-xs);
  line-height: var(--timeline-dot);
  color: var(--color-text-muted);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;

  @media (max-width: 480px) {
    grid-row: 2;
    margin-top: var(--space-1);
    line-height: var(--leading-ui);
    white-space: normal;
  }
`;

/* The emails inside a folded row sit under its title, each with its own dot and connector. */
const NestedTimeline = styled(Timeline)`
  margin-top: var(--space-3);
`;

function ActivitySection({
  member: m,
  onEditPayment,
  failed,
  lab,
  empty,
  many,
  single,
}: {
  member: Member;
  onEditPayment: (payment: Payment) => void;
  failed: boolean;
  lab: SheetLab;
  empty: boolean;
  many: boolean;
  single: boolean;
}) {
  const [view, setView] = React.useState<ActivityView>("all");
  const [q, setQ] = React.useState("");
  /* How many older years the person has revealed with "Show <year>", beyond the default. */
  const [extraYears, setExtraYears] = React.useState(0);
  /* Folded rows the person has opened. */
  const [opened, setOpened] = React.useState<ReadonlySet<string>>(() => new Set());
  const needle = q.trim().toLowerCase();
  const [loadedEmails, setLoadedEmails] = React.useState<ReadonlySet<string>>(() => new Set());
  const markLoaded = React.useCallback((id: string) => setLoadedEmails((s) => (s.has(id) ? s : new Set(s).add(id))), []);
  const toggleBundle = (key: string, open: boolean) =>
    setOpened((s) => {
      const next = new Set(s);
      if (open) next.add(key);
      else next.delete(key);
      return next;
    });

  // Slow loading: a new view or search term takes a while to come back. The previous rows stay, dimmed.
  const liveKey = `${view}|${needle}`;
  const lagged = useLabDeferred(liveKey, SLOW_SEARCH_FOR);
  const appliedKey = lab.slowLoading ? lagged.value : liveKey;
  const refreshing = lab.slowLoading && lagged.pending;
  const cut = appliedKey.indexOf("|");
  const appliedView = appliedKey.slice(0, cut) as ActivityView;
  const appliedNeedle = appliedKey.slice(cut + 1);

  // Slow loading: "Show <year>" fetches the next older year.
  const [loadingMore, setLoadingMore] = React.useState(false);
  const moreTimer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(moreTimer.current), []);
  const resetPaging = () => {
    window.clearTimeout(moreTimer.current);
    setLoadingMore(false);
    setExtraYears(0);
  };
  const showEarlier = () => {
    if (loadingMore) return;
    if (!lab.slowLoading) {
      setExtraYears((n) => n + 1);
      return;
    }
    setLoadingMore(true);
    moreTimer.current = window.setTimeout(() => {
      setExtraYears((n) => n + 1);
      setLoadingMore(false);
    }, MORE_LOAD_FOR);
  };
  const base = activityRows(m);
  /* State lab: a very long timeline, exactly one entry, or none. */
  const everything: Row[] = empty
    ? []
    : many
      ? Array.from({ length: 150 }, (_, i) => ({ ...base[i % Math.max(base.length, 1)], id: `lab-${i}` })).filter((r) => r.title)
      : single
        ? base.slice(0, 1)
        : base;
  const counts = {
    all: everything.length,
    email: everything.filter((a) => a.kind === "email").length,
    member: everything.filter((a) => a.kind !== "email").length,
  };
  const matches = everything
    .filter((a) => (appliedView === "email" ? a.kind === "email" : appliedView === "member" ? a.kind !== "email" : true))
    .filter((a) => !appliedNeedle || [a.title, a.detail, a.body].some((t) => t?.toLowerCase().includes(appliedNeedle)));

  /* Searching shows every match, in month and year groups, with nothing folded and no 12-month cut-off. */
  const searching = !!appliedNeedle;
  const groups = groupRows(matches, !searching);
  const recent = groups.filter((g) => !g.older);
  const older = groups.filter((g) => g.older);
  /* The last 12 months by default; with nothing in them, the most recent year instead of an empty list. */
  const baseYears = recent.length ? 0 : Math.min(1, older.length);
  const revealed = searching ? older.length : Math.min(older.length, baseYears + extraYears);
  const shownGroups = [...recent, ...older.slice(0, revealed)];
  const nextYear = searching ? undefined : older[revealed];

  const lastEmail = everything.find((a) => a.kind === "email");
  const eventsAttended = everything.filter((a) => a.kind === "event").length;
  const summary = [
    `Member since ${MONTH_SHORT[Number(m.joinedAt.slice(5, 7)) - 1]} ${m.joinedAt.slice(0, 4)}`,
    lastEmail && `Last email ${formatDate(lastEmail.at)}`,
    counts.email > 0 && plural(counts.email, "email"),
    eventsAttended > 0 && `${plural(eventsAttended, "event")} attended`,
  ]
    .filter(Boolean)
    .join(" · ");

  const rowProps = { onEditPayment, lab, loadedEmails, onEmailLoaded: markLoaded };
  const searchLabel = view === "email" ? "Search emails" : view === "member" ? "Search activity" : "Search all";
  return (
    <Tabs
      asChild
      value={view}
      activationMode={lab.slowLoading ? "manual" : "automatic"}
      onValueChange={(v) => {
        setView(v as ActivityView);
        resetPaging();
      }}
    >
    <Section aria-label="Activity">
      <SectionHeader title="Activity" />
      {!failed && everything.length >= SUMMARY_MIN && <Summary>{summary}</Summary>}
      <TabsList aria-label="Show" loading={refreshing}>
        <TabsTrigger value="all">
          All<TabCount>{counts.all}</TabCount>
        </TabsTrigger>
        <TabsTrigger value="email">
          Emails<TabCount>{counts.email}</TabCount>
        </TabsTrigger>
        <TabsTrigger value="member">
          Member activity<TabCount>{counts.member}</TabCount>
        </TabsTrigger>
      </TabsList>
      <ActivityPanel value={view}>
      {failed ? (
        <SectionFailed title="Couldn't load activity.">Try again to see emails, payments and changes.</SectionFailed>
      ) : (
        <>
      {everything.length > SEARCH_MIN && (
        <SearchField
          aria-label={searchLabel}
          placeholder={searchLabel}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onSearch={(v) => {
            setQ(v);
            resetPaging();
          }}
          pending={refreshing}
        />
      )}
      <Refreshing $pending={refreshing} aria-busy={refreshing || loadingMore || undefined}>
        {refreshing && <VisuallyHidden role="status">Updating activity</VisuallyHidden>}
        {loadingMore && <VisuallyHidden role="status">Loading earlier activity</VisuallyHidden>}
        {searching && !refreshing && <VisuallyHidden role="status">{plural(matches.length, "match", "matches")}</VisuallyHidden>}
        {shownGroups.length ? (
          <>
            {shownGroups.map((g) => (
              <Group key={g.key}>
                <GroupHeader>
                  {g.label}
                  <span aria-hidden="true"> · {g.count}</span>
                  <VisuallyHidden>, {plural(g.count, "item")}</VisuallyHidden>
                </GroupHeader>
                <Timeline>
                  {g.entries.map((e) =>
                    e.kind === "row" ? (
                      <ActivityRow key={e.row.id} item={e.row} {...rowProps} />
                    ) : (
                      <BundleRow key={e.key} label={TEMPLATE_LABELS[e.template]} rows={e.rows} open={opened.has(e.key)} onOpenChange={(o) => toggleBundle(e.key, o)} {...rowProps} />
                    ),
                  )}
                </Timeline>
              </Group>
            ))}
            {loadingMore && (
              <LoadingList aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <TimelineItem key={`more-${i}`}>
                    <SkeletonDot $width="var(--timeline-dot)" $height="var(--timeline-dot)" />
                    <SkeletonText>
                      <Skeleton $width={i === 1 ? "55%" : "75%"} />
                      <Skeleton $width="35%" $height="var(--space-2)" />
                    </SkeletonText>
                    <Skeleton $width="var(--space-8)" />
                  </TimelineItem>
                ))}
              </LoadingList>
            )}
          </>
        ) : (
          <Muted>{appliedNeedle ? `No activity matches “${q.trim()}”.` : "Nothing yet."}</Muted>
        )}
      </Refreshing>
      {nextYear && (
        <div>
          <SectionAction icon={loadingMore ? undefined : ChevronDown} iconSize={ACTIVITY_ICON} busy={loadingMore} onClick={showEarlier}>
            {loadingMore ? "Loading…" : `Show ${nextYear.label}`}
          </SectionAction>
        </div>
      )}
        </>
      )}
      </ActivityPanel>
    </Section>
    </Tabs>
  );
}

/** An opened email's body. Slow loading: the first open fetches it (skeleton, or a failure with Try again); later opens are instant. */
function EmailBody({
  item: a,
  lab,
  loaded,
  onLoaded,
}: {
  item: Row;
  lab: SheetLab;
  loaded: boolean;
  onLoaded: (id: string) => void;
}) {
  const fetching = useLabDelay(EMAIL_BODY_LOAD_FOR, lab.slowLoading && !loaded);
  const failed = lab.sectionFailed || lab.is("email-body-failed");
  const ok = !fetching && !(failed && !loaded);
  React.useEffect(() => {
    if (ok && !loaded) onLoaded(a.id);
  }, [ok, loaded, onLoaded, a.id]);

  if (fetching) {
    return (
      <EmailPreview aria-busy="true">
        <VisuallyHidden role="status">Loading email</VisuallyHidden>
        <SectionSkeleton lines={3} />
      </EmailPreview>
    );
  }
  if (!ok) return <SectionFailed title="Couldn't load this email.">Try again to see it.</SectionFailed>;
  return <EmailPreview>{a.body}</EmailPreview>;
}

/* Split a title so its last word can travel with the chevron. */
function titleHead(t: string) {
  const i = t.trimEnd().lastIndexOf(" ");
  return i < 0 ? "" : t.slice(0, i + 1);
}
function titleLast(t: string) {
  const s = t.trimEnd();
  return s.slice(s.lastIndexOf(" ") + 1);
}

function ActivityRow({
  item: a,
  onEditPayment,
  lab,
  loadedEmails,
  onEmailLoaded,
}: {
  item: Row;
  onEditPayment: (payment: Payment) => void;
  lab: SheetLab;
  loadedEmails: ReadonlySet<string>;
  onEmailLoaded: (id: string) => void;
}) {
  const date = <TimelineDate dateTime={a.at}>{formatDate(a.at)}</TimelineDate>;
  const routine = isRoutine(a);
  return (
    <TimelineItem data-reveal={a.payment ? "" : undefined}>
      <TimelineDot $tone={TONES[a.kind]} $quiet={routine}>
        <Icon icon={ICONS[a.kind]} size={routine ? QUIET_ICON : ACTIVITY_ICON} />
      </TimelineDot>
      {a.kind === "email" ? (
        <EmailCollapsible>
          <EmailTrigger>
            <TimelineTitle $quiet={routine}>
              {titleHead(a.title)}
              <TitleTail>
                {titleLast(a.title)}
                <Icon icon={ChevronDown} size={ACTIVITY_ICON} />
              </TitleTail>
            </TimelineTitle>
            {a.detail && <TimelineSub>{a.detail}</TimelineSub>}
          </EmailTrigger>
          <CollapsibleContent>
            <EmailBody item={a} lab={lab} loaded={loadedEmails.has(a.id)} onLoaded={onEmailLoaded} />
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

/** Several emails from one template in one group, folded into a single row: "Monthly member update · 12 emails" and the dates they span. */
function BundleRow({
  label,
  rows,
  open,
  onOpenChange,
  onEditPayment,
  lab,
  loadedEmails,
  onEmailLoaded,
}: {
  label: string;
  rows: Row[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditPayment: (payment: Payment) => void;
  lab: SheetLab;
  loadedEmails: ReadonlySet<string>;
  onEmailLoaded: (id: string) => void;
}) {
  const title = `${label} · ${rows.length} emails`;
  return (
    <TimelineItem>
      <TimelineDot $tone="email" $quiet>
        <Icon icon={Mail} size={QUIET_ICON} />
      </TimelineDot>
      <EmailCollapsible open={open} onOpenChange={onOpenChange}>
        <BundleTrigger>
          <TimelineTitle $quiet>
            {titleHead(title)}
            <TitleTail>
              {titleLast(title)}
              <Icon icon={ChevronDown} size={ACTIVITY_ICON} />
            </TitleTail>
          </TimelineTitle>
          <BundleDate>{rangeLabel(rows[rows.length - 1].at, rows[0].at)}</BundleDate>
        </BundleTrigger>
        <CollapsibleContent>
          <NestedTimeline>
            {rows.map((r) => (
              <ActivityRow key={r.id} item={r} onEditPayment={onEditPayment} lab={lab} loadedEmails={loadedEmails} onEmailLoaded={onEmailLoaded} />
            ))}
          </NestedTimeline>
        </CollapsibleContent>
      </EmailCollapsible>
    </TimelineItem>
  );
}
