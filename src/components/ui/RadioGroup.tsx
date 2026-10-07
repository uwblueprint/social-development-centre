"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Check } from "lucide-react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { Icon } from "./Icon";
import { DisabledArea, DisabledIcon, type DisabledReasonText } from "./DisabledReason";

export const RadioGroup = styled(RadioGroupPrimitive.Root)`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Item = styled(RadioGroupPrimitive.Item)`
  all: unset;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border-strong);
  background: var(--color-bg);
  cursor: pointer;
  transition: border-color var(--duration) var(--ease);

  &[data-state="checked"] {
    border-color: var(--color-primary);
  }

  &:focus-visible {
    box-shadow: var(--focus-ring);
  }

  &[aria-invalid="true"] {
    border-color: var(--color-danger);
  }

  &[data-disabled] {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const Indicator = styled(RadioGroupPrimitive.Indicator)`
  display: block;
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
`;

export function RadioGroupItem(props: RadioGroupPrimitive.RadioGroupItemProps) {
  return (
    <Item {...props}>
      <Indicator />
    </Item>
  );
}

/* ---------------------------------------------------------------------- */
/* RadioGroupOption: a full-width row so clicking anywhere in it selects   */
/* the option, with a hover background and a ring that darkens to match.   */
/* ---------------------------------------------------------------------- */

const Row = styled.label`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--duration) var(--ease);

  &:hover:not([data-disabled]) {
    background: var(--color-bg-hover);
  }

  &:hover:not([data-disabled]) ${Item}:not([data-disabled]) {
    border-color: var(--color-text-muted);
  }

  &[data-disabled] {
    cursor: not-allowed;
  }
`;

const RowText = styled.span`
  font-size: var(--text-sm);
  color: var(--color-text);
  line-height: var(--leading-ui);

  [data-disabled] > & {
    opacity: 0.45;
  }
`;

type RadioOptionDisabledProps =
  | { disabled?: false; disabledReason?: never }
  | { disabled: true; disabledReason: DisabledReasonText };

export type RadioGroupOptionProps = Omit<
  RadioGroupPrimitive.RadioGroupItemProps,
  "disabled" | "children"
> &
  RadioOptionDisabledProps & {
    /** Visible label for this option; the whole row is clickable. */
    label: React.ReactNode;
  };

export function RadioGroupOption({
  label,
  disabled,
  disabledReason,
  id,
  ...props
}: RadioGroupOptionProps) {
  const reactId = React.useId();
  const itemId = id ?? reactId;

  const row = (
    <Row htmlFor={itemId} data-disabled={disabled ? "" : undefined}>
      <Item id={itemId} disabled={disabled} {...props}>
        <Indicator />
      </Item>
      <RowText>{label}</RowText>
      {disabled && <DisabledIcon reason={disabledReason} />}
    </Row>
  );

  return disabled ? <DisabledArea reason={disabledReason}>{row}</DisabledArea> : row;
}

/**
 * Choose one of a few options shown as cards (e.g. an opportunity's type): each card holds an icon,
 * a name and a one-line description. Selected is a thicker primary border plus a check in the corner,
 * never color alone. The card's text is the radio's accessible name.
 */
export const RadioCardGroup = styled(RadioGroupPrimitive.Root)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
  gap: var(--space-2);
`;

/*
 * Each card can set --card-accent / --card-accent-subtle (e.g. a type's category colours; default:
 * primary) --card-accent-strong (a lighter "200" shade) and --card-accent-line (the hover line's shade). On hover the border draws itself around the
 * card in the accent, over the grey border; selected fills the card with
 * the subtle colour, borders it in the accent and shows a check (never colour alone).
 */
const Card = styled(RadioGroupPrimitive.Item)`
  all: unset;
  box-sizing: border-box;
  position: relative;
  /* No overflow clipping: the hover line sits on the 1px border, outside the padding box. */
  isolation: isolate;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  /* Even on every side, so an icon tile sits the same distance from the top, bottom and left edges. */
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  cursor: pointer;
  transition:
    border-color var(--duration) var(--ease),
    background-color var(--duration) var(--ease),
    translate var(--duration) var(--ease-spring);

  &:hover {
    translate: 0 -1px;
  }
  &:hover [data-draw] rect {
    stroke-dashoffset: 0;
  }
  /* Selected: the card's own 1px border in the accent (owner: never a 2px border). */
  &[data-state="checked"] {
    border-color: var(--card-accent, var(--color-primary));
    background: var(--card-accent-subtle, var(--color-bg-hover));
  }
  &:focus-visible {
    box-shadow: var(--focus-ring);
  }
  &[aria-invalid="true"] {
    border-color: var(--color-danger);
  }
`;

/* The hover border: an outline stroke that traces itself around the card (pathLength 1, dash offset 1 → 0). */
const DrawBorder = styled.svg`
  /* Over the card's border box, so the 1px line lands exactly on the 1px border instead of inside it. */
  position: absolute;
  inset: -1px;
  width: calc(100% + 2px);
  height: calc(100% + 2px);
  overflow: visible;
  pointer-events: none;

  rect {
    /* Sized in CSS: the outline sits on the card's 1px border, with the card's corner radius. */
    width: calc(100% - 1px);
    height: calc(100% - 1px);
    rx: var(--radius-lg);
    fill: none;
    /* --card-accent-line: a mid shade of the card's colour, 200 lighter than the accent (owner). */
    stroke: var(--card-accent-line, var(--card-accent, var(--color-border-strong)));
    stroke-width: 1;
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    transition: stroke-dashoffset var(--duration-enter) var(--ease);
  }
`;

const CardCheck = styled.span`
  position: absolute;
  top: 50%;
  right: var(--space-3);
  margin-top: -10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  background: var(--card-accent, var(--color-primary));
  color: var(--color-bg);
  opacity: 0;
  scale: 0.6;
  transition:
    opacity var(--duration) var(--ease),
    scale var(--duration) var(--ease-spring);

  [data-state="checked"] > & {
    opacity: 1;
    scale: 1;
  }
`;

export function RadioCard({ children, ...props }: RadioGroupPrimitive.RadioGroupItemProps) {
  return (
    <Card {...props}>
      <DrawBorder data-draw="" aria-hidden="true">
        <rect x="0.5" y="0.5" width="100%" height="100%" rx="8" pathLength="1" />
      </DrawBorder>
      <CardCheck aria-hidden="true">
        <Icon icon={Check} size={12} />
      </CardCheck>
      {children}
    </Card>
  );
}
