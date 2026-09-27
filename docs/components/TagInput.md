# TagInput

A text field that turns each entry into a removable tag, for entering many short values at once, such as email addresses. Invalid entries stay in the field as error-styled tags, so people can see and fix them.

## Use when / Don't use when
- Entering several values of the same kind in one go (email addresses, domains, codes), typed or pasted from a spreadsheet or email client.
- Choosing from a known list: use `SelectableTag`, `Select` or `CreatableCombobox`.
- One value: use `Input`.
- Values that contain spaces (full names): space ends a tag, so use `Textarea` with one value per line.

## API
```tsx
import { TagInput, tagInputCopy } from "@/components/ui/TagInput";
```
- `value`: `string[]`, the tags in order. Controlled, with `onValueChange(next)`.
- `validate?`: `(tag) => string | undefined`, why a tag is invalid (shown in the tag's tooltip and read out), or `undefined` when it's fine.
- `normalize?`: `(text) => string`, cleans each entry before it becomes a tag (default: trim). Entries that normalize to an existing tag aren't added twice.
- `name?`: submits the tags with a form as one hidden input, one tag per line.
- `placeholder?`: shown only while there are no tags. Never the label.
- `disabled?`
- `copy?`: overrides `tagInputCopy`, e.g. `{ tagsLabel: "Email addresses entered" }`.
- Render it inside `Field` and spread its props (`id`, `aria-describedby`, `aria-invalid`, `required`); they go on the text field.

## Behaviour
- A comma, semicolon, space or Enter ends a tag. Enter in an empty field submits the form as usual.
- Pasting text with separators or new lines splits it into tags at once.
- Leaving the field turns what's typed into a tag, so nothing is lost when someone clicks Continue.
- Backspace in the empty field removes the last tag.
- **Tags are selectable, like Notion's share dialog.** Click a tag to select it; Shift-click selects the range from the last clicked tag; Cmd/Ctrl-click toggles one. Cmd/Ctrl+A in the empty field selects every tag. With tags selected:
  - Backspace or Delete removes them all.
  - Cmd/Ctrl+C copies them, comma-separated ("ada@example.org, luis@example.org"); Cmd/Ctrl+X cuts them.
  - Typing, pasting or Escape deselects (typing on a selected tag moves to the field with that character). Leaving the control deselects too.
- Selected tags use `--color-bg-selected` with a 2px outline in the tag's own text color, so selection isn't carried by color alone. The focused tag also gets the focus ring.
- The × on each tag is pointer-only; keyboard users select the tag and press Backspace or Delete.
- Invalid tags use `--color-danger` on `--color-danger-subtle` with a `CircleAlert` icon (never color alone) and a tooltip with the reason.

## Example
```tsx
<Field label="Email addresses" hint="Press Enter, comma or space after each address, or paste a list." required>
  {(p) => (
    <TagInput
      {...p}
      value={emails}
      onValueChange={setEmails}
      normalize={cleanAddress}
      validate={(tag) => (EMAIL.test(tag) ? undefined : "This isn't an email address. Check for a missing @ or a typo.")}
      placeholder="name@example.org"
      copy={{ tagsLabel: "Email addresses entered" }}
    />
  )}
</Field>
```

## Content rules
The hint says how to separate entries. The invalid reason says what's wrong and how to fix it ("This isn't an email address. Check for a missing @ or a typo."), not just "Invalid".

## Accessibility
- One tab stop: the text field. Arrow Left from the start of the field moves into the tags and selects the last one; Arrow Left and Right move between them (selecting the focused tag; Shift extends the selection), Backspace or Delete removes the selected tags, and Arrow Right past the last tag returns to the field. Escape deselects when tags are selected, and a kit `Dialog`, `AlertDialog` or `Sheet` stays open (they call `keepEscapeForTagSelection`, which reads the control's `data-has-selection`); a second Escape closes the overlay. With nothing selected, Escape is left to the surrounding overlay.
- The tags are a `listbox` (`aria-multiselectable`) named by `copy.tagsLabel`; each tag is an `option` with `aria-selected`. An invalid tag's reason is part of its name ("grace@example. This isn't an email address…") and shows in a tooltip on hover.
- Copying is announced ("2 copied"). Adding, removing and duplicate entries are announced politely ("ada@example.org added", "3 added", "ada@example.org removed", "3 removed", "ada@example.org is already in the list").
- The field keeps the `Field`'s label, hint and error.

## Don't
1. Using the placeholder as the label: wrap it in `Field`.
2. Dropping invalid entries silently: return a reason from `validate` so people can fix them.
3. Using it for values that contain spaces.
