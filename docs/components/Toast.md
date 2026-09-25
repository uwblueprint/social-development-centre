# Toast

A transient, bottom-right notification confirming an action, with an optional undo/action link.

## Use when / Don't use when
- Confirming a completed action that doesn't need a decision ("Changes saved").
- Anything requiring a decision before proceeding — use `AlertDialog`.
- An error blocking progress — show it inline (`Field` `error`) so it doesn't disappear before it's read.

## API
```tsx
import { AppToastProvider, useToast } from "@/components/ui/Toast";
```
- Mount `AppToastProvider` once near the app root.
- `useToast()` returns `{ toast(data) }` where `data` is `{ title, description?, actionLabel?, onAction? }`.
- Lower-level parts (`Toast`, `ToastTitle`, `ToastDescription`, `ToastAction`, `ToastClose`, `ToastViewport`) are exported for custom rendering.

## Example
```tsx
const { toast } = useToast();
toast({
  title: "Changes saved",
  description: "Your profile has been updated successfully.",
  actionLabel: "Undo",
  onAction: handleUndo,
});
```

## Content rules
Title is a short, past-tense confirmation ("Changes saved"), sentence case. Description adds one clarifying sentence at most. `actionLabel` is a verb ("Undo").

## Accessibility
Announced via a Radix live region; swipeable to dismiss, closable via the labeled × button. `ToastAction` sits on its own right-aligned row so it's never confused with close, and needs its own `altText`.

## Don't
1. Using a toast for anything requiring action before continuing — it can disappear unread.
2. Writing a vague title like "Success" — say what succeeded.
3. Mounting more than one `AppToastProvider`.
