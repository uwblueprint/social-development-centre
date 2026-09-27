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

/* `display: contents` lets tags and the draft input wrap as one line; the explicit role keeps it a list. */
const Tags = styled.ul`
  display: contents;
  list-style: none;
`;

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
`;

const ChipText = styled.span`
  min-width: 0;
  overflow-wrap: anywhere;
`;

const RemoveButton = styled.button`
  all: unset;
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
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
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
 * (icon + tooltip with the reason). Backspace in the empty field removes the last tag; Arrow Left
 * moves into the tags, where Backspace or Delete removes one. The tags and the field are one tab stop.
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
  const removeRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  React.useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement);

  const announce = (text: string) => setAnnouncement((prev) => ({ id: prev.id + 1, text }));

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

  function removeAt(index: number, focus: "previous" | "next" | "input") {
    const tag = value[index];
    const next = value.filter((_, i) => i !== index);
    onValueChange(next);
    announce(copy.removed(tag));
    requestAnimationFrame(() => {
      const target =
        focus === "input" || next.length === 0
          ? null
          : removeRefs.current[focus === "previous" ? Math.max(0, index - 1) : Math.min(index, next.length - 1)];
      (target ?? inputRef.current)?.focus();
    });
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
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
    if (!SEPARATORS.test(text.trim())) return; // one entry: paste it as text
    event.preventDefault();
    commit((draft + text).split(SEPARATORS));
    setDraft("");
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const atStart = event.currentTarget.selectionStart === 0 && event.currentTarget.selectionEnd === 0;
    if (event.key === "Enter" && draft.trim()) {
      event.preventDefault(); // makes a tag instead of submitting; Enter in an empty field still submits
      commit([draft]);
      setDraft("");
    } else if (event.key === "Backspace" && draft === "" && value.length > 0) {
      event.preventDefault();
      removeAt(value.length - 1, "input");
    } else if (event.key === "ArrowLeft" && atStart && value.length > 0) {
      event.preventDefault();
      removeRefs.current[value.length - 1]?.focus();
    }
  }

  function handleTagKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      removeRefs.current[Math.max(0, index - 1)]?.focus();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      (index === value.length - 1 ? inputRef.current : removeRefs.current[index + 1])?.focus();
    } else if (event.key === "Backspace") {
      event.preventDefault();
      removeAt(index, "previous");
    } else if (event.key === "Delete") {
      event.preventDefault();
      removeAt(index, "next");
    }
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
            inputRef.current?.focus();
          }
        }}
      >
        {value.length > 0 && (
          <Tags role="list" aria-label={copy.tagsLabel}>
            {value.map((tag, index) => {
              const reason = validate?.(tag);
              const chip = (
                <Chip key={tag} $invalid={!!reason}>
                  {reason && <Icon icon={CircleAlert} size={14} />}
                  <ChipText>{tag}</ChipText>
                  <RemoveButton
                    type="button"
                    ref={(node) => {
                      removeRefs.current[index] = node;
                    }}
                    // One tab stop for the whole control: tags are reached with Arrow Left from the field.
                    tabIndex={-1}
                    disabled={disabled}
                    aria-label={reason ? copy.removeInvalid(tag, reason) : copy.remove(tag)}
                    onClick={() => removeAt(index, "input")}
                    onKeyDown={(event) => handleTagKeyDown(event, index)}
                  >
                    <Icon icon={X} size={14} />
                  </RemoveButton>
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
