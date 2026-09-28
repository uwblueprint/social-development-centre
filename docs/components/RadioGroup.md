# RadioGroup

A set of mutually exclusive options, either bare items or full-width clickable rows.

## Use when / Don't use when
- 2–6 always-visible, mutually exclusive options — plan, shipping speed, etc.
- A single boolean — use `Switch` or `Checkbox`.
- More than ~6 options, or options that won't all fit on screen — use `Select`.

## API
```tsx
import { RadioGroup, RadioGroupItem, RadioGroupOption } from "@/components/ui/RadioGroup";
```
- `RadioGroup` (Root): `value`/`defaultValue`, `onValueChange`, `aria-labelledby` (pair with a `Label`).
- `RadioGroupItem`: bare circle, for custom row layouts; needs its own adjacent `Label`.
- `RadioGroupOption({ label, disabled?, disabledReason, value, ... })` — a full-width clickable row (item + label together); `disabled` and `disabledReason` are required together.

## Example
```tsx
<Label id="plan-label">Plan</Label>
<RadioGroup defaultValue="pro" aria-labelledby="plan-label">
  <RadioGroupOption value="free" label="Free" />
  <RadioGroupOption value="pro" label="Pro" />
  <RadioGroupOption value="team" label="Team" disabled disabledReason="Team plan is coming soon." />
</RadioGroup>
```

## Content rules
Option labels are short nouns, parallel in form ("Free", "Pro", "Team" — not mixing "Free plan" with "Pro").

## Accessibility
Full arrow-key navigation between options (Radix roving tabindex). Checked state shown with fill *and* a filled inner dot, not border color alone. `RadioGroupOption`'s whole row is clickable and keeps a hover background for easier targeting.

## Don't
1. Using `RadioGroupItem` without a `Label` next to it — prefer `RadioGroupOption`, which pairs them for you.
2. Disabling an option without `disabledReason`.
3. Using this for a non-exclusive multi-select — that's `Checkbox` rows or `SelectableTag`.
