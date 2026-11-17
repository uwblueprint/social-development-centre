"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Columns3, Copy, Download, Ellipsis, ListFilter, Mail, Plus, Tag as TagIcon, Trash2, UsersRound, X } from "lucide-react";
import { ListEmptyState, ListPage, ListPageHeader } from "@/components/patterns/ListPage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { DatePicker } from "@/components/ui/DatePicker";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { SearchField } from "@/components/ui/SearchField";
import { Select } from "@/components/ui/Select";
import { Table, type TableColumn, type TableSort } from "@/components/ui/Table";
import { MarqueeOverlay } from "./MarqueeOverlay";
import { inOwnWidget, isTyping, overlayOpen, plain } from "./listKeys";
import { touches, useMarquee } from "./useMarquee";
import { AppToastProvider, useToast } from "@/components/ui/Toast";
import {
  TODAY,
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
import { MemberSheet } from "./MemberSheet";
import { TagPicker } from "./TagPicker";
import { Tag } from "@/components/ui/Tag";
import { useLabLoad, useStateLab } from "../_state-lab/useStateLab";
import { AccessState, ListFailed, ListLoading, StatusBanner, TagsFailed } from "./ListStates";
import {
  AddMemberDialog,
  ChangeMembershipDialog,
  ConfirmDialog,
  EditDetailsDialog,
  NoteDialog,
  PaymentDialog,
  RemoveTagDialog,
  TagPeopleDialog,
  defaultEnd,
} from "./dialogs";

/* ---------- layout ---------- */

const FilterPanel = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(calc(var(--space-8) * 3), 1fr));
  gap: var(--space-3) var(--space-4);
`;

/* One added filter: its labelled control, with a × level with the label. */
const FilterSlot = styled.div`
  position: relative;
  min-width: 0;
`;

/* Add filter sits in the next grid cell, level with the fields rather than their labels. */
const AddFilterCell = styled.div`
  align-self: end;
`;

const RemoveFilter = styled(Button)`
  &&& {
    position: absolute;
    top: calc(var(--space-1) * -0.5);
    right: 0;
    width: var(--space-5);
    height: var(--space-5);
    padding: 0;
  }
`;

/* A name with the tags that matched the search, so a tag search shows why each row is there. */
const NameCell = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
`;

/* The count or bulk actions on the left, Clear all on the right. */
const Results = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
`;

const Bar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1);
  min-height: var(--space-6);
  font-size: var(--text-sm);

  & > strong {
    margin-right: var(--space-2);
    font-weight: var(--weight-medium);
  }
  & > span {
    color: var(--color-text-muted);
  }
`;

/* Long names and emails wrap inside their column instead of widening the table. */
const Wrap = styled.span`
  overflow-wrap: anywhere;
`;

const Ends = styled.span`
  font-variant-numeric: tabular-nums;
`;

/* The tag filter: label, then the picker. 6px gap, like Field. */
const TagFilter = styled.div`
  display: flex;
  flex-direction: column;
  gap: calc(var(--space-1) * 1.5);
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

/* The tag filter's match mode beside its picker; stacked on narrow screens. */
const TagFilterRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);

  @media (min-width: 640px) {
    flex-direction: row;

    & > :first-child {
      flex: none;
      width: calc(var(--space-8) * 2);
    }
    & > :last-child {
      flex: 1;
      min-width: 0;
    }
  }
`;

/* The tag filter needs room for the mode and the picker side by side. */
const WideSlot = styled(FilterSlot)`
  @media (min-width: 640px) {
    grid-column: span 2;
  }
`;

/* The Flags column: membership ending soon or ended. */
const Flags = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-1);
`;


/* ---------- filters ---------- */

type TagMode = "any" | "all" | "none";

interface Filters {
  /** Membership ends on or before this date. */
  ends: string;
  /** Joined on or after this date. */
  joined: string;
  first: string;
  last: string;
  email: string;
  tags: string[];
  tagMode: TagMode;
  status: "" | MemberStatus;
  emails: "" | "on" | "off";
  interests: string;
  ways: string;
  location: string;
  time: string;
}

type FilterKey = Exclude<keyof Filters, "tagMode">;

/** What the Filter menu offers, in menu order. */
const filterLabels: Record<FilterKey, string> = {
  first: "First name",
  last: "Last name",
  email: "Email",
  status: "Status",
  ends: "Membership ends",
  joined: "Joined date",
  tags: "Tags",
  emails: "Emails",
  interests: "Interests",
  ways: "Ways to help",
  location: "Location",
  time: "Availability",
};

const noFilters: Filters = {
  ends: "",
  joined: "",
  first: "",
  last: "",
  email: "",
  tags: [],
  tagMode: "all",
  status: "",
  emails: "",
  interests: "",
  ways: "",
  location: "",
  time: "",
};

const tagModeOptions: { value: TagMode; label: string }[] = [
  { value: "any", label: "Has any" },
  { value: "all", label: "Has all" },
  { value: "none", label: "Doesn't have" },
];

const has = (value: string, query: string) => value.toLowerCase().includes(query.trim().toLowerCase());

function matches(m: Member, f: Filters, q: string) {
  if (q.trim() && !has(`${fullName(m)} ${m.email} ${m.tags.join(" ")}`, q)) return false;
  if (f.first && !has(m.firstName, f.first)) return false;
  if (f.last && !has(m.lastName, f.last)) return false;
  if (f.email && !has(m.email, f.email)) return false;
  if (f.status && m.status !== f.status) return false;
  if (f.tags.length) {
    const hasTag = (t: string) => m.tags.some((x) => x.toLowerCase() === t.toLowerCase());
    if (f.tagMode === "all" && !f.tags.every(hasTag)) return false;
    if (f.tagMode === "any" && !f.tags.some(hasTag)) return false;
    if (f.tagMode === "none" && f.tags.some(hasTag)) return false;
  }
  if (f.ends && m.endsAt > f.ends) return false;
  if (f.joined && m.joinedAt < f.joined) return false;
  if (f.emails === "on" && !m.subscribed) return false;
  if (f.emails === "off" && m.subscribed) return false;
  if (f.interests && !m.intake?.interests?.includes(f.interests)) return false;
  if (f.ways && !m.intake?.ways?.includes(f.ways)) return false;
  if (f.location && m.intake?.location !== f.location) return false;
  if (f.time && m.intake?.time !== f.time) return false;
  return true;
}

const filterCount = (f: Filters) =>
  [f.ends, f.joined, f.first, f.last, f.email, f.status, f.emails, f.interests, f.ways, f.location, f.time].filter(Boolean).length + f.tags.length;

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

type DialogState =
  | { kind: "add" }
  | { kind: "note" }
  | { kind: "details" }
  | { kind: "membership" }
  | { kind: "payment"; payment?: Payment }
  | { kind: "deletePayment"; payment: Payment }
  | { kind: "deletePerson" }
  | { kind: "tag"; people: Member[] }
  | { kind: "tagPaste" }
  | { kind: "untag"; people: Member[] }
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
  const [tagColors, setTagColors] = React.useState<Record<string, TagColor>>(() => Object.fromEntries(demoTags.map((t) => [t.name, t.color])));
  const [q, setQ] = React.useState("");
  const [filters, setFilters] = React.useState<Filters>(noFilters);
  /** The filters on screen, in the order they were added. One can be here with nothing entered yet. */
  const [added, setAdded] = React.useState<FilterKey[]>([]);
  const filterButton = React.useRef<HTMLButtonElement>(null);
  const addFilterButton = React.useRef<HTMLButtonElement>(null);
  const filterPanel = React.useRef<HTMLDivElement>(null);
  const justAdded = React.useRef<FilterKey | null>(null);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [sort, setSort] = React.useState<TableSort>({ key: "ends", direction: "asc" });
  const [openId, setOpenId] = React.useState<string | null>(null);
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
  const filtered = !noPeople && (Boolean(q.trim()) || filterCount(filters) > 0);

  const rows = React.useMemo(() => {
    const list = pool.filter((m) => matches(m, filters, q));
    const dir = sort.direction === "asc" ? 1 : -1;
    return list.sort((a, b) => {
      const ka = sortValue(a, sort.key);
      const kb = sortValue(b, sort.key);
      if ((ka === "") !== (kb === "")) return ka === "" ? 1 : -1;
      return ka < kb ? -dir : ka > kb ? dir : 0;
    });
  }, [pool, filters, q, sort]);

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
    let changed = 0;
    people.forEach((p) => {
      const missing = tags.filter((t) => !p.tags.includes(t));
      if (!missing.length) return;
      changed++;
      setTags(p.id, [...p.tags, ...missing]);
    });
    toast({ title: `Tagged ${plural(changed, "person", "people")} ${tags.join(", ")}` });
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
  const rowsRef = React.useRef(rows);
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
  const onListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (e.defaultPrevented || e.altKey || isTyping(target) || inOwnWidget(target)) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && (e.key === "a" || e.key === "A")) {
      e.preventDefault();
      extendBase.current = null;
      setSelected(new Set(rowsRef.current.map((m) => m.id)));
      return;
    }
    const id = target.tagName === "TR" ? rowIdOf(target) : null;
    if (mod || !id) return;
    const list = rowsRef.current;
    const at = list.findIndex((m) => m.id === id);
    const step = e.key === "ArrowDown" || (!e.shiftKey && e.key === "j") ? 1 : e.key === "ArrowUp" || (!e.shiftKey && e.key === "k") ? -1 : 0;
    if (step) {
      e.preventDefault();
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
    rowsRef.current = rows;
    prevIds.current = rows.map((m) => m.id);
    applyTabStops();
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
    setFilter(key, noFilters[key]);
    if (key === "tags") setFilter("tagMode", "all");
    /* Add filter goes away with the last filter, so focus falls back to Filter. */
    (left.length ? addFilterButton : filterButton).current?.focus();
  }

  function clearFilters() {
    setAdded([]);
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
        e.preventDefault();
        const control = filterPanel.current?.querySelector<HTMLElement>(`[data-filter="${justAdded.current}"] :is(input:not([type="hidden"]), [role="combobox"])`);
        control?.focus();
        justAdded.current = null;
      }}
    >
      {(Object.keys(filterLabels) as FilterKey[]).map((key) => (
        <DropdownMenuCheckboxItem key={key} checked={added.includes(key)} onCheckedChange={(on) => (on ? addFilter(key) : removeFilter(key))}>
          {filterLabels[key]}
        </DropdownMenuCheckboxItem>
      ))}
    </DropdownMenuContent>
  );

  const choice = (key: "emails" | "interests" | "ways" | "location" | "time", label: string, options: { value: string; label: string }[]) => (
    <Field label={label}>
      {(props) => (
        <Select
          {...props}
          options={[{ value: "any", label: "Any" }, ...options]}
          value={filters[key] || "any"}
          onValueChange={(v) => setFilter(key, (v === "any" ? "" : v) as never)}
        />
      )}
    </Field>
  );
  const fromData = (values: string[]) => values.map((v) => ({ value: v, label: v }));

  const filterControl: Record<FilterKey, React.ReactNode> = {
    first: <Field label="First name">{(props) => <Input {...props} value={filters.first} onChange={(e) => setFilter("first", e.target.value)} />}</Field>,
    last: <Field label="Last name">{(props) => <Input {...props} value={filters.last} onChange={(e) => setFilter("last", e.target.value)} />}</Field>,
    email: <Field label="Email">{(props) => <Input {...props} value={filters.email} onChange={(e) => setFilter("email", e.target.value)} />}</Field>,
    status: (
      <Field label="Status">
        {(props) => (
          <Select
            {...props}
            options={[{ value: "any", label: "Any" }, ...(Object.keys(statusLabel) as MemberStatus[]).map((s) => ({ value: s, label: statusLabel[s] }))]}
            value={filters.status || "any"}
            onValueChange={(v) => setFilter("status", v === "any" ? "" : (v as MemberStatus))}
          />
        )}
      </Field>
    ),
    ends: (
      <Field label="Membership ends" hint="On or before">
        {(props) => <DatePicker {...props} value={filters.ends} onValueChange={(v) => setFilter("ends", v)} />}
      </Field>
    ),
    joined: (
      <Field label="Joined date" hint="On or after">
        {(props) => <DatePicker {...props} value={filters.joined} onValueChange={(v) => setFilter("joined", v)} />}
      </Field>
    ),
    tags: (
      <TagFilter>
        <Label id="filter-tags">Tags</Label>
        {tagsFailed ? (
          <TagsFailed onRetry={() => setRetried((r) => ({ ...r, tags: true }))} />
        ) : (
          <TagFilterRow>
            <Select aria-label="Tag match" options={tagModeOptions} value={filters.tagMode} onValueChange={(v) => setFilter("tagMode", v as TagMode)} />
            <TagPicker aria-label="Tags" value={filters.tags} options={allTags} colors={tagColors} onValueChange={(tags) => setFilter("tags", tags)} />
          </TagFilterRow>
        )}
      </TagFilter>
    ),
    emails: choice("emails", "Emails", [
      { value: "on", label: "On" },
      { value: "off", label: "Off" },
    ]),
    interests: choice("interests", "Interests", fromData(intakeOptions.interests)),
    ways: choice("ways", "Ways to help", fromData(intakeOptions.ways)),
    location: choice("location", "Location", fromData(intakeOptions.location)),
    time: choice("time", "Availability", fromData(intakeOptions.time)),
  };

  const columns: TableColumn<Member>[] = [
    {
      key: "select",
      width: "var(--space-7)",
      header: (
        <SelectBox>
          <Checkbox
            aria-label="Select all"
            checked={rows.length > 0 && rows.every((m) => selected.has(m.id)) ? true : rows.some((m) => selected.has(m.id)) ? "indeterminate" : false}
            onCheckedChange={(v) => setSelected(v === true ? new Set(rows.map((m) => m.id)) : new Set())}
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
        const needle = q.trim().toLowerCase();
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
    let changed = 0;
    people.forEach((p) => {
      if (!p.tags.some((t) => tags.includes(t))) return;
      changed++;
      setTags(p.id, p.tags.filter((t) => !tags.includes(t)));
    });
    toast({ title: `Removed ${tags.join(", ")} from ${plural(changed, "person", "people")}` });
  }

  /** Permanent: the people leave the directory, the selection and, if open, the sheet. */
  function deletePeople(people: Member[]) {
    const ids = new Set(people.map((p) => p.id));
    setMembers((list) => list.filter((m) => !ids.has(m.id)));
    setSelected((s) => new Set([...s].filter((id) => !ids.has(id))));
    if (openId && ids.has(openId)) setOpenId(null);
    toast({ title: `Deleted ${plural(people.length, "person", "people")}` });
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

  const bulk = (label: string, all: boolean) => (
    <>
      <strong>{label}</strong>
      <Button type="button" $variant="ghost" $size="sm" onClick={() => setDialog({ kind: "tag", people: target })}>
        {all ? "Tag all" : "Tag"}
        <Icon icon={TagIcon} size={16} />
      </Button>
      {!all && (
        <Button type="button" $variant="ghost" $size="sm" onClick={() => setDialog({ kind: "untag", people: target })}>
          Remove tag
        </Button>
      )}
      <Button type="button" $variant="ghost" $size="sm" onClick={() => toast({ title: `Opens a new email to ${plural(target.length, "person", "people")}` })}>
        {all ? "Email all" : "Email"}
        <Icon icon={Mail} size={16} />
      </Button>
      <Button type="button" $variant="ghost" $size="sm" onClick={() => copyEmails(target)}>
        Copy emails
        <Icon icon={Copy} size={16} />
      </Button>
      <Button type="button" $variant="ghost" $size="sm" onClick={() => exportCsv(target)}>
        Export CSV
        <Icon icon={Download} size={16} />
      </Button>
      {!all && (
        <Button type="button" $variant="ghost" $size="sm" onClick={() => setDialog({ kind: "deleteMany", people: target })}>
          Delete
          <Icon icon={Trash2} size={16} />
        </Button>
      )}
    </>
  );

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
            onChange={(e) => {
              setQ(e.target.value);
              setSelected(new Set());
            }}
            onSearch={setQ}
          />
        }
        results={{ query: q, count: rows.length, pending: loading }}
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" $variant="secondary">
                  <Icon icon={Columns3} size={16} />
                  Columns
                </Button>
              </DropdownMenuTrigger>
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
            {showList && (
              <Button type="button" $variant="secondary" onClick={() => exportCsv(chosen.length ? chosen : rows)}>
                <Icon icon={Download} size={16} />
                Export CSV
              </Button>
            )}
            <Button type="button" onClick={() => setDialog({ kind: "add" })}>
              <Icon icon={Plus} size={16} />
              Add member
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" $variant="ghost" aria-label="More people actions">
                  <Icon icon={Ellipsis} size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setDialog({ kind: "tagPaste" })}>
                  <Icon icon={TagIcon} size={16} />
                  Tag people by email
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      {loading && <ListLoading takingLonger={load.takingLonger} />}
      {!loading && (pageFailed || listFailed) && <ListFailed onRetry={() => setRetried((r) => ({ ...r, list: true }))} />}

      {showFilters && added.length > 0 && (
        <FilterPanel ref={filterPanel} role="group" aria-label="Filters">
          {added.map((key) => {
            const Slot = key === "tags" ? WideSlot : FilterSlot;
            return (
            <Slot key={key} data-filter={key}>
              {filterControl[key]}
              <RemoveFilter type="button" $variant="ghost" aria-label={`Remove ${filterLabels[key]} filter`} onClick={() => removeFilter(key)}>
                <Icon icon={X} size={14} />
              </RemoveFilter>
            </Slot>
            );
          })}
          <AddFilterCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button ref={addFilterButton} type="button" $variant="secondary">
                  <Icon icon={Plus} size={16} />
                  Add filter
                </Button>
              </DropdownMenuTrigger>
              {filterMenu}
            </DropdownMenu>
          </AddFilterCell>
        </FilterPanel>
      )}

      {showList && (chosen.length > 0 || (filtered && rows.length > 0) || added.length > 0) && (
      <Results>
        <Bar aria-live="polite">
          {chosen.length ? (
            <>
              {bulk(`${chosen.length} selected`, false)}
              <Button type="button" $variant="ghost" $size="sm" onClick={() => setSelected(new Set())}>
                Clear selection
              </Button>
            </>
          ) : filtered && rows.length ? (
            bulk(plural(rows.length, "person", "people"), true)
          ) : null}
        </Bar>
        {added.length > 0 && (
          <Button type="button" $variant="ghost" $size="sm" onClick={clearFilters}>
            <Icon icon={X} size={16} />
            Clear all
          </Button>
        )}
      </Results>
      )}

      {showList && (
      <div ref={listRef} role="presentation" onKeyDown={onListKeyDown} onClickCapture={onListClickCapture} onFocus={onListFocus}>
      <Table
        aria-label="People"
        columns={columns}
        rows={rows}
        getRowId={(m) => m.id}
        onRowClick={(m) => setOpenId(m.id)}
        sort={sort}
        onSortChange={setSort}
        empty={
          <ListEmptyState
            items="people"
            query={noPeople ? "" : q}
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
          onSetTags: (tags) => open && setTags(open.id, tags),
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
            toast({ title: `Added ${d.firstName}` });
          }}
        />
      )}

      {open && dialog?.kind === "note" && (
        <NoteDialog
          open
          onOpenChange={close}
          initial={open.note?.text}
          onSave={(text) => {
            update(open.id, (m) => ({ ...m, note: text ? { text, updatedAt: TODAY, by: "Suhanya" } : undefined }));
            close();
            toast({ title: text ? "Note saved" : "Note cleared" });
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
            update(open.id, (m) => ({ ...m, ...d }));
            close();
            toast({ title: "Details saved" });
          }}
        />
      )}

      {open && dialog?.kind === "membership" && (
        <ChangeMembershipDialog
          open
          onOpenChange={close}
          member={open}
          onSave={(d) => {
            update(open.id, (m) => ({ ...m, kind: d.kind, amount: d.amount, endsAt: d.endsAt, status: d.endsAt < TODAY ? "ended" : m.status === "ended" ? "member" : m.status }));
            close();
            toast({ title: "Membership saved" });
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
            if (editing) {
              update(open.id, (m) => ({ ...m, payments: m.payments.map((p) => (p.id === editing.id ? { ...p, amount: d.amount, date: d.date, method: d.method, note: d.note || undefined } : p)) }));
              toast({ title: "Payment saved" });
            } else {
              const forName = d.forId ? fullName(members.find((x) => x.id === d.forId) ?? open) : undefined;
              const payment: Payment = { id: newId("p"), amount: d.amount, date: d.date, method: d.method, note: d.note || undefined, giftFor: forName };
              update(open.id, (m) => ({ ...m, payments: [payment, ...m.payments], status: forName ? m.status : "member" }));
              toast({ title: `Recorded ${new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(d.amount)}` });
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
            update(open.id, (m) => ({ ...m, payments: m.payments.filter((p) => p.id !== dialog.payment.id) }));
            close();
            toast({ title: "Payment deleted" });
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
            setMembers((list) => list.filter((m) => m.id !== open.id));
            setOpenId(null);
            close();
            toast({ title: "Person deleted" });
          }}
        />
      )}

      {(dialog?.kind === "tag" || dialog?.kind === "tagPaste") && (
        <TagPeopleDialog
          open
          onOpenChange={close}
          count={dialog.kind === "tag" ? dialog.people.length : undefined}
          pasteEmails={dialog.kind === "tagPaste"}
          allTags={allTags}
          tagColors={tagColors}
          findByEmail={(e) => members.find((m) => m.email.toLowerCase() === e.trim().toLowerCase())}
          onSave={(tags, people) => {
            tagPeople(tags, people ?? (dialog.kind === "tag" ? dialog.people : []));
            close();
          }}
        />
      )}
      {dialog?.kind === "untag" && (
        <RemoveTagDialog
          open
          onOpenChange={close}
          people={dialog.people}
          tagColors={tagColors}
          onSave={(tags) => {
            removeTags(tags, dialog.people);
            close();
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
