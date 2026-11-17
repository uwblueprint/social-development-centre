# Unsubscribe, pause and cancel membership (design)

Member-facing screens reached from the two footer links in every SDC email: A4 (the unsubscribe page, footer link 1, opened by default), A1 (email preferences, from A4's "Stay in the loop with fewer emails") and B1–B5 (membership, footer link 2). Copy is from [SDC Unsubscribe & Cancel Membership — Step Copy](https://claude.ai/artifact/9oi6VCBrW5R1xkz3uA9DzV) except where noted below. Demo data only. Open at `/design/unsubscribe`; `page.tsx` lists the query parameters for every screen and variant.

## Built on Jesse's unsubscribe page

The look comes from Jesse's `/unsubscribe/[token]` page (branch `origin/jesse/email-links`): the sign-in screen's centered column with the SDC logo (or an icon well on result screens) and full-width buttons. Design decisions on top of it:

- **No visible headings.** Each screen keeps an h1 for screen readers, and focus moves to it on each new screen. Result screens (B2 switched, B3 paused, B5) start their text with what the heading used to say, so nothing is lost.
- **A4, the unsubscribe page**, is footer link 1 and opens by default. It's laid out after Luma's unsubscribe page, in our kit, and opening it never unsubscribes. Top to bottom: "Stay in the loop with fewer emails ›" (to A1, which has Back), the reason survey in a kit `Card` (multi-select, so the reasons must all be able to be true at once; no "Other"), then the unsubscribe button with Jesse's note under it.
- **A1** folds the doc's A1–A3 into one screen. People tick the email types they want (multi-select: the types are independent, so any mix makes sense) and save. After saving, the Save button reads "Your preference is saved" and does nothing until a tick changes. It's `aria-disabled` on the secondary style rather than `disabled`, because the kit fades disabled buttons below 4.5:1 contrast. It has no disabled reason (design: the label explains it). Saving with nothing ticked unsubscribes.
- **The unsubscribe button is the same on A1 and A4**: "Unsubscribe from all communications" unsubscribes in place, and its text becomes "✓ You're unsubscribed" the same way Save does. Under it: "Unsubscribed by mistake? Resubscribe", then, for members only and only after unsubscribing, the membership line and "Cancel membership". `?screen=A4&state=done` opens A4 unsubscribed.
- Checkbox labels are body size (`ChoiceText`), like the radio options; the kit's Checkbox label is form-label size.

## Reused

| Piece | From | Used for |
| --- | --- | --- |
| `AuthScreen`, `AuthColumn`, `AuthActions`, `Footnote`, `IconWell`, `SdcLogo` | `src/features/auth/AuthScreen.tsx` | Every screen's shell, buttons column, small text and result icons |
| `--color-brand-heading`, `--color-brand-tint`, `public/brand/sdc-logo.png` | `src/components/ui/tokens.ts`, `public/brand/` | The icon tint and logo (and the green heading, now unused) |
| `Button`, `Checkbox`, `RadioGroup` + `RadioGroupOption`, `Field`, `Textarea`, `Separator`, `Icon` | `src/components/ui/` | Everything else |

`AuthScreen.tsx`, the logo and the two brand tokens are on main but not yet on this branch, so they are copied over exactly as main has them (no edits). When this branch takes main, they merge without changes.

## New components

They live in `UnsubscribeFlow.tsx`; promote them if another flow needs them.

| Component | Where | Why it's new |
| --- | --- | --- |
| `danger-outline` Button variant | `src/components/ui/Button.tsx` (main has the same variant now) | "Cancel membership" and "Unsubscribe from all" must always be visible as real buttons without competing with the main action. |
| `NavCard` | `UnsubscribeFlow.tsx` | A full-width choice that moves to another screen (B1, B2). A kit outline `Button` with a chevron. |
| `Question` | `UnsubscribeFlow.tsx` | An `h2` for a question inside the column (A1, B1, B3, B5). |
| `HiddenHeading`, `Lead` | `UnsubscribeFlow.tsx` | The screen-reader-only h1, and `AuthHeading`'s description without its title. |
| `CardName` | `UnsubscribeFlow.tsx` | "Social Development Centre" under the card's "Unsubscribe from" label. |
| `ChoiceText` | `UnsubscribeFlow.tsx` | Body-size checkbox labels (A1, A4). |
| `StatusLine` | `UnsubscribeFlow.tsx` | A result line that replaces the button just pressed and takes focus (resubscribed on A1 and A4, B3 Restart, B5 Keep getting emails and Unsubscribe). |
| `Note` | `UnsubscribeFlow.tsx` | Small print under the unsubscribe button: Jesse's note, the undo question and the membership line. |

Layout-only wrappers (no visual style): `Stack` and `Choices`.

## Copy not in the doc

Confirm with SDC:

- A1's checkbox labels ("A monthly summary of SDC's work", "Event and workshop invitations", "Campaigns and calls to action"), "Unsubscribe from all communications", and A4's "Unsubscribe from" / "Unsubscribed from" card label and "Stay in the loop with fewer emails". They're design's; SDC still has to list the email types it sends.
- Placeholders in `copy.ts` under `notInDoc`: "Back", "Thanks for telling us.", "You're subscribed again" / "You'll get emails from SDC again." (Jesse's), "You'll keep getting emails from SDC.", "Your membership is active again.", and the page title.
