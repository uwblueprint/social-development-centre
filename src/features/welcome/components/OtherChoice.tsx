"use client";

import { useId } from "react";
import { styled } from "next-yak";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { RadioGroupItem } from "@/components/ui/RadioGroup";
import { Separator } from "@/components/ui/Separator";
import { OTHER, otherLabel } from "../copy";

/*
 * "Other" sits below a divider as its own full-width card. Choosing it turns the card into a text box
 * (letter prototype, 8 Oct 2026): the card keeps its frame and its control, and the label "Other" moves onto the
 * text field so the field always has a visible label. Unchoosing it turns the card back.
 *
 * `checkbox` toggles on its own. `radio` must be rendered inside a RadioCardGroup, so the group's
 * value and arrow-key movement include it; choosing another card in the group turns it back.
 */

const Divider = styled(Separator)`
  grid-column: 1 / -1;
`;

const Card = styled.div`
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: var(--space-7);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  transition:
    border-color var(--duration) var(--ease),
    background-color var(--duration) var(--ease);

  &[data-checked] {
    border-color: var(--color-primary);
    background: var(--color-bg-hover);
  }

  &:has(:focus-visible) {
    box-shadow: var(--focus-ring);
  }
`;

/* The label fills the card, so the whole card is the click target before it opens. */
const CardLabel = styled(Label)`
  flex: 1;
  margin: 0;
  font-size: var(--text-md);
  line-height: var(--leading-ui);
`;

const BoxLabel = styled(Label)`
  margin: 0;
  flex-shrink: 0;
  font-size: var(--text-md);
`;

const Box = styled.div`
  flex: 1;
  min-width: 0;
`;

export function OtherChoice({
  kind,
  name,
  checked,
  onCheckedChange,
  text,
  onTextChange,
  textLabel,
}: {
  kind: "checkbox" | "radio";
  /** The question's form name; the text is submitted as `${name}Other`. */
  name: string;
  checked: boolean;
  /** Checkbox only; a radio is chosen through its group's value. */
  onCheckedChange?: (checked: boolean) => void;
  text: string;
  onTextChange: (text: string) => void;
  /** Describes the text field, e.g. "Where are you based?". */
  textLabel: string;
}) {
  const controlId = useId();
  const textId = useId();
  const hintId = useId();

  const control =
    kind === "checkbox" ? (
      <Checkbox
        id={controlId}
        name={name}
        value={OTHER}
        checked={checked}
        aria-label={checked ? otherLabel : undefined}
        onCheckedChange={(next) => onCheckedChange?.(next === true)}
      />
    ) : (
      <RadioGroupItem id={controlId} value={OTHER} aria-label={checked ? otherLabel : undefined} />
    );

  return (
    <>
      <Divider decorative />
      <Card data-checked={checked ? "" : undefined}>
        {checked ? (
          <>
            <BoxLabel htmlFor={textId}>{otherLabel}:</BoxLabel>
            <Box>
              <Input
                id={textId}
                name={`${name}Other`}
                value={text}
                maxLength={80}
                placeholder={textLabel}
                aria-describedby={hintId}
                autoComplete="off"
                autoFocus
                onChange={(e) => onTextChange(e.target.value)}
              />
              <span id={hintId} hidden>
                {textLabel}
              </span>
            </Box>
          </>
        ) : (
          <CardLabel htmlFor={controlId}>{otherLabel}</CardLabel>
        )}
        {control}
      </Card>
    </>
  );
}
