# Toggle

A single pressable button with a persistent on/off state (e.g. a formatting button).

## Use when / Don't use when
- A standalone on/off control that isn't part of a labeled form field, like a toolbar "Bold" button.
- A form-level boolean setting with a visible label — use `Switch` inside a `Label`/`Field` instead.
- Choosing one of several mutually exclusive options — use `ToggleGroup type="single"`.

## API
```tsx
import { Toggle } from "@/components/ui/Toggle";
```
- Accepts Radix `ToggleProps`: `pressed`, `defaultPressed`, `onPressedChange`, `disabled`.
- Icon-only or ambiguous-label toggles need `aria-label` (e.g. `aria-label="Toggle bold"`).
- Disabled needs `disabledReason` via `DisabledReason`.

## Example
```tsx
import { Toggle } from "@/components/ui/Toggle";

<Toggle aria-label="Toggle bold" defaultPressed>
  Bold
</Toggle>
```

## Content rules
Label the visible action, not the state: "Bold", not "Bold: on". If icon-only, the `aria-label` should name the action ("Toggle bold"), not just "Bold".

## Accessibility
Renders `role="button"` with `aria-pressed`, so pressed state is announced — never shown by color/background alone; text or icon should also change if the meaning isn't obvious from context. Full keyboard support (Enter/Space) and visible focus ring.

## Don't
1. Using `Toggle` for a multi-option choice — that's `ToggleGroup`.
2. Skipping `aria-label` on an icon-only toggle.
3. Disabling without `disabledReason`.
