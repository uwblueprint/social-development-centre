# Unsubscribe, pause and cancel membership (design)

Member-facing screens reached from the two footer links in every SDC email: A4 (the email page, footer link 1, opened by default) and B1–B5 (membership, footer link 2). Copy is from [SDC Unsubscribe & Cancel Membership — Step Copy](https://claude.ai/artifact/9oi6VCBrW5R1xkz3uA9DzV) except where noted below. Demo data only. Open at `/design/unsubscribe`; `page.tsx` lists the query parameters for every screen and variant.

## Built on Jesse's unsubscribe page, laid out after Luma's

The look comes from Jesse's `/unsubscribe/[token]` page (branch `origin/jesse/email-links`): the sign-in screen's centered column, the SDC logo and full-width buttons. A4's layout follows Luma's unsubscribe page, in our kit. Design decisions:

- **A4 is the only screen with a visible heading**: the green "Unsubscribe from SDC emails" (`AuthHeading`). Every other screen keeps an h1 for screen readers only, and result screens (B2 switched, B3 paused, B5) start their text with what the heading used to say.
- **"Stay in the loop with fewer emails" comes first.** It's a kit `Collapsible`: it slides open the email types (the doc's A1–A3, as checkboxes, since the types are independent) with Save, and slides the reasons card shut. After saving, Save reads "Your preference is saved" and does nothing until a tick changes. It's `aria-disabled` on the secondary style rather than `disabled`, because the kit fades disabled buttons below 4.5:1 contrast, and it has no disabled reason (design: the label explains it). Saving with nothing ticked unsubscribes. B1's "I get too many emails" opens A4 with it expanded.
- **The reasons** sit in a kit `Card` (multi-select, so the reasons must all be able to be true at once; no "Other").
- **"Unsubscribe"** is always visible. Opening the page never unsubscribes; the button does, in place, and its text becomes "✓ You're unsubscribed" the same way Save does. Under it: "Unsubscribed by mistake? Resubscribe", then, for members only and only after unsubscribing, the membership line and "Cancel membership". B5's "Unsubscribe from all emails" unsubscribes in place too.
- Membership and voting notices aren't a checkbox, because voting members can't turn the legally required ones off.
- Checkbox labels are body size (`ChoiceText`), like the radio options; the kit's Checkbox label is form-label size.

## Reused

| Piece | From | Used for |
| --- | --- | --- |
| `AuthScreen`, `AuthColumn`, `AuthHeading`, `AuthActions`, `Footnote`, `IconWell`, `SdcLogo` | `src/features/auth/AuthScreen.tsx` | Every screen's shell, A4's green heading, buttons column, small text and result icons |
| `--color-brand-heading`, `--color-brand-tint`, `public/brand/sdc-logo.png` | `src/components/ui/tokens.ts`, `public/brand/` | A4's green heading, the icon tint and the logo |
| `Button`, `Card`, `Checkbox`, `Collapsible`, `RadioGroup` + `RadioGroupOption`, `Field`, `Textarea`, `Separator`, `Icon` | `src/components/ui/` | Everything else |

`AuthScreen.tsx`, the logo and the two brand tokens are on main but not yet on this branch, so they are copied over exactly as main has them (no edits). When this branch takes main, they merge without changes.

## New components

They live in `UnsubscribeFlow.tsx`; promote them if another flow needs them.

| Component | Where | Why it's new |
| --- | --- | --- |
| `danger-outline` Button variant | `src/components/ui/Button.tsx` (main has the same variant now) | "Cancel membership" and "Unsubscribe from all" must always be visible as real buttons without competing with the main action. |
| `NavCard` | `UnsubscribeFlow.tsx` | A full-width choice with a chevron: moves to another screen (B1, B2), or opens "fewer emails" on A4 (`Chevron` turns while open). A kit outline `Button`. |
| `Panel` | `UnsubscribeFlow.tsx` | Inner padding for collapsible content, so focus rings aren't clipped. |
| `Question` | `UnsubscribeFlow.tsx` | An `h2` for a question inside the column (A4, B1, B3, B5). |
| `HiddenHeading`, `Lead` | `UnsubscribeFlow.tsx` | The screen-reader-only h1, and `AuthHeading`'s description without its title. |
| `CardName` | `UnsubscribeFlow.tsx` | "Social Development Centre" under the card's "Unsubscribe from" label. |
| `ChoiceText` | `UnsubscribeFlow.tsx` | Body-size checkbox labels (A4). |
| `StatusLine` | `UnsubscribeFlow.tsx` | A result line that replaces the button just pressed and takes focus (A4 resubscribed, B3 Restart, B5 Keep getting emails and Unsubscribe). |
| `Note` | `UnsubscribeFlow.tsx` | Small print under the unsubscribe button: Jesse's note, the undo question and the membership line. |

Layout-only wrappers (no visual style): `Stack` and `Choices`.

## Copy not in the doc

Confirm with SDC:

- A4's email-type labels ("A monthly summary of SDC's work", "Event and workshop invitations", "Campaigns and calls to action"), "Stay in the loop with fewer emails", the "Unsubscribe from" / "Unsubscribed from" card label and "Unsubscribe". They're design's; SDC still has to list the email types it sends.
- Placeholders in `copy.ts` under `notInDoc`: "Back", "Thanks for telling us.", "You're subscribed again" / "You'll get emails from SDC again." (Jesse's), "You'll keep getting emails from SDC.", "Your membership is active again.", and the page title.
