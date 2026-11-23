# Toast

A transient notification at the bottom centre of the screen confirming an action, with an optional undo/action link. A thin bar along its bottom edge empties as its time runs out.

## Use when / Don't use when
- Confirming a completed action that doesn't need a decision. **Always name what it was about** (owner): "“Film night” saved as a draft", "Copied 3 email addresses from Northside Food Bank", never a bare "Changes saved" or "Copied".
- Anything requiring a decision before proceeding — use `AlertDialog`.
- An error blocking progress — show it inline (`Field` `error`) so it doesn't disappear before it's read.

## API
```tsx
import { AppToastProvider, useToast } from "@/components/ui/Toast";
```
- Mount `AppToastProvider` once near the app root.
- `useToast()` returns `{ toast(data) }` where `data` is `{ title, description?, actionLabel?, onAction?, tone? }`. `tone: "danger"` is for something that failed: red, with an alert icon. A toast with an action (Undo, Try again) has no × button: it's too easy to hit instead of Undo, and the toast goes on its own.
- Lower-level parts (`Toast`, `ToastTitle`, `ToastDescription`, `ToastAction`, `ToastClose`, `ToastViewport`) are exported for custom rendering.
- `<Toast persistent open={…}>`: a toast that stays until the page sets `open` to false, with no close button and no time bar. Only for a state the person has to act on wherever they are, e.g. "You have unsaved changes" with a Save action (Settings). Render it inside `AppToastProvider`; ignore `onOpenChange` so a swipe doesn't hide it.

## Example
```tsx
const { toast } = useToast();
toast({
  title: "Changes to “Film night” saved.",
  description: "Your profile has been updated successfully.",
  actionLabel: "Undo",
  onAction: handleUndo,
});
```

## Content rules
Title is a short, past-tense confirmation ("Changes saved"), sentence case. One string: skip the description unless it says something the action can't ("Couldn't save your edits" + Try again is enough). A failed action is a danger toast, not an error inside a dialog that has closed its job. `actionLabel` is a verb ("Undo").

## Layering
The viewport is portalled to `<body>` at `--z-toast`, the top of the z-index scale in `tokens.ts` (above `--z-modal`, `--z-popover` and `--z-tooltip`), so a toast fired from inside a sheet or dialog ("Copied") shows above it. Use the `--z-*` tokens for any new layer; never a raw number.

## Accessibility
Announced via a Radix live region; swipe down to dismiss, closable via the labeled × button. Hovering or focusing a toast pauses its clock and its time bar; with reduced motion the bar is hidden. A toast stays 5 seconds, or 8 with an action (time to reach Undo). `ToastAction` sits on the message's line, before close, and needs its own `altText`.

## Don't
1. Using a toast for anything requiring action before continuing — it can disappear unread.
2. Writing a vague title like "Success" — say what succeeded.
3. Mounting more than one `AppToastProvider`.

Action and close (owner, Nov 2026): one line. The message, then the optional action (a kit `Button`, outline, small), then the close (X). A long message wraps in its own column; the action and close stay on the right.
