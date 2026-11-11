# Unsubscribe, pause and cancel membership (design)

Member-facing screens reached from the two footer links in every SDC email: A1–A4 (email preferences) and B1–B5 (membership). Copy is word for word from [SDC Unsubscribe & Cancel Membership — Step Copy](https://claude.ai/artifact/9oi6VCBrW5R1xkz3uA9DzV). Demo data only. Open at `/design/unsubscribe`; `page.tsx` lists the query parameters for every screen and variant.

## Reused from the intake form and the kit

| Piece | From | Used for |
| --- | --- | --- |
| `PaperPage`, `PaperSheet`, `PaperLogos`, `PaperStep`, `PaperHeading`, `PaperLead` | `src/features/intake/components/Paper.tsx` (moved out of `IntakeForm.tsx`) | The paper sheet, logo, step fade-in, heading and body text on every screen |
| `PaperChoices` + `PaperCardText` + kit `RadioCard` | `Paper.tsx` (moved out of `IntakeForm.tsx`) | Single-choice cards: A2 email types, A4 reasons, B3 pause length |
| `PaperActions` | `Paper.tsx` (moved out of `IntakeForm.tsx`; now wraps) | The sticky button bar: Back first, main action last |
| `CheckCardGroup` | `src/features/intake/components/CheckCardGroup.tsx` | A3 topics and ways, with `topicChoices` / `wayChoices` imported from `src/features/intake/copy.ts` |
| `Button`, `Field`, `Textarea`, `Icon` | `src/components/ui/` | Everything else |

## New components

Nothing in the intake form or the kit covers these. They live in `UnsubscribeFlow.tsx`; promote them if another flow needs them.

| Component | Where | Why it's new |
| --- | --- | --- |
| `danger-outline` Button variant | `src/components/ui/Button.tsx` (kit; demo on `/components`, documented in `docs/components/Button.md`) | "Cancel membership" and "Unsubscribe from all emails" must always be visible as real buttons without competing with the main action. Needs design-system owner sign-off. |
| `NavCard` | `UnsubscribeFlow.tsx` | A card that moves to another screen (A1, B1, B2). The intake form's cards only select. Built as a kit `Button` (outline) shaped like the intake cards, with a chevron. |
| `Question` | `UnsubscribeFlow.tsx` | An `h2` for a sub-question when one screen asks more than one thing (A3, A4, B1, B3, B5). The intake form has one question per step. |
| `StatusLine` | `UnsubscribeFlow.tsx` | A result line that replaces the button just pressed and takes focus (A4 Send, B3 Restart, B5 Keep getting emails). |

Layout-only wrappers (no visual style): `Stack` (column with a gap) and `Inline` (text + button on one line).

## Copy not in the doc

Placeholders in `copy.ts` under `notInDoc`. Confirm with SDC: "Back", "Thanks for telling us.", "You'll keep getting emails from SDC.", "Your membership is active again.", and the page title.
