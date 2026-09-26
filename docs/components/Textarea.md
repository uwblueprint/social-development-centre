# Textarea

Multi-line text entry with an optional live character counter.

## Use when / Don't use when
- Free-form text longer than one line: messages, feedback, notes.
- A single short value — use `Input`.
- Don't set `maxLength` without a real reason — the counter adds behavior and visual weight.

## API
```tsx
import { Textarea } from "@/components/ui/Textarea";
```
- Forwards all native `<textarea>` props and `ref`.
- `maxLength?: number` — turns on a "N characters left" counter, wired via `aria-describedby`.
- `aria-invalid?: boolean | "true" | "false"` — shows the error icon; drive from `Field`'s `error` prop.
- Wrap in `Field`.

## Example
```tsx
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Textarea";

<Field label="Message" hint="Tell us a bit about your request">
  {(props) => <Textarea {...props} maxLength={200} placeholder="Write your message..." />}
</Field>
```

## Content rules
Placeholder is an example, not the label. State any length expectation in the hint up front rather than relying solely on the counter.

## Accessibility
The counter announces politely at 20/10/0 characters left (not every keystroke), and turns to `--color-danger` plus medium weight near the limit — never color alone. Resizable vertically.

## Don't
1. Relying on the counter's color alone — the number itself says so; keep it visible.
2. Rendering a native `<textarea>` in app code directly.
3. Omitting a `hint` when there's a `maxLength`.
