"use client";

import * as React from "react";
import { keyframes, styled } from "next-yak";
import { ChevronDown, Columns3, Copy, Download, FileUp, Link2, ListChecks, Plus, Tag as TagIcon, Tags, Trash2, UsersRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { ListEmptyState, ListPage, ListPageHeader } from "@/components/patterns/ListPage";
import { Badge } from "@/components/ui/Badge";
import { DateRuleEditor, formatDateRule, type DateRule } from "@/components/ui/DateRulePicker";
import { Button, CancelButton } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Icon } from "@/components/ui/Icon";
import { SearchField } from "@/components/ui/SearchField";
import { Pagination } from "@/components/ui/Pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Tooltip } from "@/components/ui/Tooltip";
import { Table, type TableColumn, type TableSort } from "@/components/ui/Table";
import { MarqueeOverlay } from "./MarqueeOverlay";
import { inOwnWidget, isTyping, overlayOpen, plain } from "./listKeys";
import { touches, useMarquee } from "./useMarquee";
import { AppToastProvider, useToast } from "@/components/ui/Toast";
import {
  TODAY,
  demoMembers,
  demoTags,
  formatDate,
  formatMoney,
  fullName,
  joinedTitle,
  plural,
  tagsByRecency,
  totalPaid,
  type Member,
  type Payment,
  type TagColor,
} from "./data";
import { INTAKE_TIMES, PLACES } from "./demoHistory";
import { snapshotOf, useUndoableUpdate } from "./undo";
import { MemberSheet } from "./MemberSheet";
import { ImportMembersDialog, type NewMember, type TagUpdate } from "./ImportMembersDialog";
import { BulkTagsPopover } from "./BulkTagsPopover";
import { TagManager, type TagRow } from "./TagManager";
import { TAG_COLORS, Tag } from "@/components/ui/Tag";
import { SEARCH_FOR, SLOW_SEARCH_FOR, useLabDeferred, useLabLoad, useStateLab } from "../_state-lab/useStateLab";
import { VisuallyHidden } from "./SheetStates";
import { AccessState, FilterOptionsLoader, ListFailed, ListLoading, StatusBanner, TagsFailed } from "./ListStates";
import {
  AddMemberDialog,
  ConfirmDialog,
  DeletePeopleDialog,
  isPaying,
  EditDetailsDialog,
  PaymentDialog,
} from "./dialogs";

/* ---------- layout ---------- */

/* Search and filters in one row under the header. Narrow: the search takes its own full-width line and the filters scroll beneath it. */
const ToolbarBox = styled.div`
  container-type: inline-size;
  min-width: 0;
`;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;

  @container (max-width: 640px) {
    flex-direction: column;
    flex-wrap: nowrap;
    align-items: stretch;
  }
`;

/* The search is the one thing that shrinks: the filter buttons keep their size, and drop to their own line only when even a small search can't fit beside them. */
const SearchBox = styled.div`
  flex: 1 1 calc(var(--space-8) * 2);
  min-width: calc(var(--space-8) * 2);

  @container (max-width: 640px) {
    flex: none;
    min-width: 0;
  }
`;

/* A filter button at the same height as the search field (the kit's sm and default buttons are shorter). */
/* Same height as the search box, and the kit's body-size text (--text-sm) like the search, table and results line. */
const FilterButton = styled(Button)`
  &&& {
    height: var(--control-height);
    padding: 0 var(--space-3);
  }
  /* Open: a light fill, so it's clear which filter the popover below belongs to. */
  &&&[data-state="open"] {
    background: var(--color-bg-hover);
    border-color: var(--color-border-strong);
  }
  /* Applied: a light green fill and a primary outline, so the page reads as filtered at a glance (the count says how much). */
  &&&[data-applied] {
    background: var(--color-primary-subtle);
    border-color: var(--color-primary);
  }
`;

/* Search row, chips and results line as one block: one tight rhythm inside, the page's rhythm around it (a step tighter before the table). */
const FilterArea = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border);
`;

/* Header icon buttons are square: as wide as they are tall. */
const HeaderIconButton = styled(Button)`
  aspect-ratio: 1;
  padding: 0;
`;

/* "Add member" with its menu arrow joined on the right, a thin line between them. */
const SplitButton = styled.div`
  display: inline-flex;
  & > button:first-child {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
  & > button:last-child {
    aspect-ratio: 1;
    padding: 0;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-left: 1px solid color-mix(in srgb, var(--color-on-primary) 35%, transparent);
  }
`;

/* "People" with the count beside it in brackets, smaller and muted, sitting on the title's baseline. */
const TitleRow = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-1);
`;

const TitleCount = styled.span`
  font-size: var(--text-sm);
  font-weight: var(--weight-regular);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
`;

/* The quick-filter row beside the search. On narrow screens it scrolls sideways inside itself, so the page never does.
   The small padding (cancelled by the margin) gives focus rings room inside the scroll box. */
const FilterRow = styled.div`
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: var(--space-2);
  flex: none;
  max-width: calc(100% + var(--space-2));
  margin: calc(var(--space-1) * -1);
  padding: var(--space-1);
  overflow-x: auto;
  scrollbar-width: thin;

  & > * {
    flex: none;
  }
`;

/* The editor inside a filter's popover: only that filter's control. */
const FilterEditor = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
`;

/* Lists in a filter popover sit like a kit menu: the popover's own inset is cancelled so rows get the menu's var(--space-1) inner padding. */
const MenuList = styled.div`
  margin: calc(var(--space-1) - var(--space-3));
`;

const OptionList = styled(MenuList)`
  display: flex;
  flex-direction: column;
  max-height: calc(var(--menu-row-height) * 7.5);
  overflow-y: auto;
  /* The wheel scrolls the list, and never hands the scroll on to the page at the list's ends. */
  overscroll-behavior: contain;

  /* Rows keep their height (long answers wrap to two lines) instead of being squeezed into the list's max height. */
  & > * {
    flex: none;
  }
`;

/* Rows grow with their text: long answers wrap, and the checkbox and the count stay level with the first line. */
const OptionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  min-height: var(--menu-row-height);
  padding: var(--space-1) var(--space-3);
  /* The whole row ticks its box (see toggleFromRow). Its hover fill runs edge to edge, square. */
  cursor: pointer;

  &:hover {
    background: var(--color-bg-hover);
  }
`;

/* The checkbox row may shrink, so a long label wraps inside it instead of running under the count. */
const OptionCheck = styled.span`
  flex: 1 1 auto;
  min-width: 0;

  /* Box centred on the row, tag pills and wrapped answers alike. */
  & > span {
    display: flex;
    align-items: center;
    max-width: 100%;
  }
  & > span > button {
    margin-top: 0;
  }
  & label {
    min-width: 0;
    overflow-wrap: anywhere;
  }
`;

/* Same size and line height as the label, so the count sits on the label's first line. */
const OptionCount = styled.span`
  flex: none;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
`;

/* The tag list under its search: rows run edge to edge like a menu, scrolling inside the one popover. */
const TagOptionList = styled(OptionList)`
  /* Rows run to the popover's edges, so the hover fill does too, and down to the footer's line, so a scrolled row
     disappears under the line instead of being cut off short of it. */
  margin: 0 calc(var(--space-3) * -1) calc(var(--space-3) * -1);
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-strong) transparent;

  /* With a scrollbar, it sits in its own gutter with room before the counts, like the kit's column filter. */
  &[data-scrolls] {
    scrollbar-gutter: stable;
    padding-right: var(--space-1);
  }
`;

/* How many values an applied filter has, in a small circle after its name. A number, so it isn't carried by the fill alone. */
const AppliedCount = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--space-4);
  height: var(--space-4);
  padding: 0 var(--space-1);
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-size: var(--text-xs);
  font-variant-numeric: tabular-nums;
  line-height: 1;
`;

/* Cancel and Apply at the foot of a staged filter, with Reset on the left when there is something to reset. */
const FilterActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  /* A divider and a soft shadow cast up over the list, so the list reads as scrolling under the footer. */
  margin: 0 calc(var(--space-3) * -1);
  padding: var(--space-3) var(--space-3) 0;
  border-top: 1px solid var(--color-border);

  &[data-over-scroll] {
    box-shadow: var(--shadow-up);
  }
  clip-path: inset(calc(var(--space-3) * -1) 0 0 0);

  /* Cancel on the far left, as in the kit's footers. */
  & > [data-cancel] {
    margin-right: auto;
  }
`;

const OptionsNote = styled.p`
  margin: 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

/* Long answers need room: about 360px on desktop, the screen width minus the page gutters on phones. */
/* The Joined filter: as wide as its calendar, like DateRulePicker's own popover. */
const DatePopover = styled(PopoverContent)`
  &&& {
    width: auto;
    max-width: calc(100vw - var(--space-4) * 2);
  }
`;

const WidePopover = styled(PopoverContent)`
  &&& {
    width: min(calc(var(--space-8) * 5.5), calc(100vw - var(--space-4) * 2));
    max-width: calc(100vw - var(--space-4) * 2);
  }
`;

/* A name with the tags that matched the search, so a tag search shows why each row is there. */
const NameCell = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
`;

const NameStack = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const MobileEmail = styled.span`
  display: none;

  @media (max-width: 639px) {
    display: block;
    /* The viewport minus the select and columns-menu columns and the page gutters, so a long email is cut with an ellipsis instead of widening the table. */
    max-width: calc(100vw - var(--space-7) * 2 - var(--space-6));
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }
`;

/* Floats at the bottom centre where the toasts show, so selecting people never moves the page. */
const rise = keyframes`
  from { opacity: 0; transform: translate(-50%, var(--space-2)); }
`;
const sink = keyframes`
  to { opacity: 0; transform: translate(-50%, var(--space-2)); }
`;
const SelectionBar = styled.div`
  position: fixed;
  left: 50%;
  bottom: var(--space-5);
  transform: translate(-50%, 0);
  /* Above the page and its sticky headers, below sheets and dialogs. */
  z-index: calc(var(--z-nav) - 1);
  display: flex;
  align-items: center;
  gap: var(--space-1);
  max-width: calc(100vw - var(--space-4) * 2);
  padding: var(--space-1) var(--space-2);
  /* A deep brand green for overlay surfaces, with its own text colour, so the bar and the toasts above it are one family. */
  border: 1px solid var(--color-primary-deep);
  border-radius: var(--radius-lg);
  background: var(--color-primary-deep);
  color: var(--color-on-primary-deep);
  box-shadow: var(--shadow-lg);
  font-size: var(--text-sm);

  &[data-state="open"] {
    animation: ${rise} var(--duration) var(--ease);
  }
  &[data-state="closed"] {
    animation: ${sink} var(--duration) var(--ease) forwards;
    pointer-events: none;
  }
`;

const BarCount = styled.span`
  flex: none;
  padding: 0 var(--space-2);

  @media (max-width: 479px) {
    padding: 0 var(--space-1);
  }
  font-weight: var(--weight-medium);
  white-space: nowrap;
`;

const BarDivider = styled.span`
  flex: none;
  align-self: stretch;
  width: 1px;
  margin: var(--space-1);
  background: var(--color-on-primary-deep);
  opacity: 0.3;

  /* On a phone the bar needs every pixel for its buttons: the dividers lose their side margin. */
  @media (max-width: 479px) {
    margin-inline: 0;
  }
`;

/* Ghost buttons on the dark surface: inverse text, a visible hover fill, and a focus ring in the inverse colour (the usual one is the primary colour, invisible here). */
const BarButton = styled(Button)`
  &&& {
    color: var(--color-on-primary-deep);
    &:hover:not(:disabled):not([aria-disabled="true"]) {
      background: color-mix(in srgb, var(--color-on-primary-deep) 18%, transparent);
    }
    &:focus-visible {
      box-shadow: 0 0 0 2px var(--color-primary-deep), 0 0 0 4px var(--color-on-primary-deep);
    }
  }
`;

/* Square, icon-only. Never squeezed: the bar is sized to fit them at 360px. */
const BarIconButton = styled(BarButton)`
  &&& {
    flex: none;
    width: var(--space-6);
    height: var(--space-6);
    padding: 0;
  }
`;


/* Select all: words where there's room; on a phone the bar is too narrow, so it becomes an icon with a tooltip. */
const WideOnly = styled(BarButton)`
  &&& {
    flex: none;
  }
  @media (max-width: 479px) {
    &&& {
      display: none;
    }
  }
`;
const NarrowOnly = styled(BarIconButton)`
  @media (min-width: 480px) {
    &&& {
      display: none;
    }
  }
`;

/* The bar's one Tags button. It is the popover's trigger, so it takes the trigger's props and ref. */
const BarTagsButton = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof BarIconButton>>(function BarTagsButton(props, ref) {
  return (
    <Tooltip content="Add or remove tags">
      <BarIconButton ref={ref} type="button" $variant="ghost" aria-label="Add or remove tags" {...props}>
        <Icon icon={TagIcon} size={16} />
      </BarIconButton>
    </Tooltip>
  );
});

const PageBar = styled.div`
  padding-block: var(--space-3);
`;

/*
 * Selected rows: the kit's light hover fill (the darker --color-bg-selected fought with the row lines), as one band with
 * rounded corners: the divider between two selected rows is hidden, and each run of selected rows rounds its outer corners
 * like a hovered row. Done from here because the kit Table has no selected-row prop; a row counts as selected when its
 * checkbox is checked.
 */
const ListWrap = styled.div`
  &&& tbody tr:has([data-member-id] [data-state="checked"]) > td {
    background: var(--color-bg-hover);
  }
  &&& tbody tr:has([data-member-id] [data-state="checked"]) + tr:has([data-member-id] [data-state="checked"]) > td::before {
    background: transparent;
  }
  /* First row of a run: round the top corners. */
  &&& tbody tr:has([data-member-id] [data-state="checked"]):not(tr:has([data-member-id] [data-state="checked"]) + tr) > td:first-child {
    border-top-left-radius: var(--radius-sm);
  }
  &&& tbody tr:has([data-member-id] [data-state="checked"]):not(tr:has([data-member-id] [data-state="checked"]) + tr) > td:last-child {
    border-top-right-radius: var(--radius-sm);
  }
  /* Last row of a run: round the bottom corners. */
  &&& tbody tr:has([data-member-id] [data-state="checked"]):not(:has(+ tr [data-member-id] [data-state="checked"])) > td:first-child {
    border-bottom-left-radius: var(--radius-sm);
  }
  &&& tbody tr:has([data-member-id] [data-state="checked"]):not(:has(+ tr [data-member-id] [data-state="checked"])) > td:last-child {
    border-bottom-right-radius: var(--radius-sm);
  }

  /* Phones: the kit Table has no column visibility, so every column after Name except the columns menu are hidden here and the
     table drops its minimum width, so it fits the screen instead of scrolling. The select column stays. */
  @media (max-width: 639px) {
    &&& table {
      min-width: 0;
    }
    &&& :is(th, td):nth-child(n + 3):not(:last-child) {
      display: none;
    }
  }
`;

/* Room under the last row so it can scroll above the floating bar. */
const BarSpace = styled.div`
  height: var(--space-8);
`;

/* Long names and emails wrap inside their column instead of widening the table. */
const Wrap = styled.span`
  overflow-wrap: anywhere;
`;

/* The copy icon after an email: only while the email is hovered or focused, and always taking its room so nothing shifts. */
const CopyHint = styled.span`
  display: inline-flex;
  flex: none;
  color: var(--color-text-muted);
  opacity: 0;
`;

/* An email that copies on click: reads as plain text in the row, with the ghost button's hover fill and focus ring. */
const EmailCopy = styled(Button)`
  &&& {
    height: auto;
    min-height: var(--pill-height);
    margin: 0 calc(var(--space-2) * -1);
    padding: 0 var(--space-2);
    justify-content: flex-start;
    gap: var(--space-1);
    font-size: inherit;
    color: inherit;
    text-align: left;
    /* An address reads as one unit: never broken across lines. When the table runs out of room it scrolls
       sideways, with the name column frozen, instead of squeezing the email. */
    white-space: nowrap;
  }
  &:is(:hover, :focus-visible) > ${CopyHint} {
    opacity: 1;
  }
`;

const Ends = styled.span`
  font-variant-numeric: tabular-nums;
`;

/*
 * The table's select checkboxes: the kit's 20px box (as in the Outbox), centred in the row. The ::after keeps the pointer target at least 24px
 * (WCAG 2.5.8) inside the cell's clip box, which the 24px height makes room for.
 */
const SelectBox = styled.span`
  display: flex;
  align-items: center;
  height: var(--space-5);

  & > button[role="checkbox"] {
    position: relative;
  }
  & > button[role="checkbox"]::after {
    content: "";
    position: absolute;
    inset: calc(var(--space-1) * -1);
  }
`;

/* The Tags column: the two newest tags, then how many more. */
/* One line: the newest tags, then "+N" for the rest. A long tag is cut short rather than wrapping. */
const TagsCell = styled.div`
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: var(--space-1);
  min-width: 0;
`;

/* A long tag name is cut short in the table; the full name is in the member sheet. */
const CellTag = styled(Tag)`
  &&& {
    flex: 0 1 auto;
    min-width: 0;
    max-width: calc(var(--space-8) * 3);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const More = styled.span`
  flex: none;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  white-space: nowrap;
`;

/* ---------- filters ---------- */

/** "any": has at least one of the chosen tags. "all": has every one of them. */
type TagMode = "any" | "all";

interface Filters {
  /** Before / After / Between, as on automatic emails. Applied once it has a date. */
  joined: DateRule;
  tags: string[];
  tagMode: TagMode;
  /** People who have none of these tags. */
  notTags: string[];
  /** Which people show. Subscribed and unsubscribed (everyone but people who cancelled) is the default view, not an applied filter. */
  membership: Membership[];
  /** The intake-form filters match anyone who has any of the chosen values. */
  interests: string[];
  ways: string[];
  location: string[];
  time: string[];
}

/** True when a join date fits the rule. A rule with no dates yet matches everyone. */
function joinedMatches(j: Filters["joined"], joinedAt: string) {
  if (!j.from && !j.to) return true;
  if (j.op === "before") return joinedAt < j.from;
  if (j.op === "after") return joinedAt > j.from;
  const [a, b] = j.from && j.to && j.from > j.to ? [j.to, j.from] : [j.from, j.to];
  return (!a || joinedAt >= a) && (!b || joinedAt <= b);
}

/** Where someone stands. Someone who cancelled counts as cancelled, whether or not they were subscribed. */
type Membership = "subscribed" | "unsubscribed" | "cancelled";

const membershipLabels: Record<Membership, string> = {
  subscribed: "Subscribed",
  unsubscribed: "Unsubscribed",
  cancelled: "Cancelled",
};

const membershipOf = (m: Member): Membership => (m.cancelledAt ? "cancelled" : m.subscribed ? "subscribed" : "unsubscribed");

/* The default view is subscribed members only (owner, Nov 2026): unsubscribed and cancelled people are a tick away. */
const DEFAULT_MEMBERSHIP: Membership[] = ["subscribed"];

/** True when the membership filter is still the default view. Ticking nothing also means the default. */
const isDefaultMembership = (v: Membership[]) => !v.length || (v.length === DEFAULT_MEMBERSHIP.length && DEFAULT_MEMBERSHIP.every((x) => v.includes(x)));

type FilterKey = Exclude<keyof Filters, "tagMode">;

/** The filter buttons, in row order. The intake-form filters come last, behind More. */
const filterLabels: Record<FilterKey, string> = {
  tags: "Tags",
  notTags: "Not tagged",
  membership: "Membership",
  joined: "Joined",
  interests: "Interests",
  ways: "Ways to help",
  location: "Location",
  time: "Availability",
};

const quickFilters: FilterKey[] = ["tags", "joined", "membership"];
const intakeFilters: FilterKey[] = ["interests", "ways", "location", "time"];
/** Everything behind More: leaving a tag out, then the intake-form filters. */
const moreFilters: FilterKey[] = ["notTags", ...intakeFilters];

const noFilters: Filters = {
  joined: { op: "between", from: "", to: "" },
  tags: [],
  tagMode: "any",
  notTags: [],
  membership: DEFAULT_MEMBERSHIP,
  interests: [],
  ways: [],
  location: [],
  time: [],
};

/** Free-text "Other: ..." answers all count as one value, so they don't each become an option. */
const OTHER = "Other";
const answersOf = (m: Member, key: "interests" | "ways") => (m.intake?.[key] ?? []).map((v) => (v.startsWith("Other:") ? OTHER : v));

type CheckKey = "membership" | "interests" | "ways" | "location" | "time";

/** The values one person has for a checkbox filter. */
function valuesOf(m: Member, key: CheckKey): string[] {
  if (key === "membership") return [membershipOf(m)];
  if (key === "interests" || key === "ways") return answersOf(m, key);
  const v = m.intake?.[key];
  return v ? [v] : [];
}

const formOrder: Partial<Record<CheckKey, string[]>> = { location: PLACES.map((p) => p.location), time: INTAKE_TIMES };

/**
 * The values present in the list. Location and Availability keep the form's own order; Interests and Ways to help go by how many
 * people chose each (the whole list, so rows don't jump as you tick), with Other last.
 */
function optionValues(pool: Member[], key: Exclude<CheckKey, "membership">): string[] {
  const totals = new Map<string, number>();
  for (const m of pool) for (const v of new Set(valuesOf(m, key))) totals.set(v, (totals.get(v) ?? 0) + 1);
  const order = formOrder[key];
  const rank = (v: string) => (order?.includes(v) ? order.indexOf(v) : order ? order.length : 0);
  return [...totals.keys()].sort((a, b) => {
    if (order) return rank(a) - rank(b) || a.localeCompare(b);
    if ((a === OTHER) !== (b === OTHER)) return a === OTHER ? 1 : -1;
    return (totals.get(b) ?? 0) - (totals.get(a) ?? 0) || a.localeCompare(b);
  });
}

const has = (value: string, query: string) => value.toLowerCase().includes(query.trim().toLowerCase());

function matches(m: Member, f: Filters, q: string) {
  if (q.trim() && !has(`${fullName(m)} ${m.email} ${m.tags.join(" ")}`, q)) return false;
  if (!(f.membership.length ? f.membership : DEFAULT_MEMBERSHIP).includes(membershipOf(m))) return false;
  if (f.tags.length) {
    const hasTag = (t: string) => m.tags.some((x) => x.toLowerCase() === t.toLowerCase());
    if (f.tagMode === "all" && !f.tags.every(hasTag)) return false;
    if (f.tagMode === "any" && !f.tags.some(hasTag)) return false;
  }
  if (f.notTags.length && f.notTags.some((t) => m.tags.some((x) => x.toLowerCase() === t.toLowerCase()))) return false;
  if (!joinedMatches(f.joined, m.joinedAt)) return false;
  if (f.interests.length && !f.interests.some((v) => answersOf(m, "interests").includes(v))) return false;
  if (f.ways.length && !f.ways.some((v) => answersOf(m, "ways").includes(v))) return false;
  if (f.location.length && !(m.intake?.location && f.location.includes(m.intake.location))) return false;
  if (f.time.length && !(m.intake?.time && f.time.includes(m.intake.time))) return false;
  return true;
}

/** True when one filter differs from the default view. */
function isApplied(key: FilterKey, f: Filters) {
  if (key === "joined") return Boolean(f.joined.from || f.joined.to);
  if (key === "membership") return !isDefaultMembership(f.membership);
  return f[key].length > 0;
}

const filterCount = (f: Filters) =>
  [f.joined.from || f.joined.to, !isDefaultMembership(f.membership)].filter(Boolean).length + [f.interests, f.ways, f.location, f.time].filter((v) => v.length).length + [f.tags, f.notTags].filter((v) => v.length).length;

/**
 * A checkbox list. Changes apply at once. Each count is how many people have that value among those who match the search and the
 * other filters (not this one), so the numbers follow what is on screen, and an option at 0 shows it would find no one.
 */
function CheckList({
  fieldKey,
  label,
  options,
  pool,
  filters,
  q,
  onApply,
  onCancel,
  onReset,
}: {
  fieldKey: CheckKey;
  label: string;
  options: { value: string; label: string }[];
  pool: Member[];
  filters: Filters;
  q: string;
  onApply: (values: string[]) => void;
  onCancel: () => void;
  onReset?: ResetAction;
}) {
  const [listRef, scrolls] = useScrolls<HTMLDivElement>();
  /* Ticking changes a draft; Apply commits it. */
  const [chosenValues, setChosenValues] = React.useState(filters[fieldKey] as string[]);
  const counts = React.useMemo(() => {
    /* Leave this filter out. For Membership that means everyone, since an empty Membership is the default view. */
    const rest = { ...filters, [fieldKey]: fieldKey === "membership" ? Object.keys(membershipLabels) : [] };
    const out = new Map<string, number>();
    for (const m of pool) {
      if (!matches(m, rest, q)) continue;
      for (const v of new Set(valuesOf(m, fieldKey))) out.set(v, (out.get(v) ?? 0) + 1);
    }
    return out;
  }, [pool, filters, fieldKey, q]);
  return (
    <FilterEditor role="group" aria-label={label}>
      <TagOptionList ref={listRef} data-scrolls={scrolls ? "" : undefined}>
        {options.map((o) => (
          <OptionRow key={o.value} onClick={toggleFromRow}>
            <OptionCheck>
              <Checkbox
                label={o.label}
                checked={chosenValues.includes(o.value)}
                onCheckedChange={(on) => setChosenValues((cur) => (on === true ? [...cur.filter((v) => v !== o.value), o.value] : cur.filter((v) => v !== o.value)))}
              />
            </OptionCheck>
            <OptionCount>{counts.get(o.value) ?? 0}</OptionCount>
          </OptionRow>
        ))}
        {!options.length && <OptionsNote>No answers yet</OptionsNote>}
      </TagOptionList>
      <StagedActions onReset={onReset} onCancel={onCancel} onApply={() => onApply(chosenValues)} overScroll={scrolls} />
    </FilterEditor>
  );
}

/**
 * Tags as a checkbox list in the filter's own popover: a search box (focused on open), then every tag in its colour with a count,
 * scrolling when long. Staged like the kit's column filter: ticking changes a draft; Apply commits it and closes, Cancel drops it.
 * Counts are people who match the search and the other filters, leaving this one out.
 */
function TagCheckList({
  fieldKey,
  label,
  options,
  colors,
  pool,
  filters,
  q,
  onApply,
  onCancel,
  onReset,
}: {
  fieldKey: "tags" | "notTags";
  label: string;
  options: string[];
  colors: Record<string, TagColor>;
  pool: Member[];
  filters: Filters;
  q: string;
  onApply: (tags: string[]) => void;
  onCancel: () => void;
  /** Back to the default; only offered while the filter is applied or was added from More. */
  onReset?: ResetAction;
}) {
  const [query, setQuery] = React.useState("");
  const [listRef, scrolls] = useScrolls<HTMLDivElement>();
  const [chosenTags, setChosenTags] = React.useState(filters[fieldKey]);
  const counts = React.useMemo(() => {
    const rest = { ...filters, [fieldKey]: [] };
    const out = new Map<string, number>();
    for (const m of pool) {
      if (!matches(m, rest, q)) continue;
      for (const t of m.tags) out.set(t, (out.get(t) ?? 0) + 1);
    }
    return out;
  }, [pool, filters, fieldKey, q]);
  /* The tags applied when the popover opened go first (fixed at open, so rows don't jump as you tick), then the rest by colour. */
  const [applied] = React.useState(() => new Set(filters[fieldKey]));
  const ordered = React.useMemo(
    () => [...options].sort((a, b) => Number(applied.has(b)) - Number(applied.has(a)) || byColourThenName(a, b, colors)),
    [options, applied, colors],
  );
  const needle = query.trim().toLowerCase();
  const shown = needle ? ordered.filter((t) => t.toLowerCase().includes(needle)) : ordered;
  const apply = () => onApply(chosenTags);
  /* Enter ticks the first match; Enter again (or with nothing new to tick) applies. */
  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const first = needle ? shown[0] : undefined;
    if (first && !chosenTags.includes(first)) setChosenTags((cur) => [...cur, first]);
    else apply();
  };
  return (
    <>
      <SearchField
        aria-label="Search tags"
        placeholder="Search tags"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onSearch={setQuery}
        onKeyDown={onSearchKey}
        autoFocus
      />
      <TagOptionList ref={listRef} role="group" aria-label={label} data-scrolls={scrolls ? "" : undefined}>
        {shown.map((t) => (
          <OptionRow key={t} onClick={toggleFromRow}>
            <OptionCheck>
              <Checkbox
                label={<Tag color={colors[t]}>{t}</Tag>}
                checked={chosenTags.includes(t)}
                onCheckedChange={(on) => setChosenTags((cur) => (on === true ? [...cur.filter((x) => x !== t), t] : cur.filter((x) => x !== t)))}
              />
            </OptionCheck>
            <OptionCount>{counts.get(t) ?? 0}</OptionCount>
          </OptionRow>
        ))}
        {!shown.length && <OptionsNote role="status">{options.length ? "No tags match" : "No tags yet"}</OptionsNote>}
      </TagOptionList>
      <StagedActions onReset={onReset} onCancel={onCancel} onApply={apply} overScroll={scrolls} />
    </>
  );
}

type ResetAction = { label: string; run: () => void };

/**
 * Whether a list is taller than its box (so it scrolls): measured, since long answers wrap and a row count can't tell.
 * Re-checks when the box resizes or its rows change (a search narrows the list).
 */
function useScrolls<T extends HTMLElement>(): [(el: T | null) => (() => void) | undefined, boolean] {
  const [scrolls, setScrolls] = React.useState(false);
  const ref = React.useCallback((el: T | null) => {
    if (!el) return undefined;
    const check = () => setScrolls(el.scrollHeight > el.clientHeight + 1);
    check();
    const resize = new ResizeObserver(check);
    resize.observe(el);
    const rows = new MutationObserver(check);
    rows.observe(el, { childList: true, subtree: true });
    return () => {
      resize.disconnect();
      rows.disconnect();
    };
  }, []);
  return [ref, scrolls];
}

/** The foot of every filter popover: Cancel on the far left; Reset (when there's something to reset) and Apply on the right. */
function StagedActions({
  onReset,
  onCancel,
  onApply,
  overScroll = false,
}: {
  onReset?: ResetAction;
  onCancel: () => void;
  onApply: () => void;
  /** The list above scrolls: lift the footer with a shadow. Lists that fit, and the date picker, get none. */
  overScroll?: boolean;
}) {
  return (
    <FilterActions data-over-scroll={overScroll ? "" : undefined}>
      <CancelButton $size="sm" onClick={onCancel} />
      {onReset && (
        <Button type="button" $variant="secondary" $size="sm" onClick={onReset.run}>
          {onReset.label}
        </Button>
      )}
      <Button type="button" $size="sm" onClick={onApply}>
        Apply
      </Button>
    </FilterActions>
  );
}

/** The Joined filter, staged like the tag filters: the button only changes when Apply is pressed. */
function JoinedEditor({
  initial,
  onApply,
  onCancel,
  onReset,
}: {
  initial: DateRule;
  onApply: (rule: DateRule) => void;
  onCancel: () => void;
  onReset?: ResetAction;
}) {
  const [rule, setRule] = React.useState(initial);
  return (
    <>
      <DateRuleEditor label="Joined" value={rule} onValueChange={setRule} />
      <StagedActions onReset={onReset} onCancel={onCancel} onApply={() => onApply(rule)} />
    </>
  );
}

/** Tags grouped by colour (the kit's colour order, grey last), then A to Z within a colour. */
function byColourThenName(a: string, b: string, colors: Record<string, TagColor>) {
  const rank = (t: string) => {
    const c = colors[t];
    return c ? TAG_COLORS.indexOf(c) : TAG_COLORS.length;
  };
  return rank(a) - rank(b) || a.localeCompare(b);
}

/** A click anywhere on an option row ticks its box. Clicks on the box or its label already do, so they're left alone. */
function toggleFromRow(e: React.MouseEvent<HTMLElement>) {
  const target = e.target as HTMLElement;
  if (target.closest("button, label")) return;
  e.currentTarget.querySelector<HTMLButtonElement>('button[role="checkbox"]')?.click();
}

/* ---------- columns ---------- */

/** The columns the Columns menu can show or hide, in table order. Only Name is always there. */
type OptionalColumn = "email" | "tags" | "value" | "joined" | "location" | "referred";

const optionalColumns: [OptionalColumn, string][] = [
  ["email", "Email"],
  ["tags", "Tags"],
  ["value", "Lifetime value"],
  ["joined", "Joined"],
  ["location", "Location"],
  ["referred", "Referred by"],
];

const DEFAULT_COLUMNS: OptionalColumn[] = ["email", "tags", "value"];
/** This browser's column choice. Saved per browser only; the page works the same without it. */
const COLUMNS_KEY = "sdc.memberDirectory.columns";

const COLUMNS_EVENT = "sdc-columns-change";

/** The saved choice as stored text, or null. Server render and first paint read null, so they match. */
function readColumnsRaw(): string | null {
  try {
    return window.localStorage.getItem(COLUMNS_KEY);
  } catch {
    return null;
  }
}

function parseColumns(raw: string | null): Set<OptionalColumn> {
  if (!raw) return new Set(DEFAULT_COLUMNS);
  try {
    const keys = optionalColumns.map(([k]) => k);
    const parsed = JSON.parse(raw) as unknown[] | { v: 2; columns: unknown[] };
    /* A list saved before Email could be hidden is the old format: Email was always shown then, so keep it. */
    const list = Array.isArray(parsed) ? [...parsed, "email"] : parsed.columns;
    return new Set(list.filter((k): k is OptionalColumn => keys.includes(k as OptionalColumn)));
  } catch {
    return new Set(DEFAULT_COLUMNS);
  }
}

function subscribeColumns(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(COLUMNS_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(COLUMNS_EVENT, onChange);
  };
}

function saveColumns(shown: Set<OptionalColumn>) {
  try {
    window.localStorage.setItem(COLUMNS_KEY, JSON.stringify({ v: 2, columns: [...shown] }));
  } catch {
    /* Storage blocked or full: the choice just isn't remembered. */
  }
  window.dispatchEvent(new Event(COLUMNS_EVENT));
}

/** What a column sorts by. Blank values always sort last. */
function sortValue(m: Member, key: string): string | number {
  switch (key) {
    case "name":
      return fullName(m).toLowerCase();
    case "email":
      return m.email.toLowerCase();
    case "value":
      return totalPaid(m);
    case "joined":
      return m.joinedAt;
    case "location":
      return (m.intake?.location ?? "").toLowerCase();
    case "referred":
      return (m.referredBy ?? "").toLowerCase();
    default:
      return fullName(m).toLowerCase();
  }
}

/** The CSV columns for the table as shown, then whether they are subscribed and when they cancelled. */
function csvColumns(shown: Set<OptionalColumn>): { label: string; value: (m: Member) => string }[] {
  return [
    { label: "First name", value: (m) => m.firstName },
    { label: "Last name", value: (m) => m.lastName },
    { label: "Email", value: (m) => m.email },
    ...(shown.has("tags") ? [{ label: "Tags", value: (m: Member) => tagsByRecency(m).join("; ") }] : []),
    ...(shown.has("value") ? [{ label: "Lifetime value", value: (m: Member) => String(totalPaid(m)) }] : []),
    ...(shown.has("joined") ? [{ label: "Joined", value: (m: Member) => m.joinedAt }] : []),
    ...(shown.has("location") ? [{ label: "Location", value: (m: Member) => m.intake?.location ?? "" }] : []),
    ...(shown.has("referred") ? [{ label: "Referred by", value: (m: Member) => m.referredBy ?? "" }] : []),
    { label: "Subscribed", value: (m) => (m.subscribed ? "Yes" : "No") },
    { label: "Cancelled", value: (m) => m.cancelledAt ?? "" },
  ];
}

function toCsv(rows: Member[], shown: Set<OptionalColumn>) {
  const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const cols = csvColumns(shown);
  return [cols.map((c) => cell(c.label)).join(","), ...rows.map((m) => cols.map((c) => cell(c.value(m))).join(","))].join("\n");
}

/** Who a toast names: their full name, or their email when the name is missing. */
const nameOf = (m: Member) => fullName(m) || m.email || "1 person";

/** One person by name, several by count: "Priya Shah", "4 people". */
const whom = (people: Member[]) => (people.length === 1 ? nameOf(people[0]) : plural(people.length, "person", "people"));

/** An amount in Canadian dollars with cents, as the toasts and payment confirmation show it: "$25.00". */
const cad = (n: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------- state lab: demo data for the edge cases ---------- */

/** Copies of the demo people, each with its own id and email, until there are at least `count`. */
function manyMembers(base: Member[], count: number): Member[] {
  if (!base.length) return base;
  const out: Member[] = [];
  for (let k = 0; out.length < count; k++) {
    for (const m of base) out.push(k === 0 ? m : { ...m, id: `${m.id}-copy${k}`, email: `copy${k}.${m.email}` });
  }
  return out;
}

const LONG_NAME = "Maria-Magdalena Fernandez-Wolkowitz-Anderson the Third";
const LONG_EMAIL = "maria-magdalena.fernandez-wolkowitz-anderson.the-third@a-very-long-community-organisation-name.example.org";
const LONG_TAG = "Volunteers who help with the Saturday morning community garden and seed library";

function longMembers(base: Member[]): Member[] {
  return base.map((m, i) => ({
    ...m,
    firstName: i % 2 ? m.firstName : LONG_NAME,
    email: `${i}.${LONG_EMAIL}`,
    tags: i % 3 ? m.tags : [...m.tags, LONG_TAG],
  }));
}

/** Every third person has no name (their email stands in), every fourth other person has no email. */
function partialMembers(base: Member[]): Member[] {
  return base.map((m, i) => (i % 3 === 0 ? { ...m, firstName: "", lastName: "" } : i % 4 === 0 ? { ...m, email: "" } : m));
}

/* ---------- page ---------- */

/* Everyone's light row data arrives once, so search, filters, sort, Select all and Export cover the whole list; the page only limits
   how many rows render. If the list grows past a few thousand people, server-side paging takes over. */
const PAGE_SIZE = 50;
/** How long a page "loads" while Slow loading is on (ms): one full pass of the Table's progress line (5 x --duration-slow), so it never reads as cut short. */
const PAGE_LOAD_FOR = 1200;
/** Slow loading: how long applying a filter "updates" the list (ms), the same one pass of the progress line. */
const FILTER_APPLY_FOR = 1200;

type DialogState =
  | { kind: "add" }
  | { kind: "import" }
  | { kind: "details" }
  | { kind: "payment"; payment?: Payment }
  | { kind: "deletePayment"; payment: Payment }
  | { kind: "deletePerson" }
  | { kind: "deleteMany"; people: Member[] }
  | null;

let seq = 1000;
const newId = (p: string) => `${p}${++seq}`;

export function MemberDirectory() {
  return (
    <AppToastProvider>
      <Directory />
    </AppToastProvider>
  );
}

function Directory() {
  const { toast } = useToast();
  const lab = useStateLab({
    data: [
      {
        id: "tag-filter-failed",
        label: "Couldn't load tags",
        description: "The Tags filter can't load its options. Show the error in place of the picker; the other filters work.",
      },
    ],
    /* Not found: the app's own 404 page covers it. */
    notApplicable: ["readOnly", "staleData", "notFound"],
  });
  const load = useLabLoad(lab);
  const router = useRouter();
  const [members, setMembers] = React.useState<Member[]>(demoMembers);
  const undoable = useUndoableUpdate(setMembers, lab.undoExpired);
  const [tagColors, setTagColors] = React.useState<Record<string, TagColor>>(() => Object.fromEntries(demoTags.map((t) => [t.name, t.color])));
  const [q, setQ] = React.useState("");
  /* The list follows the typed text after a short search and keeps the previous results meanwhile; typing stays instant. */
  const search = useLabDeferred(q, lab.slowLoading ? SLOW_SEARCH_FOR : SEARCH_FOR);
  const sq = search.value;
  const [filters, setFilters] = React.useState<Filters>(noFilters);
  /* The list follows the filters after a short "update" while Slow loading is on, keeping the previous rows meanwhile. */
  const applied = useLabDeferred(filters, lab.slowLoading ? FILTER_APPLY_FOR : 0);
  const appliedFilters = lab.slowLoading ? applied.value : filters;
  const filterPending = lab.slowLoading && applied.pending;
  /** Intake filters chosen from More that have no value yet: they already show as a button, so their editor has somewhere to open. */
  const [pinned, setPinned] = React.useState<FilterKey[]>([]);
  const triggers = React.useRef<Partial<Record<FilterKey, HTMLButtonElement | null>>>({});
  const moreButton = React.useRef<HTMLButtonElement>(null);
  const [openFilter, setOpenFilter] = React.useState<FilterKey | null>(null);
  const justPicked = React.useRef<FilterKey | null>(null);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [sort, setSort] = React.useState<TableSort>({ key: "name", direction: "asc" });
  const [openId, setOpenId] = React.useState<string | null>(null);
  const membersRef = React.useRef(members);
  React.useEffect(() => {
    membersRef.current = members;
  });
  /* Tag edits in the sheet: one Undo per editing session (until Done, or the sheet moves to someone else), not per tag. */
  const tagSession = React.useRef<{ id: string; before: Member } | null>(null);
  const flushTagSession = () => {
    const session = tagSession.current;
    tagSession.current = null;
    if (!session) return;
    const now = membersRef.current.find((m) => m.id === session.id);
    if (!now || now.tags.join("\n") === session.before.tags.join("\n")) return;
    undoable(`Updated ${nameOf(session.before)}'s tags`, { before: [{ member: session.before, index: membersRef.current.indexOf(now) }] }, `Restored ${nameOf(session.before)}'s tags`);
  };
  const flushTags = React.useRef(flushTagSession);
  React.useEffect(() => {
    flushTags.current = flushTagSession;
  });
  React.useEffect(() => () => flushTags.current(), [openId]);
  const [dialog, setDialog] = React.useState<DialogState>(null);
  const [tagsOpen, setTagsOpen] = React.useState(false);
  /** The optional columns on show. Kept for the session. */
  const columnsRaw = React.useSyncExternalStore(subscribeColumns, readColumnsRaw, () => null);
  const shown = React.useMemo(() => parseColumns(columnsRaw), [columnsRaw]);

  /* Retry can only hide a lab error locally (the flags live in the URL). Switching a flag off starts it over. */
  const [retried, setRetried] = React.useState({ list: false, tags: false, signedIn: false });
  const flags = { list: lab.loadFailed || lab.sectionFailed, tags: lab.is("tag-filter-failed"), session: lab.sessionExpired };
  const [prevFlags, setPrevFlags] = React.useState(flags);
  if (prevFlags.list !== flags.list || prevFlags.tags !== flags.tags || prevFlags.session !== flags.session) {
    setPrevFlags(flags);
    setRetried((r) => ({ list: flags.list ? r.list : false, tags: flags.tags ? r.tags : false, signedIn: flags.session ? r.signedIn : false }));
  }
  const listFailed = flags.list && !retried.list;
  const tagsFailed = flags.tags && !retried.tags;
  const signedOut = lab.sessionExpired && !retried.signedIn;

  const wasReconnecting = React.useRef(false);
  React.useEffect(() => {
    if (wasReconnecting.current && !lab.reconnecting) toast({ title: "Back online" });
    wasReconnecting.current = lab.reconnecting;
  }, [lab.reconnecting, toast]);

  /** What the list holds: the demo people, reshaped by the lab's data states. */
  const pool = React.useMemo(() => {
    if (lab.empty) return [];
    let list = members;
    if (lab.partialData) list = partialMembers(list);
    if (lab.longText) list = longMembers(list);
    if (lab.manyItems) list = manyMembers(list, 520);
    if (lab.singleItem) list = list.slice(0, 1);
    return list;
  }, [members, lab.empty, lab.partialData, lab.longText, lab.manyItems, lab.singleItem]);
  const noPeople = pool.length === 0;
  /** The title counts the default view: subscribed members. Unsubscribed and cancelled people are not counted. */
  const memberCount = React.useMemo(() => pool.filter((m) => membershipOf(m) === "subscribed").length, [pool]);
  const intakeOptions = React.useMemo(
    () => ({
      interests: optionValues(pool, "interests"),
      ways: optionValues(pool, "ways"),
      location: optionValues(pool, "location"),
      time: optionValues(pool, "time"),
    }),
    [pool],
  );

  const allTags = lab.longText ? Array.from(new Set([...Object.keys(tagColors), ...pool.flatMap((m) => m.tags)])) : Object.keys(tagColors);
  const open = pool.find((m) => m.id === openId) ?? null;

  const rows = React.useMemo(() => {
    const list = pool.filter((m) => matches(m, appliedFilters, sq));
    const dir = sort.direction === "asc" ? 1 : -1;
    return list.sort((a, b) => {
      const ka = sortValue(a, sort.key);
      const kb = sortValue(b, sort.key);
      if ((ka === "") !== (kb === "")) return ka === "" ? 1 : -1;
      return ka < kb ? -dir : ka > kb ? dir : 0;
    });
  }, [pool, appliedFilters, sq, sort]);

  /* What the chips and the results line show: the latest filters and count, but frozen while a filter editor is open. */
  const live = { filters, applied: appliedFilters, n: rows.length, term: sq.trim() };
  const [settled, setSettled] = React.useState(live);
  if (openFilter === null && (settled.filters !== live.filters || settled.applied !== live.applied || settled.n !== live.n || settled.term !== live.term)) {
    setSettled(live);
  }

  /* Paging. `pageState` is the page asked for; `shownPage` is the one on screen, which trails it while a page "loads" (Slow loading). */
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const [pageState, setPageState] = React.useState(1);
  const page = Math.min(pageState, pageCount);
  const [shownPage, setShownPage] = React.useState(1);
  const [openSynced, setOpenSynced] = React.useState<string | null>(null);
  const [prevResetKey, setPrevResetKey] = React.useState("");
  const resetKey = `${sq}\u0000${JSON.stringify(appliedFilters)}\u0000${sort.key}${sort.direction}`;
  if (prevResetKey !== resetKey) {
    /* New search, filters or sort: back to the first page. */
    setPrevResetKey(resetKey);
    setPageState(1);
  }
  if (openSynced !== openId) {
    /* The sheet moved to someone (stepping, or a new member): show the page they're on. */
    setOpenSynced(openId);
    const at = openId ? rows.findIndex((m) => m.id === openId) : -1;
    if (at >= 0) setPageState(Math.floor(at / PAGE_SIZE) + 1);
  }
  /* A page change is a request: with Slow loading on, the previous rows stay until it lands. The open sheet skips the wait. */
  if (shownPage !== page && (!lab.slowLoading || openId)) setShownPage(page);
  React.useEffect(() => {
    if (!lab.slowLoading || openId || shownPage === page) return;
    const timer = window.setTimeout(() => setShownPage(page), PAGE_LOAD_FOR);
    return () => window.clearTimeout(timer);
  }, [lab.slowLoading, openId, shownPage, page]);
  const visiblePage = Math.min(shownPage, pageCount);
  const pageRows = React.useMemo(() => rows.slice((visiblePage - 1) * PAGE_SIZE, visiblePage * PAGE_SIZE), [rows, visiblePage]);
  const pageLoading = shownPage !== page;
  const scrollOnLand = React.useRef(false);
  const pendingFocus = React.useRef<string | null>(null);
  const changePage = (next: number) => {
    scrollOnLand.current = true;
    setPageState(next);
  };

  const chosen = pool.filter((m) => selected.has(m.id));
  const target = chosen.length ? chosen : rows;
  const copyLabel = chosen.length ? `Copy email addresses of ${plural(chosen.length, "selected person", "selected people")}` : `Copy ${plural(rows.length, "email address", "email addresses")}`;

  const update = (id: string, change: (m: Member) => Member) => setMembers((list) => list.map((m) => (m.id === id ? change(m) : m)));
  const emailTaken = (email: string, except?: string) => members.some((m) => m.id !== except && m.email.toLowerCase() === email.trim().toLowerCase());
  const close = () => setDialog(null);

  function setTags(id: string, tags: string[]) {
    tags.forEach((t) => {
      if (!(t in tagColors)) setTagColors((c) => ({ ...c, [t]: undefined }));
    });
    update(id, (m) => {
      const added = tags.filter((t) => !m.tags.includes(t));
      const removed = m.tags.filter((t) => !tags.includes(t));
      const log = [
        ...added.map((t) => ({ id: newId("a"), kind: "tag" as const, title: `Tagged ${t}`, at: TODAY })),
        ...removed.map((t) => ({ id: newId("a"), kind: "tag" as const, title: `Removed tag ${t}`, at: TODAY })),
      ];
      return { ...m, tags, activity: [...log, ...m.activity] };
    });
  }

  /** Adds every tag in one go per person, so each person's tags are only set once. */
  function tagPeople(tags: string[], people: Member[]) {
    const changed: Member[] = [];
    people.forEach((p) => {
      const missing = tags.filter((t) => !p.tags.includes(t));
      if (!missing.length) return;
      changed.push(p);
      setTags(p.id, [...p.tags, ...missing]);
    });
    undoable(`Tagged ${whom(changed)} ${tags.join(", ")}`, snapshotOf(members, changed.map((p) => p.id)), `Removed ${tags.join(", ")} from ${whom(changed)}`);
  }

  /** The CSV import: new people and tag additions to people already here, as one change with one Undo. */
  function importPeople(people: NewMember[], tagUpdates: TagUpdate[]) {
    const byEmail = new Map(tagUpdates.map((u) => [u.email.trim().toLowerCase(), u.tags]));
    const touched = members.filter((m) => byEmail.has(m.email.trim().toLowerCase()));
    const created: Member[] = people.map((d) => ({
      id: newId("m"),
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      joinedAt: d.joinedAt,
      subscribed: true,
      tags: d.tags,
      payments: [],
      activity: [{ id: newId("a"), kind: "joined", title: joinedTitle(d.howJoined), at: d.joinedAt }],
      howJoined: d.howJoined,
      referrals: [],
    }));
    const snap = { ...snapshotOf(members, touched.map((m) => m.id)), created: created.map((m) => m.id) };
    const newTags = [...created.flatMap((m) => m.tags), ...[...byEmail.values()].flat()];
    setTagColors((c) => {
      const next = { ...c };
      for (const t of newTags) if (!(t in next)) next[t] = undefined;
      return next;
    });
    setMembers((list) => [
      ...created,
      ...list.map((m) => {
        const add = byEmail.get(m.email.trim().toLowerCase());
        if (!add) return m;
        const fresh = add.filter((t) => !m.tags.some((x) => x.toLowerCase() === t.toLowerCase()));
        if (!fresh.length) return m;
        const log = fresh.map((t) => ({ id: newId("a"), kind: "tag" as const, title: `Tagged ${t}`, at: TODAY }));
        return { ...m, tags: [...m.tags, ...fresh], activity: [...log, ...m.activity] };
      }),
    ]);
    close();
    undoable(`Added ${whom(created)}`, snap, `Removed ${whom(created)}`);
  }

  /* ---------- managing tags (the Tags panel) ---------- */

  /** Every tag with how many people have it, in the filters' order (colour, then A to Z). */
  /* While the Tags panel is open, rows keep the order they opened in: recolouring doesn't move a tag until the panel closes. */
  const [orderColors, setOrderColors] = React.useState<Record<string, TagColor> | null>(null);
  if (tagsOpen && !orderColors) setOrderColors({ ...tagColors });
  if (!tagsOpen && orderColors) setOrderColors(null);
  const tagRows: TagRow[] = React.useMemo(() => {
    const counts = new Map<string, number>(Object.keys(tagColors).map((t) => [t, 0]));
    pool.forEach((m) => m.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
    const sortBy = { ...tagColors, ...(orderColors ?? {}) };
    return [...counts.keys()].sort((a, b) => byColourThenName(a, b, sortBy)).map((name) => ({ name, color: tagColors[name], count: counts.get(name) ?? 0 }));
  }, [pool, tagColors, orderColors]);

  const sameTag = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
  const swapTag = (list: string[], from: string, to: string) => list.map((t) => (sameTag(t, from) ? to : t));
  function renameKey<T>(record: Record<string, T>, from: string, to: string): Record<string, T> {
    return Object.fromEntries(Object.entries(record).map(([k, v]) => [k === from ? to : k, v]));
  }
  function withoutKey<T>(record: Record<string, T>, key: string): Record<string, T> {
    return Object.fromEntries(Object.entries(record).filter(([k]) => k !== key));
  }

  /** Renames a tag everywhere: on every person who has it, its colour, and any filter using it. One Undo. */
  function renameTag(from: string, to: string) {
    /* The renamed tag keeps its place in the open Tags panel. */
    setOrderColors((f) => f && renameKey(f, from, to));
    const snap = snapshotOf(members, members.filter((m) => m.tags.includes(from)).map((m) => m.id));
    setMembers((list) =>
      list.map((m) =>
        m.tags.includes(from)
          ? { ...m, tags: m.tags.map((t) => (t === from ? to : t)), tagAddedAt: m.tagAddedAt && renameKey(m.tagAddedAt, from, to) }
          : m,
      ),
    );
    setTagColors((c) => renameKey(c, from, to));
    setFilters((f) => ({ ...f, tags: swapTag(f.tags, from, to), notTags: swapTag(f.notTags, from, to) }));
    undoable(`Renamed ${from} to ${to}`, snap, `Renamed ${to} back to ${from}`, () => {
      setTagColors((c) => renameKey(c, to, from));
      setFilters((f) => ({ ...f, tags: swapTag(f.tags, to, from), notTags: swapTag(f.notTags, to, from) }));
    });
  }

  function recolorTag(name: string, color: TagColor) {
    setTagColors((c) => ({ ...c, [name]: color }));
  }

  /** Deletes a tag: off every person, out of the colours and out of any filter. One Undo puts it all back. */
  function deleteTag(name: string) {
    const snap = snapshotOf(members, members.filter((m) => m.tags.includes(name)).map((m) => m.id));
    const color = tagColors[name];
    const inTags = filters.tags.some((t) => sameTag(t, name));
    const inNotTags = filters.notTags.some((t) => sameTag(t, name));
    setMembers((list) =>
      list.map((m) =>
        m.tags.includes(name) ? { ...m, tags: m.tags.filter((t) => t !== name), tagAddedAt: m.tagAddedAt && withoutKey(m.tagAddedAt, name) } : m,
      ),
    );
    setTagColors((c) => withoutKey(c, name));
    setFilters((f) => ({ ...f, tags: f.tags.filter((t) => !sameTag(t, name)), notTags: f.notTags.filter((t) => !sameTag(t, name)) }));
    undoable(`Deleted the ${name} tag`, snap, `Restored the ${name} tag`, () => {
      setTagColors((c) => ({ ...c, [name]: color }));
      setFilters((f) => ({ ...f, tags: inTags ? [...f.tags, name] : f.tags, notTags: inNotTags ? [...f.notTags, name] : f.notTags }));
    });
  }

  function copy(text: string, message: string) {
    navigator.clipboard?.writeText(text).then(
      () => toast({ title: message }),
      () => toast({ title: "Couldn't copy. Select it below to copy it yourself", description: text }),
    );
  }

  function step(direction: 1 | -1) {
    const i = rows.findIndex((m) => m.id === openId);
    const next = rows[i + direction];
    if (next) setOpenId(next.id);
  }


  /* ---------- keyboard and mouse on the list ---------- */

  const listRef = React.useRef<HTMLDivElement>(null);
  /** The rows as the list shows them now (sort and filter applied), and the ids a render ago. */
  const rowsRef = React.useRef(pageRows);
  const prevIds = React.useRef<string[]>([]);
  /** Where a Shift range starts: the last row ticked or unticked by hand. */
  const anchor = React.useRef<string | null>(null);
  /** The selection when a Shift+Arrow run began, so moving back shrinks it again. */
  const extendBase = React.useRef<Set<string> | null>(null);
  /** The one row that is a tab stop: the last one focused. */
  const activeId = React.useRef<string | null>(null);
  const lastIndex = React.useRef(0);

  const rowEl = (id: string) => listRef.current?.querySelector<HTMLElement>(`[data-member-id="${CSS.escape(id)}"]`)?.closest<HTMLElement>("tr") ?? null;
  const rowIdOf = (el: Element | null) => el?.closest("tbody tr")?.querySelector<HTMLElement>("[data-member-id]")?.dataset.memberId ?? null;
  const lostFocus = () => !document.activeElement || document.activeElement === document.body;

  /** Ticks or unticks one row. With `range`, every row between the anchor and this one takes this row's new state. */
  function toggleRow(id: string, range = false) {
    extendBase.current = null;
    const ids = rowsRef.current.map((m) => m.id);
    const from = range && anchor.current ? ids.indexOf(anchor.current) : -1;
    const to = ids.indexOf(id);
    const span = from >= 0 && to >= 0 ? ids.slice(Math.min(from, to), Math.max(from, to) + 1) : [id];
    anchor.current = id;
    setSelected((cur) => {
      const on = !cur.has(id);
      const next = new Set(cur);
      for (const x of span) {
        if (on) next.add(x);
        else next.delete(x);
      }
      return next;
    });
  }

  /** Keys on a focused row. Checkboxes and other controls inside the list keep their own keys. */
  const barRef = React.useRef<HTMLDivElement>(null);
  const onListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (e.defaultPrevented || e.altKey || isTyping(target) || inOwnWidget(target)) return;
    /* With people selected, Tab from a row (or its checkbox) goes straight to the selection bar. */
    if (e.key === "Tab" && !e.shiftKey && !e.ctrlKey && !e.metaKey && chosen.length && target.closest("tbody")) {
      const first = barRef.current?.querySelector<HTMLElement>("button");
      if (first) {
        e.preventDefault();
        first.focus();
        return;
      }
    }
    const mod = e.ctrlKey || e.metaKey;
    if (mod && (e.key === "a" || e.key === "A")) {
      e.preventDefault();
      extendBase.current = null;
      /* The page first; once the whole page is selected, everyone in the list. */
      const onPage = rowsRef.current.map((m) => m.id);
      setSelected(new Set((onPage.every((x) => selected.has(x)) ? rows : rowsRef.current).map((m) => m.id)));
      return;
    }
    const id = target.tagName === "TR" ? rowIdOf(target) : null;
    if (mod || !id) return;
    const list = rowsRef.current;
    const at = list.findIndex((m) => m.id === id);
    const step = e.key === "ArrowDown" || (!e.shiftKey && e.key === "j") ? 1 : e.key === "ArrowUp" || (!e.shiftKey && e.key === "k") ? -1 : 0;
    if (step) {
      e.preventDefault();
      if (!e.shiftKey && (at + step < 0 || at + step >= list.length)) {
        /* Past the first or last row of the page: on to the neighbouring page, landing on its nearest row. */
        const nextPage = visiblePage + step;
        if (nextPage < 1 || nextPage > pageCount) return;
        extendBase.current = null;
        pendingFocus.current = rows[step > 0 ? (nextPage - 1) * PAGE_SIZE : nextPage * PAGE_SIZE - 1]?.id ?? null;
        changePage(nextPage);
        return;
      }
      const next = Math.max(0, Math.min(list.length - 1, at + step));
      if (e.shiftKey) {
        if (!extendBase.current) {
          extendBase.current = new Set(selected);
          anchor.current = id;
        }
        const from = list.findIndex((m) => m.id === anchor.current);
        const base = extendBase.current;
        const span = list.slice(Math.min(from, next), Math.max(from, next) + 1).map((m) => m.id);
        setSelected(new Set([...base, ...span]));
      } else {
        extendBase.current = null;
      }
      rowEl(list[next].id)?.focus();
      return;
    }
    if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      extendBase.current = null;
      rowEl(list[e.key === "Home" ? 0 : list.length - 1].id)?.focus();
      return;
    }
    if (e.key === " " || e.key === "x" || e.key === "X") {
      e.preventDefault();
      toggleRow(id, e.shiftKey);
    }
  };

  /** Shift+click selects a range, Ctrl or Cmd+click toggles one row; neither opens the sheet. */
  const onListClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!e.shiftKey && !e.ctrlKey && !e.metaKey) return;
    const id = rowIdOf(e.target as Element);
    if (!id) return;
    e.preventDefault();
    e.stopPropagation();
    toggleRow(id, e.shiftKey);
    rowEl(id)?.focus({ preventScroll: true });
  };

  /** The row you last focused is the list's one tab stop, and the place to come back to. */
  const onListFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    const id = e.target.tagName === "TR" ? rowIdOf(e.target) : null;
    if (!id) return;
    activeId.current = id;
    lastIndex.current = Math.max(0, rowsRef.current.findIndex((m) => m.id === id));
    applyTabStops();
  };

  /* The kit makes every clickable row a tab stop. Keep only one, so Tab crosses the list in a single press. */
  function applyTabStops() {
    const trs = Array.from(listRef.current?.querySelectorAll<HTMLElement>("tbody tr") ?? []);
    const ids = trs.map((tr) => rowIdOf(tr));
    const keep = activeId.current && ids.includes(activeId.current) ? activeId.current : ids[0];
    trs.forEach((tr, i) => {
      tr.tabIndex = ids[i] === keep ? 0 : -1;
    });
  }

  /** Puts focus on the row at this position (or the nearest one), when nothing else has taken it. */
  function refocusRow(index: number) {
    const list = rowsRef.current;
    if (!list.length || overlayOpen() || !(lostFocus() || listRef.current?.contains(document.activeElement))) return;
    rowEl(list[Math.max(0, Math.min(index, list.length - 1))].id)?.focus();
  }

  const latest = React.useRef({ chosen, rows, copyEmails });
  React.useEffect(() => {
    latest.current = { chosen, rows, copyEmails };
  });

  // When the sheet closes (Escape, the close button, a click outside, or after deleting), focus goes back to
  // that member's row, or to the one that took its place.
  const prevOpenId = React.useRef(openId);
  React.useEffect(() => {
    const was = prevOpenId.current;
    prevOpenId.current = openId;
    if (!was || openId) return;
    const at = prevIds.current.indexOf(was);
    const timer = window.setTimeout(() => {
      if (overlayOpen()) return;
      const el = rowEl(was);
      if (el) el.focus();
      else refocusRow(at);
    }, 80);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId]);

  // After a dialog closes, or a selection is cleared, focus that lived there goes to the row you were on.
  const prevDialog = React.useRef(dialog);
  const prevCount = React.useRef(selected.size);
  React.useEffect(() => {
    const closed = prevDialog.current && !dialog;
    const cleared = prevCount.current > 0 && selected.size === 0;
    prevDialog.current = dialog;
    prevCount.current = selected.size;
    if (!closed && !cleared) return;
    const timer = window.setTimeout(() => {
      if (lostFocus()) refocusRow(lastIndex.current);
    }, 80);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialog, selected.size]);

  React.useEffect(() => {
    rowsRef.current = pageRows;
    prevIds.current = pageRows.map((m) => m.id);
    applyTabStops();
    if (pageLoading) return;
    if (pendingFocus.current) {
      const el = rowEl(pendingFocus.current);
      if (el) {
        pendingFocus.current = null;
        el.focus();
      }
    }
    if (scrollOnLand.current) {
      scrollOnLand.current = false;
      listRef.current?.scrollIntoView({ block: "start" });
    }
  });

  // Shortcuts that work from anywhere on the page, unless typing, or a dialog, menu or list of options has the keyboard.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const el = e.target instanceof HTMLElement ? e.target : null;
      if (isTyping(el) || inOwnWidget(el) || overlayOpen()) return;
      const now = latest.current;
      if (e.key === "/" && plain(e) && !e.shiftKey) {
        const field = document.querySelector<HTMLInputElement>('input[type="search"], input[aria-label="Search by name, email or tag"]');
        if (!field) return;
        e.preventDefault();
        field.focus();
        return;
      }
      if (e.key === "Escape" && plain(e) && !e.shiftKey) {
        setSelected((s) => (s.size ? new Set() : s));
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && plain(e) && !e.shiftKey) {
        // Always through the confirmation. A selection first; otherwise the row that has focus.
        const focused = rowIdOf(el);
        const person = focused ? now.rows.find((m) => m.id === focused) : undefined;
        const people = now.chosen.length ? now.chosen : person ? [person] : [];
        if (!people.length) return;
        e.preventDefault();
        setDialog({ kind: "deleteMany", people });
        return;
      }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === "c" || e.key === "C")) {
        // Copy the selected people's emails, but never take over copying highlighted text.
        if (!now.chosen.length || window.getSelection()?.toString()) return;
        e.preventDefault();
        now.copyEmails(now.chosen);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const setFilter = <K extends keyof Filters>(k: K, v: Filters[K]) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setSelected(new Set());
  };

  /** After a filter button goes away or the filters clear, focus goes to the nearest button that is left, unless focus has already moved on. */
  function refocus(key: FilterKey | null) {
    window.setTimeout(() => {
      if (document.activeElement && document.activeElement !== document.body) return;
      const fallback = key && !moreFilters.includes(key) ? triggers.current[key] : moreButton.current;
      (fallback ?? triggers.current.tags)?.focus();
    }, 0);
  }

  /** Reset for a filter's popover: back to the default, or out of the row for one added from More with nothing chosen. */
  function resetOf(key: FilterKey) {
    if (isApplied(key, filters)) return { label: key === "joined" ? "Clear dates" : key === "membership" ? "Show subscribed only" : "Clear filter", run: () => removeFilter(key) };
    if (moreFilters.includes(key)) return { label: "Remove filter", run: () => removeFilter(key) };
    return undefined;
  }

  function removeFilter(key: FilterKey) {
    setPinned((list) => list.filter((k) => k !== key));
    setOpenFilter(null);
    setFilter(key, noFilters[key]);
    if (key === "tags") setFilter("tagMode", "any");
    refocus(key);
  }

  function clearFilters() {
    setPinned([]);
    setOpenFilter(null);
    setFilters(noFilters);
    setSelected(new Set());
    refocus(null);
  }

  /** A popover opens or closes. A filter added from More stays in the row, even empty, until its × removes it. */
  function changeOpen(key: FilterKey, open: boolean) {
    setOpenFilter((cur) => (open ? key : cur === key ? null : cur));
  }

  /** A checkbox list for one filter. */
  const checkList = (key: CheckKey, label: string, options: { value: string; label: string }[]) => (
    <CheckList
      fieldKey={key}
      label={label}
      options={options}
      pool={pool}
      filters={filters}
      q={sq}
      onApply={(values) => {
        setFilter(key, values as never);
        changeOpen(key, false);
      }}
      onCancel={() => changeOpen(key, false)}
      onReset={resetOf(key)}
    />
  );
  const fromData = (values: string[]) => values.map((v) => ({ value: v, label: v }));

  const filterEditor: Record<FilterKey, React.ReactNode> = {
    tags: (
      <FilterEditor>
        {tagsFailed ? (
          <TagsFailed onRetry={() => setRetried((r) => ({ ...r, tags: true }))} />
        ) : (
          <>
            <TagCheckList
              fieldKey="tags"
              label="Tags"
              options={allTags}
              colors={tagColors}
              pool={pool}
              filters={filters}
              q={sq}
              onApply={(tags) => {
                setFilter("tags", tags);
                setFilter("tagMode", "any");
                changeOpen("tags", false);
              }}
              onCancel={() => changeOpen("tags", false)}
              onReset={resetOf("tags")}
            />
          </>
        )}
      </FilterEditor>
    ),
    notTags: (
      <FilterEditor>
        {tagsFailed ? (
          <TagsFailed onRetry={() => setRetried((r) => ({ ...r, tags: true }))} />
        ) : (
          <>
            <TagCheckList
              fieldKey="notTags"
              label="Not tagged"
              options={allTags}
              colors={tagColors}
              pool={pool}
              filters={filters}
              q={sq}
              onApply={(tags) => {
                setFilter("notTags", tags);
                changeOpen("notTags", false);
              }}
              onCancel={() => changeOpen("notTags", false)}
              onReset={resetOf("notTags")}
            />
          </>
        )}
      </FilterEditor>
    ),
    membership: checkList(
      "membership",
      "Membership",
      (Object.keys(membershipLabels) as Membership[]).map((v) => ({ value: v, label: membershipLabels[v] })),
    ),
    joined: (
      <FilterEditor>
        <JoinedEditor
          initial={filters.joined}
          onApply={(rule) => {
            setFilter("joined", rule);
            changeOpen("joined", false);
          }}
          onCancel={() => changeOpen("joined", false)}
          onReset={resetOf("joined")}
        />
      </FilterEditor>
    ),
    interests: checkList("interests", "Interests", fromData(intakeOptions.interests)),
    ways: checkList("ways", "Ways to help", fromData(intakeOptions.ways)),
    location: checkList("location", "Location", fromData(intakeOptions.location)),
    time: checkList("time", "Availability", fromData(intakeOptions.time)),
  };

  /** "A", "A or B", "A, B or C": the choices in plain words. */
  const joinWords = (values: string[], word: "or" | "and") => (values.length < 2 ? values.join("") : `${values.slice(0, -1).join(", ")} ${word} ${values[values.length - 1]}`);
  /** What an applied filter says, in full and in plain words, e.g. "Tagged Board or Volunteer". Empty when the filter is not applied. */
  const summaryOf = (key: FilterKey, filters: Filters): string => {
    switch (key) {
      case "tags":
        return filters.tags.length ? `Tagged ${joinWords(filters.tags, filters.tagMode === "all" ? "and" : "or")}` : "";
      case "notTags":
        return filters.notTags.length ? `Not tagged ${joinWords(filters.notTags, "or")}` : "";
      case "membership":
        return isDefaultMembership(filters.membership) ? "" : joinWords(filters.membership.map((v) => membershipLabels[v]), "or");
      case "joined": {
        const j = filters.joined;
        if (!j.from && !j.to) return "";
        const rule = formatDateRule(j);
        return `Joined ${rule[0].toLowerCase()}${rule.slice(1)}`;
      }
      default:
        return filters[key].length ? `${filterLabels[key]}: ${joinWords(filters[key], "or")}` : "";
    }
  };
  const filterSummary = (key: FilterKey) => summaryOf(key, filters);
  /** How many values an applied filter has: the number in its button's circle. A date rule counts as one. */
  const appliedCount = (key: FilterKey) => (key === "joined" ? 1 : filters[key].length);


  /** How many people in the directory have each tag, for the Tags column filter. */
  const tagCounts = React.useMemo(() => {
    const out = new Map<string, number>();
    for (const m of pool) for (const t of m.tags) out.set(t, (out.get(t) ?? 0) + 1);
    return out;
  }, [pool]);

  const columns: TableColumn<Member>[] = [
    {
      key: "select",
      width: "var(--space-7)",
      header: (
        <SelectBox>
          <Checkbox
            aria-label="Select all"
            checked={pageRows.length > 0 && pageRows.every((m) => selected.has(m.id)) ? true : pageRows.some((m) => selected.has(m.id)) ? "indeterminate" : false}
            onCheckedChange={(v) =>
              setSelected((cur) => {
                const next = new Set(cur);
                for (const m of pageRows) {
                  if (v === true) next.add(m.id);
                  else next.delete(m.id);
                }
                return next;
              })
            }
          />
        </SelectBox>
      ),
      render: (m) => (
        <SelectBox data-member-id={m.id}>
          <Checkbox
            aria-label={`Select ${fullName(m) || "person"}`}
            checked={selected.has(m.id)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            onCheckedChange={() => toggleRow(m.id)}
          />
        </SelectBox>
      ),
    },
    {
      key: "name",
      header: "Name",
      sortKey: "name",
      render: (m) => {
        return (
          <NameStack>
            <NameCell>
              <Wrap>{fullName(m) || "No name"}</Wrap>
              {m.cancelledAt ? <Badge>Cancelled</Badge> : !m.subscribed && <Badge>Unsubscribed</Badge>}
            </NameCell>
            <MobileEmail>{m.email || "No email"}</MobileEmail>
          </NameStack>
        );
      },
    },
    ...optionalColumns
      .filter(([key]) => shown.has(key))
      .map(([key, label]): TableColumn<Member> => {
        const blank = "—";
        switch (key) {
          case "email":
            return {
              key,
              header: label,
              sortKey: key,
              /* Clicking an email copies it (the rest of the row still opens the person). */
              render: (m) =>
                m.email ? (
                  <EmailCopy
                    type="button"
                    $variant="ghost"
                    $size="sm"
                    aria-label={`Copy ${m.email}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      copy(m.email, `Copied ${m.email}`);
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <span>{m.email}</span>
                    <CopyHint aria-hidden="true">
                      <Icon icon={Copy} size={14} />
                    </CopyHint>
                  </EmailCopy>
                ) : (
                  <Wrap>No email</Wrap>
                ),
            };
          case "tags":
            return {
              key: "tags",
              header: "Tags",
              /* The same filter as the Tags button above the table: picking tags here sets it, "any of them" by default. */
              filter: {
                label: "Tag",
                options: [...allTags].sort((a, b) => byColourThenName(a, b, tagColors)).map((t) => ({ value: t, label: t, count: tagCounts.get(t) ?? 0, display: <Tag color={tagColors[t]}>{t}</Tag> })),
                selected: filters.tags,
                onChange: (tags) => {
                  setFilter("tags", tags);
                  if (tags.length < 2) setFilter("tagMode", "any");
                },
              },
              render: (m) => {
                const newest = tagsByRecency(m);
                const rest = newest.length - 2;
                return (
                  <TagsCell>
                    {newest.slice(0, 2).map((t) => (
                      <CellTag key={t} color={tagColors[t]}>
                        {t}
                      </CellTag>
                    ))}
                    {rest > 0 && <More>+{rest}</More>}
                  </TagsCell>
                );
              },
            };
          case "value":
            return { key, header: label, sortKey: key, align: "right", defaultSortDirection: "desc", render: (m) => <Ends>{formatMoney(totalPaid(m))}</Ends> };
          case "joined":
            return { key, header: label, sortKey: key, defaultSortDirection: "desc", render: (m) => <Ends>{formatDate(m.joinedAt)}</Ends> };
          case "location":
            return { key, header: label, sortKey: key, render: (m) => <Wrap>{m.intake?.location || blank}</Wrap> };
          case "referred":
            return { key, header: label, sortKey: key, render: (m) => <Wrap>{m.referredBy || blank}</Wrap> };
        }
      }),
    {
      key: "columnsMenu",
      width: "var(--space-7)",
      align: "right",
      header: (
        <DropdownMenu>
          {/* No pinning on click: a pinned tooltip would stay open over the menu this button opens. */}
          <Tooltip content="Show columns" pinOnClick={false}>
            <DropdownMenuTrigger asChild>
              <Button type="button" $variant="ghost" aria-label="Show columns">
                <Icon icon={Columns3} size={16} />
              </Button>
            </DropdownMenuTrigger>
          </Tooltip>
          <DropdownMenuContent align="end">
            {/* Name is always shown: it's how you tell people apart. */}
            <DropdownMenuCheckboxItem checked disabled>
              Name
            </DropdownMenuCheckboxItem>
            {optionalColumns.map(([key, label]) => (
              <DropdownMenuCheckboxItem
                key={key}
                checked={shown.has(key)}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={(on) => toggleColumn(key, on === true)}
              >
                {label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      render: () => null,
    },
  ];

  function exportCsv(people: Member[]) {
    if (!people.length) return toast({ title: "No people to download" });
    download("sdc-people.csv", toCsv(people, shown));
    toast({ title: `Downloaded a spreadsheet of ${plural(people.length, "person", "people")}` });
  }

  function copyEmails(people: Member[]) {
    const emails = people.map((p) => p.email.trim()).filter(Boolean);
    if (!emails.length) return toast({ title: "No email addresses to copy" });
    copy(emails.join(", "), `Copied ${plural(emails.length, "email address", "email addresses")}`);
  }

  /** Removes the tags from everyone who has any of them. */
  function removeTags(tags: string[], people: Member[]) {
    const changed: Member[] = [];
    people.forEach((p) => {
      if (!p.tags.some((t) => tags.includes(t))) return;
      changed.push(p);
      setTags(p.id, p.tags.filter((t) => !tags.includes(t)));
    });
    undoable(`Removed ${tags.join(", ")} from ${whom(changed)}`, snapshotOf(members, changed.map((p) => p.id)), `${tags.join(", ")} put back on ${whom(changed)}`);
  }

  /** Permanent: the people leave the directory, the selection and, if open, the sheet. */
  function deletePeople(people: Member[]) {
    const ids = new Set(people.map((p) => p.id));
    const snap = snapshotOf(members, ids);
    setMembers((list) => list.filter((m) => !ids.has(m.id)));
    setSelected((s) => new Set([...s].filter((id) => !ids.has(id))));
    if (openId && ids.has(openId)) setOpenId(null);
    // Stopping someone's payments can't be taken back, so a delete that includes anyone who pays has no Undo.
    if (people.some(isPaying)) toast({ title: `Deleted ${whom(people)}` });
    else undoable(`Deleted ${whom(people)}`, snap, `Restored ${whom(people)}`);
  }

  function toggleColumn(key: OptionalColumn, on: boolean) {
    const next = new Set(shown);
    if (on) next.add(key);
    else next.delete(key);
    saveColumns(next);
    if (!on && sort.key === key) setSort({ key: "name", direction: "asc" });
  }

  /* The floating bar stays mounted for the length of its exit animation. */
  const [barMounted, setBarMounted] = React.useState(false);
  const lastCount = React.useRef(0);
  if (chosen.length) lastCount.current = chosen.length;
  if (chosen.length && !barMounted) setBarMounted(true);
  React.useEffect(() => {
    if (chosen.length) return;
    const timer = window.setTimeout(() => setBarMounted(false), 200);
    return () => window.clearTimeout(timer);
  }, [chosen.length]);

  /* While the bar is up, lift the toasts above it (the kit's viewport is fixed at the bottom edge). */
  React.useEffect(() => {
    if (!barMounted) return;
    const viewport = document.querySelector<HTMLElement>('[role="region"] > ol');
    if (!viewport) return;
    viewport.style.bottom = "calc(var(--space-5) + var(--space-7) + var(--space-3))";
    return () => {
      viewport.style.bottom = "";
    };
  }, [barMounted]);

  /* Drag a box over the list to tick every row it touches, like the Outbox. A plain drag replaces the
     selection; Shift, Ctrl or Cmd adds to it. It never starts on buttons, links, column headings or checkboxes. */
  const boxBase = React.useRef<Set<string>>(new Set());
  const marqueeBox = useMarquee({
    enabled: !lab.noPermission && !load.loading && !(lab.loadFailed && !retried.list) && !listFailed && rows.length > 0,
    canStart: (target) => !target.closest("button, a, th, [role='checkbox']"),
    onStart: (e) => {
      boxBase.current = e.shiftKey || e.ctrlKey || e.metaKey ? new Set(selected) : new Set();
    },
    onBox: (box) => {
      const ids = new Set(boxBase.current);
      for (const cell of document.querySelectorAll<HTMLElement>("[data-member-id]")) {
        const row = cell.closest("tr");
        if (row && touches(row.getBoundingClientRect(), box) && cell.dataset.memberId) ids.add(cell.dataset.memberId);
      }
      setSelected((current) => (ids.size === current.size && [...ids].every((id) => current.has(id)) ? current : ids));
    },
  });

  if (lab.noPermission) return <AccessState />;

  const loading = load.loading;
  const pageFailed = lab.loadFailed && !retried.list;

  const showList = !loading && !pageFailed && !listFailed;


  return (
    <>
    <StatusBanner
      offline={lab.offline}
      reconnecting={lab.reconnecting}
      signedOut={signedOut}
      onSignIn={() => setRetried((r) => ({ ...r, signedIn: true }))}
    />
    <ListPage>
      <ListPageHeader
        title={
          loading || pageFailed || listFailed ? (
            "People"
          ) : (
            <TitleRow>
              People
              <TitleCount aria-hidden="true">({memberCount})</TitleCount>
              <VisuallyHidden>{`, ${memberCount} subscribed`}</VisuallyHidden>
            </TitleRow>
          )
        }
        actions={
          <>
            {showList && (
              <Tooltip content={copyLabel}>
                <HeaderIconButton type="button" $variant="secondary" aria-label={copyLabel} onClick={() => copyEmails(target)}>
                  <Icon icon={Copy} size={16} />
                </HeaderIconButton>
              </Tooltip>
            )}
            {showList && (
              <Tooltip content="Download as spreadsheet">
                <HeaderIconButton type="button" $variant="secondary" aria-label="Download as spreadsheet" onClick={() => exportCsv(target)}>
                  <Icon icon={Download} size={16} />
                </HeaderIconButton>
              </Tooltip>
            )}
            <Tooltip content="Manage tags">
              <HeaderIconButton type="button" $variant="secondary" aria-label="Manage tags" onClick={() => setTagsOpen(true)}>
                <Icon icon={Tags} size={16} />
              </HeaderIconButton>
            </Tooltip>
            <SplitButton>
              <Button type="button" onClick={() => setDialog({ kind: "add" })}>
                <Icon icon={Plus} size={16} />
                Add person
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" aria-label="More ways to add people">
                    <Icon icon={ChevronDown} size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setDialog({ kind: "import" })}>
                    <Icon icon={FileUp} size={16} />
                    Import from a spreadsheet
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => router.push("/design/signup-links")}>
                    <Icon icon={Link2} size={16} />
                    Create sign-up link
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SplitButton>
          </>
        }
      />

      {loading && <ListLoading takingLonger={load.takingLonger} />}
      {!loading && (pageFailed || listFailed) && <ListFailed onRetry={() => setRetried((r) => ({ ...r, list: true }))} />}

      <FilterArea>
      {/* Nothing to search or filter when the list couldn't load. */}
      {!(pageFailed || listFailed) && (
      <ToolbarBox>
      <Toolbar>
        <SearchBox>
          <SearchField
            aria-label="Search names, emails and tags"
            placeholder="Search names, emails and tags"
            value={q}
            pending={search.pending}
            onChange={(e) => {
              setQ(e.target.value);
              setSelected(new Set());
            }}
            onSearch={setQ}
          />
        </SearchBox>
      {showList && (
        <FilterRow role="group" aria-label="Filters">
          {[...quickFilters, ...moreFilters.filter((key) => filterSummary(key) || pinned.includes(key))].map((key) => {
            const summary = filterSummary(key);
            const active = summary !== "";
            /* Added from More: it stays in the row, applied or not, until Remove filter in its popover takes it away. */
            return (
              <Popover key={key} open={openFilter === key} onOpenChange={(o) => changeOpen(key, o)}>
                <PopoverTrigger asChild>
                  <FilterButton
                    ref={(el) => {
                      triggers.current[key] = el;
                    }}
                    type="button"
                    $variant="outline"
                    data-applied={active ? "" : undefined}
                    aria-label={active ? `${filterLabels[key]}, applied: ${summary}` : undefined}
                  >
                    {filterLabels[key]}
                    {active && <AppliedCount aria-hidden="true">{appliedCount(key)}</AppliedCount>}
                    <Icon icon={ChevronDown} size={14} />
                  </FilterButton>
                </PopoverTrigger>
                {key === "joined" ? (
                  <DatePopover side="bottom" align="start" sideOffset={4} collisionPadding={16} showClose={false} showArrow={false} aria-label={filterLabels[key]}>
                    <FilterOptionsLoader slow={lab.slowLoading}>{filterEditor[key]}</FilterOptionsLoader>
                  </DatePopover>
                ) : intakeFilters.includes(key) || key === "tags" || key === "notTags" ? (
                  <WidePopover side="bottom" align="start" sideOffset={4} collisionPadding={16} showClose={false} showArrow={false} aria-label={filterLabels[key]}>
                    <FilterOptionsLoader slow={lab.slowLoading}>{filterEditor[key]}</FilterOptionsLoader>
                  </WidePopover>
                ) : (
                  <PopoverContent side="bottom" align="start" sideOffset={4} collisionPadding={16} showClose={false} showArrow={false} aria-label={filterLabels[key]}>
                    <FilterOptionsLoader slow={lab.slowLoading}>{filterEditor[key]}</FilterOptionsLoader>
                  </PopoverContent>
                )}
              </Popover>
            );
          })}
          {moreFilters.some((key) => !filterSummary(key) && !pinned.includes(key)) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <FilterButton ref={moreButton} type="button" $variant="outline">
                  More filters
                  <Icon icon={ChevronDown} size={14} />
                </FilterButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                onCloseAutoFocus={(e) => {
                  if (!justPicked.current) return;
                  /* The chosen filter's button is already in the row; its editor opens there and takes the focus. */
                  e.preventDefault();
                  setOpenFilter(justPicked.current);
                  justPicked.current = null;
                }}
              >
                {moreFilters
                  .filter((key) => !filterSummary(key) && !pinned.includes(key))
                  .map((key) => (
                    <DropdownMenuItem
                      key={key}
                      onSelect={() => {
                        justPicked.current = key;
                        setPinned((list) => [...list, key]);
                      }}
                    >
                      {filterLabels[key]}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </FilterRow>
      )}
      </Toolbar>
      </ToolbarBox>
      )}

      {showList && (
        /* The visible results line is gone (the filter buttons already show what's applied); screen readers still hear the count. */
        <VisuallyHidden role="status" aria-live="polite" aria-atomic="true">
          {settled.term || filterCount(settled.applied) ? `${plural(settled.n, "person", "people")} ${settled.n === 1 ? "matches" : "match"}` : ""}
        </VisuallyHidden>
      )}
      </FilterArea>

      {showList && (
      <ListWrap ref={listRef} role="presentation" onKeyDown={onListKeyDown} onClickCapture={onListClickCapture} onFocus={onListFocus}>
      <VisuallyHidden role="status">{pageLoading || filterPending ? "Updating results" : ""}</VisuallyHidden>
      <Table
        aria-label="People"
        stickyColumns={2}
        columns={columns}
        rows={pageRows}
        busy={pageLoading || filterPending}
        getRowId={(m) => m.id}
        onRowClick={(m) => setOpenId(m.id)}
        sort={sort}
        onSortChange={setSort}
        empty={
          <ListEmptyState
            items="people"
            query={noPeople ? "" : sq}
            searchedFields="names, emails and tags"
            filtered={filterCount(appliedFilters) && !noPeople ? "people with these filters" : undefined}
            onClearSearch={() => setQ("")}
            onClearFilters={clearFilters}
            onClearSearchAndFilters={() => {
              setQ("");
              clearFilters();
            }}
            empty={
              !noPeople
                ? {
                    icon: UsersRound,
                    title: "No one is subscribed",
                    description: "Unsubscribed and cancelled people are hidden",
                    action: (
                      <Button type="button" $variant="secondary" onClick={() => setFilter("membership", ["subscribed", "unsubscribed", "cancelled"])}>
                        Show everyone
                      </Button>
                    ),
                  }
                : {
                    icon: UsersRound,
                    title: "No people yet",
                    description: "Add a person, or import people from a spreadsheet",
                    action: (
                      <Button type="button" onClick={() => setDialog({ kind: "add" })}>
                        <Icon icon={Plus} size={16} />
                        Add person
                      </Button>
                    ),
                  }
            }
          />
        }
      />
      </ListWrap>
      )}

      {showList && (
        <PageBar>
          <Pagination page={page} pageCount={pageCount} pageSize={PAGE_SIZE} total={rows.length} onPageChange={changePage} />
        </PageBar>
      )}
      {showList && barMounted && <BarSpace aria-hidden="true" />}

      {showList && barMounted && (
        <SelectionBar
          data-no-marquee=""
          data-state={chosen.length ? "open" : "closed"}
          role="group"
          aria-label="Selected people"
          ref={barRef}
          onKeyDown={(e) => {
            /* Shift+Tab from the first button goes back to the row you were on, or the first selected row. */
            if (e.key === "Tab" && e.shiftKey && e.target === e.currentTarget.querySelector("button")) {
              const row = rowEl(rowsRef.current[lastIndex.current]?.id ?? "") ?? rowEl(chosen[0]?.id ?? "");
              if (row) {
                e.preventDefault();
                row.focus();
              }
            }
            // Menus and dialogs render in a portal, so only keys pressed on the bar's own controls count.
            if (e.key === "Escape" && e.currentTarget.contains(e.target as Node)) setSelected(new Set());
          }}
        >
          <BarCount role="status" aria-live="polite">
            {lastCount.current} selected
          </BarCount>
          {/* Order: who's selected, then what to do with them (most used first), then the one destructive action on its
              own, then dismiss. Dividers split the groups. Select all is words, not an icon: it widens the selection. */}
          {chosen.length < rows.length && (
            <>
              <WideOnly type="button" $variant="ghost" $size="sm" onClick={() => setSelected(new Set(rows.map((m) => m.id)))}>
                Select all {rows.length}
              </WideOnly>
              <Tooltip content={`Select all ${rows.length}`}>
                <NarrowOnly type="button" $variant="ghost" aria-label={`Select all ${rows.length}`} onClick={() => setSelected(new Set(rows.map((m) => m.id)))}>
                  <Icon icon={ListChecks} size={16} />
                </NarrowOnly>
              </Tooltip>
            </>
          )}
          <BarDivider aria-hidden="true" />
          <BulkTagsPopover
            people={target}
            allTags={allTags}
            tagColors={tagColors}
            lab={lab}
            onToggle={({ tag, action }) => (action === "add" ? tagPeople([tag], target) : removeTags([tag], target))}
          >
            <BarTagsButton />
          </BulkTagsPopover>
          <Tooltip content="Copy email addresses">
            <BarIconButton type="button" $variant="ghost" aria-label="Copy email addresses" onClick={() => copyEmails(target)}>
              <Icon icon={Copy} size={16} />
            </BarIconButton>
          </Tooltip>
          <Tooltip content="Download as spreadsheet">
            <BarIconButton type="button" $variant="ghost" aria-label="Download as spreadsheet" onClick={() => exportCsv(target)}>
              <Icon icon={Download} size={16} />
            </BarIconButton>
          </Tooltip>
          <BarDivider aria-hidden="true" />
          <Tooltip content="Delete">
            <BarIconButton type="button" $variant="ghost" aria-label="Delete" onClick={() => setDialog({ kind: "deleteMany", people: target })}>
              <Icon icon={Trash2} size={16} />
            </BarIconButton>
          </Tooltip>
          <BarDivider aria-hidden="true" />
          <Tooltip content="Clear selection">
            <BarIconButton type="button" $variant="ghost" aria-label="Clear selection" onClick={() => setSelected(new Set())}>
              <Icon icon={X} size={16} />
            </BarIconButton>
          </Tooltip>
        </SelectionBar>
      )}

      <TagManager open={tagsOpen} onOpenChange={setTagsOpen} tags={tagRows} onRename={renameTag} onRecolor={recolorTag} onDelete={deleteTag} />

      <MemberSheet
        member={open}
        open={Boolean(open)}
        onOpenChange={(o) => !o && setOpenId(null)}
        tagColors={tagColors}
        allTags={allTags}
        onStep={step}
        actions={{
          onSaveNote: (text) => {
            if (!open) return;
            if (text === (open.note?.text ?? "")) return;
            /* No toast: the note is edited in place, so the saved text on screen is the confirmation. */
            update(open.id, (m) => ({ ...m, note: text ? { text, updatedAt: TODAY, by: "Suhanya" } : undefined }));
          },
          onEditDetails: () => setDialog({ kind: "details" }),
          onRecordPayment: () => setDialog({ kind: "payment" }),
          onEditPayment: (payment) => setDialog({ kind: "payment", payment }),
          onDelete: () => setDialog({ kind: "deletePerson" }),
          onSetTags: (tags) => {
            if (!open) return;
            if (tagSession.current && tagSession.current.id !== open.id) flushTagSession();
            tagSession.current ??= { id: open.id, before: open };
            setTags(open.id, tags);
          },
          onTagsDone: flushTagSession,
          onCopy: copy,
        }}
      />

      {dialog?.kind === "add" && (
        <AddMemberDialog
          open
          onOpenChange={close}
          emailTaken={(e) => emailTaken(e)}
          onSave={(d) => {
            const m: Member = {
              id: newId("m"),
              firstName: d.firstName,
              lastName: d.lastName,
              email: d.email,
              joinedAt: d.joinedAt,
              subscribed: true,
              tags: [],
              payments: d.amount ? [{ id: newId("p"), amount: d.amount, date: d.joinedAt, method: d.method }] : [],
              activity: [{ id: newId("a"), kind: "joined", title: joinedTitle("Added by an admin"), at: d.joinedAt }],
              howJoined: "Added by an admin",
              referrals: [],
            };
            setMembers((list) => [m, ...list]);
            close();
            setOpenId(m.id);
            undoable(`Added ${nameOf(m)}`, { before: [], created: [m.id] }, `Removed ${nameOf(m)}`, () => setOpenId((id) => (id === m.id ? null : id)));
          }}
        />
      )}

      {dialog?.kind === "import" && (
        <ImportMembersDialog
          open
          onOpenChange={close}
          existingEmails={new Set(members.map((m) => m.email.trim().toLowerCase()).filter(Boolean))}
          knownTags={allTags}
          onImport={importPeople}
        />
      )}

      {open && dialog?.kind === "details" && (
        <EditDetailsDialog
          open
          onOpenChange={close}
          member={open}
          emailTaken={(e) => emailTaken(e, open.id)}
          onSave={(d) => {
            const snap = snapshotOf(members, [open.id]);
            update(open.id, (m) => ({ ...m, ...d }));
            close();
            undoable(`Updated ${nameOf(open)}'s details`, snap, `Restored ${nameOf(open)}'s previous details`);
          }}
        />
      )}

      {open && dialog?.kind === "payment" && (
        <PaymentDialog
          open
          onOpenChange={close}
          member={open}
          people={members}
          initial={dialog.payment ? { ...dialog.payment, note: dialog.payment.note ?? "" } : undefined}
          onDelete={() => dialog.payment && setDialog({ kind: "deletePayment", payment: dialog.payment })}
          onSave={(d) => {
            const editing = dialog.payment;
            const snap = snapshotOf(members, [open.id]);
            if (editing) {
              update(open.id, (m) => ({ ...m, payments: m.payments.map((p) => (p.id === editing.id ? { ...p, amount: d.amount, date: d.date, method: d.method, note: d.note || undefined } : p)) }));
              undoable(`Updated ${nameOf(open)}'s payment`, snap, `Restored the ${cad(editing.amount)} payment`);
            } else {
              const forName = d.forId ? fullName(members.find((x) => x.id === d.forId) ?? open) : undefined;
              const payment: Payment = { id: newId("p"), amount: d.amount, date: d.date, method: d.method, note: d.note || undefined, giftFor: forName };
              update(open.id, (m) => ({ ...m, payments: [payment, ...m.payments] }));
              undoable(`Recorded ${cad(d.amount)}`, snap, `Removed the ${cad(d.amount)} payment`);
            }
            close();
          }}
        />
      )}

      {open && dialog?.kind === "deletePayment" && (
        <ConfirmDialog
          open
          onOpenChange={close}
          title={`Delete the ${cad(dialog.payment.amount)} payment?`}
          description={`${nameOf(open)}'s lifetime value goes down by ${cad(dialog.payment.amount)}`}
          confirm="Delete payment"
          onConfirm={() => {
            const snap = snapshotOf(members, [open.id]);
            update(open.id, (m) => ({ ...m, payments: m.payments.filter((p) => p.id !== dialog.payment.id) }));
            close();
            undoable(`Deleted the ${cad(dialog.payment.amount)} payment`, snap, `Restored the ${cad(dialog.payment.amount)} payment`);
          }}
        />
      )}

      {open && dialog?.kind === "deletePerson" && (
        <DeletePeopleDialog
          open
          onOpenChange={close}
          people={[open]}
          onConfirm={() => {
            deletePeople([open]);
            close();
          }}
        />
      )}

      {dialog?.kind === "deleteMany" && (
        <DeletePeopleDialog
          open
          onOpenChange={close}
          people={dialog.people}
          onConfirm={() => {
            deletePeople(dialog.people);
            close();
          }}
        />
      )}
      <MarqueeOverlay box={marqueeBox} />
    </ListPage>
    </>
  );
}
