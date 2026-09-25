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
- `error?: ReactNode` — what happened and how to fix it; shows an error icon and sets `aria-invalid`.
- `required?: boolean` — shows "(required)" next to the label.
- `disabled?: boolean` + `disabledReason: DisabledReasonText` (required together — ask, or pass `null`).
- `children: (props: FieldControlProps) => ReactNode` — spread `props` onto the inner control.

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
Wires `id`/`aria-describedby`/`aria-invalid` so hint and error are announced with the control. Disabled routes through `DisabledArea` so the reason stays reachable.

## Don't
1. Passing `disabled` without `disabledReason`.
2. Writing a vague error like "Invalid" — say what's wrong and the fix.
3. Forgetting to spread the render-prop's `props` onto the control.
