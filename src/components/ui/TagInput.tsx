"use client";

import * as React from "react";
import { styled } from "next-yak";
import { CircleAlert, X } from "lucide-react";
import { Icon } from "./Icon";
import { Tooltip } from "./Tooltip";

/**
 * Screen-reader text and labels the tag input writes itself. The owner edits them here; pass `copy`
 * to override per use.
 */
export const tagInputCopy = {
  /** Accessible name of the list of entered tags. */
  tagsLabel: "Entered",
  remove: (tag: string) => `Remove ${tag}`,
  removeInvalid: (tag: string, reason: string) => `Remove ${tag}. ${reason}`,
  added: (tags: string[]) => (tags.length === 1 ? `${tags[0]} added` : `${tags.length} added`),
  removed: (tag: string) => `${tag} removed`,
  removedMany: (count: number) => `${count} removed`,
  copied: (count: number) => (count === 1 ? "1 copied" : `${count} copied`),
  duplicate: (tag: string) => `${tag} is already in the list`,
};

export type TagInputCopy = typeof tagInputCopy;

/** Typing any of these ends a tag. Newlines arrive by paste. */
const SEPARATORS = /[\s,;]+/;

export interface TagInputProps {
  /** The tags, in order. Controlled. */
  value: string[];
  onValueChange: (next: string[]) => void;
  /** Why a tag is invalid, or `undefined` when it's fine. Invalid tags stay, marked, so people can fix them. */
  validate?: (tag: string) => string | undefined;
  /** Cleans each entry before it becomes a tag (default: trim). Tags that normalize the same are merged. */
  normalize?: (text: string) => string;
  /** Submits the tags with a form: one hidden input, tags separated by new lines. */
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  copy?: Partial<TagInputCopy>;
  /** From `Field`: the draft input's id, description and invalid state. */
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  required?: boolean;
}

const Box = styled.div<{ $invalid?: boolean; $disabled?: boolean }>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1);
  min-height: 40px;
  padding: var(--space-1);
  border: 1px solid ${({ $invalid }) => ($invalid ? "var(--color-danger)" : "var(--color-border-strong)")};
  border-radius: var(--radius-md);
  background: var(--color-bg);
  cursor: text;
  transition:
    border-color var(--duration) var(--ease),
    box-shadow var(--duration) var(--ease);

  &:hover:not(:focus-within) {
    border-color: ${({ $invalid }) => ($invalid ? "var(--color-danger)" : "var(--color-text-muted)")};
  }

  &:focus-within {
    border-color: ${({ $invalid }) => ($invalid ? "var(--color-danger)" : "var(--color-focus)")};
    box-shadow: var(--focus-ring);
  }

  ${({ $disabled }) =>
    $disabled &&
    `
    cursor: not-allowed;
    border-style: dashed;
    border-color: var(--color-border);
    background: var(--color-disabled-bg);
  `}
`;

/* `display: contents` lets tags and the draft input wrap as one line; the explicit role keeps it a listbox. */
const Tags = styled.ul`
  display: contents;
  list-style: none;
`;

/*
 * Selected tags get a darker fill and a 2px outline in their own text color (not color alone); the
 * focused tag also shows the focus ring outside it.
 */
const Chip = styled.li<{ $invalid?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  max-width: 100%;
  min-height: 28px;
  padding: 0 var(--space-1) 0 var(--space-2);
  border: 1px solid ${({ $invalid }) => ($invalid ? "var(--color-danger)" : "var(--color-border)")};
  border-radius: var(--radius-sm);
  background: ${({ $invalid }) => ($invalid ? "var(--color-danger-subtle)" : "var(--color-secondary)")};
  color: ${({ $invalid }) => ($invalid ? "var(--color-danger)" : "var(--color-text)")};
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  cursor: default;
  /* Shift-click selects tags, not text; copying tags is Cmd/Ctrl+C. */
  user-select: none;

  &[aria-selected="true"] {
    background: var(--color-bg-selected);
    border-color: currentColor;
    box-shadow: inset 0 0 0 1px currentColor;
  }

  &:focus {
    outline: none;
  }

  &:focus-visible {
    box-shadow: var(--focus-ring);
  }

  &[aria-selected="true"]:focus-visible {
    box-shadow:
      inset 0 0 0 1px currentColor,
      var(--focus-ring);
  }
`;

const ChipText = styled.span`
  min-width: 0;
  overflow-wrap: anywhere;
`;

/* Pointer-only (aria-hidden, not focusable): keyboard users select a tag and press Backspace or Delete. */
const RemoveButton = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-sm);
  color: inherit;
  cursor: pointer;

  &:hover {
    background: var(--color-bg-hover);
  }
`;

const Draft = styled.input`
  flex: 1 1 160px;
  min-width: 120px;
  height: 28px;
  padding: 0 var(--space-1);
  border: 0;
  outline: none;
  background: transparent;
  font: inherit;
  font-size: var(--text-sm);
  color: var(--color-text);

  &::placeholder {
    color: var(--color-text-subtle);
  }
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
 * A text field that turns each entry into a removable tag: type an entry, then a comma, space,
 * semicolon or Enter. Pasting a list splits it into tags. Invalid entries stay as error-styled tags
 * (icon + tooltip with the reason). Backspace in the empty field removes the last tag.
 *
 * Tags are selectable, like Notion's share dialog: click selects one, Shift-click a range, Cmd/Ctrl-click
 * toggles one; Cmd/Ctrl+A in the empty field selects all; Arrow Left/Right move between tags (Shift
 * extends). Backspace or Delete removes the selected tags; Cmd/Ctrl+C copies them comma-separated and
 * Cmd/Ctrl+X cuts them. Typing or Escape deselects. The tags and the field are one tab stop.
 */
export const TagInput = React.forwardRef<HTMLInputElement, TagInputProps>(function TagInput(
  {
    value,
    onValueChange,
    validate,
    normalize = (text) => text.trim(),
    name,
    placeholder,
    disabled,
    copy: copyOverrides,
    id,
    "aria-describedby": describedBy,
    "aria-invalid": ariaInvalid,
    required,
  },
  forwardedRef,
) {
  const copy = { ...tagInputCopy, ...copyOverrides };
  const [draft, setDraft] = React.useState("");
  const [announcement, setAnnouncement] = React.useState({ id: 0, text: "" });
  const inputRef = React.useRef<HTMLInputElement>(null);
  const tagRefs = React.useRef<(HTMLLIElement | null)[]>([]);
  const [selected, setSelected] = React.useState<ReadonlySet<string>>(() => new Set());
  const anchor = React.useRef(0);
  React.useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement);

  const announce = (text: string) => setAnnouncement((prev) => ({ id: prev.id + 1, text }));
  const clearSelection = () => setSelected((prev) => (prev.size ? new Set() : prev));
  const selectOnly = (index: number) => {
    anchor.current = index;
    setSelected(new Set([value[index]]));
  };
  const selectRange = (from: number, to: number) =>
    setSelected(new Set(value.slice(Math.min(from, to), Math.max(from, to) + 1)));
  const focusTag = (index: number) => tagRefs.current[index]?.focus();
  const focusInput = () => inputRef.current?.focus();

  /** Adds each non-empty entry once; returns what's left of the draft. */
  function commit(entries: string[]) {
    const next = [...value];
    const added: string[] = [];
    let duplicate: string | undefined;
    for (const raw of entries) {
      const tag = normalize(raw);
      if (!tag) continue;
      if (next.includes(tag)) duplicate = tag;
      else {
        next.push(tag);
        added.push(tag);
      }
    }
    if (added.length) onValueChange(next);
    if (added.length) announce(copy.added(added));
    else if (duplicate) announce(copy.duplicate(duplicate));
  }

  /** Removes the given tags; focus goes to the tag before them (Backspace), after them (Delete), or the field. */
  function removeTags(tags: string[], focus: "previous" | "next" | "input") {
    if (tags.length === 0) return;
    const first = value.indexOf(tags[0]);
    const next = value.filter((tag) => !tags.includes(tag));
    onValueChange(next);
    announce(tags.length === 1 ? copy.removed(tags[0]) : copy.removedMany(tags.length));
    const target =
      focus === "input" || next.length === 0
        ? -1
        : focus === "previous"
          ? Math.max(0, first - 1)
          : Math.min(first, next.length - 1);
    if (target >= 0) {
      anchor.current = target;
      setSelected(new Set([next[target]]));
    } else {
      setSelected(new Set());
    }
    requestAnimationFrame(() => (target >= 0 ? tagRefs.current[target] : inputRef.current)?.focus());
  }

  /** The selected tags in their on-screen order. */
  const selectedTags = () => value.filter((tag) => selected.has(tag));

  function copySelected(cut: boolean) {
    const tags = selectedTags();
    if (tags.length === 0) return;
    void navigator.clipboard?.writeText(tags.join(", ")).catch(() => {});
    if (cut) removeTags(tags, "input");
    else announce(copy.copied(tags.length));
  }

  /** Keys that act on the selection, from a tag or from the empty field. Returns whether it handled the key. */
  function handleSelectionKey(event: React.KeyboardEvent): boolean {
    const mod = event.metaKey || event.ctrlKey;
    const key = event.key.toLowerCase();
    if (mod && key === "a") {
      event.preventDefault();
      anchor.current = 0;
      setSelected(new Set(value));
      return true;
    }
    if (selected.size === 0) return false;
    if (mod && (key === "c" || key === "x")) {
      event.preventDefault();
      copySelected(key === "x");
      return true;
    }
    if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      removeTags(selectedTags(), event.key === "Backspace" ? "previous" : "next");
      return true;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      clearSelection();
      focusInput();
      return true;
    }
    return false;
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    clearSelection();
    const text = event.target.value;
    if (!SEPARATORS.test(text)) {
      setDraft(text);
      return;
    }
    // A separator was typed (or inserted by a mobile keyboard): everything before the last one is done.
    const parts = text.split(SEPARATORS);
    const rest = parts.pop() ?? "";
    commit(parts);
    setDraft(rest);
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const text = event.clipboardData.getData("text");
    clearSelection();
    if (!SEPARATORS.test(text.trim())) return; // one entry: paste it as text
    event.preventDefault();
    commit((draft + text).split(SEPARATORS));
    setDraft("");
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const atStart = event.currentTarget.selectionStart === 0 && event.currentTarget.selectionEnd === 0;
    // With an empty field, selection keys act on the tags (Cmd/Ctrl+A selects them all).
    if (draft === "" && handleSelectionKey(event)) return;
    if (event.key === "Enter" && draft.trim()) {
      event.preventDefault(); // makes a tag instead of submitting; Enter in an empty field still submits
      commit([draft]);
      setDraft("");
    } else if (event.key === "Backspace" && draft === "" && value.length > 0) {
      event.preventDefault();
      removeTags([value[value.length - 1]], "input");
    } else if (event.key === "ArrowLeft" && atStart && value.length > 0) {
      event.preventDefault();
      const last = value.length - 1;
      if (event.shiftKey && selected.size) selectRange(anchor.current, last);
      else selectOnly(last);
      focusTag(last);
    }
  }

  function handleTagKeyDown(event: React.KeyboardEvent<HTMLLIElement>, index: number) {
    if (handleSelectionKey(event)) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const target = index + (event.key === "ArrowLeft" ? -1 : 1);
      if (target >= value.length) {
        // Past the last tag: back to the field, nothing selected.
        clearSelection();
        focusInput();
        return;
      }
      const clamped = Math.max(0, target);
      if (event.shiftKey) selectRange(anchor.current, clamped);
      else selectOnly(clamped);
      focusTag(clamped);
    } else if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      // Typing deselects and goes to the field; the character lands there.
      clearSelection();
      focusInput();
    }
  }

  function handleTagClick(event: React.MouseEvent<HTMLLIElement>, index: number) {
    if (disabled) return;
    const tag = value[index];
    if (event.shiftKey) {
      selectRange(anchor.current, index);
    } else if (event.metaKey || event.ctrlKey) {
      anchor.current = index;
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(tag)) next.delete(tag);
        else next.add(tag);
        return next;
      });
    } else {
      selectOnly(index);
    }
    focusTag(index);
  }

  const invalid = ariaInvalid === true;

  return (
    <>
      <Box
        $invalid={invalid}
        $disabled={disabled}
        onMouseDown={(event) => {
          // Clicking the box's empty space puts the caret in the field, like a native input.
          if (event.target === event.currentTarget) {
            event.preventDefault();
            clearSelection();
            inputRef.current?.focus();
          }
        }}
        onBlur={(event) => {
          // Leaving the control drops the selection.
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) clearSelection();
        }}
      >
        {value.length > 0 && (
          <Tags role="listbox" aria-multiselectable="true" aria-orientation="horizontal" aria-label={copy.tagsLabel}>
            {value.map((tag, index) => {
              const reason = validate?.(tag);
              const isSelected = selected.has(tag);
              const chip = (
                <Chip
                  key={tag}
                  ref={(node) => {
                    tagRefs.current[index] = node;
                  }}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={disabled || undefined}
                  // One tab stop for the whole control: tags are reached with Arrow Left from the field.
                  tabIndex={-1}
                  $invalid={!!reason}
                  onClick={(event) => handleTagClick(event, index)}
                  onKeyDown={(event) => handleTagKeyDown(event, index)}
                >
                  {reason && <Icon icon={CircleAlert} size={14} />}
                  <ChipText>{tag}</ChipText>
                  {reason && <VisuallyHidden>. {reason}</VisuallyHidden>}
                  {!disabled && (
                    <RemoveButton
                      aria-hidden="true"
                      title={copy.remove(tag)}
                      onClick={(event) => {
                        event.stopPropagation();
                        removeTags([tag], "input");
                      }}
                    >
                      <Icon icon={X} size={14} />
                    </RemoveButton>
                  )}
                </Chip>
              );
              return reason ? (
                <Tooltip key={tag} content={reason} pinOnClick={false}>
                  {chip}
                </Tooltip>
              ) : (
                chip
              );
            })}
          </Tags>
        )}
        <Draft
          ref={inputRef}
          id={id}
          type="text"
          value={draft}
          placeholder={value.length === 0 ? placeholder : undefined}
          disabled={disabled}
          required={required && value.length === 0}
          aria-describedby={describedBy}
          aria-invalid={ariaInvalid}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          onChange={handleChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (!draft.trim()) return;
            commit([draft]);
            setDraft("");
          }}
        />
      </Box>
      <VisuallyHidden aria-live="polite" aria-atomic="true">
        <span key={announcement.id}>{announcement.text}</span>
      </VisuallyHidden>
      {name && <input type="hidden" name={name} value={value.join("\n")} />}
    </>
  );
});
