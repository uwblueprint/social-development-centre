# Building UI in this repo

This file is for AI coding agents and humans alike. Read it before writing any UI.

## Where things live

- `src/components/ui/`: the component kit. Import from here and nowhere else.
- `src/components/ui/tokens.ts`: every color, space, radius, type size, line height, shadow and duration.
- `docs/components/<Component>.md`: when to use each component, when not to, content rules and accessibility notes. Read the doc before using a component for the first time.
- `docs/design/principles.md`: the design rules behind the kit. `docs/design/research.md`: the evidence (Linear, Ramp, NN/g).
- `/components`: live showcase of every component in every state. Run `pnpm dev` and open http://localhost:3000/components.

## Hard rules (lint, types or CI enforce these)

1. **Tokens only.** No raw hex, `rgb()`, or one-off pixel values for color, radius, spacing, type or motion. If a value is missing, add a token to `tokens.ts` with a one-line reason; don't inline it.
2. **Kit components only.** In `src/app/**`, never render native `<button>`, `<input>`, `<select>` or `<textarea>`, and never import `radix-ui`, `cmdk` or `react-day-picker` directly. Use `Button`, `Input`, `Select`, `Textarea`, `DatePicker`, etc.
3. **Icons** come from `lucide-react` through `<Icon icon={Name} />` (1.5 stroke). Icon-only controls need an `aria-label`.
4. **Every form control has a visible label.** Wrap controls in `Field` (label, hint, error, required). Placeholder text is never the label.
5. **Disabled controls explain why.** `Field` and `DisabledReason` take `disabledReason`. The reason is product copy:
   - Ask the person you're working with: "Why is this disabled? Users will see the reason in a tooltip."
   - Use their words. Never invent a reason.
   - If they decline, don't know, or say it's not needed, pass `disabledReason={null}` and move on.
6. **Never convey state with color alone.** Errors pair color with an icon and a message; selected items pair fill with a check or position; statuses pair color with a text label.
7. **Accessibility is WCAG 2.2 AA:** 4.5:1 text contrast in every state (including hover, selected and disabled text you expect people to read), 3:1 for control borders and icons, visible focus, full keyboard support, and a pointer/touch path for anything keyboard-first.
8. `pnpm check` (typecheck, lint, axe accessibility test) must pass before you push. CI runs the same checks.

## How to build a flow

1. Look for an existing pattern or component first (`src/components/ui/`, `docs/components/`). A near-duplicate component is worse than none.
2. Compose kit components. Only write layout CSS (grid/flex/gap using `--space-*`), not new visual styles.
3. Design every state: loading, empty, error, disabled, success, long text, and small screens (360px wide).
4. Content: sentence case; buttons start with a verb ("Save changes", not "OK"); errors say what happened and how to fix it; no jargon.
5. Density: list and table rows use `--space-2`/`--space-3` padding. Separate rows with 1px `--color-border` lines; save shadows for overlays.
6. Accent (`--color-accent`) marks at most one thing per screen. Use status tokens (`--color-success`, `-warning`, `-danger`, `-info` with their `-subtle` backgrounds) for status.
7. Motion uses `--duration`/`--duration-slow` with `--ease`/`--ease-spring`, only for real state changes. Reduced motion is handled globally; don't override it.
8. Verify in the browser: open the page, try it with the keyboard only, and check hover, focus and disabled states.

## Changing the kit

- A new component or a new variant needs: the component in `src/components/ui/`, a demo on `/components`, a doc in `docs/components/`, and a passing `pnpm check`.
- Keep APIs small and typed: variants as string unions, required props for anything accessibility depends on.
- Ask the design-system owner before adding a component, a token, or a second way to do something that already exists.

## When to stop and ask

Ask the person you're working with instead of guessing about: disabled reasons, user-facing copy you'd otherwise invent, a new component or token, and anything that breaks a rule above.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
