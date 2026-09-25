# Icon

Wraps a `lucide-react` glyph with the kit's fixed stroke and default size.

## Use when / Don't use when
- Rendering any icon in the app — never import a `lucide-react` icon directly.
- Don't use for photographic or brand imagery — use `Avatar` or a plain `<img>`.
- Don't use it to convey status alone — pair with a text label per the "never color alone" rule.

## API
```tsx
import { Icon } from "@/components/ui/Icon";
```
- `icon: LucideIcon` (required) — the glyph component, e.g. `Info`, `X`.
- `size?: number` — default `16`.
- `label?: string` — set only when the icon is the *sole* content of a control. Adds `role="img"` and `aria-label`; omitting it marks the icon `aria-hidden`.
- Other `LucideProps` pass through (`strokeWidth` is fixed at `1.5`, don't override).

## Example
```tsx
import { Info } from "lucide-react";
import { Icon } from "@/components/ui/Icon";

<Button variant="ghost" size="sm" aria-label="More info">
  <Icon icon={Info} label="More info" />
</Button>
```

## Content rules
No copy of its own. If it sits next to text, don't duplicate the same words in the icon's `label` and the visible text.

## Accessibility
Decorative by default (`aria-hidden`). Set `label` whenever the icon is the only content people can perceive as the control's name — an unlabeled icon-only button has no accessible name.

## Don't
1. Importing icons from `lucide-react` directly in app code — go through `Icon`.
2. Leaving an icon-only button without `label` or an outer `aria-label`.
3. Overriding `strokeWidth` per-icon — breaks the kit's consistent line weight.
