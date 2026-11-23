# CommandPalette

A search box in a modal: type, move with the arrow keys, press Enter to go. The admin portal opens it with Ctrl K (⌘K on a Mac) or the search icon in the sidebar header (`src/features/search/SearchPalette.tsx`).

The overlay dims and blurs the page like `Dialog`. The panel sits near the top so it doesn't jump as results come and go.

## Use when / Don't use when
- Jumping anywhere in a product: pages, records, settings.
- Picking a value for a form field: use `Select` (it has the same search inside).
- Filtering the list on screen: use `SearchField`.

## API
```tsx
import {
  CommandPalette, CommandPaletteGroup, CommandPaletteItem, CommandPaletteMatch,
  CommandPaletteMessage, CommandPaletteLoading,
} from "@/components/ui/CommandPalette";
```
- `CommandPalette`
  - `open`, `onOpenChange`: controlled.
  - `label`: the accessible name of the dialog and the search box, e.g. "Search".
  - `placeholder`, `search`, `onSearchChange`: the search box (controlled).
  - The palette doesn't filter. Pass only the results that match, ranked how you like.
  - `value`, `onValueChange`: the selected item (optional). Use them to act on the selection yourself, e.g. Ctrl+Enter to open in a new tab from `onKeyDown`.
  - `empty`: shown instead of the list when nothing matches. Use an `EmptyState` with a way out ("Clear search").
  - `restoreFocus`: return false to stop focus returning to where it was, e.g. after navigating away.
  - `inputRef`: the search box.
- `CommandPaletteGroup heading?`: a titled group. Leave the heading off only for a one-off like an error and its retry.
- `CommandPaletteItem value icon label detail? onSelect`: one result.
  - `value` must be unique across the palette.
  - `detail` is muted text on the right, e.g. an email address.
- `CommandPaletteMatch text range`: the label with the matched range in medium weight.
- `CommandPaletteMessage icon tone? children`: a row that isn't a result, e.g. "Couldn't load people". Follow it with a "Try again" item.
- `CommandPaletteLoading label rows?`: placeholder rows while a group loads. It shows nothing for the first 200ms, so a fast answer doesn't flicker. Screen readers hear `label`.

## Example
```tsx
<CommandPalette open={open} onOpenChange={setOpen} label="Search" placeholder="Search pages"
  search={search} onSearchChange={setSearch}>
  <CommandPaletteGroup heading="Pages">
    {pages.map((p) => (
      <CommandPaletteItem key={p.href} value={p.href} icon={p.icon}
        label={<CommandPaletteMatch text={p.label} range={p.range} />} onSelect={() => go(p.href)} />
    ))}
  </CommandPaletteGroup>
</CommandPalette>
```

## Content rules
- The placeholder says what you can search: "Search pages, people, settings and emails".
- Group headings are plural nouns ("People", "Settings").
- Errors say what didn't load and come with "Try again".

## Accessibility
- cmdk gives the WAI-ARIA combobox pattern. Focus stays in the search box, and the selected option is announced as you move.
- The arrow keys loop. Home and End jump to the first and last result. Enter chooses, and Esc closes.
- On close, focus returns to where it was, unless `restoreFocus` says otherwise.
- Matches are marked with weight, not colour. Errors pair the danger colour with an icon and words.

## Don't
1. Filtering inside the palette with cmdk's own fuzzy match. Rank in the caller, so results are predictable.
2. Putting buttons or links inside groups. Every row is an item or a message.
3. Opening a palette on top of another dialog.
