# Select

Pick one option from a list; renders as a plain dropdown for 5 or fewer options and an automatic searchable combobox above that.

## Use when / Don't use when
- Choosing exactly one value from a known, bounded list.
- More than ~15–20 options — consider a dedicated search/autocomplete page instead.
- Choosing among 2–4 always-visible options — `RadioGroup` or `ToggleGroup` read faster since every option is visible.

## API
```tsx
import { Select, type SelectOption } from "@/components/ui/Select";
```
- `options: SelectOption[]` — `{ value, label, disabled? }` (required).
- `value?`, `defaultValue?`, `onValueChange?`.
- `placeholder?: string`, `disabled?: boolean`, `required?: boolean`.
- `aria-invalid?`, `aria-describedby?`, `aria-label?`/`aria-labelledby?` — always wrap in `Field` instead of setting these by hand.
- Disabled options render an "Unavailable" badge, never just greyed-out text.

## Example
```tsx
<Field label="Country" hint="Type to search the list">
  {(props) => (
    <Select {...props} options={countryOptions} defaultValue="us" placeholder="Select a country" />
  )}
</Field>
```

## Content rules
Placeholder names the action ("Select a country"), not an example value. Option labels: sentence case, no trailing punctuation. Mark unavailable options `disabled` rather than omitting them.

## Accessibility
Both variants expose full listbox/combobox ARIA and keyboard support (arrows, type-ahead, Enter, Esc) via Radix/cmdk. The two triggers share identical styling so switching variants is invisible to users. Invalid state pairs border color with an error icon.

## Don't
1. Hardcoding a native `<select>` — always use this component.
2. Hiding unavailable options instead of marking them `disabled`.
3. Setting `aria-*` props by hand instead of letting `Field` generate them.
