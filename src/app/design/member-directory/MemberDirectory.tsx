"use client";

import * as React from "react";
import { keyframes, styled } from "next-yak";
import { Columns3, Copy, Download, ListChecks, ListFilter, Plus, Tag as TagIcon, Trash2, UsersRound, X } from "lucide-react";
import { ListEmptyState, ListPage, ListPageHeader } from "@/components/patterns/ListPage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { DatePicker } from "@/components/ui/DatePicker";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { SearchField } from "@/components/ui/SearchField";
import { Pagination } from "@/components/ui/Pagination";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { RadioGroup, RadioGroupOption } from "@/components/ui/RadioGroup";
import { Select } from "@/components/ui/Select";
import { Tooltip } from "@/components/ui/Tooltip";
import { Table, type TableColumn, type TableSort } from "@/components/ui/Table";
import { MarqueeOverlay } from "./MarqueeOverlay";
import { inOwnWidget, isTyping, overlayOpen, plain } from "./listKeys";
import { touches, useMarquee } from "./useMarquee";
import { AppToastProvider, useToast } from "@/components/ui/Toast";
import {
  TODAY,
  addDays,
  addMonths,
  demoMembers,
  demoTags,
  endNotice,
  formatDate,
  fullName,
  joinedTitle,
  plural,
  statusLabel,
  tagsByRecency,
  type Member,
  type MemberStatus,
  type Payment,
  type TagColor,
} from "./data";
import { snapshotOf, useUndoableUpdate } from "./undo";
import { MemberSheet } from "./MemberSheet";
import { TagPicker } from "./TagPicker";
import { BulkTagsPopover } from "./BulkTagsPopover";
import { Tag } from "@/components/ui/Tag";
import { SEARCH_FOR, SLOW_SEARCH_FOR, useLabDeferred, useLabLoad, useStateLab } from "../_state-lab/useStateLab";
import { AccessState, ListFailed, ListLoading, StatusBanner, TagsFailed } from "./ListStates";
import {
  AddMemberDialog,
  ChangeMembershipDialog,
  ConfirmDialog,
  EditDetailsDialog,
  NoteDialog,
  PaymentDialog,
  defaultEnd,
} from "./dialogs";

/* ---------- layout ---------- */

/* One compact row of filter chips under the header; wraps on small screens. */
/* The kit label is uppercase and tracked; this menu's group heading reads in sentence case, aligned with the item text. */
const GroupLabel = styled(DropdownMenuLabel)`
  padding: var(--space-2) var(--space-2) var(--space-2) var(--space-7);
  text-align: left;
  text-transform: none;
  letter-spacing: normal;
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-text-muted);
`;

const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
`;

/* A chip: its summary opens the editor, the × beside it removes the filter. One pill, so the two read as one thing. */
const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
`;

const ChipLabel = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: calc(var(--space-8) * 4);
`;

const ChipRemove = styled(Button)`
  &&& {
    width: var(--space-6);
    padding: 0;
  }
`;

/* The editor inside a chip's popover: only that filter's control. */
const FilterEditor = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
`;

const OptionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-height: calc(var(--space-8) * 4);
  overflow-y: auto;
`;

const OptionRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
`;

const OptionCount = styled.span`
  flex: none;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
`;

/* A name with the tags that matched the search, so a tag search shows why each row is there. */
const NameCell = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
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
  padding: 0 var(--space-2);
  font-weight: var(--weight-medium);
  white-space: nowrap;
`;

const BarDivider = styled.span`
  align-self: stretch;
  width: 1px;
  margin: var(--space-1);
  background: var(--color-on-primary-deep);
  opacity: 0.3;
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

/* Square, icon-only. */
const BarIconButton = styled(BarButton)`
  &&& {
    width: var(--space-6);
    padding: 0;
  }
`;

/* The bar's one Tags button. It is the popover's trigger, so it takes the trigger's props and ref. */
const BarTagsButton = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof BarIconButton>>(function BarTagsButton(props, ref) {
  return (
    <Tooltip content="Tags">
      <BarIconButton ref={ref} type="button" $variant="ghost" aria-label="Tags" {...props}>
        <Icon icon={TagIcon} size={16} />
      </BarIconButton>
    </Tooltip>
  );
});

const PageBar = styled.div`
  padding-block: var(--space-3);
`;

/* Room under the last row so it can scroll above the floating bar. */
const BarSpace = styled.div`
  height: var(--space-8);
`;

/* Long names and emails wrap inside their column instead of widening the table. */
const Wrap = styled.span`
  overflow-wrap: anywhere;
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
const TagsCell = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1);
`;

/* A long tag name is cut short in the table; the full name is in the member sheet. */
const CellTag = styled(Tag)`
  &&& {
    max-width: calc(var(--space-8) * 3);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const More = styled.span`
  color: var(--color-text-muted);
  font-size: var(--text-sm);
`;

/* The Flags column: membership ending soon or ended. */
const Flags = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-1);
`;


/* ---------- filters ---------- */

type TagMode = "any" | "all" | "none";

type JoinedPreset = "" | "30d" | "3m" | "year" | "before" | "custom";

interface Filters {
  joined: { preset: JoinedPreset; from: string; to: string };
  tags: string[];
  tagMode: TagMode;
  status: MemberStatus[];
  emails: "" | "on" | "off";
  /** The intake-form filters match anyone who has any of the chosen values. */
  interests: string[];
  ways: string[];
  location: string[];
  time: string[];
}

const joinedPresets: { value: Exclude<JoinedPreset, "">; label: string }[] = [
  { value: "30d", label: "Last 30 days" },
  { value: "3m", label: "Last 3 months" },
  { value: "year", label: "This year" },
  { value: "before", label: "Before this year" },
  { value: "custom", label: "Custom range" },
];

/** True when a join date falls inside the joined filter. Presets are relative to today. */
function joinedMatches(j: Filters["joined"], joinedAt: string) {
  const yearStart = `${TODAY.slice(0, 4)}-01-01`;
  switch (j.preset) {
    case "30d":
      return joinedAt >= addDays(TODAY, -30);
    case "3m":
      return joinedAt >= addMonths(TODAY, -3);
    case "year":
      return joinedAt >= yearStart;
    case "before":
      return joinedAt < yearStart;
    case "custom":
      return (!j.from || joinedAt >= j.from) && (!j.to || joinedAt <= j.to);
    default:
      return true;
  }
}

type FilterKey = Exclude<keyof Filters, "tagMode">;

/** What the Filter menu offers, in menu order. The intake-form filters come last, under their own heading. */
const filterLabels: Record<FilterKey, string> = {
  tags: "Tags",
  status: "Status",
  emails: "Emails",
  joined: "Joined date",
  interests: "Interests",
  ways: "Ways to help",
  location: "Location",
  time: "Availability",
};

const intakeFilters: FilterKey[] = ["interests", "ways", "location", "time"];

const noFilters: Filters = {
  joined: { preset: "", from: "", to: "" },
  tags: [],
  tagMode: "all",
  status: [],
  emails: "",
  interests: [],
  ways: [],
  location: [],
  time: [],
};

const tagModeOptions: { value: TagMode; label: string }[] = [
  { value: "any", label: "Has any" },
  { value: "all", label: "Has all" },
  { value: "none", label: "Doesn't have" },
];

const has = (value: string, query: string) => value.toLowerCase().includes(query.trim().toLowerCase());

function matches(m: Member, f: Filters, q: string) {
  if (q.trim() && !has(`${fullName(m)} ${m.email} ${m.tags.join(" ")}`, q)) return false;
  if (f.status.length && !f.status.includes(m.status)) return false;
  if (f.tags.length) {
    const hasTag = (t: string) => m.tags.some((x) => x.toLowerCase() === t.toLowerCase());
    if (f.tagMode === "all" && !f.tags.every(hasTag)) return false;
    if (f.tagMode === "any" && !f.tags.some(hasTag)) return false;
    if (f.tagMode === "none" && f.tags.some(hasTag)) return false;
  }
  if (!joinedMatches(f.joined, m.joinedAt)) return false;
  if (f.emails === "on" && !m.subscribed) return false;
  if (f.emails === "off" && m.subscribed) return false;
  if (f.interests.length && !f.interests.some((v) => m.intake?.interests?.includes(v))) return false;
  if (f.ways.length && !f.ways.some((v) => m.intake?.ways?.includes(v))) return false;
  if (f.location.length && !(m.intake?.location && f.location.includes(m.intake.location))) return false;
  if (f.time.length && !(m.intake?.time && f.time.includes(m.intake.time))) return false;
  return true;
}

const filterCount = (f: Filters) =>
  [f.joined.preset, f.emails].filter(Boolean).length + [f.status, f.interests, f.ways, f.location, f.time].filter((v) => v.length).length + (f.tags.length ? 1 : 0);

/** The sorted, distinct non-empty values, for a filter's options. */
const distinct = (values: (string | undefined)[]) =>
  Array.from(new Set(values.filter((v): v is string => Boolean(v)))).sort((a, b) => a.localeCompare(b));

/* ---------- columns ---------- */

/** The columns the Columns menu can show or hide. Name, Email, Status, Ends and Tags are always there. */
type OptionalColumn = "joined" | "location" | "referred" | "emails";

const optionalColumns: [OptionalColumn, string][] = [
  ["joined", "Joined"],
  ["location", "Location"],
  ["referred", "Referred by"],
  ["emails", "Emails on/off"],
];

/** What a column sorts by. Blank values always sort last. */
function sortValue(m: Member, key: string): string | number {
  switch (key) {
    case "name":
      return fullName(m).toLowerCase();
    case "email":
      return m.email.toLowerCase();
    case "status":
      return `${statusLabel[m.status]}${m.endsAt}`;
    case "joined":
      return m.joinedAt;
    case "location":
      return (m.intake?.location ?? "").toLowerCase();
    case "referred":
      return (m.referredBy ?? "").toLowerCase();
    case "emails":
      return m.subscribed ? 0 : 1;
    default:
      return m.endsAt;
  }
}

/** The CSV columns for the table as shown, then Emails on/off. */
function csvColumns(shown: Set<OptionalColumn>): { label: string; value: (m: Member) => string }[] {
  return [
    { label: "First name", value: (m) => m.firstName },
    { label: "Last name", value: (m) => m.lastName },
    { label: "Email", value: (m) => m.email },
    { label: "Status", value: (m) => statusLabel[m.status] },
    { label: "Ends", value: (m) => m.endsAt },
    { label: "Tags", value: (m) => tagsByRecency(m).join("; ") },
    ...(shown.has("joined") ? [{ label: "Joined", value: (m: Member) => m.joinedAt }] : []),
    ...(shown.has("location") ? [{ label: "Location", value: (m: Member) => m.intake?.location ?? "" }] : []),
    ...(shown.has("referred") ? [{ label: "Referred by", value: (m: Member) => m.referredBy ?? "" }] : []),
    { label: "Emails on/off", value: (m) => (m.subscribed ? "On" : "Off") },
  ];
}

function toCsv(rows: Member[], shown: Set<OptionalColumn>) {
  const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const cols = csvColumns(shown);
  return [cols.map((c) => cell(c.label)).join(","), ...rows.map((m) => cols.map((c) => cell(c.value(m))).join(","))].join("\n");
}

/** "Dan Petrov, Kira Sandhu and 3 more": who a confirmation is about. */
function nameList(people: Member[]) {
  const names = people.slice(0, 5).map(fullName);
  const rest = people.length - names.length;
  if (rest > 0) return `${names.join(", ")} and ${rest} more`;
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : (names[0] ?? "");
}

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
/** How long a page "loads" while Slow loading is on (ms). */
const PAGE_LOAD_FOR = 1000;

type DialogState =
  | { kind: "add" }
  | { kind: "note" }
  | { kind: "details" }
  | { kind: "membership" }
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
    notApplicable: ["readOnly", "staleData"],
  });
  const load = useLabLoad(lab);
  const [members, setMembers] = React.useState<Member[]>(demoMembers);
  const undoable = useUndoableUpdate(setMembers, lab.undoExpired);
  const [tagColors, setTagColors] = React.useState<Record<string, TagColor>>(() => Object.fromEntries(demoTags.map((t) => [t.name, t.color])));
  const [q, setQ] = React.useState("");
  /* The list follows the typed text after a short search and keeps the previous results meanwhile; typing stays instant. */
  const search = useLabDeferred(q, lab.slowLoading ? SLOW_SEARCH_FOR : SEARCH_FOR);
  const sq = search.value;
  const [filters, setFilters] = React.useState<Filters>(noFilters);
  /** The filters on screen, in the order they were added. One can be here with nothing entered yet. */
  const [added, setAdded] = React.useState<FilterKey[]>([]);
  const filterButton = React.useRef<HTMLButtonElement>(null);
  const addFilterButton = React.useRef<HTMLButtonElement>(null);
  const [openFilter, setOpenFilter] = React.useState<FilterKey | null>(null);
  const justAdded = React.useRef<FilterKey | null>(null);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [sort, setSort] = React.useState<TableSort>({ key: "ends", direction: "asc" });
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
    undoable("Tags updated", { before: [{ member: session.before, index: membersRef.current.indexOf(now) }] }, "Change undone");
  };
  const flushTags = React.useRef(flushTagSession);
  React.useEffect(() => {
    flushTags.current = flushTagSession;
  });
  React.useEffect(() => () => flushTags.current(), [openId]);
  const [dialog, setDialog] = React.useState<DialogState>(null);
  /** The optional columns on show. Kept for the session. */
  const [shown, setShown] = React.useState<Set<OptionalColumn>>(new Set());

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
    if (wasReconnecting.current && !lab.reconnecting) toast({ title: "You're up to date." });
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
  const intakeOptions = React.useMemo(
    () => ({
      interests: distinct(pool.flatMap((m) => m.intake?.interests ?? [])),
      ways: distinct(pool.flatMap((m) => m.intake?.ways ?? [])),
      location: distinct(pool.map((m) => m.intake?.location)),
      time: distinct(pool.map((m) => m.intake?.time)),
    }),
    [pool],
  );

  const allTags = lab.longText ? Array.from(new Set([...Object.keys(tagColors), ...pool.flatMap((m) => m.tags)])) : Object.keys(tagColors);
  const open = pool.find((m) => m.id === openId) ?? null;

  const rows = React.useMemo(() => {
    const list = pool.filter((m) => matches(m, filters, sq));
    const dir = sort.direction === "asc" ? 1 : -1;
    return list.sort((a, b) => {
      const ka = sortValue(a, sort.key);
      const kb = sortValue(b, sort.key);
      if ((ka === "") !== (kb === "")) return ka === "" ? 1 : -1;
      return ka < kb ? -dir : ka > kb ? dir : 0;
    });
  }, [pool, filters, sq, sort]);

  /* Paging. `pageState` is the page asked for; `shownPage` is the one on screen, which trails it while a page "loads" (Slow loading). */
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const [pageState, setPageState] = React.useState(1);
  const page = Math.min(pageState, pageCount);
  const [shownPage, setShownPage] = React.useState(1);
  const [openSynced, setOpenSynced] = React.useState<string | null>(null);
  const [prevResetKey, setPrevResetKey] = React.useState("");
  const resetKey = `${sq}\u0000${JSON.stringify(filters)}\u0000${sort.key}${sort.direction}`;
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
    const ids: string[] = [];
    people.forEach((p) => {
      const missing = tags.filter((t) => !p.tags.includes(t));
      if (!missing.length) return;
      ids.push(p.id);
      setTags(p.id, [...p.tags, ...missing]);
    });
    undoable(`Added ${tags.join(", ")} to ${plural(ids.length, "person", "people")}`, snapshotOf(members, ids), `Restored ${plural(ids.length, "person", "people")}`);
  }

  function copy(text: string, message: string) {
    navigator.clipboard?.writeText(text).then(
      () => toast({ title: message }),
      () => toast({ title: "Couldn't copy", description: text }),
    );
  }

  function step(direction: 1 | -1) {
    const i = rows.findIndex((m) => m.id === openId);
    const next = rows[i + direction];
    if (next) setOpenId(next.id);
  }

  const openIndex = rows.findIndex((m) => m.id === openId);
  const hasPrev = openIndex > 0;
  const hasNext = openIndex >= 0 && openIndex < rows.length - 1;

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

  function addFilter(key: FilterKey) {
    justAdded.current = key;
    setAdded((list) => [...list, key]);
  }

  function removeFilter(key: FilterKey) {
    const left = added.filter((k) => k !== key);
    setAdded(left);
    setOpenFilter(null);
    setFilter(key, noFilters[key]);
    if (key === "tags") setFilter("tagMode", "all");
    /* Add filter goes away with the last filter, so focus falls back to Filter. */
    (left.length ? addFilterButton : filterButton).current?.focus();
  }

  function clearFilters() {
    setAdded([]);
    setOpenFilter(null);
    setFilters(noFilters);
    setSelected(new Set());
    filterButton.current?.focus();
  }

  /** The list of filters, shared by Filter and Add filter. Picking one moves focus into its control. */
  const filterMenu = (
    <DropdownMenuContent
      align="start"
      onCloseAutoFocus={(e) => {
        if (!justAdded.current) return;
        /* The new chip's popover opens at once and takes the focus. */
        e.preventDefault();
        setOpenFilter(justAdded.current);
        justAdded.current = null;
      }}
    >
      {(Object.keys(filterLabels) as FilterKey[]).map((key) => (
        <React.Fragment key={key}>
          {key === intakeFilters[0] && (
            <>
              <DropdownMenuSeparator />
              <GroupLabel>From the intake form</GroupLabel>
            </>
          )}
          <DropdownMenuCheckboxItem checked={added.includes(key)} onCheckedChange={(on) => (on ? addFilter(key) : removeFilter(key))}>
            {filterLabels[key]}
          </DropdownMenuCheckboxItem>
        </React.Fragment>
      ))}
    </DropdownMenuContent>
  );

  /** How many people in the list have each value, for the checkbox lists. */
  const countOf = (key: "status" | "interests" | "ways" | "location" | "time", value: string) =>
    pool.filter((m) => {
      if (key === "status") return m.status === value;
      if (key === "interests" || key === "ways") return m.intake?.[key]?.includes(value);
      return m.intake?.[key] === value;
    }).length;

  /** A checkbox list: changes apply at once. */
  const checkList = (key: "status" | "interests" | "ways" | "location" | "time", label: string, options: { value: string; label: string }[]) => {
    const chosenValues = filters[key] as string[];
    return (
      <FilterEditor role="group" aria-label={label}>
        <OptionList>
          {options.map((o) => (
            <OptionRow key={o.value}>
              <Checkbox
                label={o.label}
                checked={chosenValues.includes(o.value)}
                onCheckedChange={(on) => setFilter(key, (on === true ? [...chosenValues, o.value] : chosenValues.filter((v) => v !== o.value)) as never)}
              />
              <OptionCount>{countOf(key, o.value)}</OptionCount>
            </OptionRow>
          ))}
          {!options.length && <OptionCount>No values yet</OptionCount>}
        </OptionList>
      </FilterEditor>
    );
  };
  const fromData = (values: string[]) => values.map((v) => ({ value: v, label: v }));

  const filterEditor: Record<FilterKey, React.ReactNode> = {
    tags: (
      <FilterEditor>
        {tagsFailed ? (
          <TagsFailed onRetry={() => setRetried((r) => ({ ...r, tags: true }))} />
        ) : (
          <>
            <Select aria-label="Tag match" options={tagModeOptions} value={filters.tagMode} onValueChange={(v) => setFilter("tagMode", v as TagMode)} />
            <TagPicker aria-label="Tags" value={filters.tags} options={allTags} colors={tagColors} onValueChange={(tags) => setFilter("tags", tags)} />
          </>
        )}
      </FilterEditor>
    ),
    status: checkList("status", "Status", (Object.keys(statusLabel) as MemberStatus[]).map((v) => ({ value: v, label: statusLabel[v] }))),
    emails: (
      <FilterEditor>
        <RadioGroup aria-label="Emails" value={filters.emails} onValueChange={(v) => setFilter("emails", v as Filters["emails"])}>
          <RadioGroupOption value="on" label="On" />
          <RadioGroupOption value="off" label="Off" />
        </RadioGroup>
      </FilterEditor>
    ),
    joined: (
      <FilterEditor>
        <RadioGroup
          aria-label="Joined"
          value={filters.joined.preset || "any"}
          onValueChange={(v) => setFilter("joined", { ...filters.joined, preset: (v === "any" ? "" : v) as JoinedPreset })}
        >
          <RadioGroupOption value="any" label="Any time" />
          {joinedPresets.map((o) => (
            <RadioGroupOption key={o.value} value={o.value} label={o.label} />
          ))}
        </RadioGroup>
        {filters.joined.preset === "custom" && (
          <>
            <Field label="From">
              {(props) => <DatePicker {...props} value={filters.joined.from} onValueChange={(v) => setFilter("joined", { ...filters.joined, from: v })} />}
            </Field>
            <Field label="To">
              {(props) => <DatePicker {...props} value={filters.joined.to} onValueChange={(v) => setFilter("joined", { ...filters.joined, to: v })} />}
            </Field>
          </>
        )}
      </FilterEditor>
    ),
    interests: checkList("interests", "Interests", fromData(intakeOptions.interests)),
    ways: checkList("ways", "Ways to help", fromData(intakeOptions.ways)),
    location: checkList("location", "Location", fromData(intakeOptions.location)),
    time: checkList("time", "Availability", fromData(intakeOptions.time)),
  };

  /** What a chip says after its name: the choice in a few words, "Housing +2" when there are more than two. */
  const list = (values: string[]) => (values.length <= 2 ? values.join(", ") : `${values[0]} +${values.length - 1}`);
  const filterSummary = (key: FilterKey): string => {
    switch (key) {
      case "tags":
        return filters.tags.length ? `${filters.tagMode === "none" ? "not " : ""}${list(filters.tags)}` : "";
      case "status":
        return list(filters.status.map((v) => statusLabel[v]));
      case "emails":
        return filters.emails === "on" ? "On" : filters.emails === "off" ? "Off" : "";
      case "joined": {
        const j = filters.joined;
        if (j.preset === "custom") return j.from || j.to ? `${j.from || "…"} to ${j.to || "…"}` : "Custom range";
        return joinedPresets.find((o) => o.value === j.preset)?.label ?? "";
      }
      default:
        return list(filters[key]);
    }
  };

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
        const needle = sq.trim().toLowerCase();
        const hits = needle ? m.tags.filter((t) => t.toLowerCase().includes(needle)) : [];
        return (
          <NameCell>
            <Wrap>{fullName(m) || "No name"}</Wrap>
            {hits.map((t) => (
              <Tag key={t} color={tagColors[t]}>
                {t}
              </Tag>
            ))}
          </NameCell>
        );
      },
    },
    { key: "email", header: "Email", sortKey: "email", render: (m) => <Wrap>{m.email || "No email"}</Wrap> },
    {
      key: "flags",
      header: "Status",
      sortKey: "status",
      render: (m) => {
        const notice = endNotice(m.endsAt);
        return (
          <Flags>
            {notice && <Badge $variant={notice.tone}>{notice.text}</Badge>}
          </Flags>
        );
      },
    },
    {
      key: "ends",
      header: "Ends",
      sortKey: "ends",
      render: (m) => <Ends>{formatDate(m.endsAt)}</Ends>,
    },
    {
      key: "tags",
      header: "Tags",
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
    },
    ...optionalColumns
      .filter(([key]) => shown.has(key))
      .map(([key, label]): TableColumn<Member> => {
        const blank = "—";
        switch (key) {
          case "joined":
            return { key, header: label, sortKey: key, defaultSortDirection: "desc", render: (m) => <Ends>{formatDate(m.joinedAt)}</Ends> };
          case "location":
            return { key, header: label, sortKey: key, render: (m) => <Wrap>{m.intake?.location || blank}</Wrap> };
          case "referred":
            return { key, header: label, sortKey: key, render: (m) => <Wrap>{m.referredBy || blank}</Wrap> };
          case "emails":
            return { key, header: label, sortKey: key, render: (m) => (m.subscribed ? "On" : "Off") };
        }
      }),
    {
      key: "columnsMenu",
      width: "var(--space-7)",
      align: "right",
      header: (
        <DropdownMenu>
          <Tooltip content="Show columns">
            <DropdownMenuTrigger asChild>
              <Button type="button" $variant="ghost" aria-label="Show columns">
                <Icon icon={Columns3} size={16} />
              </Button>
            </DropdownMenuTrigger>
          </Tooltip>
          <DropdownMenuContent align="end">
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
    if (!people.length) return toast({ title: "No one to export" });
    download("sdc-members.csv", toCsv(people, shown));
    toast({ title: `Exported ${plural(people.length, "person", "people")}` });
  }

  function copyEmails(people: Member[]) {
    const emails = people.map((p) => p.email.trim()).filter(Boolean);
    if (!emails.length) return toast({ title: "No emails to copy" });
    copy(emails.join(", "), `Copied ${plural(emails.length, "email")}`);
  }

  /** Removes the tags from everyone who has any of them. */
  function removeTags(tags: string[], people: Member[]) {
    const ids: string[] = [];
    people.forEach((p) => {
      if (!p.tags.some((t) => tags.includes(t))) return;
      ids.push(p.id);
      setTags(p.id, p.tags.filter((t) => !tags.includes(t)));
    });
    undoable(`Removed ${tags.join(", ")} from ${plural(ids.length, "person", "people")}`, snapshotOf(members, ids), `Restored ${plural(ids.length, "person", "people")}`);
  }

  /** Permanent: the people leave the directory, the selection and, if open, the sheet. */
  function deletePeople(people: Member[]) {
    const ids = new Set(people.map((p) => p.id));
    const snap = snapshotOf(members, ids);
    setMembers((list) => list.filter((m) => !ids.has(m.id)));
    setSelected((s) => new Set([...s].filter((id) => !ids.has(id))));
    if (openId && ids.has(openId)) setOpenId(null);
    undoable(`Deleted ${plural(people.length, "person", "people")}`, snap, `Restored ${plural(people.length, "person", "people")}`);
  }

  function toggleColumn(key: OptionalColumn, on: boolean) {
    setShown((s) => {
      const next = new Set(s);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
    if (!on && sort.key === key) setSort({ key: "ends", direction: "asc" });
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
    enabled: !lab.notFound && !lab.noPermission && !load.loading && !(lab.loadFailed && !retried.list) && !listFailed && rows.length > 0,
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

  if (lab.notFound) return <AccessState kind="not-found" />;
  if (lab.noPermission) return <AccessState kind="no-permission" />;

  const loading = load.loading;
  const pageFailed = lab.loadFailed && !retried.list;
  const showFilters = !loading && !pageFailed;
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
        title={loading || pageFailed || listFailed ? "People" : `People (${rows.length})`}
        search={
          <SearchField
            aria-label="Search by name, email or tag"
            placeholder="Search name, email or tag"
            value={q}
            pending={search.pending}
            onChange={(e) => {
              setQ(e.target.value);
              setSelected(new Set());
            }}
            onSearch={setQ}
          />
        }
        results={{ query: sq, count: rows.length, pending: loading || search.pending }}
        actions={
          <>
<DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button ref={filterButton} type="button" $variant={filterCount(filters) ? "outline" : "secondary"}>
                    <Icon icon={ListFilter} size={16} />
                    Filter
                    {filterCount(filters) > 0 && <Badge $variant="outline">{filterCount(filters)}</Badge>}
                  </Button>
                </DropdownMenuTrigger>
                {filterMenu}
              </DropdownMenu>
            {showList && (
              <Tooltip content="Export CSV">
                <Button type="button" $variant="secondary" aria-label="Export CSV" onClick={() => exportCsv(chosen.length ? chosen : rows)}>
                  <Icon icon={Download} size={16} />
                </Button>
              </Tooltip>
            )}
            <Button type="button" onClick={() => setDialog({ kind: "add" })}>
              <Icon icon={Plus} size={16} />
              Add member
            </Button>
          </>
        }
      />

      {loading && <ListLoading takingLonger={load.takingLonger} />}
      {!loading && (pageFailed || listFailed) && <ListFailed onRetry={() => setRetried((r) => ({ ...r, list: true }))} />}

      {showFilters && added.length > 0 && (
        <FilterRow role="group" aria-label="Filters">
          {(Object.keys(filterLabels) as FilterKey[])
            .filter((key) => added.includes(key))
            .map((key) => {
              const summary = filterSummary(key);
              return (
                <Popover key={key} open={openFilter === key} onOpenChange={(o) => setOpenFilter(o ? key : null)}>
                  <PopoverAnchor asChild>
                    <Chip data-filter={key}>
                      <PopoverTrigger asChild>
                        <Button type="button" $variant="ghost" $size="sm">
                          <ChipLabel>{summary ? `${filterLabels[key]}: ${summary}` : filterLabels[key]}</ChipLabel>
                        </Button>
                      </PopoverTrigger>
                      <ChipRemove type="button" $variant="ghost" $size="sm" aria-label={`Remove ${filterLabels[key]} filter`} onClick={() => removeFilter(key)}>
                        <Icon icon={X} size={14} />
                      </ChipRemove>
                    </Chip>
                  </PopoverAnchor>
                  <PopoverContent align="start" showClose={false} aria-label={filterLabels[key]}>
                    {filterEditor[key]}
                  </PopoverContent>
                </Popover>
              );
            })}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button ref={addFilterButton} type="button" $variant="ghost" $size="sm">
                <Icon icon={Plus} size={14} />
                Add filter
              </Button>
            </DropdownMenuTrigger>
            {filterMenu}
          </DropdownMenu>
          {added.length > 1 && (
            <Button type="button" $variant="ghost" $size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          )}
        </FilterRow>
      )}

      {showList && (
      <div ref={listRef} role="presentation" onKeyDown={onListKeyDown} onClickCapture={onListClickCapture} onFocus={onListFocus}>
      <Table
        aria-label="People"
        columns={columns}
        rows={pageRows}
        busy={pageLoading}
        getRowId={(m) => m.id}
        onRowClick={(m) => setOpenId(m.id)}
        sort={sort}
        onSortChange={setSort}
        empty={
          <ListEmptyState
            items="people"
            query={noPeople ? "" : sq}
            searchedFields="names, emails and tags"
            filtered={filterCount(filters) && !noPeople ? "people with these filters" : undefined}
            onClearSearch={() => setQ("")}
            onClearFilters={clearFilters}
            onClearSearchAndFilters={() => {
              setQ("");
              clearFilters();
            }}
            empty={{
              icon: UsersRound,
              title: "No one here yet",
              description: "Add a member, or import the people who already pay.",
              action: (
                <Button type="button" onClick={() => setDialog({ kind: "add" })}>
                  <Icon icon={Plus} size={16} />
                  Add member
                </Button>
              ),
            }}
          />
        }
      />
      </div>
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
          <BarDivider aria-hidden="true" />
          {chosen.length < rows.length && (
            <Tooltip content={`Select all ${rows.length}`}>
              <BarIconButton type="button" $variant="ghost" aria-label={`Select all ${rows.length}`} onClick={() => setSelected(new Set(rows.map((m) => m.id)))}>
                <Icon icon={ListChecks} size={16} />
              </BarIconButton>
            </Tooltip>
          )}
          <BulkTagsPopover
            people={target}
            allTags={allTags}
            tagColors={tagColors}
            lab={lab}
            onToggle={({ tag, action }) => (action === "add" ? tagPeople([tag], target) : removeTags([tag], target))}
          >
            <BarTagsButton />
          </BulkTagsPopover>
          <Tooltip content="Copy emails">
            <BarIconButton type="button" $variant="ghost" aria-label="Copy emails" onClick={() => copyEmails(target)}>
              <Icon icon={Copy} size={16} />
            </BarIconButton>
          </Tooltip>
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

      <MemberSheet
        member={open}
        open={Boolean(open)}
        onOpenChange={(o) => !o && setOpenId(null)}
        hasPrev={hasPrev}
        hasNext={hasNext}
        tagColors={tagColors}
        allTags={allTags}
        onStep={step}
        actions={{
          onEditNote: () => setDialog({ kind: "note" }),
          onEditDetails: () => setDialog({ kind: "details" }),
          onChangeMembership: () => setDialog({ kind: "membership" }),
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
              status: d.kind === "paid" ? "waiting" : "member",
              kind: d.kind,
              amount: d.amount,
              joinedAt: d.joinedAt,
              endsAt: defaultEnd(d.joinedAt),
              subscribed: true,
              tags: [],
              payments: [],
              activity: [{ id: newId("a"), kind: "joined", title: joinedTitle("Added by an admin"), at: d.joinedAt }],
              howJoined: "Added by an admin",
              referrals: [],
            };
            setMembers((list) => [m, ...list]);
            close();
            setOpenId(m.id);
            undoable(`Added ${d.firstName}`, { before: [], created: [m.id] }, "Change undone", () => setOpenId((id) => (id === m.id ? null : id)));
          }}
        />
      )}

      {open && dialog?.kind === "note" && (
        <NoteDialog
          open
          onOpenChange={close}
          initial={open.note?.text}
          onSave={(text) => {
            const snap = snapshotOf(members, [open.id]);
            update(open.id, (m) => ({ ...m, note: text ? { text, updatedAt: TODAY, by: "Suhanya" } : undefined }));
            close();
            undoable(text ? "Note saved" : "Note cleared", snap, "Change undone");
          }}
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
            undoable("Details saved", snap, "Change undone");
          }}
        />
      )}

      {open && dialog?.kind === "membership" && (
        <ChangeMembershipDialog
          open
          onOpenChange={close}
          member={open}
          onSave={(d) => {
            const snap = snapshotOf(members, [open.id]);
            update(open.id, (m) => ({ ...m, kind: d.kind, amount: d.amount, endsAt: d.endsAt, status: d.endsAt < TODAY ? "ended" : m.status === "ended" ? "member" : m.status }));
            close();
            undoable("Membership changed", snap, "Change undone");
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
              undoable("Payment updated", snap, "Change undone");
            } else {
              const forName = d.forId ? fullName(members.find((x) => x.id === d.forId) ?? open) : undefined;
              const payment: Payment = { id: newId("p"), amount: d.amount, date: d.date, method: d.method, note: d.note || undefined, giftFor: forName };
              update(open.id, (m) => ({ ...m, payments: [payment, ...m.payments], status: forName ? m.status : "member" }));
              undoable(`Recorded ${new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(d.amount)}`, snap, "Change undone");
            }
            close();
          }}
        />
      )}

      {open && dialog?.kind === "deletePayment" && (
        <ConfirmDialog
          open
          onOpenChange={close}
          title="Delete this payment?"
          description={`It's removed from ${fullName(open)}'s payments and their total. This can't be undone.`}
          confirm="Delete payment"
          onConfirm={() => {
            const snap = snapshotOf(members, [open.id]);
            update(open.id, (m) => ({ ...m, payments: m.payments.filter((p) => p.id !== dialog.payment.id) }));
            close();
            undoable("Payment deleted", snap, "Change undone");
          }}
        />
      )}

      {open && dialog?.kind === "deletePerson" && (
        <ConfirmDialog
          open
          onOpenChange={close}
          title={`Delete ${fullName(open)}?`}
          description="This removes them and their history from the directory. It can't be undone."
          confirm="Delete person"
          onConfirm={() => {
            const snap = snapshotOf(members, [open.id]);
            setMembers((list) => list.filter((m) => m.id !== open.id));
            setOpenId(null);
            close();
            undoable(`Deleted ${fullName(open)}`, snap, "Restored 1 person");
          }}
        />
      )}

      {dialog?.kind === "deleteMany" && (
        <ConfirmDialog
          open
          onOpenChange={close}
          title={dialog.people.length === 1 ? `Delete ${fullName(dialog.people[0])}?` : `Delete ${dialog.people.length} people?`}
          description={`${nameList(dialog.people)} will be permanently deleted from the directory, along with their history. This can't be undone.`}
          confirm={dialog.people.length === 1 ? "Delete person" : `Delete ${dialog.people.length} people`}
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
