# Unsubscribe, pause and cancel membership (design)

Member-facing screens reached from the two footer links in every SDC email: A1, A2, A4 (email preferences) and B1–B5 (membership). Copy is from [SDC Unsubscribe & Cancel Membership — Step Copy](https://claude.ai/artifact/9oi6VCBrW5R1xkz3uA9DzV) except where noted below. Demo data only. Open at `/design/unsubscribe`; `page.tsx` lists the query parameters for every screen and variant.

## Built on Jesse's unsubscribe page

The look and structure come from Jesse's `/unsubscribe/[token]` page (branch `origin/jesse/email-links`): the sign-in screen's centered column with the SDC logo (or an icon well on result screens), a green heading, a short description and full-width buttons. Changes from Jesse's page:

- **A1** offers two choices instead of a single Unsubscribe: "Stay in the loop with fewer emails" (goes to A2) and "Unsubscribe from all communications" (goes to A4).
- **A4** asks why with a **multi-select survey** (checkboxes) instead of a dropdown, then "Send".
- A3 (pick topics) is gone: A1 no longer leads to it.

## Reused

| Piece | From | Used for |
| --- | --- | --- |
| `AuthScreen`, `AuthColumn`, `AuthHeading`, `AuthActions`, `Footnote`, `IconWell`, `SdcLogo` | `src/features/auth/AuthScreen.tsx` | Every screen's shell, heading, buttons column, small text and result icons |
| `--color-brand-heading`, `--color-brand-tint`, `public/brand/sdc-logo.png` | `src/components/ui/tokens.ts`, `public/brand/` | The green heading, icon tint and logo |
| `Button`, `Checkbox`, `RadioGroup` + `RadioGroupOption`, `Field`, `Textarea`, `Separator`, `Icon` | `src/components/ui/` | Everything else |

`AuthScreen.tsx`, the logo and the two brand tokens are on main but not yet on this branch, so they are copied over exactly as main has them (no edits). When this branch takes main, they merge without changes.

## New components

They live in `UnsubscribeFlow.tsx`; promote them if another flow needs them.

| Component | Where | Why it's new |
| --- | --- | --- |
| `danger-outline` Button variant | `src/components/ui/Button.tsx` (main has the same variant now) | "Cancel membership" and "Unsubscribe from all" must always be visible as real buttons without competing with the main action. |
| `NavCard` | `UnsubscribeFlow.tsx` | A full-width choice that moves to another screen (B1, B2). A kit outline `Button` with a chevron. |
| `Question` | `UnsubscribeFlow.tsx` | An `h2` for a question inside the column (A2, A4 survey, B1, B3, B5). |
| `StatusLine` | `UnsubscribeFlow.tsx` | A result line that replaces the button just pressed and takes focus (A4 Send, B3 Restart, B5 Keep getting emails). |

Layout-only wrappers (no visual style): `Stack` and `Choices`.

## Copy not in the doc

Confirm with SDC:

- A1's choices, "Stay in the loop with fewer emails" and "Unsubscribe from all communications" (design's, replacing the doc's three reasons).
- Placeholders in `copy.ts` under `notInDoc`: "Back", "Thanks for telling us.", "You're subscribed again" / "You'll get emails from SDC again." (Jesse's), "You'll keep getting emails from SDC.", "Your membership is active again.", and the page title.
