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
   - Too many emails → "Unsubscribe from emails instead?" with "You'll stop getting emails from SDC and stay a member." under it, then Unsubscribe from emails close under it, the size of Keep membership and on the left (`lineAction`; no card), then Keep membership / Continue to cancel. Unsubscribing opens "You're unsubscribed" with the membership still active.
   - Too expensive → "Pay less instead" (the next-payment date on its own line): two cards side by side, the member's current tier on the left (an outline "Current plan" badge, outline Continue) and the next tier down on the right (filled Continue). Buttons line up at the bottom. Each Continue is named "Continue with [tier]" for screen readers. A Friend has no lower tier, so they get the pause page.
- **Confirm your plan change** (`?step=plan`, after Continue on the lower tier; after Dribbble's "Confirm your cancellation"). An info panel, "You still have **20 days** left on your Sustainer plan." (days to the next payment), then "From **December 1, 2026**, you'll be a Supporter member for **$15** a month. You'll have access to:" and the tier's benefits with checks (placeholders in `data.ts`: SDC hasn't said what tiers include). Keep membership left, Confirm plan change right. Continue on the current tier's card opens "Keep your plan" instead, with the same panel and list and one button, "Stay a Sustainer", which opens "Your membership is active again".
   - Need a break → straight to "Pause membership instead?" (below). No card page in between.
   - No longer involved, or no answer → no offer: Continue goes straight to step 3.
3. **Cancel your membership?** (`?step=confirm`). "Your voting rights and member benefits end at the end of the month, and you won't be charged again.", then, in small grey text, how to ask for a refund (email admin@sdc.com). **Confirm cancellation** (red outline, left) or Keep membership (filled, right), after Dribbble's "Confirm your cancellation"; the only step with Keep membership on the right. Confirm cancellation is the kit `SubmitButton` in a form: a spinner while the cancellation goes through (1.2s in the demo, `CANCEL_DEMO_MS`), then the cancelled page.

Then the ends:

- **Pause membership instead?** (`?step=pause`, the offer for "I need a break"). What pausing means ("You won't be charged while paused…") above 1, 2 or 3 months as one list (the copy doc's maximum), the restart date in bold, updating as they choose (after Disney+), then Pause membership full width right under it. Bottom row like every offer: Keep membership left, Continue to cancel right.
- **End screens for each offer** (`?step=paused|switched|unsubscribed`). The outcome as the heading, the details with dates and amounts in bold, and a muted undo line ("You've switched to Supporter" has no closing line). Undoing changes the heading ("Your membership is active again" with "Thank you for your support!", "You'll stay a Sustainer member", "You're subscribed again") and moves focus to it.
- **Your membership is active again** (`?step=kept`). After Keep membership: a check in a circle draws itself in the emoji's place, then the circle fills green and the check turns white (`check`, after the referral thank-you heart); once it's done, a small confetti burst from the middle of the heading's words (`confetti`: decorative, hidden from screen readers, gone at once with reduced motion). "Thank you for your support!" under the heading. Nothing else to do.
- **Cancelled** (`?step=cancelled`). The heading "Your membership has been cancelled", then one photo card like the referral page's banner (`PhotoCard`, after `SplitLayout.tsx` on `gaurav/referrals-wired`; photo copied as `sdc-photo.jpg`), with "Thank you for being a part of SDC" in white heading type over an SDC event photo with a green shade. Under it: "We're sorry to see you go. You've been an SDC member from **April 2023** to **November 2026**. That's 3 years of support!" and "SDC runs on the generosity of members like you, so thank you for being part of it. You're welcome to rejoin anytime." ("rejoin" is the link, `InlineLink`, and opens "Your membership is active again" with the confetti). Under a year, the length is in months.

Every step sits in one card under the logo (`Template`'s `frame`), so the offers read as steps of one flow: a header with the back arrow and "Cancel membership" (grey, left), the kit `Progress` bar (as the intake form uses it, without the step text: reason, offer, confirm; with no offer, step 1 goes to 3), the step's heading and content, and a footer with the step's buttons (Keep membership left, the way forward right; on the confirm step, Confirm cancellation in primary). The end screens (paused, switched, unsubscribed, active again, cancelled) have no card: they're no longer cancelling. Accepting an offer or cancelling (Pause membership, Unsubscribe from emails, Confirm plan change, Confirm cancellation) shows the kit `SubmitButton` spinner for 0.6s first. The card is one height on desktop (592px, the tallest step) so the footer stays put; on a step taller than the window, the footer sticks to the bottom of the screen. The header and footer stay still while the content slides between steps.

Every deciding step but the survey has a small grey back arrow in the card header, left (kit ghost Button, `aria-label="Back"`). It uses the browser's back while there's a step of this flow behind it, and otherwise (a link that opened partway) goes to the step before. Every step is in the URL, so the phone's back button goes back a step instead of leaving the flow. The flow reads the step from the URL; `page.tsx` keys the flow by everything but the step, so moving between steps keeps what they chose.

## Open with SDC

- Strings marked "Not in doc" in `copy.tsx`.
- The maximum pause: built as 1, 2 or 3 months (copy doc: up to 3 months; the FigJam board asks for weeks, months or years).
- The confirm step no longer has the doc's "Anything you'd like us to know?" note: the survey already asks why. Put it back if SDC wants free-text feedback.
- What each tier includes (not shown until SDC says; the switch buttons show name and price only).
- The refund email address (built as admin@sdc.com).
