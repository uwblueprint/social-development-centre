# Unsubscribe (design)

The email flow, reached from footer link 1 in every SDC email. Open at `/design/unsubscribe`; `page.tsx` lists the query parameters for every state. Cancelling a membership is its own flow: [`/design/cancel-membership`](../cancel-membership/README.md).

The flow follows the [Unsub flow FigJam board](https://www.figma.com/board/jvbGjJ6Wb3CZIOjTB6x81Z/Unsub-flow). Copy is from [SDC Unsubscribe & Cancel Membership — Step Copy](https://claude.ai/artifact/9oi6VCBrW5R1xkz3uA9DzV) where it has the string; `copy.tsx` marks everything else "Not in doc". Always light, even on a dark-mode device: each flow's `layout.tsx` renders `LightOnly` (`parts.tsx`). Demo data only. What the backend needs is in `docs/backend/unsubscribe.md`.

## Screens

- **Update your email preferences** (footer link 1). "Choose what you still want to hear about." over one bordered list of checkboxes: A monthly summary of SDC's work; Only emails about my membership (members only); Unsubscribe from all emails. "Unsubscribe from all" and the email types exclude each other: ticking one clears the other side. Everything the person gets now starts ticked. "Save my preference" shows a toast: "Your preference has been updated."
- **You're unsubscribed** (`?screen=unsubscribed`): saving with "Unsubscribe from all" ticked, or with nothing ticked. Members see that their membership is still active (date and price in bold), with "Sounds good" and "Cancel membership" (opens the cancel-membership flow at "Before you go"). Non-members see only the heading. "Unsubscribed by mistake? Resubscribe" is the last line; resubscribing returns to the preferences page with everything ticked and a toast.
- **"Sounds good"** opens a closing screen: "You're unsubscribed / Awesome! You can close this tab now." (`?screen=closed`)

Whether the person is a member comes from their record (`demoMember.isMember` in `data.ts`), never the URL. The demo person is always a member; set it to `false` to preview a subscriber.

## Three patterns, shared with the cancel-membership flow

Both flows are built from `parts.tsx`:

1. **One template** (`Template`). SDC logo; green heading (it gets smaller as the screen narrows) with what happened right under it as one tight group (`line`: near-black, body size, centred, every screen the same); content; actions; then the undo, if any, after a divider. Sections are `--space-6` apart, the heading and its line `--space-2`, so grouping comes from spacing. Grey (`Note`) is only for small print: refunds, the undo question, what pausing means. Questions are centred over their answer list. The page is top-aligned, so the logo and heading sit at the same height on every screen. Between screens the heading's words change in place (no fade: a fade made it blink) and everything under it slides 32px in from the side it came from (forward from the right, back from the left: `order`), over `--duration-slow` with `--ease-out`. A first load doesn't move. This breaks `docs/design/motion.md` (page entrances are static, nudges 4px at most) on purpose: confirm with the design-system owner before build. Steps change with `window.history.pushState`, not `router.push`, so there is no server round trip before the next screen. Confetti is exempt from the motion rules (Shallot) but still honours reduced motion.
2. **A question is one bordered list of answers** (`Options`: kit `RadioGroup`, one answer, optional). Nothing opens under an answer: what follows it is the next page. Messages the page is about are body size (`Lead`).
3. **Results.** A change that moves the person on gets its own screen whose heading says what happened ("You're unsubscribed"). A saved setting that leaves them where they are gets a kit `Toast`. An undo is a muted question and a text button after a divider (`Template`'s `undo`).

Buttons: green primary (the kit's `--color-primary`) for the main action, red outline for cancelling, outline for the rest.

## Reused

| Piece | From | Used for |
| --- | --- | --- |
| `AuthScreen`, `AuthColumn`, `AuthHeading`, `AuthActions`, `LinkButton`, `SdcLogo` | `src/features/auth/AuthScreen.tsx` | The template, the green heading, the actions column |
| `--color-brand-heading`, `--color-brand-tint`, `public/brand/sdc-logo.png` | `src/components/ui/tokens.ts`, `public/brand/` | The green heading and the logo |
| `Button`, `Card`, `Checkbox`, `RadioGroup` + `RadioGroupOption`, `Separator`, `Toast` | `src/components/ui/` | Everything else |

## New here (`parts.tsx`)

Promote them to the kit if a third flow needs them.

| Piece | Why it's new |
| --- | --- |
| `Template`, `Column`, `Heading` | The shared template. `Heading` sizes the green heading to its width (a container query); it belongs in `AuthHeading`, for devs to move. |
| `Options` (with `OptionList`) | A centred question over one bordered list of radio answers. |
| `OfferCard` | A retention offer in a kit `Card`, full width, with its accept button. |
| `LightOnly` | Keeps member-facing pages light. For devs: set `data-theme="light"` on the server for these routes instead, so a dark device never sees one dark frame. |
| `ChoiceText`, `Lead` | Body-size answer labels and messages; the kit's labels are form-label size. |

Layout-only: `Stack`, `Question`, `Note`, and `Template`'s `footer` row (Keep membership left, the way forward right).

## Open with SDC

- Strings marked "Not in doc" in `copy.tsx`, and the email types: SDC still has to list the types it sends.
- "Only emails about my membership" sits beside the monthly summary as its own checkbox, so ticking both means both. If "only" should mean "nothing else", it would clear the monthly summary like "Unsubscribe from all" does.
