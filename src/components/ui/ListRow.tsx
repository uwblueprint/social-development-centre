"use client";

import { styled } from "next-yak";

/** Container for `ListRow`s: hairline dividers between rows, none around the group. */
export const List = styled.div`
  display: flex;
  flex-direction: column;

  & > * + * {
    border-top: 1px solid var(--color-border);
  }
`;

/**
 * A dense, full-width, clickable and keyboard-focusable row for lists and
 * simple tables. Hover fills with `--color-bg-hover`; combine with `List`
 * for hairline dividers between rows.
 */
export const ListRow = styled.button`
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: var(--space-4);
  width: 100%;
  padding: var(--space-3) var(--space-2);
  cursor: pointer;
  text-align: left;
  color: var(--color-text);
  transition: background-color var(--duration) var(--ease);

  &:hover {
    background: var(--color-bg-hover);
  }

  &:focus-visible {
    position: relative;
    z-index: 1;
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;
