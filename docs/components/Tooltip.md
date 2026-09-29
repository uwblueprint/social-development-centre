# Tooltip

A short, hover/focus/tap-triggered label that supplements a control's meaning — most often an icon-only button.

## Use when / Don't use when
- One short line explaining an icon-only control, or the delivery mechanism behind `DisabledReason`.
- Anything longer than a sentence, or with structure/links — use `Popover` or `HoverCard`.
- Don't hold the *only* copy of essential information — mouse users must hover to see it, so critical info needs a visible fallback.

## API
```tsx
import { Tooltip, TooltipProvider } from "@/components/ui/Tooltip";
```
- Mount one `TooltipProvider` near the app/demo root (`delayDuration=0`, `skipDelayDuration=300` by default).
- `Tooltip({ content: ReactNode, children: ReactElement, side?, delayDuration?, pinOnClick? })` — wraps a single focusable child.
- `delayDuration?: number` — milliseconds to wait on hover **or keyboard focus** before opening. Default `0` (instant). Use ~600 for supplementary descriptions the person didn't ask for, e.g. sidebar items, so sweeping the pointer past doesn't flash them.
- `pinOnClick?: boolean` — default `true`: a click/tap toggles a pinned tooltip (for info icons and `DisabledReason`). Pass `false` when the trigger itself acts on click (a nav link, a button): hover and focus still open it, and a click closes it and keeps it closed until the pointer leaves.

## Example
```tsx
<TooltipProvider>
  <Tooltip content="Cohorts run every quarter and are free to join.">
    <Button variant="ghost" size="sm" aria-label="More info">
      <Icon icon={Info} size={16} label="More info" />
    </Button>
  </Tooltip>
</TooltipProvider>
```

## Content rules
One short sentence or fragment. Never duplicate the control's own accessible name — add information, don't repeat it.

## Accessibility
Opens on hover or keyboard focus (instantly, or after `delayDuration`), and by default on click/tap for touch users without hover — staying open until dismissed by another click, Esc, or an outside tap. With `pinOnClick={false}` touch users can't reach it, so only use that for supplementary text.

```tsx
<Tooltip content="Reports on what people click and join." side="right" delayDuration={600} pinOnClick={false}>
  <Link href="/admin/insights">Insights</Link>
</Tooltip>
```

## Don't
1. Wrapping a non-focusable element (a plain `<div>`) as the trigger — wrap the real interactive control.
2. Putting essential, non-repeatable information only in a tooltip.
3. Using `Tooltip` for multi-line or interactive content — that's `Popover`/`HoverCard`.
