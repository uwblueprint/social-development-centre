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
- `$variant?: "neutral" | "primary" | "success" | "warning" | "danger" | "outline"` — default `neutral`.
- Compact on purpose: `--text-xs` with half of `--space-3` horizontal padding, so it doesn't compete with the text beside it.
- Plain `<span>` props otherwise.

## Example
```tsx
<Badge $variant="success">Active</Badge>
<Badge $variant="warning">Invitation pending</Badge>
<Badge $variant="outline">11 members</Badge>
```

## Content rules
One or two words, sentence case (or a short count like "11 members"). Use `warning` for something waiting on someone (pending invitations). Use `success`/`warning`/`danger` variants only for genuine status, not for decoration.

## Accessibility
`success`/`warning`/`danger` variants use the `-subtle` background with the matching status color as text (`warning`: `--color-warning` on `--color-warning-subtle`, 4.9:1) — but the label text itself is always the source of truth; never remove it and rely on color to carry meaning.

## Don't
1. Making a `Badge` clickable — it's not interactive; use `Tag`/`Button` instead.
2. Using `danger`/`success` variants for non-status decoration.
3. Relying on badge color alone in a legend without a text label nearby.
