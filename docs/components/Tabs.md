# Tabs

Switches between panels of content under a sliding-pill tab list.

## Use when / Don't use when
- Several views of related content under one heading (Overview/Schedule/Resources) shown one at a time.
- A small set of filters or view toggles that don't have distinct "content" — use `ToggleGroup` instead.
- Primary page-level navigation between unrelated sections — use real links/routes, not `Tabs`.

## API
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
```
- `Tabs` (Root): `defaultValue`/`value`, `onValueChange`.
- `TabsList` — needs `aria-label` (no visible caption of its own); renders the sliding active-tab indicator automatically.
- `TabsTrigger`: `value` (required), `disabled?`.
- `TabsContent`: `value` (required).

## Example
```tsx
<Tabs defaultValue="overview">
  <TabsList aria-label="Session sections">
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="schedule">Schedule</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">...</TabsContent>
  <TabsContent value="schedule">...</TabsContent>
</Tabs>
```

## Content rules
Tab labels are short nouns (1–2 words), parallel across the set.

## Accessibility
Full ARIA tabs pattern via Radix (roving tabindex, arrow-key navigation). `TabsContent` is focusable and gets a visible focus ring so keyboard users landing on a panel after switching tabs see where they are. Always set `TabsList`'s `aria-label`.

## Don't
1. Omitting `TabsList`'s `aria-label`.
2. Using `Tabs` for unrelated page sections better served by real navigation/routes.
3. Using `Tabs` when there's no distinct content per option — that's `ToggleGroup`.
