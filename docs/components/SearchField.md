# SearchField

A single-line text entry for filtering a list, with a leading search icon.

## Use when / Don't use when
- Filtering a list, table or directory by typed text.
- A field submitted as part of a larger form with other fields — use `Input`; `SearchField` is only styled differently (icon), not semantically different.

## API
```tsx
import { SearchField } from "@/components/ui/SearchField";
```
- Same props as a native `<input>` (forwards `ref` and all props), rendered with `type="search"`.
- Always wrap in `Field` for a visible label — the icon is decorative, not a label substitute.

## Example
```tsx
<Field label="Search partners" hint="Matches organization name, contact name or email">
  {(props) => (
    <SearchField {...props} name="q" placeholder="Search partners" defaultValue={query} />
  )}
</Field>
```

## Content rules
Label names what's being searched ("Search partners"), not a generic "Search". Placeholder can repeat the label; it is never the only label.

## Accessibility
Behaves exactly like `Input` for keyboard and screen-reader users; the leading icon is `aria-hidden`. Native `type="search"` gives it the platform's clear affordance in supporting browsers.

## Don't
1. Relying on the icon or placeholder as the label — always wrap in `Field`.
2. Using it inside a form where "search" isn't the field's purpose — use `Input`.
