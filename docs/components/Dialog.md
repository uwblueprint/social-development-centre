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
- `DialogContent` — the overlay, panel, and a built-in labeled close (×) button. `$variant="illustration"` puts the panel on the illustrations' ground so an illustration's square blends in (the offline dialog).
- `DialogTitle` (required), `DialogDescription` (optional), `DialogActions` — right-aligned action row, separated from the body by spacing. `DialogTitle $flush` drops the title's margin and its space for the close button, for a centered title.

## Example
```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild><Button>Edit profile</Button></DialogTrigger>
  <DialogContent>
    <DialogTitle>Edit profile</DialogTitle>
    <DialogDescription>Update your display name and bio.</DialogDescription>
    {/* form fields */}
    <DialogActions>
      <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
      <Button type="submit">Save changes</Button>
    </DialogActions>
  </DialogContent>
</Dialog>
```

## Content rules
Title is a short noun phrase naming the task ("Edit profile"), not a question. Primary action starts with a verb ("Save changes"); cancel is always "Cancel".

## Accessibility
Focus moves into the dialog on open and returns to the trigger on close. Esc and outside-click both dismiss. `DialogTitle` is required as the accessible name — never omit it.

## Don't
1. Omitting `DialogTitle`.
2. Using `Dialog` for a destructive confirmation — use `AlertDialog`.
3. Hand-rolling a footer instead of `DialogActions` — keep action spacing consistent.
