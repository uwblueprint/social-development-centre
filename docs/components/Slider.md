# Slider

A labeled range control (`SliderField`) pairing a draggable track with synced number inputs; one thumb for a value, two for a range.

## Use when / Don't use when
- Numeric values with a bounded range where relative position matters (budget, hours per week).
- Precise or unbounded numeric entry — use `Input type="number"` in a `Field`.
- Don't use the bare `Slider` primitive in app code — always go through `SliderField`.

## API
```tsx
import { SliderField } from "@/components/ui/Slider";
```
- `label: string` (required), `min`, `max` (required), `step?: number` (default `1`).
- `value?: number[]` / `defaultValue?: number[]` — length 1 for a single value, length 2 for a range.
- `onValueChange?: (value: number[]) => void`.
- `prefix?: string` / `suffix?: string` — e.g. `"$"` or `" hrs"`.
- `disabled?: true` + `disabledReason: DisabledReasonText` (required together).

## Example
```tsx
<SliderField label="Volunteer hours per week" min={0} max={40} step={1} defaultValue={[10]} suffix=" hrs" />
```

## Content rules
`label` names the quantity, not the widget ("Budget", not "Budget slider"). `prefix`/`suffix` should match how the value reads elsewhere.

## Accessibility
Each thumb has an `aria-label` ("Minimum"/"Maximum" for a range) and a live `aria-valuetext` with the prefix/suffix, so screen readers announce "$200", not a bare number. The synced number inputs are the precise, keyboard-first path. Track uses `--color-border-strong` for 3:1 contrast.

## Don't
1. Using the bare `Slider` export without `SliderField`'s label and inputs.
2. Disabling without `disabledReason`.
3. Choosing a `step` that doesn't divide evenly into `max - min`.
