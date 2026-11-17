# Cancel membership (design)

Its own flow, reached from footer link 2 in every SDC email ("Pause or cancel membership") and from "Cancel membership" on the unsubscribed page (`/design/unsubscribe`). Open at `/design/cancel-membership`; `page.tsx` lists the query parameters for every state. Built from the email flow's parts (`../unsubscribe/parts.tsx`), so it follows the same three patterns; see [the unsubscribe README](../unsubscribe/README.md). Demo data is shared too (`../unsubscribe/data.ts`). What the backend needs is in `docs/backend/unsubscribe.md`.

Follows the [Unsub flow FigJam board](https://www.figma.com/board/jvbGjJ6Wb3CZIOjTB6x81Z/Unsub-flow), with a survey before cancelling and a lower-tier offer (references: Uber's and Hinge's cancel surveys, Spotify's cheaper-plan cards, Disney+'s pause with a live resume date), in our design system.

## Steps

1. **Before you go** (`?step=reasons`, default). "You've supported SDC since [month year]…", then "What's the main reason you're cancelling?" (optional, one answer). Each answer slides open one alternative:
   - Too many emails → "Unsubscribe from emails instead" (keeps the membership).
   - It's too expensive right now → the tiers below theirs (name, **price** / month, what it includes, "Switch to [tier]"; the switch takes effect on the next payment, with an undo), then "Or take a break: Pause instead". A Friend has no lower tier, so it opens straight to the pause.
   - I need a break → pause for a number of weeks, months or years. The restart date updates as they type; after pausing, a reminder date and "Restart my membership now".
   - I don't want to be involved with SDC anymore → a thank-you.

   "Continue to cancel" is always visible: the question never stands between someone and cancelling.
2. **Cancel your membership?** (`?step=confirm`). What cancelling means, as body-size lines; an optional note; "Cancel membership" or "Keep my membership" (back to step 1).
3. **We're sorry to see you go** (`?step=cancelled`). Thanks, the confirmation email, and, if they still get emails, "Want to keep hearing about SDC's work?" with Keep getting emails / Unsubscribe.

## Open with SDC

- What each tier includes: the lines in `copy.tsx` are placeholders.
- "[events / workshops / resources]" in the "Before you go" line: say what's true.
- Strings marked "Not in doc" in `copy.tsx`.
- A maximum pause length: the copy doc said 3 months, the FigJam board leaves it open.
- When voting rights end after cancelling: today or at the end of the period (`?policy=end-of-period`).
