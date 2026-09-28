# ErrorSummary

A persistent box above a long form that lists every invalid field after a failed submit. Each item links to its field and moves focus there.

## Use when / Don't use when
- A long form (more than one screen, or several sections) fails validation, so some errors are out of view. See the shared rule in `docs/ux/portal.md`: "For long forms, use a persistent error summary linked to the invalid fields."
- A short form (a dialog, a sign-in box): use `Field`'s `error` beside each field and move focus to the first invalid field. No summary.
- A failure that isn't about a field (lost access, signed out): show a persistent message that says what to do next, not a summary.
- Never as a toast, and never as well as a generic "Check the highlighted fields" toast.

## API
```tsx
import { ErrorSummary } from "@/components/ui/ErrorSummary";
```
- `title: string` (required) — rendered as an `h2`. Say how much needs fixing and why it matters, e.g. "Fix 2 fields to publish this opportunity".
- `errors: { fieldId: string; message: string }[]` (required) — one item per invalid field, in form order. `fieldId` is the control's id: pass the same value to that field's `Field id`. Renders nothing when empty.

## Example
```tsx
const errors = [
  { fieldId: "opportunity-title", message: "Enter a title." },
  { fieldId: "opportunity-website", message: "Enter a web address like sdckw.ca." },
];

<ErrorSummary title="Fix 2 fields to publish this opportunity" errors={errors} />

<Field id="opportunity-title" label="Title" required error={errors[0].message}>
  {(props) => <Input {...props} />}
</Field>
```

## Content rules
- Each message is the same text as the field's own error, so people recognise it when they arrive.
- Messages say what to do ("Enter a title."), not what's wrong in the abstract ("Invalid input").
- List items in the order the fields appear in the form.

## Accessibility
- `role="alert"`, so the summary is announced when it appears after submit.
- Links go to `#fieldId`; clicking or pressing Enter scrolls the field into view and focuses the control itself, not just its label.
- Danger border, background and heading colour always come with the alert icon and the heading text, never colour alone. Text meets 4.5:1 on `--color-danger-subtle`.
- Keep entered values and the per-field errors; the summary adds to them, it doesn't replace them.

## Don't
1. Show it on short forms where every field is already in view.
2. Let the summary and field messages drift apart; derive both from the same errors.
3. Remove it as soon as one field is fixed. It stays until the next submit.
