# Badge

A small inline label for a status or category.

**Badges show state and never look clickable.** No neutral fill (a grey chip reads as a secondary button), a 1px `--color-border` outline, `--color-text-muted` text at `--text-xs`, 20px tall (shorter than the smallest 32px button), and the default cursor.

## Use when / Don't use when
- Compact status/category labels next to a title (e.g. "Active", "11 members").
- Anything clickable or removable — use `Tag`/`SelectableTag`/`RemovableTag` instead.
- Conveying status by color alone — pair with clear text, and an icon if the status is safety-critical.

## API
```tsx
import { Badge } from "@/components/ui/Badge";
```
- `$variant?: "neutral" | "primary" | "success" | "warning" | "danger" | "info" | "outline"` — default `neutral`.
  - `neutral`: no fill, `--color-border` outline, muted text. Categories and counts.
  - `success` / `warning` / `danger` / `info`: the `-subtle` fill, the status color as text and a matching `--color-*-border` hairline.
  - `outline`: like `neutral` but with `--color-text` text, for a count or category that needs more weight.
  - `primary`: filled dark. Rare; one per screen at most.
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
Every variant's text meets 4.5:1: `neutral` is `--color-text-muted` on the page background (7:1 on white); `success`/`warning`/`danger`/`info` use the status color on its `-subtle` fill (all 4.9:1 or more; `warning` is the lowest). The border is decorative (the text carries the meaning), so it doesn't need 3:1 — but the label text itself is always the source of truth; never remove it and rely on color to carry meaning.

## Don't
1. Making a `Badge` clickable, or styling a button to look like one — it's not interactive; use `Tag`/`Button` instead.
2. Using `danger`/`success` variants for non-status decoration.
3. Relying on badge color alone in a legend without a text label nearby.
