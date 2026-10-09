# HoverCard

A read-only preview panel that opens on hovering or focusing a trigger, like a profile card on an @mention.

## Use when / Don't use when
- Non-interactive supplementary info about something already visible (a person, a linked record).
- Any interactive control inside the panel — use `Popover`.
- A single short line of help text — use `Tooltip`, which is lighter-weight.

## API
```tsx
import { HoverCard, HoverCardTrigger, HoverCardContent, HoverCardTriggerLink } from "@/components/ui/HoverCard";
```
- `HoverCard` (Root), `HoverCardTrigger asChild`.
- `HoverCardTriggerLink` — pre-styled underlined-dotted trigger affordance (e.g. for @mentions) so it reads as hoverable before the card ever opens.
- `HoverCardContent({ sideOffset = 8, ... })` — fixed 300px wide panel with an arrow.

## Example
```tsx
<HoverCard>
  <HoverCardTrigger asChild>
    <HoverCardTriggerLink type="button">@janedoe</HoverCardTriggerLink>
  </HoverCardTrigger>
  <HoverCardContent>
    <p>Jane Doe</p>
    <p>Product designer at Acme Co.</p>
  </HoverCardContent>
</HoverCard>
```

## Content rules
Keep it scannable: a name/title line plus 1–3 short meta lines. No calls to action — that belongs in a `Popover`.

## Accessibility
Opens on hover *and* keyboard focus, so keyboard-only users reach the same content. `HoverCardTriggerLink` shows a dotted underline by default (solid + accent on hover/focus), so the affordance isn't color-only.

## Don't
1. Putting an interactive control inside `HoverCardContent` — use `Popover` instead.
2. Using a plain unstyled trigger instead of `HoverCardTriggerLink`.
3. Relying on hover alone without testing the keyboard-focus path.
