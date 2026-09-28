# Progress

A horizontal bar showing determinate completion toward a goal.

## Use when / Don't use when
- A measurable, known-percentage goal (enrollment target, upload progress).
- An indeterminate wait with no known duration — use a spinner/skeleton instead (not provided by this component).
- Don't use it to show a *status* (like "in review") — that's `Badge`.

## API
```tsx
import { Progress } from "@/components/ui/Progress";
```
- `value: number` (required), `max?: number` — default `100`.
- `aria-label?: string` — default `"Progress"`; always pass a specific one (e.g. `"Enrollment goal progress"`).

## Example
```tsx
<span>Enrollment goal</span>
<span>68%</span>
<Progress value={68} aria-label="Enrollment goal progress" />
```

## Content rules
Show the numeric value as visible text next to the bar (e.g. "68%") — the bar alone isn't precise enough to read at a glance, especially for low-vision users.

## Accessibility
Renders Radix's `role="progressbar"` semantics with `aria-valuenow`/`aria-valuemax` derived automatically; always override the default `aria-label` with a specific description of what's progressing.

## Don't
1. Leaving `aria-label` as the generic default when there's more than one progress bar on a screen.
2. Omitting the visible percentage/number text near the bar.
3. Using `Progress` for a static status — use `Badge`.
