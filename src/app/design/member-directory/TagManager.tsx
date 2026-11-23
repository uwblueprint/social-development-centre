"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Check, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { ErrorIcon } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { List, ListRow } from "@/components/ui/ListRow";
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { TAG_COLORS, Tag, tagColorStyle } from "@/components/ui/Tag";
import { plural, type TagColor } from "./data";
import { ConfirmDialog } from "./dialogs";

export interface TagRow {
  name: string;
  color: TagColor;
  /** How many people have it. */
  count: number;
}

/* Neutral first, as Notion lists "Default" first; then the kit's palette order. */
const COLOURS: { value: TagColor; label: string }[] = [
  { value: undefined, label: "Grey" },
  ...TAG_COLORS.map((c) => ({ value: c, label: c[0].toUpperCase() + c.slice(1) })),
];

/* The kit's list rows (List draws the hairlines, ListRow the hover fill and inset focus ring). Open shows like hover. */
const Row = styled(ListRow)`
  justify-content: space-between;

  &[data-state="open"] {
    background: var(--color-bg-hover);
  }
`;

const RowTag = styled(Tag)`
  &&& {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const Count = styled.span`
  flex: none;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
`;

const Empty = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

/* Notion's option menu: tall enough for the name, Delete and every colour without scrolling. */
const EditorContent = styled(DropdownMenuContent)`
  && {
    max-height: var(--radix-dropdown-menu-content-available-height);
  }
`;

/* The name is the menu's top segment: flush with its top, left and right edges (cancelling the menu's padding),
   with no box of its own until it's focused or invalid, then a full-width divider under it. */
const NameBox = styled.div`
  margin: calc(var(--space-1) * -1) calc(var(--space-1) * -1) 0;
`;

const NameInput = styled(Input)`
  && input {
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    background: transparent;
  }
  && input:not(:focus):not([aria-invalid="true"]) {
    border-color: transparent;
  }
`;

const NameError = styled.span`
  display: flex;
  align-items: flex-start;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3) var(--space-2);
  font-size: var(--text-xs);
  line-height: var(--leading-body);
  color: var(--color-danger);
`;

/* Edge to edge, unlike the kit separator's inset: it closes the name segment. */
const NameDivider = styled(DropdownMenuSeparator)`
  && {
    margin: 0 calc(var(--space-1) * -1) var(--space-1);
  }
`;

/* Items start at the name field's left edge; the check sits on the right, as in Notion. */
const EditorItem = styled(DropdownMenuItem)`
  && {
    padding-left: var(--space-2);
  }
`;

const Swatch = styled.span`
  flex: none;
  width: var(--space-4);
  height: var(--space-4);
  border-radius: var(--radius-sm);
  background: var(--pill-bg, var(--color-secondary));
  box-shadow: inset 0 0 0 1px var(--color-border);
`;

const Trailing = styled.span`
  display: inline-flex;
  margin-left: auto;
  color: var(--color-text);
`;

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

function TagEditor({
  tag,
  names,
  onRename,
  onRecolor,
  onAskDelete,
  onDone,
}: {
  tag: TagRow;
  names: string[];
  onRename: (from: string, to: string) => void;
  onRecolor: (name: string, color: TagColor) => void;
  onAskDelete: (name: string) => void;
  onDone: () => void;
}) {
  const [draft, setDraft] = React.useState(tag.name);
  const [error, setError] = React.useState<string | null>(null);
  const input = React.useRef<HTMLInputElement>(null);
  const cancelled = React.useRef(false);
  const errorId = React.useId();

  /* Opens on the name, selected, so typing replaces it (Notion). After a tick: the menu focuses itself once it has
     mounted (its effect runs after this component's), so focusing straight away would be undone. */
  React.useEffect(() => {
    const id = window.setTimeout(() => {
      input.current?.focus({ preventScroll: true });
      input.current?.select();
    }, 0);
    return () => window.clearTimeout(id);
  }, []);


  /** Saves the typed name. Returns false when it can't be saved, so the editor stays open. */
  function save(): boolean {
    const next = draft.trim();
    if (!next || next === tag.name) {
      setDraft(tag.name);
      setError(null);
      return true;
    }
    if (names.some((n) => n !== tag.name && sameName(n, next))) {
      setError("A tag with this name already exists. Choose another name.");
      return false;
    }
    setError(null);
    onRename(tag.name, next);
    return true;
  }

  return (
    <EditorContent align="start">
      <NameBox>
        <NameInput
          ref={input}
          aria-label="Tag name"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          value={draft}
          autoComplete="off"
          onChange={(e) => {
            setDraft(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              /* The menu closes itself; the typed name is dropped. */
              cancelled.current = true;
              return;
            }
            if (e.key === "Tab") return;
            /* Keep typing in the field: the menu would otherwise jump to an item starting with that letter. */
            e.stopPropagation();
            if (e.key === "Enter") {
              e.preventDefault();
              if (save()) {
                cancelled.current = true;
                onDone();
              }
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              input.current?.closest('[role="menu"]')?.querySelector<HTMLElement>('[role^="menuitem"]')?.focus();
            }
          }}
          onBlur={() => {
            if (cancelled.current) return;
            save();
          }}
          onFocus={() => {
            cancelled.current = false;
          }}
        />
        {error && (
          <NameError id={errorId}>
            <ErrorIcon />
            <span>{error}</span>
          </NameError>
        )}
      </NameBox>
      <NameDivider />
      {COLOURS.map((c) => {
        const current = c.value === tag.color;
        return (
          <EditorItem
            key={c.label}
            role="menuitemradio"
            aria-checked={current}
            onKeyDown={(e) => {
              if (e.key !== "ArrowUp" || c !== COLOURS[0]) return;
              e.preventDefault();
              input.current?.focus();
              input.current?.select();
            }}
            onSelect={(e) => {
              /* Recolouring keeps the menu open, so the check visibly moves. */
              e.preventDefault();
              if (!current) onRecolor(tag.name, c.value);
            }}
          >
            <Swatch style={tagColorStyle(c.value)} aria-hidden />
            {c.label}
            {current && (
              <Trailing>
                <Icon icon={Check} size={16} />
              </Trailing>
            )}
          </EditorItem>
        );
      })}
      <DropdownMenuSeparator />
      <EditorItem $variant="danger" onSelect={() => onAskDelete(tag.name)}>
        <Icon icon={Trash2} size={16} />
        Delete tag
      </EditorItem>
    </EditorContent>
  );
}

export function TagManager({
  open,
  onOpenChange,
  tags,
  onRename,
  onRecolor,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Every tag, already in the filters' order (colour, then A to Z). */
  tags: TagRow[];
  onRename: (from: string, to: string) => void;
  onRecolor: (name: string, color: TagColor) => void;
  onDelete: (name: string) => void;
}) {
  /* Rows keep their key through a rename, so the open editor and the focused row stay put while the name changes. */
  const [keys, setKeys] = React.useState<Record<string, string>>({});
  const keyOf = (name: string) => keys[name] ?? `tag:${name}`;
  const [editing, setEditing] = React.useState<string | null>(null);
  const [active, setActive] = React.useState(0);
  const [confirming, setConfirming] = React.useState<TagRow | null>(null);
  const list = React.useRef<HTMLDivElement>(null);
  const names = tags.map((t) => t.name);
  const current = Math.min(active, Math.max(0, tags.length - 1));

  const focusRow = (i: number) => {
    const rows = list.current?.querySelectorAll<HTMLElement>("[data-tag-row]");
    if (!rows?.length) return;
    const at = Math.max(0, Math.min(i, rows.length - 1));
    setActive(at);
    rows[at].focus();
  };

  function rename(from: string, to: string) {
    setKeys((k) => {
      const next = { ...k, [to]: k[from] ?? `tag:${from}` };
      delete next[from];
      return next;
    });
    onRename(from, to);
  }

  function askDelete(name: string) {
    const tag = tags.find((t) => t.name === name);
    if (tag) setConfirming(tag);
  }

  /* After the confirmation closes, focus goes back to the tag's row, or, once it's deleted, to the row that took its
     place. Scheduled after the dialog's own focus return, which would otherwise land on the removed row. */
  const refocus = React.useRef<{ name: string; index: number } | null>(null);
  function closeConfirm() {
    if (confirming) refocus.current = { name: confirming.name, index: tags.findIndex((t) => t.name === confirming.name) };
    setConfirming(null);
  }
  React.useEffect(() => {
    if (confirming || !refocus.current) return;
    const target = refocus.current;
    refocus.current = null;
    const timer = window.setTimeout(() => {
      const rows = [...(list.current?.querySelectorAll<HTMLElement>("[data-tag-row]") ?? [])];
      const same = rows.findIndex((r) => r.dataset.tagRow === target.name);
      focusRow(same >= 0 ? same : target.index);
    }, 0);
    return () => window.clearTimeout(timer);
  });

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) setEditing(null);
        onOpenChange(next);
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Tags</SheetTitle>
        </SheetHeader>
        <SheetBody>
          {tags.length === 0 ? (
            <Empty>No tags yet</Empty>
          ) : (
            <List ref={list} role="list" aria-label="Tags">
              {tags.map((tag, i) => {
                const key = keyOf(tag.name);
                return (
                  <div role="listitem" key={key}>
                    <DropdownMenu open={editing === key} onOpenChange={(o) => setEditing(o ? key : null)}>
                      <DropdownMenuTrigger
                        asChild
                        onKeyDown={(e) => {
                          const move: Record<string, number> = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: tags.length - 1 };
                          if (e.key in move) {
                            /* preventDefault also stops the trigger opening its menu on ArrowDown. */
                            e.preventDefault();
                            focusRow(move[e.key]);
                          } else if (e.key === "Delete" || e.key === "Backspace") {
                            e.preventDefault();
                            setConfirming(tag);
                          }
                        }}
                      >
                        <Row
                          type="button"
                          data-tag-row={tag.name}
                          tabIndex={i === current ? 0 : -1}
                          aria-label={`${tag.name}, ${plural(tag.count, "person", "people")}`}
                          onFocus={() => setActive(i)}
                        >
                          <RowTag color={tag.color}>{tag.name}</RowTag>
                          <Count>{tag.count}</Count>
                        </Row>
                      </DropdownMenuTrigger>
                      {editing === key && (
                        <TagEditor
                          tag={tag}
                          names={names}
                          onRename={rename}
                          onRecolor={onRecolor}
                          onAskDelete={askDelete}
                          onDone={() => setEditing(null)}
                        />
                      )}
                    </DropdownMenu>
                  </div>
                );
              })}
            </List>
          )}
        </SheetBody>
      </SheetContent>
      {confirming && (
        <ConfirmDialog
          open
          onOpenChange={closeConfirm}
          title={`Delete the ${confirming.name} tag?`}
          description={
            confirming.count
              ? `This removes it from ${plural(confirming.count, "person", "people")}`
              : "No one has this tag"
          }
          confirm="Delete tag"
          onConfirm={() => {
            onDelete(confirming.name);
            closeConfirm();
          }}
        />
      )}
    </Sheet>
  );
}
