# Card

A bordered, raised container for a self-contained block of content, with header/content/footer slots.

## Use when / Don't use when
- Grouping related content as one visual unit in a grid or list (a program summary, a settings panel).
- A full-page or full-section layout — don't nest `Card` inside `Card`.
- A list/table row — use hairline `--color-border` separators instead of individual cards (density rule).

## API
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
```
- All are plain styled elements (`div`, `h3`, `p`) with no special props beyond their native ones — compose them in order.
- `CardFooter` holds the action row, separated from content by spacing.

## Example
```tsx
<Card>
  <CardHeader>
    <CardTitle>Community program</CardTitle>
    <CardDescription>Neighborhood literacy initiative, spring cohort.</CardDescription>
  </CardHeader>
  <CardContent>{/* body */}</CardContent>
  <CardFooter>
    <Button size="sm">View program</Button>
  </CardFooter>
</Card>
```

## Content rules
`CardTitle` is a short noun phrase; `CardDescription` is one line of plain-language context, not a repeat of the title.

## Accessibility
`CardTitle` renders as an `<h3>` — make sure the surrounding page heading order still makes sense (don't skip levels). Uses `--shadow-sm`, reserving heavier shadows for true overlays per the design principles.

## Don't
1. Nesting a `Card` inside another `Card`.
2. Using `Card` for dense list/table rows — use hairline borders instead (see `Separator`).
3. Skipping `CardHeader`/`CardTitle` and hand-styling a heading — breaks the heading hierarchy and spacing rhythm.
