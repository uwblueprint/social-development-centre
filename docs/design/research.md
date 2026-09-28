# UI Research: Linear, Ramp, NN/g — applied to this repo

Grounded in this repo's `src/components/ui/tokens.ts` (Radix + Stone neutrals, single orange accent, semantic status tokens, `--focus-ring`, `--duration`/`--ease`, `prefers-reduced-motion` already wired).

## 1. Rules for AI coding agents building UI here

- Never hardcode a hex, px, or ms value. Reference `tokens.ts` variables only (`--stone-*`, `--space-*`, `--radius-*`, `--text-*`, `--duration*`).
- Compose from `src/components/ui/*` (Button, Dialog, DropdownMenu, Tooltip, Tag, Badge...) before writing new markup. Search the folder first — a near-duplicate component is worse than no PR.
- Every list/table row needs: hover state, visible keyboard-focus ring (`--focus-ring`, already global), and a designed empty state — not a blank `<div>`. Linear's issue list shows the pattern: grouped sections, per-row priority icon, status dot, assignee avatar, relative timestamp, all in one dense row — [Linear issue list](https://mobbin.com/screens/be6c4ee4-aa93-42b4-89b3-dcfc8386f022).
- Reserve `--color-accent` for exactly one action per screen (primary CTA or "this just changed" signal). Do not add a second accent color; use the semantic `-subtle`/`-700` pairs for status instead.
- Secondary actions belong in `DropdownMenu`/`Popover`, with shortcut hints shown inline (`<kbd>`), matching Linear's document actions menu — [Linear dropdown with kbd hints](https://mobbin.com/screens/f1e8745b-81b7-4a78-85e1-a325f4843f42).
- Default data-table/list row padding to `--space-2`/`--space-3`, not `--space-4+`. Civic caseworkers scan many rows per session; density is a feature.
- Motion only via `--duration`/`--duration-slow` + `--ease`/`--ease-spring`; never invent a new curve; never fight `prefers-reduced-motion`.
- Status must always be color + icon/text together (never color alone) — plan for lower-vision and colorblind users the private power-tool references below don't have to.
- Any keyboard-first affordance (command menu, `j/k` navigation) must have a fully equivalent pointer/touch path.
- When adding a new token, write the reason as a comment next to it, the way `tokens.ts` documents contrast ratios (e.g. `--color-border-strong`).

## 2. Design-system rules worth adopting

- **Tokens**: one neutral ramp + one accent, semantic tokens (success/warning/danger/info) each paired with a `-subtle` background for AA-contrast text on tint — this repo already does this; keep new tokens to this shape, don't add ad hoc grays.
- **Components**: for every component, document default/hover/focus/disabled/loading/error states and which props are content vs. control — NN/g calls this the baseline for design-system docs and the biggest onboarding accelerator ([Design Systems 101](https://www.nngroup.com/articles/design-systems-101/)).
- **Patterns**: settings pages as a flat list of labeled rows (title + one-line description + control on the right), grouped under section headers in a fixed left nav — [Linear settings: coding tools](https://mobbin.com/screens/9ac66835-aa7f-469f-ace3-a915c2cf2dfd), [Linear settings: cycles](https://mobbin.com/screens/c7223b87-8318-4848-8453-2ac4b1e1a0a9). Toggle-driven settings should show a short explanatory sentence under the label, not a tooltip-only explanation — [Triage Intelligence settings](https://mobbin.com/screens/50e9bde5-16a9-4d43-9266-450278791eab).
- **Dense financial/record tables**: sticky header, right-aligned numeric columns, status as a colored pill/tag, and inline filter chips above the table rather than a separate filter panel — [Mercury transactions](https://mobbin.com/screens/0ed937d6-2d8c-4339-80a7-39382499d3cb), [Midday transactions with inline category edit](https://mobbin.com/screens/50c9bd56-bc42-4841-9f2d-70f0641d5f0b). (Ramp itself was not in Mobbin's current index; these are the closest indexed analogs to the flat, hairline-border, one-accent fintech table style Ramp is known for per [Ramp DESIGN.md](https://www.designmd.co/d/ramp) and [Ramp on Refero Styles](https://styles.refero.design/style/b38702a0-75ab-474c-9106-00b624535825).)
- **Approvals/limits UI**: express a rule as a plain sentence with inline editable fields ("if amount ≥ $X, require 1 approval"), not a form grid — [Navan spend limit setup](https://mobbin.com/screens/1835b7cc-8f00-499d-bd95-d6bf5b30da2a), [Expensify approval routing](https://mobbin.com/screens/483133f9-eef7-40df-a7bd-3717462a27bf).
- **Content**: embed content/copy standards (button verbs, error tone, empty-state copy) in the component doc itself, not a separate wiki, so designers and engineers share one reference — [NN/G: Content Standards in Design Systems](https://www.nngroup.com/articles/content-design-systems/).
- **Motion**: short (160–240ms), single-purpose, reserved for real state changes — never decorative.
- **Density**: hairline 1px borders (`--color-border`) over shadows for separating rows/cards; reserve `--shadow-md/lg` for true overlays.
- **Accessibility**: treat the contrast-ratio comments already in `tokens.ts` as required practice for every future token, not a one-time exercise.

## 3. Guidance for the human team

- Assign a rotating **design-system owner** who reviews every PR that touches `src/components/ui` — NN/G's finding is that a system without an enforcer erodes within a few releases ([Your Design System Needs an Enforcer](https://www.nngroup.com/articles/design-system-enforcer/)).
- Run a short weekly cross-functional sync (design + product + eng) to unblock in-flight component/pattern decisions fast, echoing Ramp's velocity-first "jam session" habit reported in [Lenny's Newsletter: How Ramp builds product](https://www.lennysnewsletter.com/p/how-ramp-builds-product).
- Every new component needs one named owner and a changelog entry, not shared/anonymous ownership.
- Critique against the written state/content/a11y checklist, not taste. Keep a short "why" doc for every constraint (why one accent, why no shadows) so contributors don't quietly reintroduce complexity — mirrors the "identity from what's excluded" reading of Linear's system.
- NN/G distinguishes a style guide (visual reference) from a true design system (components + code + governance) — target the latter ([Design Systems vs. Style Guides](https://www.nngroup.com/articles/design-systems-vs-style-guides/)).

## 4. What Linear and Ramp do less well (don't copy blindly)

- Linear's near-black, tight-tracking, small-radius aesthetic optimizes for engineers staring at it all day; a civic product serving occasional public users needs more generous contrast, larger touch targets, and less reliance on subtlety.
- Linear leans hard on the command menu ([onboarding](https://mobbin.com/screens/1e783aca-8b8e-4ae5-994d-284a8ddae491)) and keyboard fluency; a public-facing civic flow can't assume that fluency and must keep every action reachable by pointer/touch first.
- Ramp's single-accent, near-monochrome system (per [DesignMD](https://www.designmd.co/d/ramp)) works when one screen has one active state; civic cases often carry several concurrent statuses (submitted, under review, escalated) — plan for redundant coding (icon + label + color) rather than color-only distinction.
- Both systems assume high-end displays, fast networks, and daily active users; test this repo's density and type scale on low-end devices and for infrequent/first-time users, and budget more onboarding/help content than either "get out of the way" philosophy allows.
