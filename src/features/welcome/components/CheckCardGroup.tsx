"use client";

import type { CSSProperties } from "react";
import { keyframes, styled } from "next-yak";
import { Checkbox } from "@/components/ui/Checkbox";
import { Icon } from "@/components/ui/Icon";
import { OTHER, type IconChoice } from "../copy";
import { OtherChoice } from "./OtherChoice";

/*
 * Pick any number of options, shown as cards like the kit's RadioCard: the whole card is the click target,
 * and selected pairs a filled check box with the card's border and fill (never colour alone).
 * The check box sits at the card's end, as in the letter design. "Other" comes last, below a divider
 * (see OtherChoice). Composed from the kit's Checkbox; if another feature needs it, promote it to src/components/ui/.
 */

const fadeUp = keyframes`
  from {
    opacity: 0;
    translate: 0 var(--enter-offset);
  }
`;

const Group = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  gap: var(--space-3);
`;

const Card = styled.label`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  cursor: pointer;
  animation: ${fadeUp} var(--duration-enter) var(--ease) calc(var(--stagger) * var(--i, 0)) both;
  transition:
    border-color var(--duration) var(--ease),
    background-color var(--duration) var(--ease),
    translate var(--duration) var(--ease-spring);

  &:hover {
    translate: 0 -1px;
    background: var(--color-bg-hover);
  }

  &[data-checked] {
    border-color: var(--color-primary);
    background: var(--color-bg-hover);
  }

  /* Keyboard focus lands on the Checkbox inside; show it on the whole card too. */
  &:has(:focus-visible) {
    box-shadow: var(--focus-ring);
  }
`;

const Glyph = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  color: var(--color-text);
`;

const Text = styled.span`
  flex: 1;
  min-width: 0;
  font-size: var(--text-md);
  line-height: var(--leading-ui);
  color: var(--color-text);
`;

export function CheckCardGroup({
  name,
  labelledBy,
  describedBy,
  options,
  value,
  onChange,
  otherValue,
  onOtherChange,
  otherLabel,
}: {
  /** Form field name: one value is submitted per selected option. */
  name: string;
  /** The id of the question's heading, which names the group. */
  labelledBy: string;
  describedBy?: string;
  /** The listed options; "Other" is always added at the end. */
  options: IconChoice[];
  value: string[];
  onChange: (next: string[]) => void;
  otherValue: string;
  onOtherChange: (text: string) => void;
  /** Describes the "Other" text field, e.g. "What other issues matter to you?". */
  otherLabel: string;
}) {
  const toggle = (id: string, checked: boolean) => onChange(checked ? [...value, id] : value.filter((v) => v !== id));

  return (
    <Group role="group" aria-labelledby={labelledBy} aria-describedby={describedBy}>
      {options.map((option, i) => {
        const checked = value.includes(option.id);
        const id = `${name}-${option.id}`;
        return (
          <Card key={option.id} htmlFor={id} data-checked={checked ? "" : undefined} style={{ "--i": i } as CSSProperties}>
            <Glyph>
              <Icon icon={option.icon} size={20} />
            </Glyph>
            <Text>{option.label}</Text>
            <Checkbox id={id} name={name} value={option.id} checked={checked} onCheckedChange={(next) => toggle(option.id, next === true)} />
          </Card>
        );
      })}
      <OtherChoice
        kind="checkbox"
        name={name}
        checked={value.includes(OTHER)}
        onCheckedChange={(checked) => toggle(OTHER, checked)}
        text={otherValue}
        onTextChange={onOtherChange}
        textLabel={otherLabel}
      />
    </Group>
  );
}
