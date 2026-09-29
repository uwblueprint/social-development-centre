# Collapsible

A single expandable/collapsible region ("Show more"/"Show less"), the building block behind `Accordion`.

## Use when / Don't use when
- One standalone block that toggles open/closed (a note with a "Show more" button).
- Several independent expandable sections — use `Accordion`, which manages one/many-open state for you.
- Don't use it just to hide required form fields — keep required fields visible per the design principles.

## API
```tsx
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/Collapsible";
```
- `Collapsible` (Root): `open`/`onOpenChange` (controlled) or `defaultOpen`.
- `CollapsibleTrigger asChild` — wrap your own `Button`; toggle its own label between "Show more"/"Show less".
- `CollapsibleContent` — animates height open/closed.

## Example
```tsx
<Collapsible open={showMore} onOpenChange={setShowMore}>
  <Row>
    <span>Attendance is up 12% since introducing evening slots.</span>
    <CollapsibleTrigger asChild>
      <Button size="sm" variant="ghost">{showMore ? "Show less" : "Show more"}</Button>
    </CollapsibleTrigger>
  </Row>
  <CollapsibleContent>{/* extra detail */}</CollapsibleContent>
</Collapsible>
```

## Content rules
Trigger label reflects the action and current state as a pair: "Show more" ⇄ "Show less" — never a static "Toggle".

## Accessibility
`CollapsibleTrigger` is a real button with `aria-expanded`/`aria-controls` wired by Radix; height animates via a CSS custom property so reduced-motion users still get an instant show/hide (handled globally).

## Don't
1. Using a static trigger label that doesn't change with state (e.g. always "Toggle").
2. Hiding content someone needs to complete a required task behind a collapsible.
3. Reaching for this when you actually have several sections — use `Accordion` instead of managing multiple `Collapsible`s by hand.
