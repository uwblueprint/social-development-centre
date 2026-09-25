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

**Exception to "every control has a visible label":** a compact search box in a toolbar (e.g. above a `Table`/`List`, filtering as you type) can skip `Field` and use `aria-label` alone — the leading search icon plus a placeholder repeating the label make its purpose obvious at a glance, and a visible label would add width/height the toolbar doesn't have to spare. Still wrap in `Field` whenever the search field carries a hint, an error, or sits in a regular form rather than a compact toolbar.

```tsx
<SearchField name="q" aria-label="Search members" placeholder="Search by name or email" value={q} onChange={...} />
```

## Don't
1. Relying on the icon or placeholder as the label with no `Field` wrapper and no `aria-label` — a decorative icon and placeholder text alone give screen-reader users nothing.
2. Using it inside a form where "search" isn't the field's purpose — use `Input`.
