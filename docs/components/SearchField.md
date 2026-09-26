# SearchField

A single-line text entry for filtering a list, submitted explicitly — never live as you type.

## Use when / Don't use when
- Filtering a list, table or directory by typed text, where results should only change once the person asks.
- A field submitted as part of a larger form with other fields — use `Input`; `SearchField` is only styled differently (icon, clear button), not semantically different.

## API
```tsx
import { SearchField } from "@/components/ui/SearchField";
```
- Same props as a native `<input>` (forwards `ref` and all props), rendered with `type="search"` inside its own `<form role="search">`.
- `onSubmit?: (value: string) => void` — called with the field's current text when the person presses **Enter** or clicks the trailing search button. This is the only time the search should actually run — `SearchField` never searches live.
- `onClear?: () => void` — called when the clear (×) button is clicked (shown only once the field has text). Defaults to calling `onSubmit("")`. The caller is responsible for also emptying its own `value` state; `SearchField` doesn't do this for you, since the field is controlled.
- `submitLabel` / `clearLabel` — accessible names for the two trailing icon buttons. Default to "Search" and "Clear search".
- Always wrap in `Field` for a visible label — the icons are controls, not label substitutes.

## Example
```tsx
const [text, setText] = useState(query);

<Field label="Search partners" hint="Matches organization name, contact name or email">
  {(props) => (
    <SearchField
      {...props}
      name="q"
      placeholder="Search partners"
      value={text}
      onChange={(event) => setText(event.target.value)}
      onSubmit={(value) => runSearch(value)}
      onClear={() => {
        setText("");
        runSearch("");
      }}
    />
  )}
</Field>
```
Typing only updates the field's own text. The list only re-queries when `onSubmit` fires (Enter, the search button, or the clear button). If the search paginates, submitting resets the list to page 1.

## Content rules
Label names what's being searched ("Search partners"), not a generic "Search". Placeholder can repeat the label; it is never the only label.

## Accessibility
Behaves like `Input` for keyboard and screen-reader users, plus two icon buttons: the trailing search button (`aria-label`, type `submit`) and, once there's text, a clear button (`aria-label`, type `button`) before it. Pressing Enter anywhere in the field submits the same way as clicking the search button, because the field is its own `<form>`. The native browser search-clear affordance is turned off in favor of the custom, keyboard-reachable clear button.

**Exception to "every control has a visible label":** a compact search box in a toolbar (e.g. above a `Table`/`List`) can skip `Field` and use `aria-label` alone — the trailing search icon plus a placeholder repeating the label make its purpose obvious at a glance, and a visible label would add width/height the toolbar doesn't have to spare. Still wrap in `Field` whenever the search field carries a hint, an error, or sits in a regular form rather than a compact toolbar.

```tsx
<SearchField
  name="q"
  aria-label="Search members"
  placeholder="Search by name or email"
  value={text}
  onChange={(event) => setText(event.target.value)}
  onSubmit={(value) => runSearch(value)}
  onClear={() => {
    setText("");
    runSearch("");
  }}
/>
```

## Don't
1. Relying on the icon or placeholder as the label with no `Field` wrapper and no `aria-label` — a decorative icon and placeholder text alone give screen-reader users nothing.
2. Searching on every keystroke (`onChange`) — only `onSubmit` should trigger the query.
3. Using it inside a form where "search" isn't the field's purpose — use `Input`.
