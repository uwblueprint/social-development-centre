"use client";

/*
 * Icon buttons in this panel follow one rule:
 * - Every icon button is the kit's ghost Button at $size="sm", made square (IconButton below): no fill at rest, the
 *   hover fill on hover, the kit focus ring on keyboard focus. It is the same 32px box as the sheet's close button.
 * - The header is the exception: edit and delete are filled (secondary; delete in the danger pair) and split from
 *   the ghost close button by a divider, so the three are never mistaken for each other.
 * - A lone icon action beside text (copy email, edit tags, edit payment) is the same ghost square, so lines that hold
 *   one are as tall as the header's controls.
 * - Every icon button has an aria-label. A tooltip only where the icon alone is ambiguous (previous and next, which
 *   also teach K and J).
 *
 * Keyboard: J and K step through the list; Delete deletes the member; Ctrl+Enter (Cmd+Enter on a Mac) saves the note
 * or finishes editing tags; Escape cancels an open editor, and closes the panel only when no editor is open.
 */

import * as React from "react";
import { keyframes, styled } from "next-yak";
import {
  Banknote,
  CalendarCheck,
  Check,
  ChevronDown,
  CircleCheck,
  Clock,
  Copy,
  LoaderCircle,
  Mail,
  MailX,
  Pencil,
  Plus,
  Tag as TagIcon,
  Trash2,
  User,
  UserPlus,
  UserX,
  type LucideIcon,
} from "lucide-react";
import { Tag } from "@/components/ui/Tag";
import { TagPicker } from "./TagPicker";
import { Button } from "@/components/ui/Button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/Collapsible";
import { Icon } from "@/components/ui/Icon";
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { SearchField } from "@/components/ui/SearchField";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Tooltip } from "@/components/ui/Tooltip";
import { intakeCopy } from "@/features/intake/copy";
import { Textarea } from "@/components/ui/Textarea";
import {
  formatDate,
  formatMoney,
  fullName,
  giftsGiven,
  methodLabel,
  plural,
  TODAY,
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

  /* A little wider than the kit's 480px (PM request) so long names, tags and emails have room: 576px (nine --space-8), full width on phones. */
  &&& {
    width: min(calc(var(--space-8) * 9), 100vw);
  }
`;

/* An icon-only action: the kit's ghost sm Button, square, so it matches the sheet's close button. See the rule at the top. */
const IconButton = styled(Button)`
  && {
    aspect-ratio: 1;
    padding: 0;
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

/*
 * Header grid: the name and email are one group, the lifetime value a step below. The name row is 32px (the kit's
 * header row) with its text centred, leaving --space-1 under the name; the email's negative margin takes back the
 * header's --space-2 gap and half of that, so the email line starts --space-1 / 2 under the name. The lifetime value
 * keeps the --space-2 gap. The bottom padding matches the top (--sheet-inset).
 */
const Email = styled.div`
  margin-top: calc(var(--space-2) * -1 - var(--space-1) / 2);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
`;

/*
 * The email as one ghost button: the hover fill reaches --space-2 past the text at the sides and --space-1 / 2 above and
 * below, cancelled by matching negative margins so the text stays on the name's left edge and the line stays one text line.
 */
const EmailCopy = styled(Button)`
  &&& {
    height: auto;
    margin: calc(var(--space-1) / -2) calc(var(--space-2) * -1);
    padding: calc(var(--space-1) / 2) var(--space-2);
    border-width: 0;
    gap: var(--space-1);
    font-size: inherit;
    line-height: inherit;
    font-weight: inherit;
    color: inherit;
    text-align: left;
    overflow-wrap: anywhere;
    white-space: normal;
  }
`;

/* Lifetime value, right under the email: one text line, the figure in body colour, its label muted. */
const HeaderValue = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text-muted);

  & > span {
    color: var(--color-text);
    font-variant-numeric: tabular-nums;
  }
`;

/* Offline, reconnecting and signed out, right under the lifetime value: --space-3 clear of it. The live region stays
   mounted; while it's empty it takes back the header's gap, so it adds no space. */
const HeaderBanner = styled.div`
  margin-top: var(--space-1);

  &:has(> [role="status"]:empty) {
    margin-top: calc(var(--space-2) * -1);
  }
`;

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--pill-height);

  /* Icon buttons (edit tags) overhang the pill row instead of making it taller. */
  & > button,
  & > span > button {
    margin-block: calc((var(--pill-height) - var(--space-6)) / 2);
  }
`;

/* The + after the last tag: a square exactly the tags' height and corner radius, so it reads as one more pill. */
const TagAddButton = styled(IconButton)`
  &&& {
    width: var(--pill-height);
    height: var(--pill-height);
    margin-block: 0;
    border-radius: var(--radius-sm);
  }
`;

/* The last tag with the + after it: one unit in the wrapping row, --space-2 apart like the other tags. */
const LastTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  max-width: 100%;
  min-width: 0;
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

const NoteForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

const NoteActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
`;

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

  /* A banner above the sections sits the section spacing (--space-5) clear of them. An empty live region takes no space. */
  & > :not(section):not(:empty):not(:last-child) {
    margin-bottom: var(--space-5);
  }
`;

/*
 * Flat section: a 1px --color-border divider with --space-5 above and below, no card inside the sheet. Inside, every
 * block is --space-3 apart; a line and its own small print (a date, who did it) are --space-1 apart.
 */
const Section = styled.section`
  --reveal-bg: var(--section-bg);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  /* The divider runs the sheet's full width; the content keeps the sheet inset. */
  margin-inline: calc(var(--sheet-inset) * -1);
  padding: var(--space-5) var(--sheet-inset);
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

/* Section labels are small: body-small and medium weight, muted, so the content under them leads. */
const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;

/*
 * The header lifts over the body once the body is scrolled: a light shadow below its hairline, none at the top.
 * Above the timeline's raised dots so they pass under it.
 */
/* Edit and delete, --space-2 apart so neither is clicked for the other. */
const PersonActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`;

/* Delete: the secondary fill swapped for the danger pair, so it reads red at rest. */
const DeleteIconButton = styled(IconButton)`
  &&& {
    background: var(--color-danger-subtle);
    color: var(--color-danger);
  }
  &&&:hover:not(:disabled) {
    background: var(--color-danger-border);
  }
`;

/* Splits the person's actions from close. */
const ActionsDivider = styled.span`
  align-self: center;
  width: 1px;
  height: var(--space-5);
  margin-inline: var(--space-2);
  background: var(--color-border);
`;

const Header = styled(SheetHeader)`
  z-index: var(--z-sticky);
  &&& {
    padding-bottom: var(--sheet-inset);
  }
  transition: box-shadow var(--duration) var(--ease);

  &[data-scrolled] {
    box-shadow: var(--shadow-sm);
  }
`;

/* A section whose content leads: content and actions on one row, lined up on their first text baseline. */
const LeadHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-4);
`;

const Lead = styled.div`
  flex: 1;
  min-width: 0;
`;

const HiddenTitle = styled.h3`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
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

const NoteText = styled.div`
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

/* Lifetime value, with how it was paid small underneath. */
const Value = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const ValueDetail = styled.span`
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
`;

/* Activity: circle, line, circle. The title sits on the dot's centre line. */
const Timeline = styled.ol`
  /* The dot is the same 32px as every icon button, so a row's dot, title line, date and edit button share one centre line. */
  --timeline-dot: var(--space-6);
  margin: 0;
  padding: 0;
  list-style: none;
`;

/*
 * Each entry has a dot beside its title. The connector runs through every row behind the opaque dots, so it reads as
 * one continuous line touching every dot. --space-3 above and below each row (--space-5 between rows).
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

/* Every dot is the same size, so the line breaks evenly above and below each one. */
const TimelineDot = styled.span<{ $tone?: Tone }>`
  position: relative;
  z-index: var(--z-raised);
  align-self: start;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--timeline-dot);
  height: var(--timeline-dot);
  /* Centred in the dot column and on the title's first line. */
  justify-self: center;
  border-radius: var(--radius-full);
  border: 1px solid ${({ $tone }) => ($tone ? `var(--color-${TONE_COLOR[$tone]}-border)` : "var(--color-border)")};
  background: ${({ $tone }) => ($tone ? `var(--color-${TONE_COLOR[$tone]}-subtle)` : "var(--color-surface-raised)")};
  color: ${({ $tone }) => ($tone ? `var(--color-${TONE_COLOR[$tone]})` : "var(--color-text-muted)")};
`;

/*
 * A row title: --text-sm medium at body line height. An email's chevron follows the last word. The box is as tall
 * as the dot with the first line centred in it, so title and dot share a centre line.
 */
const TimelineTitle = styled.div`
  min-height: var(--timeline-dot);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  line-height: var(--leading-body);
  padding-top: calc((var(--timeline-dot) - 1lh) / 2);
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

/*
 * An email row spans the title and date columns on the row's own grid (subgrid): the trigger keeps to the title
 * column, the date sits in its column on the first line, and the opened body runs the full width under both.
 */
const EmailCollapsible = styled(Collapsible)`
  grid-column: 2 / 4;
  grid-row: 1;
  display: grid;
  grid-template-columns: subgrid;

  & > :not(button) {
    grid-column: 1 / -1;
  }
  & ~ time {
    grid-column: 3;
    grid-row: 1;
  }
`;

const EmailTrigger = styled(CollapsibleTrigger)`
  all: unset;
  display: block;
  grid-column: 1;
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
`;

const SkeletonText = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

/* Blocks stacked at the section's inside spacing: "Answered <date>" over the intake answers. */
const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

/**
 * The intake answers in the form's own shape: each question as it was asked, then the answer the way it was given
 * (topics ranked 1, 2, 3; ways to connect as ticks; one choice; their own words). A skipped question says so.
 */
function IntakeAnswers({ intake }: { intake: NonNullable<Member["intake"]> }) {
  const q = intakeCopy;
  const skipped = <Muted>Skipped</Muted>;
  return (
    <Stack>
      <Muted>Answered {formatDate(intake.answeredAt)}</Muted>
      <QuestionList>
        <li>
          <Question>{q.topics.heading}</Question>
          {intake.interests?.length ? (
            <RankList>
              {intake.interests.map((t, i) => (
                <li key={t}>
                  <Rank aria-hidden="true">{i + 1}</Rank>
                  <span>{t}</span>
                </li>
              ))}
            </RankList>
          ) : (
            skipped
          )}
        </li>
        <li>
          {/* The form's "(Select all that apply.)" is an instruction for them, not part of the question. */}
          <Question>{q.ways.heading.replace(/\s*\(.*\)\s*$/, "")}</Question>
          {intake.ways?.length ? (
            <TickList>
              {intake.ways.map((w) => (
                <li key={w}>
                  <Icon icon={Check} />
                  <span>{w}</span>
                </li>
              ))}
            </TickList>
          ) : (
            skipped
          )}
        </li>
        <li>
          <Question>{q.location.heading}</Question>
          {intake.location ? <AnswerText>{intake.location}</AnswerText> : skipped}
        </li>
        <li>
          <Question>{q.time.heading}</Question>
          {intake.time ? <AnswerText>{intake.time}</AnswerText> : skipped}
        </li>
        <li>
          <Question>{q.hopes.heading}</Question>
          {intake.hopes ? <OwnWords>{intake.hopes}</OwnWords> : skipped}
        </li>
      </QuestionList>
    </Stack>
  );
}

/* One block per question, split by hairlines with --space-4 either side so each question and its answer read as a pair. */
const QuestionList = styled.ol`
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;

  & > li {
    padding: var(--space-4) 0;
    border-top: 1px solid var(--color-border);
  }
  & > li:last-child {
    padding-bottom: 0;
  }
`;

/* The question as asked: medium weight and muted, a clear label --space-2 above its answer, which reads in body colour. */
const Question = styled.p`
  margin: 0 0 var(--space-2);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;

const AnswerText = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
`;

/* Ranked topics: their order, as they dragged them. */
const RankList = styled.ol`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: var(--text-sm);
  line-height: var(--leading-body);

  & > li {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
  }
`;

/* The rank as a plain muted number in a --space-4 column (the same column as the ticks), so every row is one text line. */
const Rank = styled.span`
  flex: none;
  width: var(--space-4);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
`;

/* "Select all that apply": what they ticked. */
const TickList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: var(--text-sm);
  line-height: var(--leading-body);

  & > li {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
  }
  /* The tick is one line tall, so it centres on the first line of a wrapping answer. */
  & > li > svg {
    flex: none;
    width: var(--space-4);
    height: 1lh;
    color: var(--color-text-muted);
  }
`;

/* Their own words, set off like a quote. */
const OwnWords = styled.blockquote`
  margin: 0;
  padding-left: var(--space-3);
  border-left: 1px solid var(--color-border-strong);
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  white-space: pre-wrap;
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
  cancelled: Clock,
  status: CircleCheck,
  payment: Banknote,
};

const TONES: Partial<Record<Row["kind"], Tone>> = { email: "email", referral: "referral", event: "event", cancelled: "danger", payment: "payment" };

function SectionHeader({
  title,
  titleId,
  badge,
  lead,
  children,
}: {
  title: React.ReactNode;
  titleId?: string;
  badge?: React.ReactNode;
  /* Content that replaces the visible title (the tags, the note): it runs up to the actions; the title stays for screen readers. */
  lead?: React.ReactNode;
  children?: React.ReactNode;
}) {
  if (lead) {
    return (
      <LeadHead>
        <HiddenTitle id={titleId}>{title}</HiddenTitle>
        <Lead>{lead}</Lead>
        {children && <SectionActions>{children}</SectionActions>}
      </LeadHead>
    );
  }
  return (
    <SectionHead>
      <SectionTitle id={titleId}>
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
  children,
  onClick,
  ref,
  ...rest
}: {
  icon?: LucideIcon;
  children: React.ReactNode;
  onClick: () => void;
  ref?: React.Ref<HTMLButtonElement>;
} & Omit<React.ComponentProps<"button">, "onClick" | "children" | "ref">) {
  return (
    <QuietButton {...rest} ref={ref} type="button" $variant="ghost" onClick={onClick}>
      {children}
      {icon && <Icon icon={icon} />}
    </QuietButton>
  );
}

/* ---------- inline editors and Escape ---------- */

/** An open inline editor (the note, the tags): where it is, and how to cancel it. */
interface OpenEditor {
  node: React.RefObject<HTMLElement | null>;
  cancel: () => void;
}

/** The panel's open editors, so Escape can cancel one instead of closing the panel. */
const EditorsContext = React.createContext<Set<OpenEditor> | null>(null);

/**
 * Registers an inline editor while it is mounted. Escape anywhere in the panel cancels the editor that has focus (or
 * the last one opened) and leaves the panel open. Returns the ref for the editor's outer element.
 */
function useInlineEditor<T extends HTMLElement>(cancel: () => void) {
  const editors = React.useContext(EditorsContext);
  const node = React.useRef<T>(null);
  const latest = React.useRef(cancel);
  React.useEffect(() => {
    latest.current = cancel;
  });
  React.useEffect(() => {
    if (!editors) return;
    const entry: OpenEditor = { node, cancel: () => latest.current() };
    editors.add(entry);
    return () => {
      editors.delete(entry);
    };
  }, [editors]);
  return node;
}

/** After an inline editor closes, focus goes back to the control that opened it (so the keyboard isn't dropped on the page). */
function useReturnFocus<T extends HTMLElement>(editing: boolean) {
  const trigger = React.useRef<T>(null);
  const wasEditing = React.useRef(editing);
  React.useEffect(() => {
    if (wasEditing.current && !editing) {
      const active = document.activeElement;
      if (!active || active === document.body) trigger.current?.focus();
    }
    wasEditing.current = editing;
  }, [editing]);
  return trigger;
}

/* ---------- the panel ---------- */

export interface MemberSheetActions {
  /** Saves the note written in place; "" clears it. */
  onSaveNote: (text: string) => void;
  onEditDetails: () => void;
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
}: {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tagColors: Record<string, TagColor>;
  allTags: string[];
  actions: MemberSheetActions;
  /** J and K step through the list while the panel is open. */
  onStep: (direction: 1 | -1) => void;
}) {
  const lab = useStateLab({
    data: [
      { id: "activity-failed", label: "Couldn't load activity", description: "Activity can't load; the rest of the panel works." },
      { id: "notes-failed", label: "Couldn't load the note", description: "The note can't load; the rest of the panel works." },
      { id: "intake-failed", label: "Couldn't load intake answers", description: "The intake answers can't load; the rest works." },
      { id: "email-body-failed", label: "Couldn't load an email", description: "Opening an email in the timeline fails; offer Try again in place" },
      { id: "slow-activity", label: "Slow activity", description: "Switching activity tabs takes about a second; the rows dim and the tab shows a spinner." },
    ],
    notApplicable: ["readOnly", "rateLimited"],
  });
  const load = useLabLoad(lab);
  const waiting = load.loading || lab.loadFailed;
  const [editors] = React.useState(() => new Set<OpenEditor>());
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <Panel
        aria-describedby={undefined}
        data-member-sheet=""
        onEscapeKeyDown={(event) => {
          // Escape cancels an open editor first; the panel closes only when none is open.
          if (!editors.size) return;
          event.preventDefault();
          const list = [...editors];
          const active = document.activeElement;
          const focused = list.find((e) => e.node.current?.contains(active));
          // A marked tag pill in the field: this Escape only clears the mark (the tag field handles it).
          if (focused?.node.current?.querySelector('[aria-current="true"]')) return;
          (focused ?? list[list.length - 1]).cancel();
        }}
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
        <EditorsContext.Provider value={editors}>
          {member && <MemberPanel key={member.id} member={member} tagColors={tagColors} allTags={allTags} actions={actions} lab={lab} load={load} />}
        </EditorsContext.Provider>
      </Panel>
    </Sheet>
  );
}

type SheetLab = StateLab<"activity-failed" | "notes-failed" | "intake-failed" | "email-body-failed" | "slow-activity">;
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
  tagColors,
  allTags,
  actions,
  lab,
  load,
}: {
  member: Member;
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
  const name = fullName(m) || "No name";
  // Slow loading: the header comes from list data, so it is instant. The sections are fetched, on first open
  // and again for each member stepped to (this panel is keyed by member, so the delay starts afresh).
  const fetching = useLabDelay(MEMBER_LOAD_FOR, lab.slowLoading);
  const sectionsLoading = loading || fetching;
  const waiting = sectionsLoading || failed;
  const [editingNote, setEditingNote] = React.useState(false);
  const noteTitleId = React.useId();
  const tagsTitleId = React.useId();
  const noteTrigger = useReturnFocus<HTMLButtonElement>(editingNote);
  /* The body has scrolled under the header: the header shows its elevation shadow. */
  const [scrolled, setScrolled] = React.useState(false);

  // A new member (j, k or the step buttons) replaces this panel, so focus follows to the new name.
  const title = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => {
    const panel = title.current?.closest("[data-member-sheet]");
    const active = document.activeElement;
    if (panel && (!active || active === document.body || panel.contains(active))) title.current?.focus();
  }, []);

  return (
    <>
      <Header
        aria-busy={loading || undefined}
        data-scrolled={scrolled ? "" : undefined}
        actions={
          <>
            {/* Filled, so they read as actions on the person, apart from close: delete (red), then edit, then a divider before close. */}
            <PersonActions>
              <Tooltip content="Delete person">
                <DeleteIconButton type="button" $variant="secondary" $size="sm" aria-label="Delete person" disabled={waiting} onClick={actions.onDelete}>
                  <Icon icon={Trash2} />
                </DeleteIconButton>
              </Tooltip>
              <Tooltip content="Edit person">
                <IconButton type="button" $variant="secondary" $size="sm" aria-label="Edit person" disabled={waiting} onClick={actions.onEditDetails}>
                  <Icon icon={Pencil} />
                </IconButton>
              </Tooltip>
            </PersonActions>
            <ActionsDivider aria-hidden="true" />
          </>
        }
      >
        {loading ? (
          <Name ref={title} tabIndex={-1} data-member-title="" aria-label="Loading person">
            <Skeleton aria-hidden="true" $width="60%" $height="var(--space-5)" />
          </Name>
        ) : failed ? (
          <Name ref={title} tabIndex={-1} data-member-title="">Person</Name>
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
              {m.email ? (
                /* The whole address copies, as in the table: the copy icon sits right after it and shows on hover or focus. */
                <EmailCopy type="button" $variant="ghost" $size="sm" aria-label={`Copy ${m.email}`} onClick={() => actions.onCopy(m.email, `Copied ${m.email}`)}>
                  <span>{m.email}</span>
                  <Reveal aria-hidden="true">
                    <Icon icon={Copy} size={14} />
                  </Reveal>
                </EmailCopy>
              ) : (
                <Muted>No email</Muted>
              )}
            </Email>
            <HeaderValue>
              <span>{formatMoney(totalPaid(m))}</span> lifetime value
            </HeaderValue>
          </>
        )}
        <HeaderBanner>
          <ConnectionBanner offline={lab.offline} reconnecting={lab.reconnecting} sessionExpired={lab.sessionExpired} />
        </HeaderBanner>
      </Header>
      <Body aria-busy={sectionsLoading || undefined} onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 0)}>
        {failed ? (
          <SectionFailed title="Couldn't load this person">Try again in a moment. If it keeps happening, tell an SDC admin.</SectionFailed>
        ) : sectionsLoading ? (
          <>
            <VisuallyHidden role="status">Loading details</VisuallyHidden>
            <Section aria-label="Tags">
              <SectionHeader title="Tags" />
              <SectionSkeleton lines={1} />
            </Section>
            <Section aria-label="Note">
              <SectionHeader title="Note" />
              <SectionSkeleton lines={2} takingLonger={load.takingLonger} />
            </Section>
            <Section aria-label="Activity">
              <SectionSkeleton lines={4} />
            </Section>
          </>
        ) : (
          <>
            <StatusAlert member={m} />
            <Section aria-labelledby={tagsTitleId}>
              <TagsRow titleId={tagsTitleId} member={m} tagColors={tagColors} allTags={allTags} onSetTags={actions.onSetTags} onDone={actions.onTagsDone} lab={lab} />
            </Section>
            <Section aria-label="Note">
              <SectionHeader
                titleId={noteTitleId}
                title="Note"
                /* With a note, the note itself leads and runs up to Edit note; the "Note" heading only shows when there's none. */
                lead={m.note && !noteFailed && !editingNote ? <NoteText>{m.note.text}</NoteText> : undefined}
              >
                {!noteFailed && !editingNote &&
                  (m.note ? (
                    <Tooltip content={`Updated ${formatDate(m.note.updatedAt)}${m.note.by ? ` by ${m.note.by}` : ""}`}>
                      <SectionAction ref={noteTrigger} icon={Pencil} onClick={() => setEditingNote(true)}>
                        Edit note
                      </SectionAction>
                    </Tooltip>
                  ) : (
                    <SectionAction ref={noteTrigger} icon={Plus} onClick={() => setEditingNote(true)}>
                      Add note
                    </SectionAction>
                  ))}
              </SectionHeader>
              {noteFailed ? (
                <SectionFailed title="Couldn't load the note">Everything else here still works</SectionFailed>
              ) : editingNote ? (
                <NoteEditor
                  labelledBy={noteTitleId}
                  initial={m.note?.text ?? ""}
                  onCancel={() => setEditingNote(false)}
                  onSave={(text) => {
                    actions.onSaveNote(text);
                    setEditingNote(false);
                  }}
                />
              ) : null}
            </Section>
            <MemberTabs
              member={m}
              onRecordPayment={actions.onRecordPayment}
              onEditPayment={actions.onEditPayment}
              failed={activityFailed}
              intakeFailed={intakeFailed}
              lab={lab}
              empty={lab.sectionEmpty}
              many={lab.manyItems}
              single={lab.singleItem}
            />
          </>
        )}
      </Body>
    </>
  );
}

/** Why a tag change didn't go through. */
type TagIssue = "failed" | "conflict" | "validation" | "offline" | "session";

/*
 * Cancelled and Unsubscribed (only when true) and tags in one row. Edit adds a × to each tag (same size and colour as before) and the
 * tag picker, open as a field: type to filter existing tags or create one. A typed name matching an existing tag
 * (any case) reuses it.
 *
 * State lab: a change is applied at once, unless an action state is on. Then it is held as a draft: Saving keeps
 * it in flight for a few seconds (no double submit); the failures keep the draft and say what to do.
 */
function TagsRow({
  titleId,
  member: m,
  tagColors,
  allTags,
  onSetTags,
  onDone,
  lab,
}: {
  titleId: string;
  member: Member;
  tagColors: Record<string, TagColor>;
  allTags: string[];
  onSetTags: (tags: string[]) => void;
  onDone?: () => void;
  lab: SheetLab;
}) {
  const [editing, setEditing] = React.useState(false);
  /* The tags as they were when editing started, so Escape can put them back. */
  const [before, setBefore] = React.useState<string[]>([]);
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
  const startEditing = () => {
    setBefore(m.tags);
    setEditing(true);
  };
  const done = () => {
    if (pending) return;
    setEditing(false);
    onDone?.();
  };
  /* Escape: put the tags back as they were and stop editing. */
  const cancel = () => {
    if (pending) return;
    window.clearTimeout(timer.current);
    discard();
    if (m.tags.length !== before.length || m.tags.some((t, i) => t !== before[i])) onSetTags(before);
    setEditing(false);
    onDone?.();
  };
  const trigger = useReturnFocus<HTMLButtonElement>(editing);

  /*
   * With tags, the tags lead and run up to Edit tags (no visible heading). With none, or while editing, the "Tags"
   * heading shows with Add tag on its right, and the tag field opens below it.
   */
  const leads = !editing && visible.length > 0;
  const showRow = !leads && (editing || pending || Boolean(draft && issue));
  const chips = (
    <Chips data-reveal="">
      {editing ? (
        <TagEditor
          onCancel={cancel}
          onConfirm={done}
          picker={
            <TagPicker
              autoFocus
              aria-label="Add a tag"
              value={shown}
              options={allTags}
              colors={tagColors}
              onValueChange={(tags) => {
                if (!pending) attempt(tags);
              }}
              placeholder="Add a tag"
              createLabel={(q) => `Create “${q}”`}
            />
          }
        >
          <QuietButton type="button" $variant="ghost" aria-disabled={pending || undefined} onClick={done}>
            {pending ? "Saving…" : "Save tags"}
          </QuietButton>
        </TagEditor>
      ) : (
        <>
          {(pending ? visible : visible.slice(0, -1)).map((t) => (
            <WrappingTag key={t} color={tagColors[t]}>
              {t}
            </WrappingTag>
          ))}
          {pending ? (
            <Muted role="status">Saving tags…</Muted>
          ) : (
            visible.length > 0 && (
              /* Hovering the tags shows a + right after the last one, a quick way to add another. The last tag and the +
                 wrap as one, so the + never sits on a line of its own. */
              <LastTag>
                <WrappingTag color={tagColors[visible[visible.length - 1]]}>{visible[visible.length - 1]}</WrappingTag>
                <Reveal>
                  <TagAddButton type="button" $variant="ghost" $size="sm" aria-label="Add a tag" onClick={startEditing}>
                    <Icon icon={Plus} />
                  </TagAddButton>
                </Reveal>
              </LastTag>
            )
          )}
        </>
      )}
      {draft && issue && (
        <FullRow>
          {issue === "failed" && (
            <InlineAlert
              title="Couldn't save the tags"
              actions={[
                { label: "Try again", onClick: () => attempt(draft) },
                { label: "Discard changes", onClick: discard },
              ]}
            >
              Your changes are still here
            </InlineAlert>
          )}
          {issue === "conflict" && (
            <InlineAlert
              tone="warning"
              title="Someone else changed these tags"
              actions={[
                { label: "Keep my tags", onClick: () => apply(draft) },
                { label: "Use their tags", onClick: discard },
              ]}
            >
              They changed this person&apos;s tags while you were editing. Choose which tags to keep.
            </InlineAlert>
          )}
          {issue === "validation" && (
            <InlineAlert
              title="That tag name is too long"
              actions={[
                { label: "Edit tags", onClick: startEditing },
                { label: "Discard changes", onClick: discard },
              ]}
            >
              Tag names can have up to 30 characters. Shorten “{added}” and try again.
            </InlineAlert>
          )}
          {issue === "offline" && (
            <InlineAlert tone="info" title="You're offline" actions={[{ label: "Try again", onClick: () => attempt(draft) }]}>
              Reconnect, then try again. Your changes are still here.
            </InlineAlert>
          )}
          {issue === "session" && (
            <InlineAlert tone="warning" title="You've been signed out" actions={[{ label: "Try again", onClick: () => attempt(draft) }]}>
              Sign in again, then try again. Your changes are still here.
            </InlineAlert>
          )}
        </FullRow>
      )}
    </Chips>
  );
  return (
    <>
      <SectionHeader titleId={titleId} title="Tags" lead={leads ? chips : undefined}>
        {!editing && !pending && (
          <SectionAction ref={trigger} icon={visible.length ? Pencil : Plus} onClick={startEditing}>
            {visible.length ? "Edit tags" : "Add tag"}
          </SectionAction>
        )}
      </SectionHeader>
      {showRow && chips}
    </>
  );
}

/** The tag field and Done, registered as an inline editor: Ctrl+Enter (Cmd+Enter) finishes, Escape cancels. */
function TagEditor({ picker, children, onCancel, onConfirm }: { picker: React.ReactNode; children: React.ReactNode; onCancel: () => void; onConfirm: () => void }) {
  const node = useInlineEditor<HTMLSpanElement>(onCancel);
  return (
    <TagEntry
      ref={node}
      onKeyDownCapture={(e) => {
        // Caught before the tag field, so Ctrl+Enter doesn't also pick the highlighted option.
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          e.stopPropagation();
          onConfirm();
        }
      }}
    >
      <TagField>{picker}</TagField>
      {children}
    </TagEntry>
  );
}

/** The note, written in place: a box under the "Note" heading (its visible label), then Cancel and Save. */
function NoteEditor({ labelledBy, initial, onCancel, onSave }: { labelledBy: string; initial: string; onCancel: () => void; onSave: (text: string) => void }) {
  const [text, setText] = React.useState(initial);
  const node = useInlineEditor<HTMLFormElement>(onCancel);
  return (
    <NoteForm
      ref={node}
      onSubmit={(e) => {
        e.preventDefault();
        onSave(text.trim());
      }}
    >
      <Textarea
        aria-labelledby={labelledBy}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          /* Ctrl+Enter (Cmd+Enter on a Mac) saves; Enter alone is a new line. */
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            onSave(text.trim());
          }
        }}
        rows={4}
        autoFocus
        /* Editing picks up where the note ends, so new text never lands in front of it. */
        onFocus={(e) => {
          const end = e.currentTarget.value.length;
          e.currentTarget.setSelectionRange(end, end);
        }}
      />
      <NoteActions>
        <Button type="button" $variant="ghost" $size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" $size="sm">
          Save note
        </Button>
      </NoteActions>
    </NoteForm>
  );
}

/** Cancelled or unsubscribed: a banner above the note, so it's the first thing anyone sees about this person. */
function StatusAlert({ member: m }: { member: Member }) {
  if (m.cancelledAt) {
    return (
      <InlineAlert tone="warning" icon={UserX}>
        Cancelled their membership on {formatDate(m.cancelledAt)}
      </InlineAlert>
    );
  }
  if (!m.subscribed) {
    const at = m.activity.find((a) => a.title === "Unsubscribed from emails")?.at;
    return (
      <InlineAlert tone="info" icon={MailX}>
        {at ? `Unsubscribed from emails on ${formatDate(at)}` : "Unsubscribed from emails"}
      </InlineAlert>
    );
  }
  return null;
}

type MemberTab = "activity" | "email" | "payments" | "intake";
/** The tabs that show the timeline; switching between them is a fetch. Payments and Intake form are already loaded. */
type TimelineView = "activity" | "email";

/* A tab switch is a fetch: long enough to see the rows dim and the tab spinner, short enough not to slow anyone down. */
const TAB_LOAD_FOR = 250;
/* "Slow activity" in the state lab: a realistic slow fetch on a busy day. */
const SLOW_ACTIVITY_FOR = 1200;

/* The search field only appears once there is enough history to search. */
const SEARCH_MIN = 12;

/* Everything newer than this many months back is grouped by month; older items are grouped by year. */
const RECENT_MONTHS = 12;

/* Newest first; on the same day, "Joined" goes last since everything else follows it. */
const joined = (r: Row) => (r.kind === "joined" ? 1 : 0);
const newestFirst = (a: Row, b: Row) => (a.at < b.at ? 1 : a.at > b.at ? -1 : joined(a) - joined(b));

/** The member's payments as timeline rows, newest first: amount, then method, who it was a gift for, and its note. */
function paymentRows(m: Member): Row[] {
  return m.payments
    .map(
      (p): Row => ({
        id: p.id,
        kind: "payment",
        title: `Paid ${formatMoney(p.amount)}`,
        at: p.date,
        detail: [methodLabel[p.method], p.giftFor ? `Gift for ${p.giftFor}` : "", p.note ?? ""].filter(Boolean).join(" · "),
        payment: p,
      }),
    )
    .sort(newestFirst);
}

/** Payments join the stored activity as their own rows. */
function activityRows(m: Member): Row[] {
  return [...m.activity, ...paymentRows(m)].sort(newestFirst);
}

/** The rows under one month or year header. Every row is its own line: emails are never bundled. */
interface Group {
  key: string;
  label: string;
  /** Older than the last 12 months: grouped by year, and revealed one year at a time. */
  older: boolean;
  rows: Row[];
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const monthIndex = (iso: string) => Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7)) - 1;

/** Newest-first rows into month groups (last 12 months) and year groups (older). */
function groupRows(rows: Row[]): Group[] {
  const recentFrom = monthIndex(TODAY) - (RECENT_MONTHS - 1);
  const groups: Group[] = [];
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
  return groups;
}

/* A tab's panel: no top padding (the section's gap spaces it) and the same column rhythm as the section. */
/*
 * The tabs on the panel's grid: the first label starts at the content edge (its left padding dropped, so the underline
 * starts there too), the labels sit the section spacing (--space-5) under the divider above (the trigger's own top
 * padding, --space-3, is taken back), and each panel starts --space-5 under the tabs (the section's --space-3 gap plus
 * this panel's margin).
 */
const DetailTabs = styled(TabsList)`
  &&& {
    margin-top: calc((var(--space-1) + var(--space-3)) * -1);
  }
  &&& [role="tab"]:first-child {
    padding-left: 0;
  }
`;

const TabPanel = styled(TabsContent)`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: 0;
  margin-top: calc(var(--space-5) - var(--space-3));

  /* Inactive panels stay in the DOM, hidden; display: flex above would otherwise keep their margin and gap. */
  &[hidden] {
    display: none;
  }

`;

/* Groups sit a timeline row apart (--space-5): the header's top padding plus this. */
const Group = styled.div`
  & + & {
    margin-top: var(--space-3);
  }
  /* The first month label starts the tab's content, so it sits flush with the panel's top like every other tab's first line. */
  &:first-of-type > h4:first-child {
    padding-top: 0;
  }
`;

/*
 * A group's label: plain, scrolling with its rows (a sticky label cut into the row above it). Each group has its own
 * list, so the connector line starts and ends inside each group: it breaks at every header.
 */
const GroupHeader = styled.h4`
  margin: 0;
  padding: var(--space-3) 0;
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
`;

/* Skeleton rows for the next year while it loads. */
const LoadingList = styled(Timeline)`
  margin-top: var(--space-5);
`;

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

/* "Show 2025": a full-width secondary button. While the year loads, a spinner replaces the label at the same size. */
const MoreButton = styled(Button)`
  position: relative;
  width: 100%;
`;

const MoreLabel = styled.span<{ $hidden: boolean }>`
  visibility: ${({ $hidden }) => ($hidden ? "hidden" : "visible")};
`;

const MoreSpinner = styled.span`
  position: absolute;
  inset: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  svg {
    animation: ${spin} calc(var(--duration-slow) * 3) linear infinite;
  }
`;

/* Lifetime value and Record payment share the first line; the gift line, when there is one, wraps under the value. */
const PaymentsHead = styled(SectionHead)`
  align-items: baseline;
`;

/**
 * Everything below the note, as one tab set: Activity (emails, member actions and payments, newest first), Emails,
 * Payments (lifetime value, Record payment, the payments) and the Intake form answers.
 */
function MemberTabs({
  member: m,
  onRecordPayment,
  onEditPayment,
  failed,
  intakeFailed,
  lab,
  empty,
  many,
  single,
}: {
  member: Member;
  onRecordPayment: () => void;
  onEditPayment: (payment: Payment) => void;
  /** The timeline (Activity and Emails) couldn't load. */
  failed: boolean;
  intakeFailed: boolean;
  lab: SheetLab;
  empty: boolean;
  many: boolean;
  single: boolean;
}) {
  const [tab, setTab] = React.useState<MemberTab>("activity");
  /* The timeline tab last chosen: Activity or Emails. Payments and Intake form leave it as it was. */
  const [view, setView] = React.useState<TimelineView>("activity");
  const [q, setQ] = React.useState("");
  /* How many older years the person has revealed with "Show <year>", beyond the default. */
  const [extraYears, setExtraYears] = React.useState(0);
  const needle = q.trim().toLowerCase();
  const [loadedEmails, setLoadedEmails] = React.useState<ReadonlySet<string>>(() => new Set());
  const markLoaded = React.useCallback((id: string) => setLoadedEmails((s) => (s.has(id) ? s : new Set(s).add(id))), []);

  // Switching between Activity and Emails always fetches: a short load (TAB_LOAD_FOR), about a second with "Slow
  // activity", longer with Slow loading. The previous rows stay, dimmed, with a spinner in the tabs. Payments and
  // Intake form are already loaded, so they switch at once. A search term only lags with Slow loading.
  const tabLoadFor = lab.slowLoading ? SLOW_SEARCH_FOR : lab.is("slow-activity") ? SLOW_ACTIVITY_FOR : TAB_LOAD_FOR;
  const viewLag = useLabDeferred(view, tabLoadFor);
  const needleLag = useLabDeferred(needle, SLOW_SEARCH_FOR);
  const appliedView = viewLag.value;
  const appliedNeedle = lab.slowLoading ? needleLag.value : needle;
  const refreshing = viewLag.pending || (lab.slowLoading && needleLag.pending);

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
  const payments = paymentRows(m);
  const counts = {
    activity: everything.length,
    email: everything.filter((a) => a.kind === "email").length,
  };
  const matches = everything
    .filter((a) => appliedView !== "email" || a.kind === "email")
    .filter((a) => !appliedNeedle || [a.title, a.detail, a.body].some((t) => t?.toLowerCase().includes(appliedNeedle)));

  /* Searching shows every match, in month and year groups, with no 12-month cut-off. */
  const searching = !!appliedNeedle;
  const groups = groupRows(matches);
  const recent = groups.filter((g) => !g.older);
  const older = groups.filter((g) => g.older);
  /* The last 12 months by default; with nothing in them, the most recent year instead of an empty list. */
  const baseYears = recent.length ? 0 : Math.min(1, older.length);
  const revealed = searching ? older.length : Math.min(older.length, baseYears + extraYears);
  const shownGroups = [...recent, ...older.slice(0, revealed)];
  const nextYear = searching ? undefined : older[revealed];

  const rowProps = { onEditPayment, lab, loadedEmails, onEmailLoaded: markLoaded };
  const searchLabel = view === "email" ? "Search emails" : "Search activity";
  const gifts = giftsGiven(m);
  const giftTotal = gifts.reduce((sum, p) => sum + p.amount, 0);
  return (
    <Tabs
      asChild
      value={tab}
      activationMode={lab.slowLoading ? "manual" : "automatic"}
      onValueChange={(v) => {
        const next = v as MemberTab;
        setTab(next);
        if ((next === "activity" || next === "email") && next !== view) {
          setView(next);
          resetPaging();
        }
      }}
    >
    <Section>
      {/* The count reads as part of the label: same colour, size and weight (PM). */}
      <DetailTabs aria-label="Details" loading={refreshing && (tab === "activity" || tab === "email")}>
        <TabsTrigger value="activity">Activity ({counts.activity})</TabsTrigger>
        <TabsTrigger value="email">Emails ({counts.email})</TabsTrigger>
        <TabsTrigger value="payments">Payments ({m.payments.length})</TabsTrigger>
        <TabsTrigger value="intake">Intake form</TabsTrigger>
      </DetailTabs>
      <TabPanel value="payments">
        <PaymentsHead>
          <Value>
            {gifts.length > 0 && (
              <ValueDetail>
                Includes {formatMoney(giftTotal)} in gifts for {gifts.map((p) => p.giftFor).join(", ")}
              </ValueDetail>
            )}
          </Value>
          <SectionActions>
            <SectionAction icon={Plus} onClick={onRecordPayment}>
              Record payment
            </SectionAction>
          </SectionActions>
        </PaymentsHead>
        {payments.length > 0 && (
          <Timeline aria-label="Payments">
            {payments.map((r) => (
              <ActivityRow key={r.id} item={r} {...rowProps} />
            ))}
          </Timeline>
        )}
      </TabPanel>
      <TabPanel value="intake">
        {intakeFailed ? (
          <SectionFailed title="Couldn't load the intake answers">Everything else here still works</SectionFailed>
        ) : m.intake ? (
          <IntakeAnswers intake={m.intake} />
        ) : (
          <Muted>They haven&apos;t filled in the intake form yet</Muted>
        )}
      </TabPanel>
      <TabPanel value={view}>
      {failed ? (
        <SectionFailed title="Couldn't load activity">Emails, payments and changes are hidden until it loads</SectionFailed>
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
                <GroupHeader>{g.label}</GroupHeader>
                <Timeline>
                  {g.rows.map((r) => (
                    <ActivityRow key={r.id} item={r} {...rowProps} />
                  ))}
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
          <Muted>{appliedNeedle ? `No activity matches “${q.trim()}”` : view === "email" ? "No emails yet" : "No activity yet"}</Muted>
        )}
      </Refreshing>
      {nextYear && (
        <MoreButton
          type="button"
          $variant="secondary"
          aria-disabled={loadingMore || undefined}
          aria-busy={loadingMore || undefined}
          onClick={showEarlier}
        >
          <MoreLabel $hidden={loadingMore}>Show {nextYear.label}</MoreLabel>
          {loadingMore && (
            <MoreSpinner aria-hidden="true">
              <Icon icon={LoaderCircle} />
            </MoreSpinner>
          )}
        </MoreButton>
      )}
        </>
      )}
      </TabPanel>
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
  if (!ok) return <SectionFailed title="Couldn't load this email">The rest of the timeline still works</SectionFailed>;
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
  return (
    <TimelineItem data-reveal={a.payment ? "" : undefined}>
      <TimelineDot $tone={TONES[a.kind]}>
        <Icon icon={ICONS[a.kind]} />
      </TimelineDot>
      {a.kind === "email" ? (
        <EmailCollapsible>
          <EmailTrigger>
            <TimelineTitle>
              {titleHead(a.title)}
              <TitleTail>
                {titleLast(a.title)}
                <Icon icon={ChevronDown} />
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
            <IconButton type="button" $variant="ghost" $size="sm" aria-label="Edit payment" onClick={() => onEditPayment(a.payment!)}>
              <Icon icon={Pencil} />
            </IconButton>
          </RevealOverlay>
        </DateCell>
      ) : (
        date
      )}
    </TimelineItem>
  );
}
