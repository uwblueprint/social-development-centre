"use client";

import type { CSSProperties } from "react";
import { keyframes, styled } from "next-yak";
import { Checkbox } from "@/components/ui/Checkbox";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { OTHER, type IconChoice } from "../copy";

/*
 * Pick any number of options, shown as cards like the kit's RadioCard: the whole card is the click target,
 * and selected pairs a filled check box with the card's border and fill (never colour alone).
 * Composed from the kit's Checkbox; if another feature needs it, promote it to src/components/ui/.
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
  gap: var(--space-2);
`;

const Card = styled.label`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
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
    border-color: var(--color-border-strong);
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
  color: var(--color-text-muted);
`;

const Text = styled.span`
  min-width: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text);
`;

/* Wide enough that the text field under "Other" lines up with the card, not a single column. */
const OtherField = styled.div`
  grid-column: 1 / -1;
  animation: ${fadeUp} var(--duration-enter) var(--ease) both;
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
  otherPlaceholder,
}: {
  /** Form field name: one value is submitted per selected option. */
  name: string;
  /** The id of the question's heading, which names the group. */
  labelledBy: string;
  describedBy?: string;
  options: IconChoice[];
  value: string[];
  onChange: (next: string[]) => void;
  otherValue: string;
  onOtherChange: (text: string) => void;
  otherLabel: string;
  otherPlaceholder: string;
}) {
  function toggle(option: IconChoice, checked: boolean) {
    if (!checked) return onChange(value.filter((v) => v !== option.id));
    if (option.exclusive) return onChange([option.id]);
    const exclusive = new Set(options.filter((o) => o.exclusive).map((o) => o.id));
    onChange([...value.filter((v) => !exclusive.has(v)), option.id]);
  }

  return (
    <Group role="group" aria-labelledby={labelledBy} aria-describedby={describedBy}>
      {options.map((option, i) => {
        const checked = value.includes(option.id);
        const id = `${name}-${option.id}`;
        return (
          <Card key={option.id} htmlFor={id} data-checked={checked ? "" : undefined} style={{ "--i": i } as CSSProperties}>
            <Checkbox id={id} name={name} value={option.id} checked={checked} onCheckedChange={(next) => toggle(option, next === true)} />
            <Glyph>
              <Icon icon={option.icon} size={20} />
            </Glyph>
            <Text>{option.label}</Text>
          </Card>
        );
      })}
      {value.includes(OTHER) && (
        <OtherField>
          <Field label={otherLabel} hint="Optional">
            {(props) => (
              <Input
                {...props}
                name={`${name}Other`}
                value={otherValue}
                maxLength={80}
                placeholder={otherPlaceholder}
                autoComplete="off"
                autoFocus
                onChange={(e) => onOtherChange(e.target.value)}
              />
            )}
          </Field>
        </OtherField>
      )}
    </Group>
  );
}
