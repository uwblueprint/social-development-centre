# Checkbox

A tri-state (checked/unchecked/indeterminate) selection control, with distinct disabled and read-only states.

## Use when / Don't use when
- Independent boolean choices, or "select all" with `indeterminate` for partial selection.
- A single immediate-effect setting (saves instantly, no form submit) — use `Switch` instead.
- Choosing exactly one from a list — use `RadioGroup`.

## API
```tsx
import { Checkbox } from "@/components/ui/Checkbox";
```
- `checked?: boolean | "indeterminate"`, `defaultChecked?`, `onCheckedChange?`.
- `disabled?: true` + `disabledReason: DisabledReasonText` (required together) — value is unknown, box always renders blank.
- `readOnly?: true` + `disabledReason` (required together) — value stays visible but can't change.
- `label?: ReactNode`: renders box, label, then the lock icon (when unavailable) as one row. Prefer this; otherwise pair with a `Label` via `id`/`htmlFor`.

## Example
```tsx
import { Checkbox } from "@/components/ui/Checkbox";

<Checkbox label="Accept terms and conditions" />
<Checkbox readOnly defaultChecked disabledReason="Set by your plan." label="Two-factor authentication" />
```

## Content rules
Label states the thing being agreed to or included, not the state: "Subscribe to newsletter", not "Newsletter: on".

## Accessibility
Fully keyboard-operable (Space toggles), visible focus ring, `aria-invalid` support. Checked/indeterminate are shown with fill *and* a check/dash glyph, never fill alone. `disabled` hides the real value entirely (always renders unchecked); `readOnly` keeps the value visible in muted color but blocks change — pick the one that matches whether the value is actually knowable.

## Don't
1. Using `disabled` when the value is actually known — use `readOnly` so people can still see it.
2. Disabling/read-onlying without `disabledReason`.
3. Leaving the checkbox without a `label` (or `Label`) and relying on surrounding text.
