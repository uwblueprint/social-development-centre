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
- `Tabs` (Root): `defaultValue`/`value`, `onValueChange`, `activationMode?: "automatic" | "manual"` (default `"automatic"`; see Keyboard).
- `TabsList` — needs `aria-label` (no visible caption of its own); renders the shared bottom border. `loading?: boolean` and `loadingLabel?: string` show that the selected tab's content is on its way (see Loading).
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

## Loading
When switching tabs takes a moment, keep the new tab selected, keep the previous content on screen (no flash of empty), and pass `loading` to `TabsList`. The selected tab's underline becomes a `--color-border-strong` track with a 40% wide `--color-primary` segment sweeping left to right across the tab's width (`--duration-slow` x 5, looping), 2px tall, inside the tab's own width. Reduced motion: no sweep; the segment stays at half width. The list gets `aria-busy`. Always pass `loadingLabel` ("Loading All"): it renders a visually hidden polite status beside the list, so loading isn't conveyed by the animation alone. Mark the panel `aria-busy` too.

```tsx
<TabsList aria-label="Show recipients" loading={pending} loadingLabel={pending ? "Loading All" : undefined}>
```

## Content rules
Tab labels are short nouns (1–2 words), parallel across the set. Counts/suffixes go in `TabsCount` after the label, not baked into the label text.

## Keyboard
Tab enters the list once (on the selected tab); Left/Right (Home/End) move between tabs; Tab leaves the list.
- **Automatic (default):** arrow keys move focus and select, so the panel changes as you arrow. Right when panels are instant (static content).
- **Manual (`activationMode="manual"`):** arrow keys move focus only; Enter or Space selects. Use it whenever selecting a tab loads or fetches content (the `loading` state), so arrowing across the set doesn't fire a load per key press. It is opt-in, not the default, because for instant panels the ARIA tabs pattern recommends automatic activation and manual adds a keypress for nothing. The Outbox uses manual.

## Focus
A 2px `--focus-ring` (4px reach, `--radius-sm`) shown on `:focus-visible` only, drawn tight around the tab's label box. It sits above the underline and never covers it, so the two read separately: the ring is where the keyboard is, the underline is what is selected. A focused but unselected tab shows the ring and no underline; the selected tab shows the underline, and both when it also has focus. The ring stays inside the tab's own padding, so it is never clipped by the scrolling list.

## Accessibility
Full ARIA tabs pattern via Radix (roving tabindex, arrow-key navigation). `TabsContent` is focusable and gets a visible focus ring so keyboard users landing on a panel after switching tabs see where they are. Each `TabsTrigger` gets its own focus ring; the active state pairs the underline with a heavier label weight, never the border color alone. Always set `TabsList`'s `aria-label`.

## Don't
1. Omitting `TabsList`'s `aria-label`.
2. Using `Tabs` for unrelated page sections better served by real navigation/routes.
3. Using `Tabs` when there's no distinct content per option — that's `ToggleGroup`.
4. Putting a count in the label string instead of `TabsCount` — it needs to read as muted regardless of active state.

Motion: none for selection. The active line jumps to the selected tab; selection is instant. Loading is the one exception: the sweep described above. Tab labels fade colour on hover (`--duration-fast`). See `docs/design/motion.md`.
