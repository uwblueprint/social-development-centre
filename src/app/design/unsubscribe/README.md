# Unsubscribe, pause and cancel membership (design)

Member-facing screens reached from the two footer links in every SDC email: A1 (email preferences, one screen) and B1–B5 (membership). Copy is from [SDC Unsubscribe & Cancel Membership — Step Copy](https://claude.ai/artifact/9oi6VCBrW5R1xkz3uA9DzV) except where noted below. Demo data only. Open at `/design/unsubscribe`; `page.tsx` lists the query parameters for every screen and variant.

## Built on Jesse's unsubscribe page

The look comes from Jesse's `/unsubscribe/[token]` page (branch `origin/jesse/email-links`): the sign-in screen's centered column with the SDC logo (or an icon well on result screens) and full-width buttons. Design decisions on top of it:

- **No visible headings.** Each screen keeps an h1 for screen readers, and focus moves to it on each new screen. Result screens (B2 switched, B3 paused, B5) start their text with what the heading used to say, so nothing is lost.
- **A1 is one screen** and replaces the doc's A1–A4. People tick the email types they want (multi-select: the types are independent, so any mix makes sense) and save. "Unsubscribe from all communications" stays as its own button. Saving with nothing ticked unsubscribes too.
- **Results show under the buttons, not on a new screen**: "Your preference is saved", "You're unsubscribed" (with Resubscribe and, for members, Cancel membership) and "You're subscribed again". The result takes focus; changing a tick clears it.
- Membership and voting notices aren't a checkbox, because voting members can't turn the legally required ones off. Members see the doc's note about them instead.
- The doc's reason question ("Mind telling us why?") is gone from the email side.

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
| `Confirmation` | `UnsubscribeFlow.tsx` | A1's result under the buttons: icon and bold first line (not color alone), detail, follow-up buttons. Takes focus. |
| `StatusLine` | `UnsubscribeFlow.tsx` | A result line that replaces the button just pressed and takes focus (B3 Restart, B5 Keep getting emails). |
| `Note` | `UnsubscribeFlow.tsx` | Small print under A1's checkboxes (the required-notices line). |

Layout-only wrappers (no visual style): `Stack` and `Choices`.

## Copy not in the doc

Confirm with SDC:

- A1's checkbox labels ("A monthly summary of SDC's work", "Event and workshop invitations", "Campaigns and calls to action") and "Unsubscribe from all communications". They're design's; SDC still has to list the email types it sends.
- Placeholders in `copy.ts` under `notInDoc`: "Back", "You're subscribed again" / "You'll get emails from SDC again." (Jesse's), "You'll keep getting emails from SDC.", "Your membership is active again.", and the page title.
