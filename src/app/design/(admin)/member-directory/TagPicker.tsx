"use client";

import * as React from "react";
import { styled } from "next-yak";
import { CreatableCombobox } from "@/components/ui/CreatableCombobox";
import type { TagColor } from "./data";
import { RemovableBadge } from "./MemberSheet";

/*
 * One field holding the picked tags and the cursor, like TagInput's box. The kit's inline combobox draws its own
 * field and search icon, so both are switched off here: this box is the field.
 * TagCombobox does all of this itself. Swap it in once it merges, then delete this file.
 */
const Box = styled.div<{ $hasTags: boolean; $invalid?: boolean }>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1);
  min-height: var(--control-height);
  padding: var(--space-1) var(--space-3) var(--space-1) ${({ $hasTags }) => ($hasTags ? "var(--space-1)" : "var(--space-3)")};
  border: 1px solid ${({ $invalid }) => ($invalid ? "var(--color-danger)" : "var(--color-border-field)")};
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
    box-shadow: ${({ $invalid }) => ($invalid ? "var(--focus-ring-field-invalid)" : "var(--focus-ring-field)")};
  }

  & > [cmdk-root] {
    flex: 1;
    width: auto;
    min-width: var(--space-8);
  }
  & > [cmdk-root] > div {
    height: auto;
    padding: 0;
    border: 0;
    background: none;
    box-shadow: none;
  }
  & > [cmdk-root] > div > svg {
    display: none;
  }
`;

export function TagPicker({
  labelledBy,
  label,
  value,
  options,
  colors,
  onValueChange,
  placeholder = "Select a tag",
  createLabel = (q) => `Filter by “${q}”`,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
}: {
  /** The visible label's id, which names the group of picked tags. Leave out inside a `Field`. */
  labelledBy?: string;
  /** The typing field's accessible name (the inline combobox can't take a `Field` label yet). */
  label: string;
  placeholder?: string;
  createLabel?: (query: string) => string;
  /** From `Field`: links the error message and marks the field invalid. */
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  value: string[];
  options: string[];
  colors: Record<string, TagColor>;
  onValueChange: (tags: string[]) => void;
}) {
  const box = React.useRef<HTMLDivElement>(null);
  const input = () => box.current?.querySelector("input:not([type='hidden'])") as HTMLInputElement | null;

  /** Matches an existing tag in any case, so "volunteer" filters by Volunteer. */
  function add(name: string) {
    const tag = options.find((t) => t.toLowerCase() === name.toLowerCase()) ?? name;
    if (!value.some((t) => t.toLowerCase() === tag.toLowerCase())) onValueChange([...value, tag]);
    /* The kit combobox closes its list after each pick. Reopen it, so picking another tag is one click;
       it closes when focus leaves (click outside, Tab or Escape). */
    reopen();
  }

  function reopen() {
    requestAnimationFrame(() => {
      input()?.focus();
      input()?.click();
    });
  }

  return (
    <Box
      ref={box}
      $hasTags={value.length > 0}
      $invalid={invalid}
      role={labelledBy ? "group" : undefined}
      aria-labelledby={labelledBy}
      onMouseDown={(e) => {
        if (e.target !== e.currentTarget) return;
        e.preventDefault();
        input()?.focus();
        input()?.click();
      }}
      onKeyDownCapture={(e) => {
        if (e.key === "Backspace" && e.target === input() && !input()?.value && value.length) onValueChange(value.slice(0, -1));
      }}
    >
      {value.map((t) => (
        <RemovableBadge
          key={t}
          name={t}
          color={colors[t]}
          onRemove={() => {
            onValueChange(value.filter((x) => x !== t));
            reopen();
          }}
        />
      ))}
      <CreatableCombobox
        inline
        aria-label={label}
        options={options.filter((t) => !value.includes(t)).map((t) => ({ value: t, label: t }))}
        existingFieldName="tag"
        createFieldName="newTag"
        placeholder={value.length ? "" : placeholder}
        createLabel={createLabel}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        listAnchor={box}
        onValueChange={(picked) => picked && add(picked.kind === "existing" ? picked.value : picked.label.trim())}
      />
    </Box>
  );
}
