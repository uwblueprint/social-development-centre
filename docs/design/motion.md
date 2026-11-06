# Motion

Calm, rare and short. Motion exists only to reinforce where something came from or where it lives. If it doesn't do that, it doesn't move.

## Principles

- Opacity first. Movement is a small extra, never the main event.
- 100-240ms. Colour fades 100ms, overlays 160ms, things with real distance 240ms. Leaving is faster than entering.
- Decelerate in (`--ease-out`), accelerate out (`--ease-in`). Nothing overshoots, springs or scales.
- Nudge at most 4px, toward the side the thing came from.
- No sliding indicators, hover lifts, press shrinks or entrance staggers.
- Focus rings and selection are instant.
- Spinners and progress bars are allowed: they show that work is happening.
- Reduced motion is handled globally in `tokens.ts`. Don't override it.

## Tokens

| Token | Value | Use |
| --- | --- | --- |
| `--duration-fast` | 100ms | Colour fades on hover, press and state change; overlay exits |
| `--duration` | 160ms | Overlays in, switch thumb, toast, progress fill |
| `--duration-slow` | 240ms | Sheet slide, accordion and collapsible reveal, mobile drawer |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Decelerate: entering or changing |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Accelerate: leaving |
| `--ease`, `--ease-spring` | alias of `--ease-out` | Retired names. Nothing springs |

`--duration-enter`, `--stagger`, `--enter-offset` and `--duration-scan` remain only for the intake and brand screens, not kit components.

## What moves

| Component | Motion | Why |
| --- | --- | --- |
| Menu, Select, Popover, Hover card, Tooltip, Date picker, Combobox lists | Fade in with a 4px nudge from the trigger side; faster fade out | Shows the panel belongs to its trigger |
| Dialog, Alert dialog | Fade plus a 4px rise; overlay fades; faster exit | Arrival without a jump; no scale |
| Sheet | Slides from the right edge; overlay fades; faster exit | Shows where the sheet lives |
| Mobile nav drawer | Slides from the left edge | Same reason |
| Accordion, Collapsible | Height reveal | Shows content belongs to its header |
| Toast | Fade and 16px slide from the right | Shows where notifications come from |
| Switch | Thumb travels, track colour fades | Explains on and off |
| Progress | Fill eases to the new value | Shows change |
| Button, Tag, Pagination, Tabs labels, Toggle items, Radio card, Sidebar links, Table sort buttons, Date picker days | Colour fade on hover | Affordance only |
| Checkbox, Radio | Fill fades | Confirms the change |
| Spinners, Table loading line | Rotate or sweep | Work is in progress |

## What is static

Inputs, Textarea, Search, Select, Combobox and Tag fields (focus ring and border are instant), Slider, list and table rows, scroll bars, Tabs and Toggle group selection (no sliding pill), the Plus/minus icon in Accordion, page and list entrances, button press scale, radio card lift and border trace.
