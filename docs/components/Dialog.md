# Dialog

A modal window for a focused task — editing a record, a short form — that blocks the rest of the page until dismissed.

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
- `DialogTitle` (required), `DialogDescription` (optional), `DialogActions` — right-aligned action row with a top divider.

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
3. Hand-rolling a footer instead of `DialogActions` — keep the divider consistent.
