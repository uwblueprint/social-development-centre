# EmptyState

A centered icon, title, optional description and action(s) for an empty list, empty section or no-search-results state.

## Use when / Don't use when
- A list, table or panel has nothing to show yet, or a search/filter matched nothing.
- A field-level error or validation message — use `Field`'s `error`.
- A blocking page-level error (failed to load) — that needs its own retry-oriented treatment, not this.

## API
```tsx
import { EmptyState } from "@/components/ui/EmptyState";
```
- `icon: LucideIcon` (required) — passed through `Icon`, decorative.
- `title: ReactNode` (required).
- `description?: ReactNode`.
- `action?: ReactNode` — one or two `Button`s for the way out (e.g. "Invite partner", "Clear search").

## Example
```tsx
<EmptyState
  icon={Building}
  title="No partners yet"
  description="Invite an organization to give them access to their opportunities."
  action={<Button onClick={openInvite}>Invite partner</Button>}
/>
```
```tsx
<EmptyState
  icon={Search}
  title={`No matches for "${query}"`}
  description="Try a different organization name, contact name or email."
/>
```

## Content rules
Title states what's missing in plain terms ("No partners yet", not "Nothing here"). For no-results states, echo the search term back so the person can confirm what didn't match. Description suggests the next step; omit it if the title already says enough.

## Accessibility
Plain text and a decorative icon (`aria-hidden`) — nothing here is interactive except the optional `action` buttons, which follow normal `Button` semantics.

## Don't
1. Using it for a field error — that belongs under the field via `Field`'s `error`.
2. Writing a vague title like "Nothing here" instead of naming what's missing.
3. Omitting the search term on a no-results state.
