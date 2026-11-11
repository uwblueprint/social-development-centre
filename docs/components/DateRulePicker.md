# DateRulePicker

A date rule shown as plain text ("Between Nov 1 and Nov 30, 2026"). Clicking it opens a popover with a Before / After / Between switcher above a [RangeCalendar](RangeCalendar.md).

## When to use

- Filtering by a date rule inside a row or sentence, e.g. the "Join date" condition on automatic emails.
- Not for picking a single date in a form: use [DatePicker](DatePicker.md).

## API

| Prop | Type | Notes |
| --- | --- | --- |
| `value` | `{ op: "before" \| "after" \| "between"; from: string; to: string }` | ISO dates; `""` = not set. |
| `onValueChange` | `(value) => void` | Fires on every change. |
| `label` | `string` | Names the rule for assistive tech ("Join date"). Required. |
| `disabled` | `boolean` | Read-only display. |
| `onOpenChange` | `(open) => void` | E.g. group changes made while open into one undo step. |
| `openRequest` / `onOpenRequestHandled` | `boolean` / `() => void` | Open once programmatically (e.g. right after the rule is added). |

Helpers: `formatDateRule(rule)` gives the same sentence the trigger shows; `monthOf(date)` gives a month's first and last day (the usual default).

## Behaviour

- The popover is anchored to where the text was when it opened, so it doesn't move while the text changes width.
- Switching rule keeps the first date; Between fills the end with the end of that month.
- The switcher spans the calendar's width with equal options.

## Accessibility

- The trigger is a button named "{label}: {rule}. Change dates" with `aria-haspopup="dialog"`.
- Calendar keyboard support comes from RangeCalendar.
