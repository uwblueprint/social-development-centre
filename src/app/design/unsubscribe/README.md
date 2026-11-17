# Unsubscribe, pause and cancel membership (design)

Member-facing pages reached from the two footer links in every SDC email:

- **A4, the email page** (footer link 1, opens by default).
- **B1, the membership page** (footer link 2, "Pause or cancel membership"), then **B4** (confirm cancelling) and **B5** (cancelled).

The flow follows the [Unsub flow FigJam board](https://www.figma.com/board/jvbGjJ6Wb3CZIOjTB6x81Z/Unsub-flow). Copy is from [SDC Unsubscribe & Cancel Membership — Step Copy](https://claude.ai/artifact/9oi6VCBrW5R1xkz3uA9DzV) where it has the string; `copy.ts` marks everything else "Not in doc". Demo data only. Open at `/design/unsubscribe`; `page.tsx` lists the query parameters for every state. What the backend needs is in `docs/backend/unsubscribe.md`.

## Three patterns, on every page

1. **One template.** SDC logo, green heading (`AuthHeading`, with at most one short line under it), content, then actions in a full-width column. The column is top-aligned, so opening or changing something never moves what's above it. Each new page fades in.
2. **"What's going on?" is one bordered list of answers** (kit `RadioGroup`, one answer, optional). Choosing an answer slides its follow-up open under it (kit `Collapsible`, `--duration-slow`) and closes the previous one. Follow-ups never open a new page.
   - Email page: too many emails → tick the email types you want → Save. Not relevant → link to the intake form to update interests. Don't want to hear from SDC → the Unsubscribe button below.
   - Membership page: too many emails → "Unsubscribe from emails instead". Budget → pause, or cancel completely with the button below. Need a break → pause for a number of weeks, months or years. No longer involved → a thank-you, then the button below.
3. **The button you press becomes its result.** It stays in place, its text says what happened ("✓ Your preference is saved", "✓ You're unsubscribed", "✓ Your membership is paused", "✓ You'll keep getting emails") and it does nothing more. It's `aria-disabled` on the secondary style rather than `disabled`, because the kit fades disabled buttons below 4.5:1, and it has no disabled reason (design: the label explains it). Focus stays on it. An undo, where there is one, is a muted line with a text button under it ("Unsubscribed by mistake? Resubscribe", "Want to come back sooner? Restart my membership now").

Unsubscribe and Cancel membership are always visible, as the FigJam board and the doc ask.

The email page's Unsubscribe is the one exception to pattern 3: the whole page becomes the result. The question slides closed, the heading changes to "You're unsubscribed" and takes focus, members see that their membership is still active (body size) with "Sounds good" and "Cancel membership", and "Unsubscribed by mistake? Resubscribe" is the last line. Resubscribing slides the question open again and replaces the note under Unsubscribe with "You're subscribed again".

Text inside an opened answer is small and muted, so the answer above it reads first.

Buttons: black primary for the main action, red outline for Unsubscribe and Cancel membership, outline for Keep my membership.

## Reused

| Piece | From | Used for |
| --- | --- | --- |
| `AuthScreen`, `AuthColumn`, `AuthHeading`, `AuthActions`, `LinkButton`, `SdcLogo` | `src/features/auth/AuthScreen.tsx` | The template, the green heading, the actions column, the intake-form link |
| `--color-brand-heading`, `--color-brand-tint`, `public/brand/sdc-logo.png` | `src/components/ui/tokens.ts`, `public/brand/` | The green heading and the logo |
| `Button`, `Checkbox`, `Collapsible`, `Field`, `Input`, `RadioGroup` + `RadioGroupOption`, `Select`, `Separator`, `Textarea`, `Icon` | `src/components/ui/` | Everything else |

`AuthScreen.tsx`, the logo and the two brand tokens are on main but not yet on this branch, so they are copied over exactly as main has them. When this branch takes main, they merge without changes.

## New here

They live in `UnsubscribeFlow.tsx`; promote them if another flow needs them.

| Piece | Why it's new |
| --- | --- |
| `danger-outline` Button variant (`src/components/ui/Button.tsx`; main has the same variant now) | Unsubscribe and Cancel membership must always be visible without competing with the main action. |
| `Options` (with `OptionList`, `FollowUp`) | A radio question whose answers each slide open a follow-up. The kit has radios and collapsibles but not the two together. |
| `done()` | A pressed button turned into its result (see pattern 3). |
| `UndoLine`, `StatusLine` | The undo line, and a result line that replaces a button that's gone (resubscribed, restarted). `StatusLine` takes focus. |
| `ChoiceText` | Body-size labels for answers and checkboxes; the kit's labels are form-label size. |
| `Lead` | Body-size text for the membership message after unsubscribing. |
| `Page`, `Column` | `AuthScreen` top-aligned, and a fade-in per page. |

Layout-only: `Stack`, `Choices`, `PauseFields`, `Facts`, `Question`, `Note`, `Body`.

## Open with SDC

- Strings marked "Not in doc" in `copy.ts`, including the email-type labels (SDC still has to list the types it sends), "Sounds good", "Unsubscribe from emails instead", the pause-unit label and error, and the thank-you line.
- A maximum pause length: the copy doc said 3 months, the FigJam board leaves it open.
- The copy doc's tier switch ("Switch to [lower tier]") isn't in the FigJam flow, so it's gone.
- Footer link 1 now opens the email page, not the doc's A1 preferences screen.
