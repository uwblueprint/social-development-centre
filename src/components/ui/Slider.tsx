"use client";

import * as React from "react";
import { css, styled } from "next-yak";
import { Slider as SliderPrimitive } from "radix-ui";
import { Label } from "./Label";
import { DisabledArea, DisabledIcon, type DisabledReasonText } from "./DisabledReason";

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
  align-items: center;
  gap: var(--space-1);
`;

const TrackRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
`;

const TrackArea = styled.div`
  flex: 1;
  padding: 0 2px;
`;

const InputsRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
`;

const RangeDash = styled.span`
  color: var(--color-text-muted);
`;

const CompactFieldWrap = styled.span`
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
`;

const CompactInput = styled.input`
  all: unset;
  box-sizing: border-box;
  width: 4.5ch;
  min-width: 40px;
  height: 32px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-strong);
  background: var(--color-bg);
  color: var(--color-text);
  font-family: inherit;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  text-align: left;
  transition:
    border-color var(--duration) var(--ease),
    box-shadow var(--duration) var(--ease);

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    margin: 0;
  }

  &:hover:not(:disabled) {
    border-color: var(--color-text-muted);
  }

  &:focus-visible {
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

const Affix = styled.span<{ $side: "left" | "right" }>`
  position: absolute;
  ${({ $side }) => ($side === "left" ? css`left: var(--space-2);` : css`right: var(--space-2);`)}
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  pointer-events: none;
`;

/** A single compact number input with the prefix/suffix rendered inside it. */
function CompactField({
  value,
  onChange,
  onBlur,
  onKeyDown,
  min,
  max,
  step,
  disabled,
  prefix,
  suffix,
  id,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  prefix?: string;
  suffix?: string;
  id?: string;
  "aria-label"?: string;
}) {
  const affixChars = (prefix?.length ?? 0) + (suffix?.length ?? 0);
  const leftPad = prefix ? `calc(${prefix.length}ch + 14px)` : undefined;
  const rightPad = suffix ? `calc(${suffix.length}ch + 14px)` : undefined;
  // The base CSS width (4.5ch + 40px min) only fits bare digits; when a
  // prefix/suffix is embedded, grow the box so the padding they need
  // doesn't eat into the digits' own space.
  const width = affixChars > 0 ? `calc(4.5ch + ${affixChars}ch + 40px)` : undefined;
  return (
    <CompactFieldWrap>
      {prefix && <Affix $side="left">{prefix}</Affix>}
      <CompactInput
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        aria-label={ariaLabel}
        value={value}
        style={{ width, paddingLeft: leftPad, paddingRight: rightPad }}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onBlur(e.target.value)}
        onKeyDown={onKeyDown}
      />
      {suffix && <Affix $side="right">{suffix}</Affix>}
    </CompactFieldWrap>
  );
}

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
  /** Submits the value with the surrounding form; ranges submit two values under this name. */
  name?: string;
}

type SliderFieldDisabledProps =
  | { disabled?: false; disabledReason?: never }
  | {
      disabled: true;
      /**
       * Ask the product owner for the real reason; never invent one.
       * Pass null only if they decline or it isn't known.
       */
      disabledReason: DisabledReasonText;
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
  name,
}: SliderFieldProps) {
  const reactId = React.useId();
  const baseId = id ?? reactId;
  const initial = value ?? defaultValue ?? [min];
  const isRange = initial.length > 1;

  const [internal, setInternal] = React.useState<number[]>(initial);
  const current = value ?? internal;
  const [texts, setTexts] = React.useState<string[]>(() => current.map(String));

  const currentKey = current.join(",");
  const [syncedKey, setSyncedKey] = React.useState(currentKey);
  if (currentKey !== syncedKey) {
    setSyncedKey(currentKey);
    setTexts(current.map(String));
  }

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

  const groupLabelId = `${baseId}-label`;

  const body = (
    <FieldWrap>
      <HeaderRow>
        <Label id={groupLabelId} data-disabled={disabled ? "" : undefined}>
          {label}
        </Label>
        {disabled && <DisabledIcon reason={disabledReason} />}
      </HeaderRow>

      {isRange ? (
        <>
          <TrackArea>
            <Root
              name={name}
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
                  aria-label={i === 0 ? "Minimum" : "Maximum"}
                  aria-valuetext={formatValue(v, prefix, suffix)}
                />
              ))}
            </Root>
          </TrackArea>

          <InputsRow>
            <CompactField
              id={`${baseId}-min`}
              aria-label="Minimum"
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              prefix={prefix}
              suffix={suffix}
              value={texts[0] ?? ""}
              onChange={(v) => handleInputChange(0, v)}
              onBlur={(v) => handleInputCommit(0, v)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleInputCommit(0, (e.target as HTMLInputElement).value);
              }}
            />
            <RangeDash aria-hidden="true">–</RangeDash>
            <CompactField
              id={`${baseId}-max`}
              aria-label="Maximum"
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              prefix={prefix}
              suffix={suffix}
              value={texts[1] ?? ""}
              onChange={(v) => handleInputChange(1, v)}
              onBlur={(v) => handleInputCommit(1, v)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleInputCommit(1, (e.target as HTMLInputElement).value);
              }}
            />
          </InputsRow>
        </>
      ) : (
        <TrackRow>
          <TrackArea>
            <Root
              name={name}
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
              <Thumb aria-label={label} aria-valuetext={formatValue(current[0], prefix, suffix)} />
            </Root>
          </TrackArea>

          <CompactField
            id={`${baseId}-value`}
            aria-label={label}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            prefix={prefix}
            suffix={suffix}
            value={texts[0] ?? ""}
            onChange={(v) => handleInputChange(0, v)}
            onBlur={(v) => handleInputCommit(0, v)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleInputCommit(0, (e.target as HTMLInputElement).value);
            }}
          />
        </TrackRow>
      )}
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
