# Field

Labels a form control and carries its hint, error, required, and disabled state.

## Use when / Don't use when
- Wrapping any input-like control (`Input`, `Textarea`, `Select`, `DatePicker`) that needs a visible label.
- Don't use for `Checkbox`/`Switch`/`RadioGroupOption` rows — pair those with `Label` inline instead.
- Don't skip it to save space — placeholder text is never a substitute for a label.

## API
```tsx
import { Field } from "@/components/ui/Field";
```
- `label: ReactNode` (required).
- `hint?: ReactNode` — helper text below the control.
- `error?: ReactNode` — what happened and how to fix it; shows an error icon and sets `aria-invalid`. It replaces the hint while shown.
- `required?: boolean` — shows "(required)" next to the label.
- `id?: string` — the control's id. Set it when an [`ErrorSummary`](./ErrorSummary.md) links to the field; otherwise one is generated.
- `disabled?: boolean` + `disabledReason: DisabledReasonText` (required together — ask, or pass `null`).
- `children: (props: FieldControlProps) => ReactNode` — spread `props` onto the inner control.

## Hint line
One line under the control: the hint on the left, the character counter on the right ("120 characters left"). The counter exists only when the control has a `maxLength` (today: `Textarea`, which hands its counter to the Field through `useFieldCounter`), and inside a Field it appears only once a quarter or less of the limit is left (`visible`), to keep the form quiet. An error replaces the hint on the left; the counter stays on the right. Near the limit (last 10%) the counter turns `--color-danger` and medium weight; the number itself carries the meaning. Outside a `Field`, `Textarea` shows its own counter under the box.

## Example
```tsx
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

<Field label="Email" hint="We'll send confirmations here">
  {(props) => <Input {...props} type="email" placeholder="you@example.com" />}
</Field>
```

## Content rules
Label: short noun phrase, sentence case, no colon. Hint: one line. Error: state the problem and the fix, e.g. "Enter a URL starting with https://".

## Accessibility
Wires `id`/`aria-describedby`/`aria-invalid` so the hint (or the error that replaces it) is announced with the control. The counter has the id `{control id}-counter`, which the control adds to its own `aria-describedby`; `Textarea` also announces 20, 10 and 0 characters left politely. Disabled routes through `DisabledArea` so the reason stays reachable.

## Don't
1. Passing `disabled` without `disabledReason`.
2. Writing a vague error like "Invalid" — say what's wrong and the fix.
3. Forgetting to spread the render-prop's `props` onto the control.
