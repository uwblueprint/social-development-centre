"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Popover as PopoverPrimitive } from "radix-ui";
import { Command } from "cmdk";
import { ChevronDown, Plus, Search } from "lucide-react";
import { ErrorIcon } from "./Field";
import { Icon } from "./Icon";

export interface CreatableComboboxOption {
  value: string;
  label: string;
}

export type CreatableComboboxValue =
  | { kind: "existing"; value: string; label: string }
  | { kind: "create"; label: string };

export interface CreatableComboboxProps {
  options: CreatableComboboxOption[];
  /** Hidden field submitted with the chosen option's id. */
  existingFieldName: string;
  /** Hidden field submitted with the typed name when creating a new one. */
  createFieldName: string;
  defaultValue?: CreatableComboboxValue;
  onValueChange?: (value: CreatableComboboxValue | undefined) => void;
  /** Trigger text before anything is chosen. Name the action, e.g. "Search or create an organization…". */
  placeholder?: string;
  /** Placeholder for the search box inside the list. */
  searchPlaceholder?: string;
  /** Label of the create row (and of the trigger once a new one is chosen). Default: `Create "{query}"`. */
  createLabel?: (query: string) => string;
  disabled?: boolean;
  id?: string;
  required?: boolean;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-describedby"?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  /**
   * The field is the search box: type to filter, and the options (plus "Create") drop down underneath. No
   * button to open first. The field clears after each pick, so the person can add another (e.g. tags).
   * Name it with `aria-label`; it can't take a `Field` label yet (cmdk owns the input's id and labelling).
   */
  inline?: boolean;
  /** Inline only: focus the field on mount, e.g. when an Edit button reveals it. */
  autoFocus?: boolean;
  /**
   * Inline only: the element the list opens under, instead of the field. For a field inside a larger box
   * (e.g. picked tags then the cursor), so the list stays under the whole box as the cursor moves.
   */
  listAnchor?: React.RefObject<HTMLElement | null>;
}

function isInvalid(value: unknown) {
  return value === true || value === "true";
}

/* Visual language matches Select's searchable combobox variant exactly, so
   the two controls are indistinguishable at rest. */
const Trigger = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  width: 100%;
  height: var(--control-height);
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-field);
  background: var(--color-bg);
  color: var(--color-text);
  font-family: inherit;
  font-size: var(--text-sm);
  text-align: left;
  appearance: none;
  cursor: pointer;
  transition:
    border-color var(--duration) var(--ease),
    box-shadow var(--duration) var(--ease);

  &[data-placeholder] {
    color: var(--color-text-muted);
  }

  &:hover:not(:disabled) {
    border-color: var(--color-text-muted);
  }

  &:focus-visible {
    outline: none;
    border-color: var(--color-focus);
    box-shadow: var(--focus-ring-field);
  }

  &[aria-invalid="true"] {
    border-color: var(--color-danger);
    box-shadow: inset 0 0 0 1px var(--color-danger);

    &:focus-visible {
      box-shadow: var(--focus-ring-field-invalid);
    }
  }

  &:disabled {
    background: var(--color-surface);
    color: var(--color-text-muted);
    cursor: not-allowed;
    border-color: transparent;
    background-image: var(--dashed-border);
    background-size: var(--dashed-border-size);
    background-position: var(--dashed-border-position);
    background-repeat: var(--dashed-border-repeat);
    background-origin: border-box;
  }
`;

const TriggerLabel = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const IconGroup = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`;

const ErrorSlot = styled.span`
  display: inline-flex;
  color: var(--color-danger);
`;

const ChevronSlot = styled.span`
  display: inline-flex;
  color: var(--color-text-muted);
`;

const Content = styled(PopoverPrimitive.Content)`
  z-index: var(--z-popover);
  min-width: var(--radix-popover-trigger-width);
  display: flex;
  flex-direction: column;
  background: var(--color-surface-raised);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
  padding: var(--space-1);
  overflow: hidden;

  &:focus {
    outline: none;
  }
`;

const SearchRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  margin-bottom: var(--space-1);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-muted);
  flex-shrink: 0;
`;

const SearchInput = styled(Command.Input)`
  all: unset;
  flex: 1;
  min-width: 0;
  font-family: inherit;
  font-size: var(--text-sm);
  color: var(--color-text);

  &::placeholder {
    color: var(--color-text-muted);
  }
`;

const List = styled(Command.List)`
  overflow-y: auto;
  max-height: 260px;
`;

const EmptyState = styled(Command.Empty)`
  padding: var(--space-3) var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  text-align: center;
`;

const ComboItem = styled(Command.Item)`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  height: 34px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--color-text);
  cursor: pointer;
  scroll-margin: var(--space-1);

  &[data-selected="true"] {
    background: var(--color-bg-hover);
  }
`;

const CreateItem = styled(ComboItem)`
  color: var(--color-accent);
  border-top: 1px solid var(--color-border);
  margin-top: 2px;
  padding-top: 2px;
`;

const ComboItemLabel = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

function ChevronIcon() {
  return <Icon icon={ChevronDown} size={14} />;
}

const defaultCreateLabel = (query: string) => `Create “${query}”`;

function toDisplayValue(value: CreatableComboboxValue | undefined): CreatableComboboxOption | undefined {
  if (!value) return undefined;
  return value.kind === "existing" ? { value: value.value, label: value.label } : { value: "", label: value.label };
}

/**
 * Combobox that lets the person pick an existing option or create a new one
 * on the fly. Submits one of two hidden fields: `existingFieldName` (the
 * chosen option's id) or `createFieldName` (the typed name), never both.
 */
export function CreatableCombobox(props: CreatableComboboxProps) {
  return props.inline ? <InlineCreatableCombobox {...props} /> : <PopupCreatableCombobox {...props} />;
}

function PopupCreatableCombobox({
  options,
  existingFieldName,
  createFieldName,
  defaultValue,
  onValueChange,
  placeholder = "Search or create…",
  searchPlaceholder = "Search organizations…",
  createLabel = defaultCreateLabel,
  disabled,
  id,
  required,
  "aria-invalid": ariaInvalid,
  "aria-describedby": describedBy,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
}: CreatableComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<CreatableComboboxValue | undefined>(defaultValue);

  const reactId = React.useId();
  const controlId = id ?? reactId;

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const invalid = isInvalid(ariaInvalid);
  const trimmed = search.trim();
  const filtered = trimmed
    ? options.filter((o) => o.label.toLowerCase().includes(trimmed.toLowerCase()))
    : options;
  const hasExactMatch = options.some((o) => o.label.trim().toLowerCase() === trimmed.toLowerCase());
  const showCreate = trimmed.length > 0 && !hasExactMatch;

  function commit(next: CreatableComboboxValue) {
    setSelected(next);
    onValueChange?.(next);
    setOpen(false);
  }

  const display = toDisplayValue(selected);

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setSearch("");
      }}
    >
      <PopoverPrimitive.Trigger asChild>
        <Trigger
          ref={triggerRef}
          type="button"
          id={controlId}
          disabled={disabled}
          // Select-only combobox (WAI-ARIA APG): the role makes aria-required valid on the trigger
          // (a plain button doesn't allow it — axe: aria-allowed-attr). Matches Select.tsx's ComboboxSelect.
          role="combobox"
          aria-haspopup="listbox"
          aria-invalid={ariaInvalid}
          aria-required={required}
          aria-describedby={describedBy}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          data-placeholder={display ? undefined : ""}
        >
          <TriggerLabel>
            {display ? (selected?.kind === "create" ? createLabel(display.label) : display.label) : placeholder}
          </TriggerLabel>
          <IconGroup>
            {invalid && (
              <ErrorSlot aria-hidden="true">
                <ErrorIcon />
              </ErrorSlot>
            )}
            <ChevronSlot aria-hidden="true">
              <ChevronIcon />
            </ChevronSlot>
          </IconGroup>
        </Trigger>
      </PopoverPrimitive.Trigger>
      <input type="hidden" name={existingFieldName} value={selected?.kind === "existing" ? selected.value : ""} />
      <input type="hidden" name={createFieldName} value={selected?.kind === "create" ? selected.label : ""} />
      <PopoverPrimitive.Portal>
        <Content
          align="start"
          sideOffset={6}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            inputRef.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            triggerRef.current?.focus();
          }}
        >
          <Command shouldFilter={false} loop label={ariaLabel ?? "Organizations"}>
            <SearchRow>
              <Icon icon={Search} size={14} />
              <SearchInput
                ref={inputRef}
                value={search}
                onValueChange={setSearch}
                placeholder={searchPlaceholder}
              />
            </SearchRow>
            <List>
              {filtered.length === 0 && !showCreate && <EmptyState>No organizations found</EmptyState>}
              {filtered.map((option) => (
                <ComboItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => commit({ kind: "existing", value: option.value, label: option.label })}
                >
                  <ComboItemLabel>{option.label}</ComboItemLabel>
                </ComboItem>
              ))}
              {showCreate && (
                <CreateItem
                  value={`__create__${trimmed}`}
                  onSelect={() => commit({ kind: "create", label: trimmed })}
                >
                  <Icon icon={Plus} size={14} />
                  <ComboItemLabel>{createLabel(trimmed)}</ComboItemLabel>
                </CreateItem>
              )}
            </List>
          </Command>
        </Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

/* Inline mode: the field itself is the search box, styled like the closed trigger. */
const InlineRoot = styled(Command)`
  width: 100%;
`;

const InlineField = styled.div<{ $invalid?: boolean }>`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  height: var(--control-height);
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid ${({ $invalid }) => ($invalid ? "var(--color-danger)" : "var(--color-border-field)")};
  box-shadow: ${({ $invalid }) => ($invalid ? "inset 0 0 0 1px var(--color-danger)" : "none")};
  background: var(--color-bg);
  color: var(--color-text-muted);
  cursor: text;
  transition:
    border-color var(--duration) var(--ease),
    box-shadow var(--duration) var(--ease);

  &:hover:not(:focus-within):not([data-disabled]) {
    border-color: ${({ $invalid }) => ($invalid ? "var(--color-danger)" : "var(--color-text-muted)")};
  }

  &:focus-within {
    border-color: ${({ $invalid }) => ($invalid ? "var(--color-danger)" : "var(--color-focus)")};
    box-shadow: ${({ $invalid }) => ($invalid ? "var(--focus-ring-field-invalid)" : "var(--focus-ring-field)")};
  }

  &[data-disabled] {
    background: var(--color-surface);
    cursor: not-allowed;
  }
`;

const InlineContent = styled(Content)`
  &[data-state="closed"] {
    display: none;
  }
`;

function InlineCreatableCombobox({
  options,
  existingFieldName,
  createFieldName,
  onValueChange,
  placeholder = "Search or create…",
  createLabel = defaultCreateLabel,
  disabled,
  required,
  autoFocus,
  listAnchor,
  "aria-invalid": ariaInvalid,
  "aria-describedby": describedBy,
  "aria-label": ariaLabel,
}: CreatableComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [last, setLast] = React.useState<CreatableComboboxValue | undefined>();
  const anchorRef = React.useRef<HTMLDivElement>(null);

  const invalid = isInvalid(ariaInvalid);
  const trimmed = search.trim();
  const filtered = trimmed ? options.filter((o) => o.label.toLowerCase().includes(trimmed.toLowerCase())) : options;
  const hasExactMatch = options.some((o) => o.label.trim().toLowerCase() === trimmed.toLowerCase());
  const showCreate = trimmed.length > 0 && !hasExactMatch;
  const hasRows = filtered.length > 0 || showCreate;

  function commit(next: CreatableComboboxValue) {
    setLast(next);
    onValueChange?.(next);
    setSearch("");
    setOpen(false);
  }

  const field = (
    <InlineField ref={anchorRef} $invalid={invalid} data-disabled={disabled ? "" : undefined}>
      <Icon icon={Search} size={14} />
      <SearchInput
        value={search}
        onValueChange={(next) => {
          setSearch(next);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        aria-required={required}
        aria-describedby={describedBy}
      />
      {invalid && (
        <ErrorSlot aria-hidden="true">
          <ErrorIcon />
        </ErrorSlot>
      )}
    </InlineField>
  );

  return (
    <InlineRoot shouldFilter={false} loop label={ariaLabel ?? "Search or create"}>
      <PopoverPrimitive.Root open={open && hasRows} onOpenChange={setOpen}>
        {listAnchor ? (
          <>
            {/* A virtual anchor renders nothing, so the field sits beside it instead of inside. */}
            <PopoverPrimitive.Anchor virtualRef={listAnchor} />
            {field}
          </>
        ) : (
          <PopoverPrimitive.Anchor asChild>{field}</PopoverPrimitive.Anchor>
        )}
        {/* Always mounted (hidden while closed): the input's aria-controls must point at a list that exists. */}
        <PopoverPrimitive.Portal forceMount>
          <InlineContent
            forceMount
            align="start"
            sideOffset={6}
            onOpenAutoFocus={(event) => event.preventDefault()}
            onCloseAutoFocus={(event) => event.preventDefault()}
            onInteractOutside={(event) => {
              const inside = listAnchor?.current ?? anchorRef.current;
              if (inside?.contains(event.target as Node)) event.preventDefault();
            }}
          >
            <List>
              {filtered.map((option) => (
                <ComboItem key={option.value} value={option.label} onSelect={() => commit({ kind: "existing", value: option.value, label: option.label })}>
                  <ComboItemLabel>{option.label}</ComboItemLabel>
                </ComboItem>
              ))}
              {showCreate && (
                <CreateItem value={`__create__${trimmed}`} onSelect={() => commit({ kind: "create", label: trimmed })}>
                  <Icon icon={Plus} size={14} />
                  <ComboItemLabel>{createLabel(trimmed)}</ComboItemLabel>
                </CreateItem>
              )}
            </List>
          </InlineContent>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
      <input type="hidden" name={existingFieldName} value={last?.kind === "existing" ? last.value : ""} />
      <input type="hidden" name={createFieldName} value={last?.kind === "create" ? last.label : ""} />
    </InlineRoot>
  );
}
