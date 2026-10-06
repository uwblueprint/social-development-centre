# SubmitButton

The submit button for any form backed by a server action; shows a pending spinner automatically.

## Use when / Don't use when
- Use as the primary action of a `<form action={serverAction}>`.
- Don't use for buttons that don't submit a form; use `Button`.

## API
```tsx
import { SubmitButton } from "@/components/ui/SubmitButton";
```
Same props as `Button` (`$variant`, `$size`). Reads pending state from the surrounding form via `useFormStatus`.

## Example
```tsx
<form action={action}>
  …
  <SubmitButton>Send invitation</SubmitButton>
</form>
```

## Content rules
Verb + object ("Send invitation", "Save changes"). Don't change the label while pending; the spinner says it.

## Accessibility
While pending: `aria-busy`, `aria-disabled` (keeps focus, ignores repeat clicks) and the same width, so nothing shifts.

## Don't
1. Using `disabled` to block double submits; it drops keyboard focus. SubmitButton already handles it.
2. Rendering it outside a `<form>`; it never becomes pending.
