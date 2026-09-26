# ToggleGroup

A segmented control: a row of `ToggleGroupItem`s with a single sliding pill indicating the active choice.

## Use when / Don't use when
- Switching between a small set of views or filters, e.g. Day/Week/Month, or selecting several independent text styles (`type="multiple"`).
- Choosing from a long list — use `Select`.
- A single standalone on/off action — use `Toggle`.
- Navigating between page sections with URL state — consider `Tabs` instead, which pairs with `TabsContent`.

## API
```tsx
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup";
```
- `ToggleGroup`: Radix `type: "single" | "multiple"` (required), `value`/`defaultValue`, `onValueChange`, and `aria-label` (required — the group has no visible label of its own).
- `ToggleGroupItem`: `value` (required), `disabled?`, `aria-label?` for icon-only items.

## Example
```tsx
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup";

<ToggleGroup type="single" defaultValue="week" aria-label="View range">
  <ToggleGroupItem value="day" aria-label="Day">Day</ToggleGroupItem>
  <ToggleGroupItem value="week" aria-label="Week">Week</ToggleGroupItem>
  <ToggleGroupItem value="month" aria-label="Month">Month</ToggleGroupItem>
</ToggleGroup>
```

## Content rules
Short nouns/labels (1–2 words), parallel across items ("Day", "Week", "Month" — not "Daily view" mixed with "Month").

## Accessibility
`aria-label` on the group is required since there's no visible caption. `type="single"` renders one sliding indicator; `type="multiple"` shows a static background per pressed item (both states are never color-only — position/shape also changes). Full keyboard arrow navigation via Radix; visible focus ring per item.

## Don't
1. Omitting the group's `aria-label`.
2. Using `type="multiple"` when only one selection should ever be true — use `type="single"`.
3. Mixing this with `Tabs` for the same content — pick one pattern per screen.
