# Dialog

A modal window for a focused task — editing a record, a short form — that blocks the rest of the page until dismissed.

The overlay dims and slightly blurs the page (`backdrop-filter: blur(var(--overlay-blur))`), so the decision in front reads first. Sheets dim without blurring, because the list behind a sheet is context people keep reading.

## Use when / Don't use when
- A self-contained task needing the person's full attention and a clear commit/cancel.
- Confirming a destructive action — use `AlertDialog`, which can't be dismissed by outside click.
- A small, contextual action anchored to a trigger — use `Popover`.

## API
```tsx
import {
  Dialog, DialogTrigger, DialogContent, DialogTitle,
  DialogDescription, DialogClose, DialogActions,
} from "@/components/ui/Dialog";
```
- `Dialog` (Root): `open`/`onOpenChange`.
- `DialogTrigger asChild` — wrap your own `Button`.
- `DialogContent` — the overlay, panel, and a built-in labeled close (×) button.
- `DialogTitle` (required), `DialogDescription` (optional, only when it adds something), `DialogActions` — the footer. The action sits on the right; a `CancelButton` is pinned to the far left, lined up with the content, so it's hard to hit by mistake.
- Spacing is built in: 8px from title to description, 16px from title to the body when there's no description.

## Example
```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild><Button>Edit profile</Button></DialogTrigger>
  <DialogContent>
    <DialogTitle>Edit profile</DialogTitle>
    <DialogDescription>Update your display name and bio.</DialogDescription>
    {/* form fields */}
    <DialogActions>
      <DialogClose asChild><CancelButton /></DialogClose>
      <Button type="submit">Save changes</Button>
    </DialogActions>
  </DialogContent>
</Dialog>
```

## Content rules
Title is a short noun phrase naming the task ("Edit profile"), not a question. Primary action starts with a verb ("Save changes") and carries the same icon as the button that opened the dialog (Add person → Plus, Delete → Trash2). Cancel is always "Cancel". Footers use only primary (or `danger` for a destructive confirm) and secondary buttons, never outline or ghost. A multi-step dialog drops Cancel (the × closes it) and uses Back (secondary, left) and Continue (primary, right).

## Accessibility
Focus moves into the dialog on open and returns to the trigger on close. Esc and outside-click both dismiss. `DialogTitle` is required as the accessible name — never omit it.

## Don't
1. Omitting `DialogTitle`.
2. Using `Dialog` for a destructive confirmation — use `AlertDialog`.
3. Hand-rolling a footer instead of `DialogActions` — keep action spacing consistent.
