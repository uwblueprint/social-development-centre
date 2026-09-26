# Badge

A small inline label for a status or category.

## Use when / Don't use when
- Compact status/category labels next to a title (e.g. "Active", "11 members").
- Anything clickable or removable — use `Tag`/`SelectableTag`/`RemovableTag` instead.
- Conveying status by color alone — pair with clear text, and an icon if the status is safety-critical.

## API
```tsx
import { Badge } from "@/components/ui/Badge";
```
- `$variant?: "neutral" | "primary" | "success" | "danger" | "outline"` — default `neutral`.
- Plain `<span>` props otherwise.

## Example
```tsx
<Badge $variant="success">Active</Badge>
<Badge $variant="outline">11 members</Badge>
```

## Content rules
One or two words, sentence case (or a short count like "11 members"). Use `success`/`danger` variants only for genuine status, not for decoration.

## Accessibility
`success`/`danger` variants use tinted `-subtle`-strength backgrounds with the matching text color at readable contrast — but the label text itself is always the source of truth; never remove it and rely on color to carry meaning.

## Don't
1. Making a `Badge` clickable — it's not interactive; use `Tag`/`Button` instead.
2. Using `danger`/`success` variants for non-status decoration.
3. Relying on badge color alone in a legend without a text label nearby.
