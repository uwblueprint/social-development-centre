# Cancel membership (design)

Its own flow. Footer link 2 in every SDC email ("Pause or cancel membership") and "Cancel membership" on the unsubscribed page (`/design/unsubscribe`) both open "Before you go": one click from either. Pausing is one of its offers. Open at `/design/cancel-membership`; `page.tsx` lists the query parameters for every state. Built from the email flow's parts (`../unsubscribe/parts.tsx`), so it follows the same three patterns; see [the unsubscribe README](../unsubscribe/README.md). Demo data is shared (`../unsubscribe/data.ts`). What the backend needs is in `docs/backend/unsubscribe.md`.

Follows the [Unsub flow FigJam board](https://www.figma.com/board/jvbGjJ6Wb3CZIOjTB6x81Z/Unsub-flow) in three steps, survey → retention offer → cancellation confirmation (Shallot, after a Mobbin cancel flow), with a lower-tier offer (Spotify's cheaper plans) and Disney+'s pause with a live resume date, in our design system. Always light, even on a dark-mode device (`LightOnly`).

## Steps

```
1 Before you go ─Continue─► 2 Offer for that answer ─Continue to cancel─► 3 Cancel your membership? ─► We're sorry to see you go (end)
     no answer, or "no longer involved": straight to 3                         └─ Keep membership ─► Your membership is active again (end)
  2 too many emails → Unsubscribe from emails instead ─► Unsubscribed, membership kept (end)
  2 too expensive   → Continue (on a tier card) ─► Switched (end)
  need a break      → 2 Pause membership instead? ─Pause membership─► Paused (end)
```

Every step of cancelling ends with one bottom row: **Keep membership** on the left (outline; filled on the confirm step) and the way forward on the right (Continue, Continue to cancel, Pause membership), at natural width. On a narrow phone the right button wraps under and stays right-aligned. Keep membership opens "Your membership is active again".

1. **Before you go** (`?step=reasons`, default). "What's the main reason you're cancelling?" as one list of answers, then Continue. Nothing opens under an answer: what follows is the next page. The answer is optional, so Continue never stands between someone and cancelling.
2. **The offer** (`?step=offer&reason=…`). One page per answer. Each offer is a kit `Card` (title, one line, and a full-width button that accepts it):
   - Too many emails → "Stop the emails, keep your membership": card "Unsubscribe from emails" → Unsubscribe from emails instead.
   - Too expensive → "Pay less instead": one card per lower tier, side by side (the tier name, "$15 per month", and a "Continue" button, named "Continue with Supporter" for screen readers). Two cards widen the page to `--flow-width` and sit side by side whenever they fit (by their own space, not the window), phones included; they stack only on a 320px phone. The single emails card fills the content's width. The price is a near-black, body-size subheading. A Friend has no lower tier, so they get the pause page.
   - Need a break → straight to "Pause membership instead?" (below). No card page in between.
   - No longer involved, or no answer → no offer: Continue goes straight to step 3.
3. **Cancel your membership?** (`?step=confirm`). "Your voting rights and member benefits end at the end of the month, and you won't be charged again.", then, in small grey text, how to ask for a refund (email admin@sdc.com). Keep membership (filled, left) or Cancel membership (red outline, right).

Then the ends:

- **Pause membership instead?** (`?step=pause`, the offer for "I need a break"). What pausing means ("You won't be charged while paused…") above 1, 2 or 3 months as one list (the copy doc's maximum), the restart date in bold, updating as they choose (after Disney+), then Pause membership full width right under it. Bottom row like every offer: Keep membership left, Continue to cancel right.
- **End screens for each offer** (`?step=paused|switched|unsubscribed`). The outcome as the heading, the details with dates and amounts in bold, and a muted undo line ("Switched" also says "Awesome! You can close this tab now."). Undoing changes the heading ("Your membership is active again" with "Thank you for your support!", "You'll stay a Sustainer member", "You're subscribed again") and moves focus to it.
- **Your membership is active again** (`?step=kept`). After Keep membership: "Thank you for your support!" with a small confetti burst (`Confetti`: decorative, hidden from screen readers, gone at once with reduced motion). Nothing else to do.
- **We're sorry to see you go** (`?step=cancelled`). "You've been a supporter from", then "April 2023 to November 2026" on its own line, larger (`Tenure`), then "Thank you for being a part of SDC." (joined, to the month the membership ends). No small print, no buttons.
  - Layout options to compare (`?layout=`, drafts from the design review; their copy is Claude's, marked in copy.tsx, and needs SDC's OK):
    - `card-note` (1 + 3): "Thank you for being a part of SDC.", a membership card (kit Card: "SDC membership", their name, their tier as a Badge, the dates), then a short note signed by the executive director (name is a placeholder).
    - `card-rejoin` (1 + 4): the same card, then "You're welcome back anytime. Rejoin SDC" in the undo spot. Rejoin opens "Your membership is active again" with the confetti.
    - `years-rejoin` (2 + 4): "3 years" as a big green number, "as an SDC supporter", the dates in small print, the thanks, then Rejoin SDC.

Every step is in the URL, so the phone's back button goes back a step instead of leaving the flow. The flow reads the step from the URL; `page.tsx` keys the flow by everything but the step, so moving between steps keeps what they chose.

## Open with SDC

- Strings marked "Not in doc" in `copy.tsx`.
- The maximum pause: built as 1, 2 or 3 months (copy doc: up to 3 months; the FigJam board asks for weeks, months or years).
- The confirm step no longer has the doc's "Anything you'd like us to know?" note: the survey already asks why. Put it back if SDC wants free-text feedback.
- What each tier includes (not shown until SDC says; the switch buttons show name and price only).
- The refund email address (built as admin@sdc.com).
