# Input

A single-line text field with a built-in invalid-state error icon.

## Use when / Don't use when
- Short, single-line text, numbers, emails, URLs, or passwords typed freely.
- Multi-line text — use `Textarea`.
- A date that also needs a calendar picker — use `DatePicker`.
- Picking from a fixed set of values — use `Select`.

## API
```tsx
import { Input } from "@/components/ui/Input";
```
- Forwards all native `<input>` props and `ref`.
- `aria-invalid?: boolean | "true" | "false"` — shows a red error icon; pair with `Field`'s `error` prop rather than setting this by hand.
- Always wrap in `Field` — never render a bare `<input>` in `src/app/**`.

## Example
```tsx
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

<Field label="Email" error="Enter a valid email address">
  {(props) => <Input {...props} type="email" defaultValue="not-an-email" />}
</Field>
```

## Content rules
Placeholder shows an example value, never the label itself (e.g. "Ada Lovelace", not "Full name"). Errors from `Field` say what happened and how to fix it.

## Accessibility
Border color never carries the invalid state alone — an icon appears too, using reserved padding, not a layout jump. Focus ring meets 3:1 border contrast; disabled combines dashed border, muted text, and `not-allowed` cursor.

## Don't
1. Rendering a native `<input>` directly in app code — lint blocks it.
2. Using placeholder text as the only label.
3. Setting `aria-invalid` without an `error` message via `Field`.
