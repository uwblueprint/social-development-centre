# Separator

A 1px hairline divider, horizontal or vertical.

## Use when / Don't use when
- Dividing rows in a list/table, or sections within a card (per the "separate with hairlines" principle).
- Separating an overlay's action row from its body — `DialogActions`/`CardFooter`/`PopoverActions` already build this in; don't add a second one.
- Don't use a shadow or extra whitespace alone to separate dense rows — hairlines are the default here.

## API
```tsx
import { Separator } from "@/components/ui/Separator";
```
- Radix `Separator.Root` props: `orientation?: "horizontal" | "vertical"` (default horizontal), `decorative?: boolean`.

## Example
```tsx
<p>Attendance is up 12% since introducing evening slots.</p>
<Separator style={{ margin: "var(--space-3) 0" }} />
<p>Action items were assigned to Amara and Devon.</p>
```

## Content rules
No copy of its own — purely structural.

## Accessibility
Set `decorative` (default behavior when used purely for visual spacing) so screen readers skip it; only omit that when the separator marks a real semantic boundary a screen reader should announce.

## Don't
1. Using a full `--shadow-md` card border where a `Separator` would do — reserve shadows for overlays.
2. Adding a `Separator` between content and actions in dialogs, toasts, popovers or cards; those use spacing, not lines.
3. Using `margin`/`padding` with raw pixel values around it instead of `--space-*` tokens.
