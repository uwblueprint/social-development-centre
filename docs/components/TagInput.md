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
- One tab stop: the text field. Arrow Left from the start of the field moves into the tags; Arrow Left and Right move between them, Backspace or Delete removes the focused tag, and Arrow Right past the last tag returns to the field. Escape is left to the surrounding dialog.
- Each tag's remove button is named "Remove {tag}", or "Remove {tag}. {reason}" when invalid; focusing it also opens the reason's tooltip.
- The tags are a list named by `copy.tagsLabel`. Adding, removing and duplicate entries are announced politely ("ada@example.org added", "3 added", "ada@example.org removed", "ada@example.org is already in the list").
- The field keeps the `Field`'s label, hint and error.

## Don't
1. Using the placeholder as the label: wrap it in `Field`.
2. Dropping invalid entries silently: return a reason from `validate` so people can fix them.
3. Using it for values that contain spaces.
