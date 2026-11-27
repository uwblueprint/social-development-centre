"use client";

import * as React from "react";
import { styled } from "next-yak";
import { DropdownMenuShortcut } from "@/components/ui/DropdownMenu";
import { Input } from "@/components/ui/Input";
import { completeEmail } from "./data";

/*
 * An email field that finishes the address, the same as Gaurav's on his referral page (PR #89):
 * "alex@g" shows "mail.com" after the cursor, faintly, with a Tab key beside it. Tab (or →) accepts it;
 * typing anything else carries on as normal. Clicking the Tab key accepts it too (phones have no Tab key).
 */

/* The field and its offered ending, stacked: the ending sits exactly where the typed text ends. */
const Completion = styled.div`
  position: relative;
  min-width: 0;
`;

/* Same box as the input's text (a transparent 1px border and the same inline padding), so they line up. */
const Ghost = styled.span`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-3);
  border: 1px solid transparent;
  overflow: hidden;
  pointer-events: none;
  font-size: var(--text-sm);
  line-height: var(--leading-none);
  white-space: pre;
`;

const Typed = styled.span`
  color: transparent;
`;

const Ending = styled.span`
  color: var(--color-text-muted);
`;

/* The kit's shortcut chip as a key outline: a hint (hidden from screen readers), not a control. */
const KeyHint = styled(DropdownMenuShortcut)`
  margin-left: 0;
  padding: var(--space-1);
  font-family: inherit;
  letter-spacing: var(--tracking-tight);
  background: transparent;
  border-color: var(--color-border);
  pointer-events: auto;
  cursor: pointer;
`;

type Props = Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
  value: string;
  onValue: (value: string) => void;
};

export function EmailInput({ value, onValue, onFocus, onBlur, onKeyDown, ...props }: Props) {
  const [focused, setFocused] = React.useState(false);
  const invalid = props["aria-invalid"] === true || props["aria-invalid"] === "true";
  const ending = focused && !invalid ? completeEmail(value) : null;

  const accept = () => ending && onValue(value + ending);

  return (
    <Completion>
      <Input
        {...props}
        type="email"
        value={value}
        onChange={(e) => onValue(e.target.value)}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (!ending || e.shiftKey || (e.key !== "Tab" && e.key !== "ArrowRight")) return;
          // Email fields don't report the cursor position; the ending only shows while typing at the end.
          e.preventDefault();
          accept();
        }}
      />
      {ending && (
        <Ghost aria-hidden="true">
          <span>
            <Typed>{value}</Typed>
            <Ending>{ending}</Ending>
          </span>
          <KeyHint
            onMouseDown={(e) => {
              // Keep focus in the field (a blur would hide the ending before the click lands).
              e.preventDefault();
              accept();
            }}
          >
            Tab
          </KeyHint>
        </Ghost>
      )}
    </Completion>
  );
}
