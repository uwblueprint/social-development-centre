# ScrollArea

A styled, cross-browser-consistent scrollable region with custom scrollbars.

## Use when / Don't use when
- A fixed-height panel that needs its own internal scroll (a long list inside a card, a menu with many items).
- The page's main scroll — just let the browser handle body/page scrolling; don't wrap the whole page in `ScrollArea`.
- Don't use it purely for visual flourish — only when content genuinely overflows a bounded area.

## API
```tsx
import { ScrollArea } from "@/components/ui/ScrollArea";
```
- Accepts Radix `ScrollAreaProps` (e.g. `type`, `scrollHideDelay`) plus `children`.
- Give the wrapping element (or `ScrollArea` itself via `style`) an explicit height so the internal viewport knows when to scroll.

## Example
```tsx
<div style={{ height: 320 }}>
  <ScrollArea>
    <LongList />
  </ScrollArea>
</div>
```

## Content rules
No copy of its own.

## Accessibility
The scrollbar thumb keeps a minimum 20px hit target via an invisible expanded hit area, so it stays draggable even when the thumb itself renders thin. Content remains natively keyboard-scrollable (arrow keys/Page Down) since the viewport is a normal focusable overflow container.

## Don't
1. Wrapping the whole app/page in `ScrollArea` — reserve it for bounded internal panels.
2. Forgetting to set a height on the container — without one, nothing scrolls.
3. Nesting a `ScrollArea` inside another `ScrollArea` unnecessarily.
