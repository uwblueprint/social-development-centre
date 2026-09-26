# DatePicker

A typed date field (ISO `YYYY-MM-DD`) with an assistive calendar, built for fast entry of far-back dates like a date of birth.

## Use when / Don't use when
- Any date field, especially far-back ones (typing is primary; clicking "previous month" hundreds of times isn't).
- A date range — compose two `DatePicker`s with your own "from"/"to" `Field`s; no built-in range mode.
- Don't use a bare `Input type="date"` — renders inconsistently.

## API
```tsx
import { DatePicker } from "@/components/ui/DatePicker";
```
- `value?` / `defaultValue?: string` — ISO `"YYYY-MM-DD"`.
- `onValueChange?: (value: string) => void`.
- `placeholder?` (default `"YYYY-MM-DD"`), `disabled?`, `required?`.
- `min?` / `max?: string` — ISO bounds for typing and the calendar.
- `aria-invalid?`, `aria-describedby?`, `aria-label?` — set via `Field`, not by hand.

## Example
```tsx
<Field label="Date of birth" hint="YYYY-MM-DD, or pick from the calendar">
  {(props) => <DatePicker {...props} max={todayIso} defaultValue="1990-05-14" />}
</Field>
```

## Content rules
Hint should mention the expected format and that the calendar is optional, e.g. "YYYY-MM-DD — typing is fastest; the calendar button also works".

## Accessibility
The calendar opens from its own labeled button without stealing focus from the text field, then focuses the roving-tabindex day, not "previous month". Out-of-range days are muted and marked `disabled`, never color alone.

## Don't
1. Using a native `<input type="date">` instead of this component.
2. Skipping `min`/`max` on a bounded field (e.g. date of birth needs a `max` of today).
3. Relying on the calendar as the only entry path — typing must keep working.
