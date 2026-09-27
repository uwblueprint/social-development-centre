# CreatableCombobox

A searchable combobox for picking an existing option or creating a new one inline, styled identically to `Select`'s searchable variant.

## Use when / Don't use when
- Attaching a record to one of an open-ended, growing set of parent records (e.g. an organization) where the person may need to add one that doesn't exist yet.
- The set of options is fixed and won't grow — use `Select`.
- Creating the new record needs more than a name — open a `Dialog` instead and preselect the option once it's created.

## API
```tsx
import { CreatableCombobox, type CreatableComboboxValue } from "@/components/ui/CreatableCombobox";
```
- `options: { value, label }[]` (required).
- `existingFieldName: string` — hidden field submitted with the chosen option's `value` when an existing option is picked.
- `createFieldName: string` — hidden field submitted with the typed text when creating a new one.
- Exactly one of the two hidden fields is ever non-empty; the server action tells them apart the same way `invitePartner` does (`organizationId` vs `organizationName`).
- `defaultValue?: CreatableComboboxValue` (`{ kind: "existing", value, label }` or `{ kind: "create", label }`), `onValueChange?`.
- `placeholder?: string` — trigger text before anything is chosen. Default `Search or create…`; name the action per instance.
- `searchPlaceholder?: string` — placeholder of the search box inside the list. Default `Search organizations…`.
- `createLabel?: (query: string) => string` — label of the create row, and of the trigger once a new option is chosen. Default `` (q) => `Create “${q}”` ``. Per instance, so one screen can say `Add “{name}” as a new organization` without changing others.
- `disabled?`, `required?`, `id?`, `aria-invalid?`, `aria-describedby?`, `aria-label?`/`aria-labelledby?` — always wrap in `Field` instead of setting these by hand.
- When the typed text has no case-insensitive exact match among `options`, the list's last row is `createLabel(text)` with a plus icon.

## Example
```tsx
<Field label="Organization" hint="Search existing organizations or create a new one">
  {(props) => (
    <CreatableCombobox
      {...props}
      options={organizationOptions}
      existingFieldName="organizationId"
      createFieldName="organizationName"
      placeholder="Search or create an organization…"
      createLabel={(name) => `Add “${name}” as a new organization`}
    />
  )}
</Field>
```

## Content rules
Placeholder names the action ("Search or create an organization…"). A custom `createLabel` must still echo the exact text typed, in curly double quotes, so there's no ambiguity about what will be created.

## Accessibility
Full listbox/combobox ARIA and keyboard support (arrows, type-ahead, Enter, Esc) via `cmdk` inside a `Popover`. The create row is announced like any other option — it isn't a separate control.

## Don't
1. Using this where the list of options is closed and won't grow — that's over-engineering; use `Select`.
2. Letting the create option silently duplicate an existing name — an exact match never shows a create row.
3. Setting `aria-*` props by hand instead of letting `Field` generate them.
