"use client";

import * as React from "react";
import { css, styled } from "next-yak";
import { Popover as PopoverPrimitive, Select as SelectPrimitive } from "radix-ui";
import { Command } from "cmdk";
import { Check, ChevronDown, Search } from "lucide-react";
import { ErrorIcon } from "./Field";
import { Icon } from "./Icon";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  required?: boolean;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-describedby"?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

function isInvalid(value: unknown) {
  return value === true || value === "true";
}

/* Shared visual style for the trigger, whichever variant renders it, so the
   short (Radix Select) and searchable (Popover + cmdk) pickers look
   identical. Border color alone never carries the invalid/disabled states:
   invalid also gets an icon, disabled also gets a dashed border + muted
   text. */
const triggerStyles = css`
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  width: 100%;
  height: 40px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-strong);
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

  &:hover:not(:disabled):not([data-disabled]) {
    border-color: var(--color-text-muted);
  }

  &:focus-visible {
    outline: none;
    border-color: var(--color-focus);
    box-shadow: var(--focus-ring);
  }

  &[aria-invalid="true"] {
    border-color: var(--color-danger);
    box-shadow: inset 0 0 0 1px var(--color-danger);

    &:focus-visible {
      box-shadow:
        inset 0 0 0 1px var(--color-danger),
        0 0 0 2px var(--color-bg),
        0 0 0 4px var(--color-danger);
    }
  }

  &:disabled,
  &[data-disabled] {
    background: var(--color-surface);
    color: var(--color-text-muted);
    border-color: var(--color-border);
    border-style: dashed;
    cursor: not-allowed;
  }
`;

const Trigger = styled(SelectPrimitive.Trigger)`
  ${triggerStyles}
`;

const ComboTrigger = styled.button`
  ${triggerStyles}
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

const UnavailableBadge = styled.span`
  flex-shrink: 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 1px 6px;
`;

function ChevronIcon() {
  return <Icon icon={ChevronDown} size={14} />;
}

function CheckIcon() {
  return <Icon icon={Check} size={14} />;
}

function SearchIcon() {
  return <Icon icon={Search} size={14} />;
}

/* ---------------------------------------------------------------------- */
/* Short list (5 or fewer options): plain Radix Select.                    */
/* ---------------------------------------------------------------------- */

const Content = styled(SelectPrimitive.Content)`
  overflow: hidden;
  min-width: var(--radix-select-trigger-width);
  background: var(--color-surface-raised);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border);
  z-index: 50;
`;

const Viewport = styled(SelectPrimitive.Viewport)`
  padding: var(--space-1);
`;

const Item = styled(SelectPrimitive.Item)`
  all: unset;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  height: 34px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--color-text);
  cursor: pointer;

  &[data-highlighted] {
    background: var(--color-bg-hover);
    outline: none;
  }

  &[data-disabled] {
    color: var(--color-text-muted);
    background: var(--color-surface);
    cursor: not-allowed;
  }
`;

const ScrollButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  color: var(--color-text-muted);
  cursor: default;
`;

function NativeSelect({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  disabled,
  id,
  name,
  required,
  "aria-invalid": ariaInvalid,
  "aria-describedby": describedBy,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
}: SelectProps) {
  return (
    <SelectPrimitive.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
      name={name}
      required={required}
    >
      <Trigger
        id={id}
        aria-invalid={ariaInvalid}
        aria-describedby={describedBy}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
      >
        <TriggerLabel>
          <SelectPrimitive.Value placeholder={placeholder} />
        </TriggerLabel>
        <IconGroup>
          {isInvalid(ariaInvalid) && (
            <ErrorSlot aria-hidden="true">
              <ErrorIcon />
            </ErrorSlot>
          )}
          <ChevronSlot aria-hidden="true">
            <ChevronIcon />
          </ChevronSlot>
        </IconGroup>
      </Trigger>
      <SelectPrimitive.Portal>
        <Content position="popper" sideOffset={6}>
          <SelectPrimitive.ScrollUpButton asChild>
            <ScrollButton>
              <ChevronIcon />
            </ScrollButton>
          </SelectPrimitive.ScrollUpButton>
          <Viewport>
            {options.map((option) => (
              <Item key={option.value} value={option.value} disabled={option.disabled}>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                {option.disabled ? (
                  <UnavailableBadge>Unavailable</UnavailableBadge>
                ) : (
                  <SelectPrimitive.ItemIndicator>
                    <CheckIcon />
                  </SelectPrimitive.ItemIndicator>
                )}
              </Item>
            ))}
          </Viewport>
          <SelectPrimitive.ScrollDownButton asChild>
            <ScrollButton>
              <ChevronIcon />
            </ScrollButton>
          </SelectPrimitive.ScrollDownButton>
        </Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

/* ---------------------------------------------------------------------- */
/* Long list (more than 5 options): searchable combobox, built from a      */
/* Popover (for positioning/dismissal) with cmdk inside (for filtering,    */
/* keyboard navigation and listbox ARIA).                                  */
/* ---------------------------------------------------------------------- */

const ComboContent = styled(PopoverPrimitive.Content)`
  z-index: 50;
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
  justify-content: space-between;
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

  &[data-disabled="true"] {
    color: var(--color-text-muted);
    background: var(--color-surface);
    cursor: not-allowed;
  }
`;

const ComboItemLabel = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CheckSlot = styled.span`
  flex-shrink: 0;
  display: inline-flex;
  color: var(--color-text);
`;

function ComboboxSelect({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  disabled,
  id,
  name,
  required,
  "aria-invalid": ariaInvalid,
  "aria-describedby": describedBy,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
}: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const isControlled = value !== undefined;
  const [innerValue, setInnerValue] = React.useState(defaultValue);
  const currentValue = isControlled ? value : innerValue;

  const reactId = React.useId();
  const controlId = id ?? reactId;
  const listId = `${controlId}-listbox`;

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selected = options.find((option) => option.value === currentValue);
  const invalid = isInvalid(ariaInvalid);

  function commit(nextValue: string) {
    if (!isControlled) setInnerValue(nextValue);
    onValueChange?.(nextValue);
    setOpen(false);
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <ComboTrigger
          ref={triggerRef}
          type="button"
          id={controlId}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-invalid={ariaInvalid}
          aria-required={required}
          aria-describedby={describedBy}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          data-placeholder={selected ? undefined : ""}
        >
          <TriggerLabel>{selected ? selected.label : placeholder}</TriggerLabel>
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
        </ComboTrigger>
      </PopoverPrimitive.Trigger>
      {name && <input type="hidden" name={name} value={currentValue ?? ""} />}
      <PopoverPrimitive.Portal>
        <ComboContent
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
          <Command loop label={ariaLabel ?? (typeof placeholder === "string" ? placeholder : "Options")}>
            <SearchRow>
              <SearchIcon />
              <SearchInput ref={inputRef} placeholder="Search…" />
            </SearchRow>
            <List id={listId}>
              <EmptyState>No results</EmptyState>
              {options.map((option) => (
                <ComboItem
                  key={option.value}
                  value={option.label}
                  disabled={option.disabled}
                  onSelect={() => commit(option.value)}
                >
                  <ComboItemLabel>{option.label}</ComboItemLabel>
                  {option.disabled ? (
                    <UnavailableBadge>Unavailable</UnavailableBadge>
                  ) : option.value === currentValue ? (
                    <CheckSlot aria-hidden="true">
                      <CheckIcon />
                    </CheckSlot>
                  ) : null}
                </ComboItem>
              ))}
            </List>
          </Command>
        </ComboContent>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

/* ---------------------------------------------------------------------- */

/**
 * Pick one option from a list. Five or fewer options render as a plain
 * dropdown (Radix Select); more than five render as a searchable combobox
 * (Popover + cmdk) with an identical-looking trigger.
 */
export function Select(props: SelectProps) {
  return props.options.length > 5 ? <ComboboxSelect {...props} /> : <NativeSelect {...props} />;
}
