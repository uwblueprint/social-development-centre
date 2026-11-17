# Cancel membership (design)

Its own flow. Footer link 2 in every SDC email ("Pause or cancel membership") opens the first step; "Cancel membership" on the unsubscribed page (`/design/unsubscribe`) opens "Before you go", because that person already chose to cancel. Open at `/design/cancel-membership`; `page.tsx` lists the query parameters for every state. Built from the email flow's parts (`../unsubscribe/parts.tsx`), so it follows the same three patterns; see [the unsubscribe README](../unsubscribe/README.md). Demo data is shared (`../unsubscribe/data.ts`). What the backend needs is in `docs/backend/unsubscribe.md`.

Follows the [Unsub flow FigJam board](https://www.figma.com/board/jvbGjJ6Wb3CZIOjTB6x81Z/Unsub-flow), with a survey before cancelling and a lower-tier offer (references: Uber's and Hinge's cancel surveys, Spotify's cheaper plans, Disney+'s pause with a live resume date), in our design system.

## Steps

```
Pause or cancel ─► Pause ─► Paused (end)
      │              ▲
      ▼              │
Before you go ──────┤ (need a break, or too expensive → Pause instead)
  ├─ too many emails → Unsubscribed, membership kept (end)
  ├─ too expensive   → Switched to a lower tier (end)
  └─ Continue to cancel ─► Cancel your membership? ─► We're sorry to see you go (end)
                                     └─ Keep my membership ─► Your membership is active again (end)
```

- **Pause or cancel your membership** (`?step=choose`, default). What the email link promised: the membership in one line (tier · price · next payment), then Pause membership or Cancel membership.
- **Pause your membership** (`?step=pause`). 1, 2 or 3 months as one list (the copy doc's maximum), the restart date in bold, updating as they choose (after Disney+), what pausing means, then Pause membership or Back.
- **Before you go** (`?step=reasons`). "What's the main reason you're cancelling?" (optional, one answer). Each answer opens one line and its buttons, never a nested form:
  - Too many emails → Unsubscribe from emails instead.
  - It's too expensive right now → "Switch to [tier] · $[price] a month" for each lower tier (starts on the next payment), and Pause instead. A Friend has no lower tier, so only Pause instead.
  - I need a break → Pause instead.
  - I don't want to be involved with SDC anymore → nothing: Continue to cancel is right there.

  "Continue to cancel" is always visible: the question never stands between someone and cancelling.
- **End screens for each alternative** (`?step=paused|switched|unsubscribed`). Saying yes to an alternative ends the flow on its own screen: the outcome as the heading, the details with dates and amounts in bold, and a muted undo line ("Switched" also says "Awesome! You can close this tab now."). Undoing changes the heading ("Your membership is active again" with "Thank you for your support.", "You'll stay a Supporter member", "You're subscribed again") and moves focus to it.
- **Cancel your membership?** (`?step=confirm`). "Your voting rights and member benefits end at the end of the month, and you won't be charged again.", then, in small grey text, how to ask for a refund (email admin@sdc.com). Cancel membership, or Keep my membership.
- **Your membership is active again** (`?step=kept`). After Keep my membership: "Thank you for your support." Nothing else to do.
- **We're sorry to see you go** (`?step=cancelled`). Thanks (the "supporter since" line lives only here), the confirmation email and "You can rejoin anytime", and, if they still get emails, Keep getting emails / Unsubscribe.

Every step is in the URL, so the phone's back button goes back a step instead of leaving the flow. The flow reads the step from the URL; `page.tsx` keys the flow by everything but the step, so moving between steps keeps what they chose.

## Open with SDC

- Strings marked "Not in doc" in `copy.tsx`.
- The maximum pause: built as 1, 2 or 3 months (copy doc: up to 3 months; the FigJam board asks for weeks, months or years).
- The confirm step no longer has the doc's "Anything you'd like us to know?" note: the survey already asks why. Put it back if SDC wants free-text feedback.
- What each tier includes (not shown until SDC says; the switch buttons show name and price only).
- The refund email address (built as admin@sdc.com).
