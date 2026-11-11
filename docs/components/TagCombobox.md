# TagCombobox

Pick several options from a known list, shown as tags inside one field. Typing searches the list.

## Use when / Don't use when
- Choosing several values from a set the app already knows (member tags, interests), especially when the set may grow.
- Free-text entries such as email addresses: use `TagInput`.
- One value: use `Select`.
- A handful of options that should all stay visible: use `SelectableTag` in a `TagList`.

## API
```tsx
import { TagCombobox } from "@/components/ui/TagCombobox";
```
- `options: { value, label, hint? }[]`: `hint` shows on the right of an option ("Moves from Has tag").
- `value: string[]` with `onValueChange(next)`. Controlled.
- `placeholder?`: shown only while nothing is picked. Never the label.
- `readOnly?`: shows the tags with no field or remove buttons.
- `autoFocus?`: focuses the field and opens the list on mount, e.g. right after the condition is added.
- `bare?`: drops the field's own border, for use inside a box that already has one.
- `extraPills?: { key, index, node, onRemove }[]`: foreign pills (e.g. a date-range pill) shown among the tags at `index` (the tag count puts it last). Backspace selects and deletes it like a tag, calling `onRemove`. The placeholder shows only when there are no tags and no extra pills.
- `leadingOption?: { label, textValue, onSelect({ index }) } | null`: one special option listed first, above a 1px divider and the normal tags (e.g. a typed phrase turned into a date rule). It is highlighted by default and joins keyboard navigation. Selecting it calls `onSelect` (`index` = tags before the field), clears the text and keeps focus. While it is present the "No tags match" message is not shown.
- `leadingOptionAlways?`: lists the leading option even while the field is empty, pinned at the top, then the divider, then all tags (the divider shows whenever both the leading option and at least one tag are listed). Highlight starts on the first item. Without it the leading option is listed only while text is typed.
- `pillActions?(value) => { label, icon?, onSelect, danger? }[]`: a context menu for tags. Right-click a tag (the browser menu is not shown), or select it with Backspace and press Shift+F10 or the Menu key. Escape closes it and returns focus to the field. `danger` uses the danger color for destructive actions. Return an empty list for no menu.
- `queryMode?(query) => { filter, heading, icon, iconTone?, hide?, onPick } | null`: turns a typed shortcut (e.g. "-board") into a mode. The list shows every option matching `filter` (the text after the prefix; empty shows all), minus `hide`, under a small `heading`, each with `icon` before it (`iconTone: "danger"` paints it red). Picking calls `onPick(value)` instead of adding to `value`, then clears the text. Keyboard works as for normal options. Return null for normal behaviour; a `leadingOption` is not listed while a mode is active.
- `onQueryChange?(query)`: reports the typed text, so the caller can build a `leadingOption` from it.
- `getColor?(value) => TagColor | undefined`: a colour per tag, one of five hues (`stone`, `sky`, `emerald`, `amber`, `rose`; see `--tag-*` in tokens and `TAG_COLORS`). Pills use the hue's 50 fill and 800 text, with no border; in the dropdown each option renders as the same pill, left-aligned, with the row's normal hover fill behind it. A pill selected for removal (Backspace) gets the 100 fill (`--tag-*-bg-strong`) instead of a border, and is announced. Text is 4.5:1 or better on both fills. The name is always in the pill, so colour is never the only signal. No colour = grey.
- `pillIcon?` and `pillIconTone?: "danger"`: a small icon before every tag's text; `"danger"` paints it `--color-danger`, e.g. a Ban icon on an exclusion list. The tag keeps its own colour.
- `separator?: ReactNode`: rendered between consecutive tags, e.g. a small "or" / "and" connector. Not shown before the first tag, after the last, or beside the text field. It may be interactive (a ghost `Button`); give it its own `aria-label`. Not shown in `readOnly`.
- `disabled?`, `copy?` (overrides `tagComboboxCopy`).
- Render it inside `Field` and spread its props, or pass `aria-label`.

## Behaviour
- Focusing or clicking the field opens the list. Typing filters it; options already picked aren't listed.
- Click an option, or move with Arrow Up/Down and press Enter, to add it. The field clears and stays open for the next pick.
- Backspace in the empty field selects the last tag (darker fill and stronger border). A second Backspace removes it.
- After a removal, Backspace removes the next tag straight away for 5 seconds, without selecting first: the intent to delete is already clear.
- Escape deselects the tag, then closes the list.
- Selecting several tags, like text: Shift+Left / Shift+Right from the field (caret at the text edge) extend the selection one tag at a time from the field's position, and the opposite arrow shrinks it. Shift+Home / Shift+End extend to the first / last tag. Ctrl/Cmd+A in the empty field selects all. Shift+click a tag extends from the field to it. Selected tags use the stronger fill and are announced ("3 tags selected").
- Backspace or Delete with a selection removes all of it in one `onValueChange` call (one undo step) and leaves the field where they were ("Removed Housing, Youth and Board"). Typing, a plain arrow, Escape, clicking or leaving the field clears the selection. Extra pills in the selection are removed through their `onRemove`.
- The × on each tag is pointer-only; keyboard users use Backspace.

## Content rules
- The empty list says "All tags are added" when nothing is typed and every option is picked, and `No tags match “query”` when typed text matches nothing. Override both through `copy` (`allAdded`, `noMatches(query)`).
Option labels are the values people know (tag names). No "and" or "or" between tags: the screen explains the logic once, elsewhere.

## Accessibility
The field is a `combobox` with `aria-expanded`, `aria-controls` and `aria-activedescendant`; the list is a `listbox` of `option`s, and focus never leaves the field. The selected tag is marked with fill and outline, not color alone. Adding, selecting and removing are announced politely.

## Don't
1. Using it for free text: use `TagInput`.
2. Putting "or"/"and" between the tags.
3. Using the placeholder as the label.
