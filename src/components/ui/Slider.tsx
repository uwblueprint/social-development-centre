"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Slider as SliderPrimitive } from "radix-ui";
import { Label } from "./Label";
import { Input } from "./Input";
import { DisabledArea, DisabledIcon } from "./DisabledReason";

const Root = styled(SliderPrimitive.Root)`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 20px;
  touch-action: none;
  user-select: none;
  cursor: pointer;

  &[data-disabled] {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const Track = styled(SliderPrimitive.Track)`
  position: relative;
  flex-grow: 1;
  height: 4px;
  border-radius: var(--radius-full);
  /* --color-border alone is ~1.2:1 on white; --color-border-strong clears
     the 3:1 WCAG 1.4.11 boundary/graphical-object requirement (~3.3:1). */
  background: var(--color-border-strong);
`;

const Range = styled(SliderPrimitive.Range)`
  position: absolute;
  height: 100%;
  border-radius: var(--radius-full);
  background: var(--color-primary);
`;

const Thumb = styled(SliderPrimitive.Thumb)`
  display: block;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  background: var(--color-bg);
  border: 1px solid var(--color-border-strong);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--duration) var(--ease);

  &:hover {
    border-color: var(--color-primary);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

export function Slider(props: SliderPrimitive.SliderProps) {
  const values = props.value ?? props.defaultValue ?? [0];
  return (
    <Root {...props}>
      <Track>
        <Range />
      </Track>
      {values.map((_, i) => (
        <Thumb key={i} />
      ))}
    </Root>
  );
}

/* ---------------------------------------------------------------------- */
/* SliderField: labelled slider + synced min/max number inputs, modelled   */
/* on filter sliders like Kiwi.com / Shop (Min/Max fields under the track). */
/* ---------------------------------------------------------------------- */

const FieldWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-1);
`;

const ValueText = styled.span`
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
`;

const TrackArea = styled.div`
  padding: 0 2px;
`;

const ScaleRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: -4px;
`;

const ScaleLabel = styled.span`
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const InputsRow = styled.div`
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-1);
`;

const InputCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1;
`;

const InputLabel = styled.label`
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

function formatValue(n: number, prefix?: string, suffix?: string) {
  return `${prefix ?? ""}${n}${suffix ?? ""}`;
}

function clampToStep(n: number, min: number, max: number, step: number) {
  const clamped = Math.min(max, Math.max(min, n));
  if (step <= 0) return clamped;
  const steps = Math.round((clamped - min) / step);
  return Math.min(max, Math.max(min, min + steps * step));
}

interface SliderFieldBaseProps {
  /** Visible label for the whole field. */
  label: string;
  min: number;
  max: number;
  step?: number;
  /** One thumb (single value) or two (a range). */
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  /** Prepended to every formatted value, e.g. "$". */
  prefix?: string;
  /** Appended to every formatted value, e.g. "%" or " hrs". */
  suffix?: string;
  id?: string;
}

type SliderFieldDisabledProps =
  | { disabled?: false; disabledReason?: never }
  | {
      disabled: true;
      /** Required. Ask the product owner for the real reason; never invent one. */
      disabledReason: string;
    };

export type SliderFieldProps = SliderFieldBaseProps & SliderFieldDisabledProps;

export function SliderField({
  label,
  min,
  max,
  step = 1,
  value,
  defaultValue,
  onValueChange,
  prefix,
  suffix,
  disabled,
  disabledReason,
  id,
}: SliderFieldProps) {
  const reactId = React.useId();
  const baseId = id ?? reactId;
  const initial = value ?? defaultValue ?? [min];
  const isRange = initial.length > 1;

  const [internal, setInternal] = React.useState<number[]>(initial);
  const current = value ?? internal;
  const [texts, setTexts] = React.useState<string[]>(() => current.map(String));

  React.useEffect(() => {
    setTexts(current.map(String));
    // Only re-sync when the committed numeric values actually change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.join(",")]);

  function commit(next: number[]) {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  }

  function handleInputChange(index: number, raw: string) {
    setTexts((t) => t.map((x, i) => (i === index ? raw : x)));
    const parsed = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(parsed)) return;
    let v = Math.min(max, Math.max(min, parsed));
    const next = [...current];
    if (isRange) {
      if (index === 0) v = Math.min(v, next[1]);
      else v = Math.max(v, next[0]);
    }
    next[index] = v;
    commit(next);
  }

  function handleInputCommit(index: number, raw: string) {
    const parsed = Number(raw);
    const base = Number.isFinite(parsed) ? parsed : current[index];
    let v = clampToStep(base, min, max, step);
    const next = [...current];
    if (isRange) {
      if (index === 0) v = Math.min(v, next[1]);
      else v = Math.max(v, next[0]);
    }
    next[index] = v;
    commit(next);
    setTexts(next.map(String));
  }

  const formatted = current.map((v) => formatValue(v, prefix, suffix)).join(" – ");
  const groupLabelId = `${baseId}-label`;

  const body = (
    <FieldWrap>
      <HeaderRow>
        <HeaderLeft>
          <Label id={groupLabelId} data-disabled={disabled ? "" : undefined}>
            {label}
          </Label>
          {disabled && <DisabledIcon reason={disabledReason} />}
        </HeaderLeft>
        <ValueText>{formatted}</ValueText>
      </HeaderRow>

      <TrackArea>
        <Root
          aria-labelledby={groupLabelId}
          value={current}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onValueChange={(next) => commit(next)}
        >
          <Track>
            <Range />
          </Track>
          {current.map((v, i) => (
            <Thumb
              key={i}
              aria-label={isRange ? (i === 0 ? "Minimum" : "Maximum") : label}
              aria-valuetext={formatValue(v, prefix, suffix)}
            />
          ))}
        </Root>
        <ScaleRow aria-hidden="true">
          <ScaleLabel>{formatValue(min, prefix, suffix)}</ScaleLabel>
          <ScaleLabel>{formatValue(max, prefix, suffix)}</ScaleLabel>
        </ScaleRow>
      </TrackArea>

      <InputsRow>
        {isRange ? (
          <>
            <InputCol>
              <InputLabel htmlFor={`${baseId}-min`}>Minimum</InputLabel>
              <Input
                id={`${baseId}-min`}
                type="number"
                inputMode="decimal"
                min={min}
                max={max}
                step={step}
                disabled={disabled}
                value={texts[0] ?? ""}
                onChange={(e) => handleInputChange(0, e.target.value)}
                onBlur={(e) => handleInputCommit(0, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleInputCommit(0, (e.target as HTMLInputElement).value);
                }}
              />
            </InputCol>
            <InputCol>
              <InputLabel htmlFor={`${baseId}-max`}>Maximum</InputLabel>
              <Input
                id={`${baseId}-max`}
                type="number"
                inputMode="decimal"
                min={min}
                max={max}
                step={step}
                disabled={disabled}
                value={texts[1] ?? ""}
                onChange={(e) => handleInputChange(1, e.target.value)}
                onBlur={(e) => handleInputCommit(1, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleInputCommit(1, (e.target as HTMLInputElement).value);
                }}
              />
            </InputCol>
          </>
        ) : (
          <InputCol>
            <InputLabel htmlFor={`${baseId}-value`}>Value</InputLabel>
            <Input
              id={`${baseId}-value`}
              type="number"
              inputMode="decimal"
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              value={texts[0] ?? ""}
              onChange={(e) => handleInputChange(0, e.target.value)}
              onBlur={(e) => handleInputCommit(0, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleInputCommit(0, (e.target as HTMLInputElement).value);
              }}
            />
          </InputCol>
        )}
      </InputsRow>
    </FieldWrap>
  );

  return disabled ? (
    <DisabledArea reason={disabledReason} block>
      {body}
    </DisabledArea>
  ) : (
    body
  );
}
