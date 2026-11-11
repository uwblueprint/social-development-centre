# RangeCalendar

A month calendar for picking the edge(s) of a date rule: one date for "before" or "after", a start and an end for "between".

## Use when / Don't use when
- Filtering by a date rule, e.g. "Joined between Nov 1 and Nov 30", usually inside a `Popover` under a Before / After / Between `ToggleGroup`.
- A single date in a form: use `DatePicker`.

## API
```tsx
import { RangeCalendar } from "@/components/ui/RangeCalendar";
```
- `mode`: `"before" | "after" | "between"`.
- `value: { from?, to? }` and `onValueChange(next)`: ISO dates (`YYYY-MM-DD`). Before and after use `from` only.
- `aria-label?`: names the grid ("Joined"); the month is added.

## Behaviour
- Between: click the start, then the end (the earlier click is always the start); the next click starts over. Before and after: one click picks the date.
- The band is a light fill across the range, one continuous shape: only its outer corners are rounded. The end is solid, the start a stronger tint.
- The date inputs above the grid are real inputs ("Start date", "End date", or "Date"). Type "Nov 10, 2026", "10 Nov 2026", "11/10/2026" (month first) or "2026-11-10"; it applies on Enter or blur, and text that is not a date reverts without a message.
- Header: previous, title, next. Click the title to zoom out to the months of the year, then to a block of 12 years; a dot marks the month or year being viewed. Picking a year opens its months, picking a month opens its days. Picked dates are kept at every level, so a start in April and an end in November can be set by zooming out in between.
- Weeks start on Monday and always show six rows, with neighbouring months' days in a lighter colour. Today is marked with a dot in the text colour. Range ends use the primary fill with on-primary text (both ends alike), the days between them a light neutral band (`--color-bg-hover`), and hovering a day uses the same neutral fill. There is no teal in the calendar.
- Keyboard: arrows move by day and week (months and years by cell), Page Up/Down by month, year or block, Enter or Space picks.

## Accessibility
`role="grid"` with a `gridcell` per day (`aria-selected` for days in the range; the month and year grids have none, `aria-current` marks the one in view) and a full date as each day's label. Color is never the only signal: the fields and the selected state carry the same information.
