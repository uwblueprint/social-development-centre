# SearchField

Instant search for filtering a list. Results update 300ms after the last keystroke, Enter searches right away, and × clears. There is no search button.

## Use when / Don't use when
- Filtering a list, table or directory by typed text, usually in a `ListPageToolbar` beside the tabs it filters.
- A text field submitted with other fields in a form: use `Input`.

## API
```tsx
import { SearchField } from "@/components/ui/SearchField";
```
- Same props as a native `<input>` (forwards `ref`), rendered as `type="search"` inside its own `<form role="search">`.
- `aria-label: string` (required by the type). The field has no visible label, so this is its accessible name.
- `onSearch: (value: string) => void` (required). Called with the field's text:
  - 300ms after the last keystroke,
  - immediately on **Enter** (cancelling the pending timer),
  - with `""` when the clear (×) button is clicked.
  Called with whatever is typed, even if unchanged; de-duplicate in the caller if a repeat search is costly (`useListSearch` does).
- `pending?: boolean`: while `true`, the leading search icon becomes a spinner and the form is `aria-busy`. Pass `useTransition`'s pending flag.
- `clearLabel?: string`: accessible name of the × button. Default "Clear search".
- Controlled (`value` + `onChange`) or uncontrolled (`defaultValue`). In both modes × empties the field through a normal change event, so a controlled caller's `onChange` receives `""`.

## Example
On a list page backed by the URL, use `useListSearch` from `@/components/patterns/ListPage`. It writes `?q=` with `router.replace`, resets to page 1, keeps the other params, and gives you `pending`:

```tsx
const search = useListSearch(q);

<SearchField
  name="q"
  aria-label="Search by name or email"
  placeholder="Search by name or email"
  value={search.value}
  onChange={(event) => search.setValue(event.target.value)}
  onSearch={search.search}
  pending={search.pending}
/>
```

Anything that depends on the search (the rows, the tab counts, the empty state) must be computed with the same `q` on the server.

## Content rules
- Placeholder says what you can search by ("Search by name or email"). It stays, and it is the only visible text.
- `aria-label` usually repeats the placeholder, so screen-reader and sighted users get the same words.

## Accessibility
- No visible label is the one exception to "every control has a visible label" (AGENTS.md rule 4): the leading search icon, the placeholder and the required `aria-label` together identify it.
- Enter searches because the field is its own `role="search"` form, which is also a landmark.
- The × button is a real, keyboard-reachable `button` with an `aria-label`; the browser's native clear affordance is hidden.
- The spinner is decorative; the results region announces changes if it needs to (e.g. `aria-live` on a count).

## Don't
1. Wrapping it in `Field` with a visible label and hint. Use the placeholder and `aria-label`.
2. Adding a search button or waiting for Enter only. Search runs as you type.
3. Pushing a history entry per search. Use `router.replace`.
4. Showing tab counts that ignore the current search.
