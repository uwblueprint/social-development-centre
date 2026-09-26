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
- `Tooltip({ content: ReactNode, children: ReactElement, side? })` — wraps a single focusable child.

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
Opens instantly on hover or keyboard focus (`delayDuration=0`), and on click/tap for touch users without hover — staying open until dismissed by another click, Esc, or an outside tap.

## Don't
1. Wrapping a non-focusable element (a plain `<div>`) as the trigger — wrap the real interactive control.
2. Putting essential, non-repeatable information only in a tooltip.
3. Using `Tooltip` for multi-line or interactive content — that's `Popover`/`HoverCard`.
