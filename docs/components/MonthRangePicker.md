# MonthRangePicker

A field-style picker for one month or a run of months, e.g. "Nov 2026" or "Jan – Mar 2026". It is the date picker's month-scale sibling.

## Use when / Don't use when
- A reporting period where whole months are the unit, e.g. payments or totals by month, optionally "All time".
- Exact days: use `DatePicker`, or `RangeCalendar` for a before / after / between rule.
- Don't use it for a single month in a form: use `Select`.

## API
```tsx
import { MonthRangePicker, type MonthRange } from "@/components/ui/MonthRangePicker";
```
- `value: { from, to } | null` and `onValueChange(next)`: months as `YYYY-MM`; a single month has `from === to`. `null` means all time.
- `allTime?`: adds an "All time" button under the months. Without it, `value` is never `null`.
- `min?` / `max?`: earliest and latest pickable months (`YYYY-MM`). Others are muted and disabled, and the year arrows stop at their years.
- `size?`: `"default"` (40px, like other fields) or `"compact"` (36px, the default `Button` height: beside buttons in a page header).
- `id?`, `disabled?`, `aria-label?`, `aria-labelledby?`, `aria-describedby?`: set via `Field`, not by hand.
- `formatMonthRange(value)` is exported for text that should match the trigger.

## Example
```tsx
<Field label="Period">
  {(props) => <MonthRangePicker {...props} value={range} onValueChange={setRange} max={thisMonth} allTime />}
</Field>
```

## Behaviour
- The trigger is a 40px field with a calendar icon and the range in words. It opens a popover with a year header (previous, year, next) over a 3 x 4 grid of months.
- Click a month, then another to end the range, in either order. Clicking the same month twice picks that month alone. The popover closes after the second click.
- After the first click the band follows the pointer or focus. Ends use the primary fill, the months between a light band, as in `RangeCalendar`. This month has a dot.
- "All time" clears the range, closes the popover and shows `aria-pressed` while active.
- Keyboard: arrows move by month and row, Page Up/Down by year, Enter or Space picks, Escape closes.

## Accessibility
`role="grid"` per year with a `gridcell` per month (`aria-selected` for months in the range) and the full month and year as each label. Focus lands on the roving-tabindex month when it opens. The trigger text carries the range, so the selected state never rests on colour alone.

## Don't
1. Using it for exact dates.
2. Leaving out `max` when future months have no data.
3. Showing the range somewhere else as well, since the trigger already says it.
