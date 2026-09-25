# AlertDialog

A modal that interrupts for a decision the person must explicitly confirm or cancel — no outside-click dismiss.

## Use when / Don't use when
- Confirming a destructive or hard-to-reverse action: delete, remove access, discard changes.
- Any other modal task (editing, forms) — use `Dialog`, which allows outside-click dismiss.
- A low-stakes heads-up that doesn't need a decision — use `Toast`.

## API
```tsx
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogTitle,
  AlertDialogDescription, AlertDialogCancel, AlertDialogAction, AlertDialogActions,
} from "@/components/ui/AlertDialog";
```
- `AlertDialog` (Root), `AlertDialogTrigger asChild`.
- `AlertDialogContent` — overlay + panel + close (×) button.
- `AlertDialogTitle` (required), `AlertDialogDescription`.
- `AlertDialogCancel asChild` / `AlertDialogAction asChild` inside `AlertDialogActions`.

## Example
```tsx
<AlertDialog>
  <AlertDialogTrigger asChild><Button variant="danger">Delete project</Button></AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogTitle>Delete project?</AlertDialogTitle>
    <AlertDialogDescription>
      This will permanently delete the project and all of its data. This action cannot be undone.
    </AlertDialogDescription>
    <AlertDialogActions>
      <AlertDialogCancel asChild><Button variant="secondary">Cancel</Button></AlertDialogCancel>
      <AlertDialogAction asChild><Button variant="danger">Yes, delete</Button></AlertDialogAction>
    </AlertDialogActions>
  </AlertDialogContent>
</AlertDialog>
```

## Content rules
Title is a direct question naming the action and object ("Delete project?"). Description states consequences and reversibility plainly. Confirm button restates the verb ("Yes, delete"), never just "OK"/"Confirm".

## Accessibility
Unlike `Dialog`, outside-click and the overlay don't dismiss it — only `AlertDialogCancel`/`AlertDialogAction`/Esc do, so an irreversible choice is never made by accident. `AlertDialogTitle` is required as the accessible name.

## Don't
1. Using `AlertDialog` for non-destructive flows — it blocks outside-click dismiss, which frustrates routine tasks.
2. Labeling the confirm action "OK" instead of naming the action.
3. Omitting `AlertDialogDescription` on a destructive action — always state what will happen.
