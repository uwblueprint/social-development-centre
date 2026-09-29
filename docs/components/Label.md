# Label

The visible text label for a form control, linked by `htmlFor`.

## Use when / Don't use when
- Every form control needs one (hard rule #4) — `Checkbox`, `Switch`, `RadioGroupOption` rows, or standalone `Input`.
- Building a labeled `Input`/`Textarea`/`Select`/`DatePicker` — prefer `Field`, which renders the label for you and wires up hints/errors.
- Don't use placeholder text as a substitute — it disappears on input and fails contrast checks.

## API
```tsx
import { Label } from "@/components/ui/Label";
```
- Radix `Label.Root` props: `htmlFor` (required to associate with the control's `id`).
- `data-disabled` attribute (set manually) mutes it and switches the cursor to not-allowed when the control lives outside the label.

## Example
```tsx
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";

<Label htmlFor="full-name">Full name</Label>
<Input id="full-name" placeholder="Ada Lovelace" />
```

## Content rules
Short noun phrase, sentence case, no trailing colon, no placeholder-style examples in the label itself (put those in a `Field` hint).

## Accessibility
Clicking the label focuses/activates its control (native `<label>` behavior). When the control is wrapped inside the label, `:has(:disabled)` styles it automatically; when it's a sibling, set `data-disabled` yourself to match.

## Don't
1. Using placeholder text instead of a `Label` — always pair the two.
2. Wrapping a `Label` around a control without `htmlFor` matching the control's `id`.
3. Writing a label as an instruction ("Please enter your name") — just name the field ("Full name").
