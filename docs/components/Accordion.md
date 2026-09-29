# Accordion

Expandable/collapsible sections with a plus-to-minus trigger icon, for FAQs or grouped detail.

## Use when / Don't use when
- A list of independent Q&A or detail sections where most stay collapsed (FAQs, grouped settings detail).
- A single expand/collapse of one block — use `Collapsible` directly instead.
- Content people need to compare side-by-side — collapsing hides it; consider `Tabs` or just showing it all.

## API
```tsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/Accordion";
```
- `Accordion` (Root): `type: "single" | "multiple"` (required), `collapsible?` (for `single`, allows closing the open item), `defaultValue`/`value`.
- `AccordionItem`: `value` (required), `disabled?`.
- `AccordionTrigger`: label plus the animated plus/minus icon.
- `AccordionContent`: animates open/closed.

## Example
```tsx
<Accordion type="single" collapsible defaultValue="item-0">
  {faq.map((item, i) => (
    <AccordionItem value={`item-${i}`} key={item.q}>
      <AccordionTrigger>{item.q}</AccordionTrigger>
      <AccordionContent><p>{item.a}</p></AccordionContent>
    </AccordionItem>
  ))}
</Accordion>
```

## Content rules
Trigger text is the question or heading itself, sentence case, ending in "?" for FAQs. Keep answers to a few sentences — longer content belongs on its own page.

## Accessibility
Trigger is a real `<button>` in a heading, with the plus/minus icon marked `aria-hidden` (state carries via `aria-expanded`, not icon shape alone). Full keyboard support (Enter/Space, arrow keys via Radix).

## Don't
1. Using `type="single"` without `collapsible` when people should be able to close the open item.
2. Nesting focus-sensitive controls without testing the animated height change.
3. Using `Accordion` to hide content actually needed for side-by-side comparison.
