"use client";

import { styled } from "next-yak";
import { ToggleGroup } from "@/components/ui/ToggleGroup";

/*
 * The member directory's single-choice toggle: a pill, 8px either side of each label, 14px regular like the
 * section titles. Compact: 24px items in a 2px track (28px overall). The track is the border colour 10% toward
 * the page.
 */
export const PillToggle = styled(ToggleGroup)`
  && {
    padding: calc(var(--space-1) / 2);
    border-radius: var(--radius-full);
    background: color-mix(in oklab, var(--color-border) 90%, var(--color-bg));
  }

  & > [aria-hidden="true"] {
    top: calc(var(--space-1) / 2);
    bottom: calc(var(--space-1) / 2);
  }
  & > [aria-hidden="true"],
  & > button {
    border-radius: var(--radius-full);
  }
  & > button {
    height: var(--space-5);
    padding: 0 var(--space-2);
    font-size: var(--text-sm);
    font-weight: var(--weight-regular);
    white-space: nowrap;
  }

  /* Phones: 4px either side, so "Their own membership | Someone else's" fits a 360px screen on one line. */
  @media (max-width: 399px) {
    & > button {
      padding: 0 var(--space-1);
    }
  }
`;

/*
 * Pick-one options as separate buttons, styled like the small secondary Button. Selected adds a 1px outline.
 * Inset shadow, not a border, so selecting doesn't change the height, and it steps aside for the focus ring.
 */
export const OptionToggle = styled(ToggleGroup)`
  && {
    flex-wrap: wrap;
    gap: var(--space-2);
    padding: 0;
    border-radius: 0;
    background: transparent;
  }

  & > [aria-hidden="true"] {
    display: none;
  }
  & > button {
    height: var(--space-6);
    padding: 0 var(--space-3);
    border-radius: var(--radius-md);
    background: var(--color-secondary);
    color: var(--color-text);
    font-size: var(--text-xs);
    line-height: var(--leading-none);
    white-space: nowrap;
  }
  & > button:hover:not([data-disabled]) {
    background: var(--color-secondary-hover);
  }
  & > button[data-state="on"]:not(:focus-visible) {
    box-shadow: inset 0 0 0 1px var(--color-text);
  }
`;
