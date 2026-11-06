"use client";

import * as React from "react";
import { keyframes, styled } from "next-yak";
import { Popover as PopoverPrimitive } from "radix-ui";
import { X, type LucideIcon } from "lucide-react";
import { Icon } from "./Icon";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./DropdownMenu";
import { tagColorStyle, tagPill, type TagColor } from "./Tag";

/** Screen-reader text the combobox writes itself. Pass `copy` to override per use. */
export const tagComboboxCopy = {
  tagsLabel: "Selected",
  allAdded: "All tags are added",
  between: (before: string, after: string) => `Between ${before} and ${after}`,
  atStart: "At the start",
  atEnd: "At the end",
  noMatches: (query: string) => `No tags match “${query}”`,
  added: (label: string) => `${label} added`,
  removed: (label: string) => `${label} removed`,
  selected: (label: string) => `${label} selected. Press Backspace again to remove it.`,
  selectedCount: (n: number) => `${n} ${n === 1 ? "tag" : "tags"} selected`,
  removedMany: (labels: string[]) =>
    `Removed ${labels.length > 1 ? `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}` : labels[0]}`,
};

export interface TagComboboxOption {
  value: string;
  label: string;
  /** Short note shown on the right of the option, e.g. "Moves from Has tag". */
  hint?: string;
}

export interface TagComboboxExtraPill {
  key: string;
  index: number;
  node: React.ReactNode;
  onRemove: () => void;
}

export interface TagComboboxLeadingOption {
  label: React.ReactNode;
  /** Plain text of the label, for the screen reader. */
  textValue: string;
  /** `index` is how many tags sit before the field, so a caller can insert something there. */
  onSelect: (at: { index: number }) => void;
}

export interface TagComboboxQueryMode {
  /** Text used to filter the options (the query without its prefix). */
  filter: string;
  heading: string;
  icon: LucideIcon;
  iconTone?: "danger";
  /** Option values to leave out of the list. */
  hide?: string[];
  onPick: (value: string) => void;
}

export interface TagComboboxPillAction {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  /** Destructive action: shown in the danger color. */
  danger?: boolean;
}

export interface TagComboboxProps {
  options: TagComboboxOption[];
  /** Selected option values, in order. Controlled. */
  value: string[];
  onValueChange: (next: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Drops the field's own border and padding, for use inside a box that already has one. */
  bare?: boolean;
  /** Shows the tags only, with no way to change them. */
  readOnly?: boolean;
  /** Opens the list as soon as it mounts, e.g. right after the field is added. */
  autoFocus?: boolean;
  copy?: Partial<typeof tagComboboxCopy>;
  /**
   * Foreign pills shown among the tags, e.g. a date-range pill. `index` is the position among the tags it
   * sits before (the tag count puts it last). Backspace selects and deletes it like a tag, calling `onRemove`.
   */
  extraPills?: TagComboboxExtraPill[];
  /** Reports the text typed in the field, e.g. so the caller can offer a leadingOption for it. */
  onQueryChange?: (query: string) => void;
  /**
   * Turns a typed shortcut (e.g. "-board") into a mode where the list is every option matching `filter` (the text
   * after the prefix), under a small `heading`, each with `icon` before it. Picking calls `onPick` instead of adding
   * to `value`, then clears the text. `hide` lists values left out. Return null for normal behaviour.
   */
  queryMode?: (query: string) => TagComboboxQueryMode | null;
  /**
   * One special option listed first, above a divider and the normal tags. It is highlighted by default,
   * and selecting it calls `onSelect`, clears the text and keeps focus. While present, the "No tags match" message is not shown.
   */
  leadingOption?: TagComboboxLeadingOption | null;
  /**
   * Lists the leading option even while the field is empty (pinned at the top, then the divider, then all tags).
   * Without it the leading option is listed only while text is typed.
   */
  leadingOptionAlways?: boolean;
  /**
   * Actions for a tag's context menu. Right-click a tag, or select it with Backspace and press Shift+F10 or the
   * Menu key. Return an empty list for no menu. Escape closes the menu and returns focus to the field.
   */
  pillActions?: (value: string) => TagComboboxPillAction[];
  /** Colour of a tag, by value. Tags and dropdown options take it (pill fill and text; options render as the tag itself). No colour = grey. */
  getColor?: (value: string) => TagColor | undefined;
  /** Small icon shown before the text of every tag. */
  pillIcon?: LucideIcon;
  /** "danger" paints the pill icon red, e.g. the Ban icon on an exclusion list. The tag keeps its own colour. */
  pillIconTone?: "danger";
  /** Called when adding a tag in the middle shifts an extra pill's `index`; store the new one. */
  onExtraMove?: (key: string, index: number) => void;
  /** From `Field`. */
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  "aria-label"?: string;
}

/** After a Backspace removes a tag, the next Backspace within this long removes the next one straight away. */
const FAST_DELETE_MS = 5000;

const Box = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1);
  width: 100%;
  min-height: 40px;
  padding: var(--space-1);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  cursor: text;

  &:hover:not(:focus-within) {
    border-color: var(--color-text-muted);
  }

  &:focus-within {
    border-color: var(--color-focus);
    box-shadow: var(--focus-ring);
  }

  &[data-readonly] {
    border-color: transparent;
    background: var(--color-surface);
    cursor: default;
  }

  &[data-bare],
  &[data-bare]:hover:not(:focus-within),
  &[data-bare]:focus-within {
    min-height: 0;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }
`;

const DraftSlot = styled.li`
  display: contents;
`;

const Tags = styled.ul`
  display: contents;
  list-style: none;
`;

/* Holds a foreign pill; shows the same "about to be removed" ring as a selected tag. */
const ExtraPill = styled.li`
  display: inline-flex;
  max-width: 100%;
  border-radius: var(--radius-sm);

  /* Selected: darker fill and a stronger 1px border on the pill inside, like a selected tag. */
  &[aria-current="true"] > * {
    background: var(--color-mention-hover);
    border-color: var(--color-mention);
  }
`;

/* Selected (about to be removed) tags get a darker fill and a stronger fill, no border; it is also announced. */
const Chip = styled.li`
  ${tagPill}
  max-width: 100%;
  /* Tags are interactive (select, remove, right-click menu). */
  cursor: pointer;
  white-space: normal;
  padding-right: var(--space-1);

  &[data-readonly] {
    cursor: default;
    padding-right: var(--space-2);
  }

  /* Selected (about to be removed): a stronger fill, no border. */
  &[aria-current="true"] {
    background: var(--pill-bg-strong, var(--color-bg-selected));
  }
`;

const PillIcon = styled.span`
  display: inline-flex;
  flex-shrink: 0;

  &[data-tone="danger"] {
    color: var(--color-danger);
  }
`;

/* An option with a colour renders as the tag itself, the same pill as in the box (no remove button). */
const OptionPill = styled.span`
  ${tagPill}
  max-width: 100%;
  white-space: normal;
  overflow-wrap: anywhere;
`;

const OptionLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
`;

const ChipText = styled.span`
  min-width: 0;
  overflow-wrap: anywhere;
`;

/* Pointer-only: keyboard users remove tags with Backspace. */
const RemoveButton = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;

  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text);
  }
`;

const Draft = styled.input`
  /* Only as wide as its text (min 2ch). Last in the box it also fills the leftover space on its line. */
  field-sizing: content;
  flex: 0 0 auto;
  min-width: 2ch;
  height: 28px;
  padding: 0 var(--space-1);
  border: 0;
  outline: none;
  background: transparent;
  font: inherit;
  font-size: var(--text-sm);
  color: var(--color-text);

  &[data-last] {
    flex: 1 1 auto;
  }

  /* Empty and last: take whatever room is left on the line, however little, instead of wrapping to an empty line of its own. */
  &[data-last][data-empty] {
    flex: 1 1 0;
    min-width: 0;
  }

  &::placeholder {
    color: var(--color-text-subtle);
  }
`;

/*
 * Overlay enter/exit: a short fade plus a 4px nudge toward the trigger side, vertical only. The old
 * scale + transform-origin (a Radix var that isn't measured on the first frame) and the horizontal
 * slide made the panel twitch sideways as Radix settled its position. Exit is a plain fade. Only the
 * inner content animates, never Radix's positioned wrapper.
 */
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeInBelow = keyframes`
  from { opacity: 0; transform: translateY(calc(var(--space-1) * -1)); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeInAbove = keyframes`
  from { opacity: 0; transform: translateY(var(--space-1)); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const List = styled(PopoverPrimitive.Content)`
  z-index: var(--z-popover);
  width: var(--radix-popover-trigger-width);
  /* 7.5 rows + padding + border: the half row shows there is more to scroll to. */
  max-height: calc(var(--menu-row-height) * 7.5 + var(--space-1) * 2 + 2px);
  overflow-y: auto;
  scroll-padding: var(--space-1);
  padding: var(--space-1);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);

  &[data-state="open"] {
    animation: ${fadeIn} var(--duration) var(--ease-out);
  }

  &[data-state="open"][data-side="bottom"] {
    animation: ${fadeInBelow} var(--duration) var(--ease-out);
  }

  &[data-state="open"][data-side="top"] {
    animation: ${fadeInAbove} var(--duration) var(--ease-out);
  }

  &[data-state="closed"] {
    animation: ${fadeOut} var(--duration-fast) var(--ease-in) forwards;
  }
`;

const Option = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  min-height: var(--menu-row-height);
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--color-text);
  cursor: pointer;

  &[aria-selected="true"] {
    background: var(--color-bg-hover);
  }
`;

const Separator = styled.div`
  height: 1px;
  margin: var(--space-1) 0;
  background: var(--color-border);
`;

const Heading = styled.div`
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const Hint = styled.span`
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const Empty = styled.div`
  padding: var(--space-3) var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  text-align: center;
`;

/* Zero-size point the context menu anchors to; moved to the pointer or the tag. */
const MenuAnchor = styled.span`
  position: fixed;
  width: 0;
  height: 0;
  pointer-events: none;
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
`;

/**
 * Pick several options from a list, shown as tags inside one field. Typing filters the list; click or
 * Enter adds the highlighted option. Backspace in the empty field selects the last tag, and a second
 * Backspace removes it. Once one is removed, Backspace keeps removing for a few seconds without
 * selecting first: the intent to delete is already clear.
 */
export function TagCombobox({
  options,
  value,
  onValueChange,
  placeholder,
  disabled,
  readOnly,
  autoFocus,
  bare,
  extraPills = [],
  onExtraMove,
  onQueryChange,
  queryMode,
  leadingOption: leadingOptionProp,
  leadingOptionAlways,
  pillActions,
  getColor,
  pillIconTone,
  pillIcon,
  copy: copyOverrides,
  id,
  "aria-describedby": describedBy,
  "aria-invalid": ariaInvalid,
  "aria-label": ariaLabel,
}: TagComboboxProps) {
  const copy = { ...tagComboboxCopy, ...copyOverrides };
  const listId = React.useId();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  // The tag the next Backspace removes, shown selected.
  const [pending, setPending] = React.useState<string | null>(null);
  // Several pills selected like text: `anchor` is the field's slot, `focus` the moving end (slots 0..visual.length).
  const [sel, setSel] = React.useState<{ anchor: number; focus: number } | null>(null);
  const lastDelete = React.useRef(-Infinity);
  const [announcement, setAnnouncement] = React.useState({ id: 0, text: "" });
  // Context menu for a tag: which tag, and the point it opens at.
  const [menu, setMenu] = React.useState<{ key: string; x: number; y: number } | null>(null);
  const skipOpen = React.useRef(false);
  const menuActions = menu && pillActions ? pillActions(menu.key) : [];
  const announce = (text: string) => setAnnouncement((prev) => ({ id: prev.id + 1, text }));

  // Tags and extra pills in the order they are shown.
  const visual: { key: string; extra?: TagComboboxExtraPill }[] = value.map((v) => ({ key: v }));
  [...extraPills].sort((x, y) => x.index - y.index).forEach((x, n) => {
    visual.splice(Math.min(x.index + n, visual.length), 0, { key: `extra:${x.key}`, extra: x });
  });
  const selLo = sel ? Math.min(sel.anchor, sel.focus, visual.length) : 0;
  const selHi = sel ? Math.min(Math.max(sel.anchor, sel.focus), visual.length) : 0;
  const selectedKeys = new Set(sel ? visual.slice(selLo, selHi).map((x) => x.key) : []);
  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;
  const q = query.trim().toLowerCase();
  const mode = queryMode?.(query) ?? null;
  const modeQ = mode ? mode.filter.trim().toLowerCase() : "";
  const matches = mode
    ? options.filter((o) => !mode.hide?.includes(o.value) && (!modeQ || o.label.toLowerCase().includes(modeQ)))
    : options.filter((o) => !value.includes(o.value) && (!q || o.label.toLowerCase().includes(q)));
  const leadingOption = !mode && leadingOptionProp && (leadingOptionAlways || query.trim() !== "") ? leadingOptionProp : null;
  const lead = leadingOption ? 1 : 0;
  const count = matches.length + lead;
  const activeIndex = Math.min(active, Math.max(0, count - 1));
  const changeQuery = (next: string) => {
    setQuery(next);
    onQueryChange?.(next);
  };

  // A change from outside (e.g. undo) leaves no tag selected for removal.
  const shown = `${value.join("\u0000")}|${extraPills.map((x) => x.key + x.index).join(",")}`;
  const [lastShown, setLastShown] = React.useState(shown);
  if (lastShown !== shown) {
    setLastShown(shown);
    setPending(null);
    setSel(null);
  }

  React.useEffect(() => {
    // Focusing the field opens the list (onFocus).
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Where the field sits among the pills: a visual index, or null for the end.
  const [caret, setCaret] = React.useState<number | null>(null);
  const at = caret === null ? visual.length : Math.min(caret, visual.length);
  const hoverMoved = React.useRef(false);
  // Keep the highlighted row fully in view for keyboard and programmatic changes; hover never scrolls.
  React.useEffect(() => {
    if (hoverMoved.current) {
      hoverMoved.current = false;
      return;
    }
    if (!open) return;
    document.getElementById(`${listId}-${activeIndex}`)?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex, listId, query]);
  const refocus = React.useRef(false);
  React.useEffect(() => {
    if (refocus.current) {
      refocus.current = false;
      inputRef.current?.focus();
    }
  });
  const nameOf = (key: string) => (key.startsWith("extra:") ? key.slice(6) : labelOf(key));

  function moveCaret(next: number) {
    setSel(null);
    const to = Math.max(0, Math.min(next, visual.length));
    refocus.current = true;
    setCaret(to === visual.length ? null : to);
    setPending(null);
    const before = to > 0 ? nameOf(visual[to - 1].key) : null;
    const after = to < visual.length ? nameOf(visual[to].key) : null;
    announce(before && after ? copy.between(before, after) : after ? copy.atStart : copy.atEnd);
  }

  function add(option: TagComboboxOption) {
    if (mode) {
      mode.onPick(option.value);
      announce(copy.added(option.label));
      changeQuery("");
      setActive(0);
      setPending(null);
      inputRef.current?.focus();
      return;
    }
    const tagIndex = visual.slice(0, at).filter((x) => !x.extra).length;
    const next = [...value];
    next.splice(tagIndex, 0, option.value);
    onValueChange(next);
    if (onExtraMove) {
      const order = [...visual.slice(0, at), { key: option.value } as (typeof visual)[number], ...visual.slice(at)];
      let tags = 0;
      order.forEach((x) => {
        if (!x.extra) tags += 1;
        else if (x.extra.index !== tags) onExtraMove(x.extra.key, tags);
      });
    }
    if (caret !== null) setCaret(at + 1);
    announce(copy.added(option.label));
    changeQuery("");
    setActive(0);
    setPending(null);
    inputRef.current?.focus();
  }

  function selectLeading() {
    if (!leadingOption) return;
    leadingOption.onSelect({ index: visual.slice(0, at).filter((x) => !x.extra).length });
    announce(copy.added(leadingOption.textValue));
    changeQuery("");
    setActive(0);
    setPending(null);
    inputRef.current?.focus();
  }

  /** Removes the pill with this visual key, keeping the field where it was relative to the others. */
  function removeKey(key: string) {
    const index = visual.findIndex((x) => x.key === key);
    const extra = visual[index]?.extra;
    if (extra) extra.onRemove();
    else onValueChange(value.filter((x) => x !== key));
    announce(copy.removed(nameOf(key)));
    if (caret !== null) setCaret(index < at ? at - 1 : at);
    setPending(null);
  }

  /** Backspace acts on the pill before the field, Delete on the one after: select first, then remove. */
  function deleteAround(event: React.KeyboardEvent<HTMLInputElement>, direction: "before" | "after") {
    const target = visual[direction === "before" ? at - 1 : at]?.key;
    if (!target) return;
    event.preventDefault();
    // Event timestamps share one clock, so they measure the gap between presses.
    const fast = event.timeStamp - lastDelete.current < FAST_DELETE_MS;
    if (pending === target || fast) {
      removeKey(target);
      lastDelete.current = event.timeStamp;
    } else {
      setPending(target);
      announce(copy.selected(nameOf(target)));
    }
  }

  function setSelection(anchor: number, focus: number) {
    const lo = Math.min(anchor, focus);
    const hi = Math.max(anchor, focus);
    setPending(null);
    if (lo === hi) {
      setSel(null);
      return;
    }
    setSel({ anchor, focus });
    announce(copy.selectedCount(hi - lo));
  }

  /** Removes every selected pill in one change, so the caller records one undo step. */
  function removeSelection(event: React.KeyboardEvent<HTMLInputElement>) {
    const keys = visual.slice(selLo, selHi);
    event.preventDefault();
    const removedTags = new Set(keys.filter((x) => !x.extra).map((x) => x.key));
    if (removedTags.size) onValueChange(value.filter((x) => !removedTags.has(x)));
    keys.forEach((x) => x.extra?.onRemove());
    announce(copy.removedMany(keys.map((x) => nameOf(x.key))));
    lastDelete.current = event.timeStamp;
    setCaret(selLo);
    setSel(null);
    setPending(null);
  }

  function openMenu(key: string, x: number, y: number) {
    if (!pillActions || pillActions(key).length === 0) return false;
    setOpen(false);
    setMenu({ key, x, y });
    return true;
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    if ((event.key === "F10" && event.shiftKey) || event.key === "ContextMenu") {
      const key = pending && !pending.startsWith("extra:") ? pending : null;
      const el = key ? [...(input.closest("ul")?.querySelectorAll<HTMLElement>("[data-pill-key]") ?? [])].find((n) => n.dataset.pillKey === key) : null;
      if (key && el) {
        const r = el.getBoundingClientRect();
        if (openMenu(key, r.left, r.bottom)) event.preventDefault();
      }
      return;
    }
    const mod = event.ctrlKey || event.metaKey;
    const emptyText = input.value === "";
    const anchor = sel ? sel.anchor : at;
    const from = sel ? sel.focus : at;
    if (sel && selHi > selLo && (event.key === "Backspace" || event.key === "Delete")) {
      removeSelection(event);
      return;
    }
    if (event.shiftKey && !mod && event.key === "ArrowLeft" && (sel || (input.selectionStart === 0 && input.selectionEnd === 0))) {
      if (sel || at > 0) {
        event.preventDefault();
        setSelection(anchor, Math.max(0, from - 1));
      }
      return;
    }
    if (event.shiftKey && !mod && event.key === "ArrowRight" && (sel || (input.selectionStart === input.value.length && input.selectionEnd === input.value.length))) {
      if (sel || at < visual.length) {
        event.preventDefault();
        setSelection(anchor, Math.min(visual.length, from + 1));
      }
      return;
    }
    if (event.shiftKey && event.key === "Home" && (sel || (input.selectionStart === 0 && input.selectionEnd === 0)) && (sel || at > 0)) {
      event.preventDefault();
      setSelection(anchor, 0);
      return;
    }
    if (event.shiftKey && event.key === "End" && (sel || (input.selectionStart === input.value.length && input.selectionEnd === input.value.length)) && (sel || at < visual.length)) {
      event.preventDefault();
      setSelection(anchor, visual.length);
      return;
    }
    if (mod && !event.shiftKey && event.key.toLowerCase() === "a" && emptyText && visual.length > 0) {
      event.preventDefault();
      setSelection(0, visual.length);
      return;
    }
    if (sel && event.key !== "Shift" && event.key !== "Control" && event.key !== "Meta" && event.key !== "Alt") {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setSel(null);
        return;
      }
      setSel(null);
    }
    const atTextStart = input.selectionStart === 0 && input.selectionEnd === 0;
    const atTextEnd = input.selectionStart === input.value.length && input.selectionEnd === input.value.length;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      hoverMoved.current = false;
      setActive(count ? (activeIndex + step + count) % count : 0);
    } else if (event.key === "Enter") {
      if (open && count) {
        event.preventDefault();
        if (leadingOption && activeIndex === 0) selectLeading();
        else add(matches[activeIndex - lead]);
      }
    } else if (event.key === "Escape") {
      if (pending) setPending(null);
      else if (open) setOpen(false);
      else return;
      event.preventDefault();
      event.stopPropagation();
    } else if (event.key === "ArrowLeft" && atTextStart && at > 0) {
      event.preventDefault();
      moveCaret(at - 1);
    } else if (event.key === "ArrowRight" && atTextEnd && at < visual.length) {
      event.preventDefault();
      moveCaret(at + 1);
    } else if (event.key === "Home" && atTextStart && at > 0) {
      event.preventDefault();
      moveCaret(0);
    } else if (event.key === "End" && atTextEnd && at < visual.length) {
      event.preventDefault();
      moveCaret(visual.length);
    } else if (event.key === "Backspace" && query === "") {
      deleteAround(event, "before");
    } else if (event.key === "Delete" && query === "") {
      deleteAround(event, "after");
    }
  }

  // Clicking between pills puts the field there; clicking empty space puts it at the end.
  function placeFromPoint(x: number, y: number, box: HTMLElement) {
    const pills = [...box.querySelectorAll<HTMLElement>("[data-pill]")];
    const index = pills.filter((el) => {
      const r = el.getBoundingClientRect();
      return r.bottom <= y || (y >= r.top && r.left + r.width / 2 < x);
    }).length;
    setCaret(index === pills.length ? null : index);
    refocus.current = true;
    setPending(null);
    setSel(null);
    setOpen(true);
  }

  if (readOnly) {
    return (
      <Box data-readonly="" data-bare={bare ? "" : undefined} id={id} aria-describedby={describedBy}>
        <Tags aria-label={ariaLabel ?? copy.tagsLabel}>
          {value.map((v) => (
            <Chip key={v} data-readonly="" data-colored={getColor?.(v) ? "" : undefined} style={tagColorStyle(getColor?.(v))}>
              {pillIcon && <PillIcon data-tone={pillIconTone}><Icon icon={pillIcon} size={14} /></PillIcon>}
              <ChipText>{labelOf(v)}</ChipText>
            </Chip>
          ))}
        </Tags>
      </Box>
    );
  }

  const fieldNode = (
    <DraftSlot key="field">
      <Draft
            ref={inputRef}
            data-last={at === visual.length ? "" : undefined}
            data-empty={query === "" ? "" : undefined}
            id={id}
            role="combobox"
            aria-label={ariaLabel}
            aria-describedby={describedBy}
            aria-invalid={ariaInvalid || undefined}
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            autoComplete="off"
            aria-activedescendant={open && count ? `${listId}-${activeIndex}` : undefined}
            value={query}
            placeholder={value.length || extraPills.length ? undefined : placeholder}
            disabled={disabled}
            onChange={(event) => {
              changeQuery(event.target.value);
              setActive(0);
              setPending(null);
              setSel(null);
              setOpen(true);
            }}
            onFocus={() => {
              if (skipOpen.current) {
                skipOpen.current = false;
                return;
              }
              setOpen(true);
              setActive(0);
            }}
            onClick={() => setOpen(true)}
            onBlur={() => {
              setPending(null);
              setSel(null);
            }}
            onKeyDown={handleKeyDown}
          />
    </DraftSlot>
  );

  return (
    <PopoverPrimitive.Root open={open && !disabled} onOpenChange={setOpen}>
      <PopoverPrimitive.Anchor asChild>
        <Box
          data-bare={bare ? "" : undefined}
          onMouseDown={(event) => {
            // Clicking empty space or a gap in the box puts the caret in the field, like a native input.
            const target = event.target as HTMLElement;
            const pillEl = target.closest<HTMLElement>("[data-pill]");
            if (event.button === 0 && event.shiftKey && pillEl && !target.closest("[data-remove]")) {
              // Shift+click extends the selection from the field to the clicked pill.
              event.preventDefault();
              const i = [...event.currentTarget.querySelectorAll("[data-pill]")].indexOf(pillEl);
              const anchor = sel ? sel.anchor : at;
              setSelection(anchor, i >= anchor ? i + 1 : i);
              inputRef.current?.focus();
              return;
            }
            if (event.button === 0 && (target === event.currentTarget || target.closest("[data-pill]") === target)) {
              event.preventDefault();
              placeFromPoint(event.clientX, event.clientY, event.currentTarget);
            }
          }}
        >
          <Tags aria-label={copy.tagsLabel}>
            {visual.map(({ key: v, extra }, i) => (
              <React.Fragment key={v}>
                {i === at && fieldNode}
                {extra ? (
                  <ExtraPill data-pill="" aria-current={pending === v || selectedKeys.has(v) ? "true" : undefined}>
                    {extra.node}
                  </ExtraPill>
                ) : (
                  <Chip
                    data-pill=""
                    data-pill-key={v}
                    data-colored={getColor?.(v) ? "" : undefined}
                    style={tagColorStyle(getColor?.(v))}
                    aria-current={pending === v || selectedKeys.has(v) ? "true" : undefined}
                    onContextMenu={(event) => {
                      if (openMenu(v, event.clientX, event.clientY)) event.preventDefault();
                    }}
                  >
                    {pillIcon && <PillIcon data-tone={pillIconTone}><Icon icon={pillIcon} size={14} /></PillIcon>}
                    <ChipText>{labelOf(v)}</ChipText>
                    <RemoveButton aria-hidden data-remove="" onMouseDown={(event) => event.preventDefault()} onClick={() => removeKey(v)}>
                      <Icon icon={X} size={14} />
                    </RemoveButton>
                  </Chip>
                )}
              </React.Fragment>
            ))}
            {at === visual.length && fieldNode}
          </Tags>
        </Box>
      </PopoverPrimitive.Anchor>
      <PopoverPrimitive.Portal>
        <List
          id={listId}
          role="listbox"
          align="start"
          sideOffset={4}
          // Focus stays in the field while the list is open.
          onOpenAutoFocus={(event) => event.preventDefault()}
          onInteractOutside={(event) => {
            const target = event.target as Node | null;
            if (target && inputRef.current?.parentElement?.contains(target)) event.preventDefault();
          }}
        >
          {leadingOption && (
            <>
              <Option
                id={`${listId}-0`}
                role="option"
                aria-label={leadingOption.textValue}
                aria-selected={activeIndex === 0}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => {
                  hoverMoved.current = true;
                  setActive(0);
                }}
                onClick={selectLeading}
              >
                {leadingOption.label}
              </Option>
              {matches.length > 0 && <Separator role="separator" />}
            </>
          )}
          {mode && matches.length > 0 && <Heading role="presentation">{mode.heading}</Heading>}
          {matches.length === 0 ? (
            leadingOption ? null : <Empty>{query.trim() ? copy.noMatches(mode ? mode.filter.trim() || query.trim() : query.trim()) : copy.allAdded}</Empty>
          ) : (
            matches.map((o, n) => (
              <Option
                key={o.value}
                id={`${listId}-${n + lead}`}
                role="option"
                aria-selected={n + lead === activeIndex}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => {
                  hoverMoved.current = true;
                  setActive(n + lead);
                }}
                onClick={() => add(o)}
              >
                <OptionLabel>
                  {mode && (
                    <PillIcon data-tone={mode.iconTone}><Icon icon={mode.icon} size={14} /></PillIcon>
                  )}
                  {getColor ? <OptionPill style={tagColorStyle(getColor(o.value))}>{o.label}</OptionPill> : o.label}
                </OptionLabel>
                {o.hint && <Hint>{o.hint}</Hint>}
              </Option>
            ))
          )}
        </List>
      </PopoverPrimitive.Portal>
      <DropdownMenu open={!!menu && menuActions.length > 0} onOpenChange={(next) => !next && setMenu(null)}>
        <DropdownMenuTrigger asChild>
          <MenuAnchor aria-hidden style={{ left: menu?.x ?? 0, top: menu?.y ?? 0 }} />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={0}
          aria-label={menu ? labelOf(menu.key) : undefined}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            skipOpen.current = true;
            inputRef.current?.focus();
            // If focus was already there no focus event fires, so don't leave the flag set.
            skipOpen.current = false;
          }}
        >
          {menuActions.map((action) => (
            <DropdownMenuItem key={action.label} $variant={action.danger ? "danger" : undefined} onSelect={action.onSelect}>
              {action.icon && <Icon icon={action.icon} size={16} />}
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <VisuallyHidden aria-live="polite" key={announcement.id}>
        {announcement.text}
      </VisuallyHidden>
    </PopoverPrimitive.Root>
  );
}
