# Tabs

Switches between panels of content, shown as underline tabs: text labels on a shared bottom border, with a 2px underline on the active one.

## Use when / Don't use when
- Several views of related content under one heading (Overview/Schedule/Resources) shown one at a time.
- A small set of filters or view toggles that don't have distinct "content" — use `ToggleGroup` instead (a segmented control, not underline tabs).
- Primary page-level navigation between unrelated sections — use real links/routes, not `Tabs`.

## API
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsCount } from "@/components/ui/Tabs";
```
- `Tabs` (Root): `defaultValue`/`value`, `onValueChange`.
- `TabsList` — needs `aria-label` (no visible caption of its own); renders the shared bottom border.
- `TabsTrigger`: `value` (required), `disabled?`.
- `TabsCount` — wraps a count/suffix placed after a trigger's label; always muted (`--color-text-muted`), whether or not the tab is active.
- `TabsContent`: `value` (required).

## Example
```tsx
<Tabs defaultValue="general">
  <TabsList aria-label="Community views">
    <TabsTrigger value="general">
      General members
      <TabsCount>({counts.general})</TabsCount>
    </TabsTrigger>
    <TabsTrigger value="paying">
      Paying members
      <TabsCount>({counts.paying})</TabsCount>
    </TabsTrigger>
  </TabsList>
  <TabsContent value="general">...</TabsContent>
  <TabsContent value="paying">...</TabsContent>
</Tabs>
```

## Content rules
Tab labels are short nouns (1–2 words), parallel across the set. Counts/suffixes go in `TabsCount` after the label, not baked into the label text.

## Accessibility
Full ARIA tabs pattern via Radix (roving tabindex, arrow-key navigation). `TabsContent` is focusable and gets a visible focus ring so keyboard users landing on a panel after switching tabs see where they are. Each `TabsTrigger` gets its own focus ring; the active state pairs the underline with a heavier label weight, never the border color alone. Always set `TabsList`'s `aria-label`.

## Don't
1. Omitting `TabsList`'s `aria-label`.
2. Using `Tabs` for unrelated page sections better served by real navigation/routes.
3. Using `Tabs` when there's no distinct content per option — that's `ToggleGroup`.
4. Putting a count in the label string instead of `TabsCount` — it needs to read as muted regardless of active state.
