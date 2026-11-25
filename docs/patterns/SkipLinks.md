# SkipLinks

Links that are hidden until a keyboard user tabs to them, then jump focus past repeated content (the sidebar, a page header) to the part of the page they came for.

## Use when / Don't use when
- Every signed-in page, once the real sidebar exists: the first link is "Skip to main content". Add a second for another major landmark that is a long way into the tab order (the Outbox adds "Skip to calendar").
- Don't add a skip link for a short page with nothing to skip, and don't use more than three.

## API
```tsx
import { SkipLinks } from "@/components/patterns/SkipLinks";
<SkipLinks links={[{ targetId: "outbox-title", label: "Skip to main content" }]} />
```
- Render it first in the page so the links are the first tab stops.
- The target needs a matching `id` and `tabIndex={-1}`, and a `:focus-visible` ring (`box-shadow: var(--focus-ring)`, `--radius-sm`) so people can see where they landed. Pick a heading, so screen readers start reading from it.
- Activating a link moves focus (not just scroll) to the target. Leave a link out when its target isn't on the page.

## Behavior
Hidden visually (still focusable and read aloud) until it has focus; then shows at the top-left with the primary focus ring over the page. Copy is sentence case: "Skip to main content", "Skip to calendar". Nothing happens on mouse hover, and mouse users never see it.

## Where the main-content target goes
At the heading that starts the page's main job, not at the first item of a list: the tabs, search and filters are part of the job, so skipping them would cost the user. In the Outbox that is the "Outbox" `h1`: the next Tab reaches the tabs, then search, then the list's single tab stop.
