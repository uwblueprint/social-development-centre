# Design principles

The rules behind the component kit. Evidence and sources: [research.md](./research.md).

## 1. Calm, paper-like, one accent
- Neutrals are Tailwind Stone (warm grays). No other grays.
- One accent (orange, `--color-accent`) marks the single most important thing on a screen. Status colors (success, warning, danger, info) are for status only.
- Separate with 1px hairlines (`--color-border`). Shadows are for things that float: menus, dialogs, toasts.

## 2. Accessible by construction
- WCAG 2.2 AA is the floor, in every state. Contrast ratios for tokens are noted in `tokens.ts`; keep doing that.
- State is never color alone: pair it with an icon, a label, or a change in shape.
- Every control is reachable and usable by keyboard, pointer and touch. Keyboard shortcuts are accelerators, never the only path.
- Disabled things explain why (see `disabledReason`), and there's a meaningful difference between *disabled* (can't use it, state unknown) and *read-only* (can see the state, can't change it).

## 3. Quiet type, clear hierarchy
- One family (Onest) for UI and headings; JetBrains Mono for keyboard shortcuts, codes and IDs.
- Regular (400) by default, medium (500) for headings and titles. Nothing bolder.
- Line height: 1.5 for body text, 1.4 for small UI text, 1.2 for headings, 1.05 for display.

## 4. Small radii, stable layouts
- Radius 4px (small items, tags), 6px (controls), 8px (cards, dialogs, menus). Round only for avatars, switches and radios.
- Interacting must not reflow the page: selecting a tag, toggling, or showing a check keeps widths constant.

## 5. Dense where people work, generous where people arrive
- Staff-facing lists and tables are compact (`--space-2`/`--space-3` rows), scannable, with right-aligned numbers.
- Public-facing flows (sign-up, applications) use more space, plain language and more help text. Many users are first-time or occasional visitors.

## 6. Motion explains change
- 160 to 240ms, using the motion tokens. Motion shows where something came from or went (a sliding selection, an expanding answer). Never decorative. Reduced-motion preferences are respected globally.

## 7. Content is part of the component
- Sentence case. Buttons start with a verb. Errors say what happened and how to fix it. Empty states say what goes here and how to add it.
- Each component doc carries its own content rules, so designers, engineers and AI agents share one reference.
