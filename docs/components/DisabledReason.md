# DisabledReason

Wraps a disabled or read-only control with a hover/focus-reachable tooltip explaining why.

## Use when / Don't use when
- Any control that is `disabled` or `readOnly` — the reason must be reachable, not just implied by grey styling.
- Prefer `Field`'s built-in `disabled`/`disabledReason` props for labeled form controls over wrapping manually.
- Don't use for a control that's simply loading — that's transient, not "disabled"; use a skeleton or spinner instead.

## API
```tsx
import { DisabledReason, DisabledArea, DisabledIcon, type DisabledReasonText } from "@/components/ui/DisabledReason";
```
- `DisabledReasonText = string | null` — product copy: ask for it, use their words. `null` only if declined/unknown.
- `DisabledReason({ reason, children })` — `children` then a lock icon (only if `reason` is set).
- `DisabledArea({ reason, block?, children })` — layout wrapper used internally by `Checkbox`/`Field`/`RadioGroupOption`/`SliderField`.
- `DisabledIcon({ reason })` — the lock glyph alone.

## Example
```tsx
import { DisabledReason } from "@/components/ui/DisabledReason";
import { Button } from "@/components/ui/Button";

<DisabledReason reason="Add at least one volunteer before publishing.">
  <Button disabled>Publish</Button>
</DisabledReason>
```

## Content rules
State what's blocking the action and, where possible, how to unblock it. Sentence case, no fragments like "Missing data".

## Accessibility
The lock icon is a focusable `<button>`, reachable by keyboard; hovering, focusing, or tapping it opens the tooltip.

## Don't
1. Inventing a reason — always ask; pass `disabledReason={null}` if none is given.
2. Disabling a control directly without this wrapper — the reason becomes undiscoverable.
3. Using this for `readOnly` without explaining why it can't change.
