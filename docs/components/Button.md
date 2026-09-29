# Button

A clickable control for a single action, styled with six variants (plus `dropzone`) and three sizes.

## Use when / Don't use when
- Triggering an action: submit a form, open a `Dialog`, confirm a change.
- Navigating to another page — use a link, not `Button`.
- Toggling a persistent state — use `Switch` or `Toggle`.
- Picking one of several options — use `ToggleGroup`/`RadioGroup`.

## API
```tsx
import { Button } from "@/components/ui/Button";
```
- `$variant?: "primary" | "secondary" | "outline" | "ghost" | "danger"` — default `primary`. There is no link-style variant (owner, 28 Sep): every action is a box. For a quiet in-content action ("Back", "Download template") use `ghost` or `secondary` at `$size="sm"`.
  - `dropzone` is the large dashed target that opens a file picker or takes a dropped file (the image field, the CSV import). It fills the width and lays its content out in a column. Pass `$dragging` while a file is dragged over it to highlight it.
- `$dragging?: boolean` — `dropzone` only.
- `$size?: "sm" | "md" | "lg"` — default `md`.
- All native `<button>` props (`type`, `disabled`, `onClick`, …).
- Icon-only buttons need `aria-label` (hard rule #3); disabled buttons need `disabledReason` via `DisabledReason`.

## Example
```tsx
import { Button } from "@/components/ui/Button";
import { DisabledReason } from "@/components/ui/DisabledReason";

<DisabledReason reason="Add at least one volunteer before publishing.">
  <Button disabled>Publish</Button>
</DisabledReason>
```

## Content rules
Start with a verb: "Save changes", not "OK". Sentence case, no ALL CAPS, 1–4 words. `danger` variant names the destructive action: "Delete project", not "Confirm".

## Accessibility
Native `<button>`, keyboard-reachable and Space/Enter-activatable. Every variant clears 4.5:1 text contrast, including `:disabled` (reduced opacity, never color alone). Visible focus ring.

## Don't
1. Rendering a native `<button>` in `src/app/**` — lint blocks it.
2. Using `disabled` without `DisabledReason`.
3. Giving every button `primary` — reserve it for the one main action per screen.
4. Icon-only button with no `aria-label`.
