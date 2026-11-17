# Unsubscribe (design)

The email flow, reached from footer link 1 in every SDC email. Open at `/design/unsubscribe`; `page.tsx` lists the query parameters for every state. Cancelling a membership is its own flow: [`/design/cancel-membership`](../cancel-membership/README.md).

The flow follows the [Unsub flow FigJam board](https://www.figma.com/board/jvbGjJ6Wb3CZIOjTB6x81Z/Unsub-flow). Copy is from [SDC Unsubscribe & Cancel Membership — Step Copy](https://claude.ai/artifact/9oi6VCBrW5R1xkz3uA9DzV) where it has the string; `copy.tsx` marks everything else "Not in doc". Demo data only. What the backend needs is in `docs/backend/unsubscribe.md`.

## Screens

- **The email page.** "What's going on?": too many emails → tick the email types you want → Save. Not relevant → link to the intake form to update interests. Don't want to hear from SDC → the Unsubscribe button below.
- **After Unsubscribe** the page becomes the result: the question slides closed, the heading changes to "You're unsubscribed" and takes focus. Members see that their membership is still active (body size, date and price in bold), with "Sounds good" and "Cancel membership" (opens the cancel-membership flow). "Unsubscribed by mistake? Resubscribe" is the last line; resubscribing slides the question open again and shows "You're subscribed again" in place of the note under Unsubscribe.
- **"Sounds good"** opens a closing screen: "You're unsubscribed / Awesome! You can close this tab now." (`?screen=closed`)

## Three patterns, shared with the cancel-membership flow

Both flows are built from `parts.tsx`:

1. **One template** (`Template`). SDC logo, green heading (with at most one short line under it; it gets smaller as the screen narrows), content, then actions in a full-width column, centred on the page. Each new screen fades in.
2. **A question is one bordered list of answers** (`Options`: kit `RadioGroup`, one answer, optional). Choosing an answer slides its follow-up open under it (kit `Collapsible`, `--duration-slow`) and closes the previous one. Follow-ups never open a new page. Text inside a follow-up is small and muted, so the answer above it reads first; messages the page is about are body size (`Lead`).
3. **The button you press becomes its result** (`done()`). It stays in place, says what happened ("✓ Your preference is saved") and does nothing more. It's `aria-disabled` on the secondary style rather than `disabled`, because the kit fades disabled buttons below 4.5:1, and it has no disabled reason (design: the label explains it). Focus stays on it. An undo is a muted line with a text button under it (`UndoLine`).

Buttons: black primary for the main action, red outline for Unsubscribe and cancelling, outline for the rest.

## Reused

| Piece | From | Used for |
| --- | --- | --- |
| `AuthScreen`, `AuthColumn`, `AuthHeading`, `AuthActions`, `LinkButton`, `SdcLogo` | `src/features/auth/AuthScreen.tsx` | The template, the green heading, the actions column, the intake-form link |
| `--color-brand-heading`, `--color-brand-tint`, `public/brand/sdc-logo.png` | `src/components/ui/tokens.ts`, `public/brand/` | The green heading and the logo |
| `Button`, `Checkbox`, `Collapsible`, `Field`, `Input`, `RadioGroup` + `RadioGroupOption`, `Select`, `Separator`, `Textarea`, `Icon` | `src/components/ui/` | Everything else |

`AuthScreen.tsx`, the logo and the two brand tokens are on main but not yet on this branch, so they are copied over exactly as main has them. When this branch takes main, they merge without changes.

## New here (`parts.tsx`)

Promote them to the kit if a third flow needs them.

| Piece | Why it's new |
| --- | --- |
| `danger-outline` Button variant (`src/components/ui/Button.tsx`; main has the same variant now) | Unsubscribe and cancelling must always be visible without competing with the main action. |
| `Template`, `Column`, `Heading` | The shared template. `Heading` sizes the green heading to its width (a container query); it belongs in `AuthHeading`, for devs to move. |
| `Options` (with `OptionList`, `FollowUp`) | A radio question whose answers each slide open a follow-up. The kit has radios and collapsibles but not the two together. |
| `done()`, `UndoLine`, `StatusLine` | Pattern 3, the undo line, and a result line that replaces a button that's gone (takes focus). |
| `ChoiceText`, `Lead` | Body-size answer labels and messages; the kit's labels are form-label size. |

Layout-only: `Stack`, `Choices`, `PauseFields`, `Question`, `Note`, `Body`.

## Open with SDC

- Strings marked "Not in doc" in `copy.tsx`, including the email-type labels (SDC still has to list the types it sends) and "Sounds good".
- Footer link 1 now opens the email page, not the doc's A1 preferences screen.
