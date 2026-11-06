"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { styled } from "next-yak";
import { ArrowLeft, BadgeCheck, Ban, CalendarDays, Check, ChevronDown, Clock, Eye, Info, Plus, Trash2, UserMinus, Users, X, Zap } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { DisabledReason } from "@/components/ui/DisabledReason";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/DropdownMenu";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Select";
import { TagCombobox } from "@/components/ui/TagCombobox";
import { parseJoinedQuery } from "../_joinedQuery";
import { Tag, type TagColor } from "@/components/ui/Tag";
import { DateRulePicker, formatDateRule, monthOf, type DateRule } from "@/components/ui/DateRulePicker";
import { Tooltip } from "@/components/ui/Tooltip";
import { EmailEditor as MessageEditor } from "@/app/design/email-editor";
import {
  type AutomaticEmail,
  type Unit,
  type Audience,
  type CondKind,
  type JoinedRule,
  EVERYONE,
  TAGS,
  tagColor,
  TRIGGER_OPTIONS,
  audienceSentence,
  checkEmail,
  upcomingRecipients,
  effectiveAudience,
  displayName,
  docToText,
  momentFor,
  textToDoc,
  defaultFor,
  unitOf,
} from "../_data";
import type { SaveStatus } from "./AutomaticEmails";
import { EmailPreviewDialog } from "./EmailDialogs";

export const EMAIL_FOOTER = {
  reason: "You're getting this because you're an SDC member.",
  organization: "Social Development Centre Waterloo Region",
  address: "Mailing address to come",
  contact: "suhanya@waterlooregion.org",
};
import { MemberRows, Notice, Page, PageTitle, SectionTitle } from "./parts";

const TAG_OPTIONS = TAGS.map((t) => ({ value: t, label: t, color: tagColor(t) }));
const DELAY_OPTIONS = [
  { value: "same", label: "Within 24 hours" },
  { value: "days", label: "After a delay" },
];
const UNIT_OPTIONS = [
  { value: "days", label: "days" },
  { value: "weeks", label: "weeks" },
  { value: "months", label: "months" },
  { value: "years", label: "years" },
];

/* One row: the title with its save status beside it, and the actions at the far right. */
const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-4);
  align-items: center;
  justify-content: space-between;
`;

const HeaderMain = styled.div`
  flex: 1 1 calc(var(--space-8) * 6);
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1) var(--space-4);
  /* One title line tall in every state, so the row never shifts. */
  min-height: calc(var(--text-xl) * var(--leading-heading));
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
`;

const SaveState = styled.span`
  display: inline-flex;
  gap: var(--space-1);
  align-items: center;
  height: var(--space-5);
  font-size: var(--text-xs);
  line-height: var(--space-5);
  color: var(--color-text-muted);
`;

/* One column at the width of the app's other full-page flows: title, email, schedule, then the actions. */
const Flow = styled(Page)`
  max-width: var(--flow-width);
  gap: var(--space-6);
`;

/* A page section: a quiet heading over its content. Items inside keep --space-4 between them. */
const Group = styled.section`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const PushRight = styled.div`
  margin-left: auto;
`;

/*
 * The page title is the email's name, edited in place like a Notion page title: big and light, no box
 * in any state, a grey placeholder when empty, and the caret as the only sign of editing.
 * Input puts className on its wrapper, hence `input`; the repeated `&` outranks the kit's hover and
 * focus borders.
 */
const TitleInput = styled(Input)`
  width: 100%;
  max-width: 100%;

  &&&& input {
    /* Same height with the placeholder or a typed title. */
    height: calc(var(--text-xl) * var(--leading-heading));
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    /* Spans the whole row so clicking anywhere on the line edits the title. */
    width: 100%;
    max-width: 100%;
    font-size: var(--text-xl);
    font-weight: var(--weight-medium);
    line-height: var(--leading-heading);
    letter-spacing: var(--tracking-tight);
  }

  &&&& input::placeholder {
    /* A light placeholder (owner): the empty title recedes so the sections read first. */
    color: var(--taupe-300);
  }
`;

/* Always reserves the icon's width, so "Saving…" and "Saved as a draft" start at the same place. */
const IconSlot = styled.span`
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: var(--space-4);
  height: var(--space-4);
`;

const BackRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
`;

const BackLink = styled.div`
  margin-left: calc(var(--space-3) * -1);
`;

const HeadingRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-1) var(--space-4);
`;

const EligibleLine = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-text-muted);
  font-size: var(--text-xs);
`;

/* Kit ghost button; only the padding and height are overridden so it reads as a link beside the heading. */
/* Quiet text action: no fill on hover, the text just darkens. */
const EligibleLink = styled(Button)`
  && {
    height: auto;
    padding: 0;
    color: var(--color-text-muted);
  }
  &&:hover:not(:disabled),
  &&:active:not(:disabled) {
    background: transparent;
    color: var(--color-text);
  }
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

const ApprovalRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`;

/* The kit Button, unstyled to read as part of its row; the repeated & outranks the kit's own rules. */
const InfoTrigger = styled(Button)`
  &&&& {
    all: unset;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-muted);
    border-radius: var(--radius-sm);
    cursor: help;
  }
  &&&&:hover:not(:disabled),
  &&&&:active:not(:disabled) {
    background: transparent;
    transform: none;
  }
  &&&&:focus-visible {
    box-shadow: var(--focus-ring);
  }
`;

const ToStack = styled(Stack)`
  gap: var(--space-4);
`;

/* The Sends box and the delay inputs share one line: the box grows, the inputs keep fixed widths and match its height. */
const SendsLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: var(--space-2);

  & > :first-child {
    flex: 1 1 calc(var(--space-8) * 4);
    min-width: 0;
  }

  @media (max-width: 479px) {
    & > :first-child {
      flex-basis: 100%;
    }
  }
`;

const DelayInputs = styled.div`
  display: flex;
  gap: var(--space-2);
  align-items: stretch;

  && > :first-child {
    width: 9ch;
  }
  && > :last-child {
    width: 14ch;
  }
  && input,
  && button {
    height: 100%;
    min-height: var(--control-height);
  }
`;

/* A value that reads as text: no fill or border, never underlined. Used for the tag picker beside the Starts when row. */
/* The kit Button, unstyled to read as part of its row; the repeated & outranks the kit's own rules. */
const ValueButton = styled(Button)<{ $grow?: boolean }>`
  &&&& {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    flex: ${({ $grow }) => ($grow ? "1 1 auto" : "0 1 auto")};
    min-width: 0;
    min-height: var(--pill-height);
    cursor: pointer;
    color: var(--color-text);
    font-size: var(--text-sm);
    line-height: var(--leading-ui);
    border-radius: var(--radius-sm);
    user-select: none;
  }
  &&&&:hover:not(:disabled),
  &&&&:active:not(:disabled) {
    background: transparent;
    transform: none;
  }
  &&&&,
  &&&&:hover,
  &&&&:active,
  &&&&:focus,
  &&&&:focus-visible {
    text-decoration: none;
  }

  &&&&:focus-visible {
    box-shadow: var(--focus-ring);
  }

  &&&&:disabled {
    cursor: default;
  }
`;

const Dot = styled.span`
  color: var(--color-text-muted);
`;

/* The core stack (when, to, subject, body) sits closer together than the sections below it. */
const Core = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-7);
  min-width: 0;
`;

/* The "To" line: boxed exactly like the Subject box (radius, border, padding, text size). */
const ToBox = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  font-size: var(--text-sm);
  line-height: var(--leading-body);

  &:focus-within {
    border-color: var(--color-focus);
  }
`;

/* The label and divider are one pill row (--pill-height) tall and stay at the top when the tags wrap. */
const JOINED_HINT = "Only members who joined in this time frame receive this email.";
const EXCLUDE_HINT ="Members with any of these tags won't receive this email.";
const REQUIRE_HINT = "Members need every one of these tags to get this email.";
const VisuallyHiddenHint = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;
const ToLabel = styled.span`
  flex: none;
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  height: var(--pill-height);
  gap: var(--space-2);
  /* One label column for every row (icon + the longest label, "Starts when" / "Send to"), so the dividers line up. Same width as the Subject label. */
  width: 15ch;
  color: var(--color-text-muted);
`;

const ToDivider = styled.span`
  flex: none;
  position: relative;
  /* Stretches the whole box (cancels its vertical padding); the line stops --space-2 short of the top and bottom edges. */
  align-self: stretch;
  width: 1px;
  margin: calc(var(--space-2) * -1) 0;

  &::before {
    content: "";
    position: absolute;
    inset: var(--space-2) 0;
    background: var(--color-border);
  }
`;

/* A "When it sends" row: the whole box is the menu trigger (one button), so the box takes the hover fill and focus ring. */
const PickBox = styled(ToBox)`
  padding: 0;
  align-items: stretch;
  gap: 0;

  &:has(> button:not(:disabled)):hover {
    background: var(--color-bg-hover);
  }

  &:has(> button:focus-visible) {
    box-shadow: var(--focus-ring);
  }
`;

/* The kit Button, unstyled to read as part of its row; the repeated & outranks the kit's own rules. */
const PickTrigger = styled(Button)<{ $tight?: boolean }>`
  &&&& {
    all: unset;
    box-sizing: border-box;
    flex: ${({ $tight }) => ($tight ? "0 1 auto" : "1 1 auto")};
    min-width: 0;
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-2) ${({ $tight }) => ($tight ? "var(--space-1)" : "var(--space-4)")} var(--space-2) var(--space-4);
    cursor: pointer;
    font-size: var(--text-sm);
    line-height: var(--leading-body);
    color: var(--color-text);
    user-select: none;
  }
  &&&&:hover:not(:disabled),
  &&&&:active:not(:disabled) {
    background: transparent;
    transform: none;
  }
  &&&&,
  &&&&:hover,
  &&&&:active,
  &&&&:focus,
  &&&&:focus-visible {
    text-decoration: none;
  }

  &&&&:disabled {
    cursor: default;
  }
`;

const PickValueText = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: var(--space-1);
  min-height: var(--pill-height);
`;

/* What sits after the trigger in the same box (the tag picker, the delay inputs). Not part of the trigger button. */
const PickExtras = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-4) var(--space-2) 0;
`;

/* The Joined rule sits in the Send to box as a pill, after the tag pills, in the teal of personalized details. */
const ToField = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1);
`;

const TagsSlot = styled.div`
  flex: 1 1 calc(var(--space-8) * 2);
  min-width: 0;

`;

/* The remove button sits inside its row's box at the right end, so every box has the same width. */

const RowRemove = styled(Button)`
  && {
    flex: none;
    align-self: flex-start;
    width: var(--pill-height);
    height: var(--pill-height);
    padding: 0;
  }
`;

/* The conditions you can still add, directly under the rows. */
const AddRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`;

const JoinedOptionLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
`;

type AudienceSnap = { audience: Audience };
const HISTORY_LIMIT = 50;

/* Says what an undo or redo did, from the difference between the two states. */
function describeChange(from: AudienceSnap, to: AudienceSnap, dir: "undo" | "redo") {
  const boxOf = (s: AudienceSnap, t: string) =>
    s.audience.only.includes(t) ? "Send to" : s.audience.require.includes(t) ? "Must have" : s.audience.never.includes(t) ? "Exclude" : null;
  const tags = new Set([...from.audience.only, ...from.audience.require, ...from.audience.never, ...to.audience.only, ...to.audience.require, ...to.audience.never]);
  const parts: string[] = [];
  tags.forEach((t) => {
    const was = boxOf(from, t);
    const now = boxOf(to, t);
    if (was === now) return;
    if (!was) parts.push(`${dir === "undo" ? "Restored" : "Added"} ${t}`);
    else if (!now) parts.push(`Removed ${t}`);
    else parts.push(`Moved ${t} to ${now}`);
  });
  const hadJoined = from.audience.rows.includes("joined");
  const hasJoined = to.audience.rows.includes("joined");
  if (hadJoined !== hasJoined) parts.push(hasJoined ? `${dir === "undo" ? "Restored" : "Added"} Join date` : "Removed Join date");
  else if (!parts.length) parts.push(`${dir === "undo" ? "Undid" : "Redid"} Joined date change`);
  return parts.join(". ");
}

const HiddenLive = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

/** "exclude board", "not board", "except board" or "-board" in Send to: the text after the prefix (may be empty), else null. */
function excludeQueryRest(query: string) {
  return /^\s*(?:exclude\s+|not\s+|except\s+|-\s*)(.*)$/i.exec(query)?.[1] ?? null;
}

/** "must have housing", "+housing" or "and housing" in Send to: the text after the prefix (may be empty), else null. */
function requireQueryRest(query: string) {
  return /^\s*(?:must have\s+|and\s+|\+\s*)(.*)$/i.exec(query)?.[1] ?? null;
}

/** What the Send to box means, in one sentence, from its tags and its Join date rule. */
function sendToHint(tags: string[], joined: JoinedRule | null) {
  const these = "any of these tags";
  const rule = joined ? formatDateRule(asDateRule(joined), "") : "";
  const when = rule ? rule.charAt(0).toLowerCase() + rule.slice(1) : "";
  if (!when && !tags.length) return "Sends to every member.";
  if (!when) return `Sends to members with ${these}.`;
  return `Sends to members who joined ${when}${tags.length ? ` and have ${these}` : ""}.`;
}

/** The stored rule allows "any" (no date filter); the picker always shows a concrete rule. */
const asDateRule = (rule: JoinedRule): DateRule => ({ op: rule.op === "any" ? "between" : rule.op, from: rule.from ?? "", to: rule.to ?? "" });

export function EmailEditor({
  email: e,
  saved,
  onUpdate,
  onRetrySave,
  onAsk,
  onRestore,
  onBack,
}: {
  email: AutomaticEmail;
  saved: SaveStatus;
  onUpdate: (patch: Partial<AutomaticEmail>) => void;
  onRetrySave: () => void;
  onAsk: (kind: "publish" | "unpublish" | "trash") => void;
  onRestore: () => void;
  onBack: () => void;
}) {
  const [eligibleOpen, setEligibleOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  // One fallback per personalized field, shared by every email (Email Editor PRD). Demo: lives here.
  const [fallbacks, setFallbacks] = useState<Record<string, string>>({});

  const isDraft = e.state === "draft";
  const ro = !isDraft;
  const check = checkEmail(e);
  const blockers = saved === "error" ? [...check.blockers, "save your latest changes"] : check.blockers;
  const blockerText = `To publish: ${blockers.join(", ")}.`;
  const isReview = e.mode === "review";
  // Justin's wording from the read-only notice. Trash has no reason yet.
  const lockReason = e.state === "published" ? "To change it, unpublish it." : null;
  const lock = ro ? { readOnly: true as const, disabledReason: lockReason } : {};

  const a = e.audience;
  const triggerTag = e.trigger === "tag" ? e.tag : null;
  // Display order only (not saved, not in undo): rows present when the email opens keep the canonical order,
  // rows added afterwards stack in the order they were added.
  const [rowOrder, setRowOrder] = useState<{ id: string; base: CondKind[]; added: CondKind[] }>({ id: e.id, base: a.rows, added: [] });
  {
    const fresh = rowOrder.id !== e.id;
    const base = (fresh ? a.rows : rowOrder.base).filter((k) => a.rows.includes(k));
    const prevAdded = fresh ? [] : rowOrder.added.filter((k) => a.rows.includes(k));
    const added = [...prevAdded, ...a.rows.filter((k) => !base.includes(k) && !prevAdded.includes(k))];
    if (fresh || base.length !== rowOrder.base.length || added.join() !== rowOrder.added.join()) {
      setRowOrder({ id: e.id, base, added });
    }
  }
  const orderedRows: CondKind[] = [...(["joined", "require", "never"] as CondKind[]).filter((k) => rowOrder.base.includes(k)), ...rowOrder.added].filter((k) => a.rows.includes(k));
  const showJoined = a.rows.includes("joined");
  const showExclude = a.rows.includes("never");
  const showRequire = a.rows.includes("require");
  // Focus moves into a tag box only when it was just added, not when an email opens with one.
  const [focusRow, setFocusRow] = useState<CondKind | null>(null);
  const sendTo = a.only.filter((t) => t !== triggerTag);
  const must = a.require.filter((t) => t !== triggerTag);
  const exclude = a.never.filter((t) => t !== triggerTag);
  // One undo history for the whole audience section: both boxes, the Joined rule and where its pill sits.
  const hist = useRef({ past: [] as AudienceSnap[], future: [] as AudienceSnap[], group: null as AudienceSnap | null });
  const [announced, setAnnounced] = useState({ n: 0, text: "" });
  useEffect(() => {
    hist.current = { past: [], future: [], group: null };
  }, [e.id]);
  const snap = (): AudienceSnap => ({ audience: a });
  function record() {
    const h = hist.current;
    if (h.group) return;
    h.past.push(snap());
    if (h.past.length > HISTORY_LIMIT) h.past.shift();
    h.future = [];
  }
  function groupJoined(open: boolean) {
    const h = hist.current;
    if (open) h.group = snap();
    else if (h.group) {
      const start = h.group;
      h.group = null;
      if (JSON.stringify(start.audience) !== JSON.stringify(a)) {
        h.past.push(start);
        if (h.past.length > HISTORY_LIMIT) h.past.shift();
        h.future = [];
      }
    }
  }
  function step(dir: "undo" | "redo") {
    const h = hist.current;
    h.group = null;
    const target = (dir === "undo" ? h.past : h.future).pop();
    if (!target) return;
    const here = snap();
    (dir === "undo" ? h.future : h.past).push(here);
    onUpdate({ audience: target.audience });
    setAnnounced((p) => ({ n: p.n + 1, text: describeChange(here, target, dir) }));
  }
  function handleHistoryKey(ev: React.KeyboardEvent) {
    if (ro || !(ev.ctrlKey || ev.metaKey) || ev.altKey) return;
    const k = ev.key.toLowerCase();
    const dir = k === "z" ? (ev.shiftKey ? "redo" : "undo") : k === "y" && !ev.shiftKey ? "redo" : null;
    if (!dir) return;
    // Text in the field keeps the browser's own undo.
    if (ev.target instanceof HTMLInputElement && ev.target.value !== "") return;
    ev.preventDefault();
    step(dir);
  }
  function setAudience(patch: Partial<Audience>) {
    record();
    onUpdate({ audience: { ...a, ...patch } });
  }
  // A tag lives in one box only: picking it in one takes it out of the others, with no warning.
  function setTagsIn(kind: "only" | "require" | "never", next: string[]) {
    const rows = next.length && !a.rows.includes(kind) ? [...a.rows, kind] : a.rows;
    const keep = (list: string[]) => list.filter((t) => !next.includes(t));
    setAudience({
      rows,
      only: kind === "only" ? next : keep(a.only),
      require: kind === "require" ? next : keep(a.require),
      never: kind === "never" ? next : keep(a.never),
    });
  }
  const setSendTo = (next: string[]) => setTagsIn("only", next);
  const setMust = (next: string[]) => setTagsIn("require", next);
  const setExclude = (next: string[]) => setTagsIn("never", next);
  function setJoined(patch: Partial<JoinedRule>) {
    setAudience({ joined: { ...a.joined, ...patch } });
  }
  const [sendToQuery, setSendToQuery] = useState("");
  const [joinedOpenRequest, setJoinedOpenRequest] = useState(false);
  const joinedQuery = parseJoinedQuery(sendToQuery, new Date());
  const movesFrom = (t: string, self: "only" | "require" | "never") => {
    const where = self !== "only" && sendTo.includes(t) ? "Send to" : self !== "require" && must.includes(t) ? "Must have" : self !== "never" && exclude.includes(t) ? "Exclude" : null;
    return where ? `Moves from ${where}` : undefined;
  };
  const sendToOptions = TAGS.filter((t) => t !== triggerTag).map((t) => ({ value: t, label: t, hint: movesFrom(t, "only") }));
  const hasJoined = a.rows.includes("joined");
  // "-x" / "+x" shortcuts list every matching tag under a heading; picking one moves it to Exclude / Must have.
  const sendToQueryMode = (query: string) => {
    if (ro) return null;
    const out = excludeQueryRest(query);
    if (out !== null) return { filter: out, heading: "Add to Exclude", icon: Ban, iconTone: "danger" as const, hide: exclude, onPick: (t: string) => moveTag(t, "never") };
    const must_ = requireQueryRest(query);
    if (must_ !== null) return { filter: must_, heading: "Add to Must have", icon: BadgeCheck, hide: must, onPick: (t: string) => moveTag(t, "require") };
    return null;
  };
  const joinedOption =
    ro
      ? null
      : joinedQuery.rule
        ? {
            label: (
              <JoinedOptionLabel>
                <Icon icon={CalendarDays} size={14} />
                {typedJoinedLabel(joinedQuery.rule)}
              </JoinedOptionLabel>
            ),
            textValue: typedJoinedLabel(joinedQuery.rule),
            // A typed date phrase creates the Join date row, or replaces the dates of the one that is there.
            onSelect: () => {
              const rule = joinedQuery.rule!;
              setAudience(hasJoined ? { joined: rule } : { rows: [...a.rows, "joined"], joined: rule });
            },
          }
        : null;
  /** In the Send to list the option needs its subject: "Joined between …", not just "Between …". */
  function typedJoinedLabel(rule: JoinedRule) {
    const l = formatDateRule(asDateRule(rule));
    return `Joined ${l.charAt(0).toLowerCase()}${l.slice(1)}`;
  }
  /** Moves a tag between the boxes as one undo step, adding the destination row if it is missing. */
  function moveTag(tag: string, to: "only" | "require" | "never") {
    const rows = a.rows.includes(to) ? [...a.rows] : [...a.rows, to];
    const without = (list: string[]) => list.filter((t) => t !== tag);
    setAudience({
      rows,
      only: to === "only" ? [...without(a.only), tag] : without(a.only),
      require: to === "require" ? [...without(a.require), tag] : without(a.require),
      never: to === "never" ? [...without(a.never), tag] : without(a.never),
    });
  }
  function viewMembers(tag: string) {
    window.open(`/design/members?tag=${encodeURIComponent(tag)}`, "_blank", "noopener");
  }
  const viewAction = (tag: string) => ({ label: "View members with this tag", icon: Users, onSelect: () => viewMembers(tag) });
  const pillActionsFor = (kind: "only" | "require" | "never", current: string[], set: (next: string[]) => void, tag: string) => {
    if (ro) return [viewAction(tag)];
    const moves = [
      { to: "only" as const, label: "Move to Send to", icon: Users },
      { to: "require" as const, label: "Move to Must have", icon: BadgeCheck },
      { to: "never" as const, label: "Move to Exclude", icon: Ban },
    ].filter((m) => m.to !== kind);
    return [
      ...moves.map((m) => ({ label: m.label, icon: m.icon, onSelect: () => moveTag(tag, m.to) })),
      { label: "Remove", icon: Trash2, danger: true, onSelect: () => set(current.filter((t) => t !== tag)) },
      viewAction(tag),
    ];
  };
  const sendToPillActions = (tag: string) => pillActionsFor("only", sendTo, setSendTo, tag);
  const mustPillActions = (tag: string) => pillActionsFor("require", must, setMust, tag);
  const excludePillActions = (tag: string) => pillActionsFor("never", exclude, setExclude, tag);
  function addRow(kind: CondKind) {
    if (kind === "joined") {
      setJoinedOpenRequest(true);
      setAudience({ rows: [...a.rows, kind], joined: { op: "between", ...monthOf(new Date()) } });
    } else {
      setFocusRow(kind);
      setAudience({ rows: [...a.rows, kind] });
    }
  }
  function removeRow(kind: CondKind) {
    const rows = a.rows.filter((k) => k !== kind);
    setFocusRow(null);
    if (kind === "joined") setAudience({ rows, joined: EVERYONE.joined });
    else if (kind === "never") setAudience({ rows, never: [] });
    else if (kind === "require") setAudience({ rows, require: [] });
    else setAudience({ rows });
  }
  const excludeOptions = TAGS.filter((t) => t !== triggerTag).map((t) => ({ value: t, label: t, hint: movesFrom(t, "never") }));
  const mustOptions = TAGS.filter((t) => t !== triggerTag).map((t) => ({ value: t, label: t, hint: movesFrom(t, "require") }));

  const sendsRow = (
    <SendsLine>
      <PickRow
        icon={Clock}
        label="Then send"
        heading="Then send"
        options={DELAY_OPTIONS}
        value={e.delay}
        onChange={(v) => onUpdate(v === "days" && !e.daysEdited ? { delay: "days", days: defaultFor(unitOf(e)) } : { delay: v as AutomaticEmail["delay"] })}
        disabled={ro}
      />
      {e.delay === "days" && (
        <DelayInputs>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            aria-label={`How many ${unitOf(e)}`}
            value={e.days}
            onKeyDown={(ev) => {
              if (ev.key.length === 1 && !/\d/.test(ev.key) && !ev.ctrlKey && !ev.metaKey) ev.preventDefault();
            }}
            onChange={(ev) => onUpdate({ days: ev.target.value.replace(/\D/g, "").replace(/^0+/, ""), daysEdited: true })}
            onBlur={() => {
              if (!/^[1-9]\d*$/.test(e.days)) onUpdate({ days: defaultFor(unitOf(e)) });
            }}
            disabled={ro}
          />
          <Select aria-label="Unit" options={UNIT_OPTIONS} value={unitOf(e)} onValueChange={(v) => onUpdate(e.daysEdited ? { unit: v as Unit } : { unit: v as Unit, days: defaultFor(v as Unit) })} disabled={ro} />
        </DelayInputs>
      )}
    </SendsLine>
  );

  const timing = (
    <ToStack>
      <PickRow
        icon={Zap}
        label="Starts when"
        heading="Starts when"
        options={TRIGGER_OPTIONS}
        groups={[{ name: "Joining", info: JOIN_ANY_INFO }]}
        value={e.trigger}
        onChange={(v) => onUpdate({ trigger: v as AutomaticEmail["trigger"] })}
        disabled={ro}
      >
        {e.trigger === "tag" && (
          <>
            <Dot aria-hidden>·</Dot>
            <PickValue heading="Tag" grow options={TAG_OPTIONS} value={e.tag} onChange={(v) => onUpdate({ tag: v })} disabled={ro} />
          </>
        )}
      </PickRow>
      <div>
        {sendsRow}
      </div>
    </ToStack>
  );

  const whoSentence = audienceSentence(effectiveAudience(e));
  const eligible = upcomingRecipients(e);
  const sendToText = sendToHint(sendTo, showJoined ? a.joined : null);
  const rowNodes: Partial<Record<CondKind, React.ReactNode>> = {};
  rowNodes.joined = showJoined && (
      <ToBox>
        <Tooltip content={JOINED_HINT} pinOnClick={false}>
          <ToLabel tabIndex={0}><Icon icon={CalendarDays} size={14} />Join date</ToLabel>
        </Tooltip>
        <ToDivider aria-hidden />
        <ToField>
          <DateRulePicker
            label="Join date"
            value={asDateRule(a.joined)}
            onValueChange={(v) => setJoined(v)}
            disabled={ro}
            onOpenChange={groupJoined}
            openRequest={joinedOpenRequest}
            onOpenRequestHandled={() => setJoinedOpenRequest(false)}
          />
        </ToField>
        {!ro && (
          <RowRemove $variant="ghost" $size="sm" aria-label="Remove join date" onClick={() => removeRow("joined")}>
            <Icon icon={X} />
          </RowRemove>
        )}
      </ToBox>
  );
  rowNodes.require = showRequire && (
      <ToBox>
        <Tooltip content={REQUIRE_HINT} pinOnClick={false}>
          <ToLabel tabIndex={0}><Icon icon={BadgeCheck} size={14} />Must have</ToLabel>
        </Tooltip>
        <ToDivider aria-hidden />
        <ToField>
          <VisuallyHiddenHint id="must-have-hint">{REQUIRE_HINT}</VisuallyHiddenHint>
          <TagsSlot>
            <TagCombobox
              bare
              aria-label="Must have"
              aria-describedby="must-have-hint"
              getColor={tagColor}
              options={mustOptions}
              value={must}
              onValueChange={setMust}
              autoFocus={focusRow === "require"}
              pillActions={mustPillActions}
              readOnly={ro}
            />
          </TagsSlot>
        </ToField>
        {!ro && (
          <RowRemove $variant="ghost" $size="sm" aria-label="Remove must have" onClick={() => removeRow("require")}>
            <Icon icon={X} />
          </RowRemove>
        )}
      </ToBox>
  );
  rowNodes.never = showExclude && (
      <ToBox>
        <Tooltip content={EXCLUDE_HINT} pinOnClick={false}>
          <ToLabel tabIndex={0}><Icon icon={UserMinus} size={14} />Exclude</ToLabel>
        </Tooltip>
        <ToDivider aria-hidden />
        <ToField>
          <VisuallyHiddenHint id="exclude-hint">{EXCLUDE_HINT}</VisuallyHiddenHint>
          <TagCombobox
            bare
            aria-label="Exclude"
            aria-describedby="exclude-hint"
            options={excludeOptions}
            value={exclude}
            onValueChange={setExclude}
            autoFocus={focusRow === "never"}
            getColor={tagColor}
            pillIcon={Ban}
            pillIconTone="danger"
            pillActions={excludePillActions}
            readOnly={ro}
          />
        </ToField>
        {!ro && (
          <RowRemove $variant="ghost" $size="sm" aria-label="Remove exclude" onClick={() => removeRow("never")}>
            <Icon icon={X} />
          </RowRemove>
        )}
      </ToBox>
  );
  const to = (
    <div>
      <ToStack onKeyDown={handleHistoryKey}>
        <ToBox>
          <Tooltip content={sendToText} pinOnClick={false}>
            <ToLabel tabIndex={0}><Icon icon={Users} size={14} />Send to</ToLabel>
          </Tooltip>
          <ToDivider aria-hidden />
          <ToField>
            <VisuallyHiddenHint id="send-to-hint">{sendToText}</VisuallyHiddenHint>
            <TagsSlot>
              <TagCombobox
                bare
                aria-label="Send to"
                aria-describedby="send-to-hint"
                options={sendToOptions}
                value={sendTo}
                onValueChange={setSendTo}
                getColor={tagColor}
                placeholder="Everyone"
                readOnly={ro}
                onQueryChange={setSendToQuery}
                leadingOption={joinedOption}
                queryMode={sendToQueryMode}
                pillActions={sendToPillActions}
              />
            </TagsSlot>
          </ToField>
        </ToBox>
        {orderedRows.map((k) => <Fragment key={k}>{rowNodes[k]}</Fragment>)}
        {!ro && (!showJoined || !showExclude || !showRequire) && (
          <AddRow>
            {!showRequire && (
              <Button $variant="secondary" $size="sm" onClick={() => addRow("require")}>
                <Icon icon={Plus} size={14} />
                Must have
              </Button>
            )}
            {!showExclude && (
              <Button $variant="secondary" $size="sm" onClick={() => addRow("never")}>
                <Icon icon={Plus} size={14} />
                Exclude
              </Button>
            )}
            {!showJoined && (
              <Button $variant="secondary" $size="sm" onClick={() => addRow("joined")}>
                <Icon icon={Plus} size={14} />
                Join date
              </Button>
            )}
          </AddRow>
        )}
        <HiddenLive aria-live="polite" key={announced.n}>
          {announced.text}
        </HiddenLive>
      </ToStack>
    </div>
  );

  const email = (
      <div>
        {/* Shallot's Email Editor. Keyed by email so switching emails loads that email's content. */}
        <MessageEditor
          key={e.id}
          moment={momentFor(e.trigger)}
          initialSubject={e.subjectDoc ?? (e.subject ? textToDoc(e.subject) : undefined)}
          initialBody={e.body}
          footer={EMAIL_FOOTER}
          fallbacks={fallbacks}
          onFallbackChange={(id, value) => setFallbacks((f) => ({ ...f, [id]: value }))}
          onChange={(d) => {
            const subject = docToText(d.subject);
            // Until the admin names the email, the title follows the subject. Renaming it never touches the subject.
            // A half-typed "@First" isn't copied until it becomes a tag, so the title doesn't flicker while picking.
            const titleFrom = (text: string) => text.replace(/@\S*$/, "").trim();
            const follow = !e.name.trim() || e.name === titleFrom(e.subject);
            onUpdate({ subjectDoc: d.subject, subject, body: d.body, attachments: d.attachments.length, ...(follow && { name: titleFrom(subject) }) });
          }}
          onPreview={() => setPreviewOpen(true)}
          readOnly={ro}
          subjectApart
          hidePreview
        />
      </div>
  );

  const everyone = whoSentence === "Every member.";
  return (
    <Flow>
      <BackRow>
        <BackLink>
          <Button $variant="ghost" $size="sm" onClick={onBack}>
            <Icon icon={ArrowLeft} size={14} />
            Automatic emails
          </Button>
        </BackLink>
        <div aria-live="polite">
          {isDraft && saved === "saving" && <SaveState><IconSlot aria-hidden />Saving…</SaveState>}
          {isDraft && saved === "saved" && (
            <SaveState>
              <IconSlot>
                <Icon icon={Check} size={14} />
              </IconSlot>
              Saved as a draft
            </SaveState>
          )}
          {isDraft && saved === "error" && (
            <SaveState>
              <Badge $variant="danger">Not saved</Badge>
              <Button $variant="outline" $size="sm" onClick={onRetrySave}>
                Retry
              </Button>
            </SaveState>
          )}
        </div>
      </BackRow>
      <Header>
        <HeaderMain>
          {isDraft ? (
            <TitleInput
              aria-label="Title"
              name="title"
              id="title-input"
              autoComplete="off"
              value={e.name}
              onChange={(ev) => onUpdate({ name: ev.target.value })}
              placeholder="Untitled automatic email"
              maxLength={80}
            />
          ) : (
            <PageTitle style={{ margin: 0 }}>{displayName(e)}</PageTitle>
          )}
          {e.state === "published" && <Tag>Published</Tag>}
        </HeaderMain>
      </Header>

      {e.state === "published" && (
        <Notice tone="info">
          This email is live and read-only. To change it, unpublish it. Sending stops until you publish again.
        </Notice>
      )}
      {saved === "error" && (
        <Notice tone="danger" alert>
          Your latest changes didn&apos;t save. Your text is still here. Retry, or keep editing and we&apos;ll try again.
        </Notice>
      )}
      <Core>
        <Group aria-describedby={everyone ? undefined : "who-gets-it-sentence"}>
          <HeadingRow>
            {/* "Every member." says nothing the empty Send to doesn't; only explain a real filter. */}
            {everyone ? (
              <SectionTitle>Who gets it</SectionTitle>
            ) : (
              <>
                <Tooltip content={whoSentence} pinOnClick={false}>
                  <SectionTitle tabIndex={0}>Who gets it</SectionTitle>
                </Tooltip>
                <VisuallyHiddenHint id="who-gets-it-sentence">{whoSentence}</VisuallyHiddenHint>
              </>
            )}
            {/* Only when someone qualifies: an empty count is noise, not news. */}
            {eligible.length > 0 && (
              <EligibleLine>
                <Icon icon={Users} size={14} />
                <EligibleLink $variant="ghost" $size="sm" onClick={() => setEligibleOpen(true)}>
                  {eligible.length === 1 ? "1 member will get this" : `${eligible.length} members will get this`}
                </EligibleLink>
              </EligibleLine>
            )}
          </HeadingRow>
          {to}
        </Group>
        <Group>
          <SectionTitle>When it sends</SectionTitle>
          {timing}
        </Group>
        <Group>
          <SectionTitle>What it says</SectionTitle>
          {email}
        </Group>
      </Core>
      <ApprovalRow>
        <Checkbox
          {...lock}
          label="Wait for approval before sending"
          checked={isReview}
          onCheckedChange={(v) => onUpdate({ mode: v === true ? "review" : "auto" })}
        />
        <Tooltip content="Each email waits for your OK, so you can add a personal touch for that member before it goes out.">
          <InfoTrigger type="button" aria-label="About waiting for approval">
            <Icon icon={Info} size={14} />
          </InfoTrigger>
        </Tooltip>
      </ApprovalRow>
        <Actions>
          {e.state !== "trash" && (
            <Button $variant="danger-outline" onClick={() => onAsk("trash")}>
              <Icon icon={Trash2} />
              Move to trash
            </Button>
          )}
          {e.state === "trash" && (
            <Button $variant="outline" onClick={onRestore}>
              Restore to drafts
            </Button>
          )}
          {e.state === "published" && (
            <Button $variant="outline" onClick={() => onAsk("unpublish")}>
              Unpublish to edit
            </Button>
          )}
          <Button $variant="outline" onClick={() => setPreviewOpen(true)}>
            <Icon icon={Eye} />
            Preview
          </Button>
          {isDraft && (
            <PushRight>
              {blockers.length > 0 ? (
                <DisabledReason reason={blockerText}>
                  <Button disabled>Publish</Button>
                </DisabledReason>
              ) : (
                <Button onClick={() => onAsk("publish")}>Publish</Button>
              )}
            </PushRight>
          )}
        </Actions>

      <Dialog open={eligibleOpen} onOpenChange={setEligibleOpen}>
        <DialogContent>
          <DialogTitle>Will get this</DialogTitle>
          {/* Everyone needs no explaining; a filtered list says who it's filtered to. */}
          {whoSentence !== "Every member." && <DialogDescription>{whoSentence}</DialogDescription>}
          <MemberRows members={eligible} />
        </DialogContent>
      </Dialog>
      <EmailPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} email={e} fallbacks={fallbacks} />
    </Flow>
  );
}

/* Subtle sentence-case heading: overrides the kit label's uppercase for these pick menus only. */
const PickHeading = styled(DropdownMenuLabel)`
  padding: var(--space-2) var(--space-3) var(--space-1);
  font-weight: var(--weight-regular);
  color: var(--color-text-subtle);
  text-transform: none;
  letter-spacing: normal;
`;

/* The short Trigger menu shows in full, without the kit's 7.5-row scroll cap. */
const PickContent = styled(DropdownMenuContent)`
  && {
    min-width: 0;
    max-width: var(--radix-dropdown-menu-content-available-width);
    max-height: none;
    overflow-y: visible;
  }
`;

const HeadingInfo = styled.span`
  display: inline-flex;
  vertical-align: middle;
  margin-left: var(--space-1);
  color: var(--color-text-muted);
`;

const PickItem = styled(DropdownMenuItem)`
  padding: 0 var(--space-3);
  gap: var(--space-4);

  /* The chosen option uses the DS selected fill; the repeated & outranks the kit's highlight fill. */
  &&[data-selected],
  &&[data-selected][data-highlighted] {
    background: var(--color-bg-selected);
    color: var(--color-text);
  }

  /* The hint stays visible on a highlighted or chosen row, one shade darker so it reads on the darker fill. */
`;

const JOIN_ANY_INFO = "Use this for anything tied to when someone joined: thank-yous, anniversaries, onboarding series.";

function PickRow({
  icon,
  label,
  heading,
  options,
  groups,
  value,
  onChange,
  disabled,
  children,
}: {
  icon: typeof Zap;
  label: string;
  heading: string;
  options: { value: string; label: string; group?: string }[];
  /** Optional group details; `info` shows as a hover tooltip beside the group heading. */
  groups?: { name: string; info?: string }[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  const current = options.find((o) => o.value === value)?.label ?? value;
  const hasExtras = Boolean(children);
  return (
    <PickBox>
      <PickMenu heading={heading} hideHeading options={options} groups={groups} value={value} onChange={onChange} disabled={disabled}>
        <PickTrigger type="button" $tight={hasExtras} aria-label={`${heading}: ${current}`}>
          <ToLabel>
            <Icon icon={icon} size={14} />
            {label}
          </ToLabel>
          <ToDivider aria-hidden />
          <PickValueText data-pick-value>
            {current}
            <Icon icon={ChevronDown} size={14} />
          </PickValueText>
        </PickTrigger>
      </PickMenu>
      {hasExtras && <PickExtras>{children}</PickExtras>}
    </PickBox>
  );
}

function PickMenu({
  heading,
  hideHeading,
  options,
  groups,
  value,
  onChange,
  disabled,
  children,
}: {
  heading: string;
  /** Row menus sit right under their row label, so they skip repeating it as a heading. */
  hideHeading?: boolean;
  options: { value: string; label: string; group?: string; color?: string }[];
  groups?: { name: string; info?: string }[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** The trigger element (one button). */
  children: React.ReactElement;
}) {
  const grouped = options.some((o) => o.group);
  const groupNames = [...new Set(options.map((o) => o.group ?? ""))];
  const item = (o: (typeof options)[number]) => (
    <PickItem
      key={o.value}
      role="menuitemradio"
      aria-checked={o.value === value}
      data-selected={o.value === value ? "" : undefined}
      onSelect={() => onChange(o.value)}
    >
      {o.color ? <Tag color={o.color as TagColor}>{o.label}</Tag> : o.label}
    </PickItem>
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [alignOffset, setAlignOffset] = useState(0);
  /* Line the menu items' text up with the value text: offset = value x - trigger x - (menu padding + item padding), measured on open. */
  function measure(open: boolean) {
    const trigger = triggerRef.current;
    if (!open || !trigger) return;
    const valueEl = trigger.querySelector<HTMLElement>("[data-pick-value]");
    const tr = trigger.getBoundingClientRect();
    const valueLeft = valueEl ? valueEl.getBoundingClientRect().left : tr.left + parseFloat(getComputedStyle(trigger).paddingLeft || "0");
    const probe = document.createElement("div");
    probe.style.cssText = "position:absolute;visibility:hidden;width:calc(var(--space-1) + var(--space-3))";
    trigger.appendChild(probe);
    const pad = probe.getBoundingClientRect().width;
    probe.remove();
    setAlignOffset(valueLeft - tr.left - pad);
  }
  return (
    <DropdownMenu onOpenChange={measure}>
      <DropdownMenuTrigger asChild disabled={disabled} ref={triggerRef}>
        {children}
      </DropdownMenuTrigger>
      <PickContent align="start" alignOffset={alignOffset} aria-label={heading}>
        {!hideHeading && <PickHeading>{heading}</PickHeading>}
        {grouped
          ? groupNames.map((g, i) => (
              <DropdownMenuGroup
                key={g}
                aria-label={g}
                aria-describedby={groups?.find((x) => x.name === g)?.info ? `pick-group-info-${g}` : undefined}
              >
                {i > 0 && <DropdownMenuSeparator />}
                <PickHeading aria-hidden>
                  {g}
                  {groups?.find((x) => x.name === g)?.info && (
                    <>
                      {/* Hover-only (not focusable) so menu keyboard navigation is untouched; screen readers get the text via aria-describedby. */}
                      <Tooltip content={groups.find((x) => x.name === g)!.info!} side="right" pinOnClick={false}>
                        <HeadingInfo>
                          <Icon icon={Info} size={14} />
                        </HeadingInfo>
                      </Tooltip>
                      <VisuallyHiddenHint id={`pick-group-info-${g}`}>{groups.find((x) => x.name === g)!.info}</VisuallyHiddenHint>
                    </>
                  )}
                </PickHeading>
                {options.filter((o) => (o.group ?? "") === g).map(item)}
              </DropdownMenuGroup>
            ))
          : options.map(item)}
      </PickContent>
    </DropdownMenu>
  );
}

function PickValue({
  heading,
  options,
  value,
  onChange,
  disabled,
  grow,
}: {
  heading: string;
  options: { value: string; label: string; group?: string; color?: string }[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  grow?: boolean;
}) {
  const current = options.find((o) => o.value === value)?.label ?? value;
  return (
    <PickMenu heading={heading} options={options} value={value} onChange={onChange} disabled={disabled}>
      <ValueButton type="button" $grow={grow} aria-label={`${heading}: ${current}`}>
        {current}
        <Icon icon={ChevronDown} size={14} />
      </ValueButton>
    </PickMenu>
  );
}

/* The Before / After / Between switcher spans the calendar's width, each option an equal share. */
