# Sheet

A modal panel anchored to the right edge of the screen, full height, for viewing and editing a record without leaving the list behind it.

## Use when / Don't use when
- Inspecting or editing one record from a list (a partner, a person) while keeping the list's context and scroll position.
- A focused, centered task unrelated to a specific list row — use `Dialog`.
- Confirming a destructive action — use `AlertDialog`, nested inside the sheet if needed.

## API
```tsx
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle,
  SheetDescription, SheetBody, SheetFooter, SheetClose,
} from "@/components/ui/Sheet";
```
- `Sheet` (Root): `open`/`onOpenChange`.
- `SheetTrigger asChild` — wrap your own `Button`.
- `SheetContent` — overlay, right-anchored panel (~420px, full width below 640px), and a built-in labeled close (×) button.
- `SheetHeader` — top section with a bottom hairline; put `SheetTitle` (required) and `SheetDescription` (optional) here, or any custom heading content (e.g. an editable name field).
- `SheetBody` — scrollable middle section.
- `SheetFooter` — bottom section with a top hairline, right-aligned actions.
- `SheetClose asChild` — wrap your own `Button` for a text "Close"/"Done" action, in addition to the built-in ×.

## Example
```tsx
<Sheet open={open} onOpenChange={setOpen}>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Northside Food Bank</SheetTitle>
      <SheetDescription>Active partner since Jan 2026</SheetDescription>
    </SheetHeader>
    <SheetBody>{/* contacts, details */}</SheetBody>
    <SheetFooter>
      <Button variant="danger">Remove access</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

## Content rules
`SheetTitle` names the record ("Northside Food Bank"), not the action. If the visible heading is an editable field rather than plain text, still render a `SheetTitle` for the accessible name (visually hidden if it would otherwise duplicate the field).

## Accessibility
Built on the same Radix Dialog primitive as `Dialog`: focus moves in on open and returns to the trigger on close, Esc and outside-click both dismiss, and the panel traps focus. `SheetTitle` is required as the accessible name — never omit it.

## Don't
1. Omitting `SheetTitle`, even when the visible heading is an editable field.
2. Using `Sheet` for a task that isn't anchored to a specific record — use `Dialog`.
3. Nesting a second `Sheet` inside a `Sheet` — use a `Dialog` for a sub-task instead.
