# Switch

An on/off control for a setting that takes effect immediately.

## Use when / Don't use when
- A single setting that applies right away (no form "Save" needed), like "Email notifications".
- A choice that needs an explicit form submit — use `Checkbox` instead, which reads as a pending selection.
- Choosing one of several options — use `RadioGroup` or `ToggleGroup`.

## API
```tsx
import { Switch } from "@/components/ui/Switch";
```
- Radix `SwitchProps`: `checked?`, `defaultChecked?`, `onCheckedChange?`, `disabled?`.
- Always paired with an inline `Label` (`htmlFor`) — never rely on surrounding prose alone.
- Wrap `disabled` in `DisabledReason`.

## Example
```tsx
import { Switch } from "@/components/ui/Switch";
import { Label } from "@/components/ui/Label";

<Switch id="email-notif" defaultChecked />
<Label htmlFor="email-notif">Email notifications</Label>
```

## Content rules
Label names the setting being turned on, in sentence case, no "Enable"/"Disable" prefix needed — the switch itself shows the state.

## Accessibility
Renders `role="switch"` with `aria-checked`; the thumb's position and track color both change together, never color alone. Space toggles, visible focus ring, disabled uses reduced opacity plus `not-allowed` cursor.

## Don't
1. Using `Switch` for a setting that only takes effect after a "Save" button — use `Checkbox`.
2. Disabling without `disabledReason`.
3. Omitting the adjacent `Label`.
