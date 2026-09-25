"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Search } from "lucide-react";
import { Icon } from "./Icon";

const Wrapper = styled.span`
  position: relative;
  display: block;
  width: 100%;
`;

const IconSlot = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  height: 40px;
  width: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  pointer-events: none;
`;

const StyledInput = styled.input`
  display: block;
  width: 100%;
  height: 40px;
  padding: 0 var(--space-3) 0 36px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-strong);
  background: var(--color-bg);
  color: var(--color-text);
  font-family: inherit;
  font-size: var(--text-sm);
  line-height: 1;
  transition:
    border-color var(--duration) var(--ease),
    box-shadow var(--duration) var(--ease);

  &::placeholder {
    color: var(--color-text-muted);
  }

  &:hover:not(:disabled):not(:focus) {
    border-color: var(--color-text-muted);
  }

  &:focus-visible,
  &:focus {
    outline: none;
    border-color: var(--color-focus);
    box-shadow: var(--focus-ring);
  }

  &:disabled {
    background: var(--color-surface);
    color: var(--color-text-muted);
    border-color: var(--color-border);
    border-style: dashed;
    cursor: not-allowed;
  }
`;

export type SearchFieldProps = React.ComponentPropsWithoutRef<"input">;

/** A single-line text entry for searching/filtering a list, with a leading search icon. Wrap in `Field` for its label. */
export const SearchField = React.forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { className, style, ...props },
  ref,
) {
  return (
    <Wrapper className={className} style={style}>
      <IconSlot aria-hidden="true">
        <Icon icon={Search} size={16} />
      </IconSlot>
      <StyledInput ref={ref} type="search" {...props} />
    </Wrapper>
  );
});
