# Unsubscribe and pause or cancel membership: what the design needs from the backend

Design screens: `src/app/design/unsubscribe/` (the email flow) and `src/app/design/cancel-membership/` (its own
flow). Demo data is in `src/app/design/unsubscribe/data.ts`; its types are the contract the screens read. Flow: the "Unsub flow" FigJam board (https://www.figma.com/board/jvbGjJ6Wb3CZIOjTB6x81Z/Unsub-flow).
Copy: "SDC Unsubscribe & Cancel Membership — Step Copy" (https://claude.ai/artifact/9oi6VCBrW5R1xkz3uA9DzV).
Jesse's `origin/jesse/email-links` branch already has unsubscribe tokens (`openLink`, `unsubscribe`,
`resubscribe`, `giveUnsubscribeReason`); reuse those where they fit.

Items marked **new** aren't on Jesse's branch.

## Opening the pages
- Both footer links carry the per-recipient token. No sign-in: the token says who it is.
- Footer link 1 opens the email page; footer link 2 ("Pause or cancel membership") opens the cancel-membership
  flow. "Cancel membership" on the unsubscribed page opens the same flow.
- Opening a page never changes anything (email scanners open links). Every change is a button press.
- Each page needs: first name, email, member or not, subscribed or not, the chosen email types, and for members the tier
  name, monthly price, next payment date, member-since date and status (active / paused / cancelled), and the
  list of tiers with prices (and what each includes, once SDC says).
- An unknown or broken token shows Jesse's "This link doesn't work" page.

## Email preferences page
- Whether the person is a member comes from their record via the token, never from the URL.
- **Email types (new):** the types a person still wants: the monthly summary, and for members "only emails
  about my membership" (SDC to confirm the real list). The page opens with the types they get now ticked.
  `save_email_types(token, types[])`. "Unsubscribe from all emails", or an empty list, is an unsubscribe:
  Jesse's `unsubscribe(token)`. Legally required voting notices always send and aren't a type.
- Resubscribe: Jesse's `resubscribe(token)`, back to every type.

## Cancel-membership flow
- "What's the main reason you're cancelling?" (optional, one answer): too many emails / too expensive / need a
  break / no longer involved. Store it with whatever they do next, including the cancellation.
- Too many emails: unsubscribes from emails only (same as the email page's "Unsubscribe from all emails").
- **Switch to a lower tier (new):** `change_tier(token, tierId)`. Takes effect on the next payment; the
  current period stays at the current tier. Undoable until then (`change_tier` back to the current tier).
- **Pause (new):** `pause_membership(token, months)`, months 1, 2 or 3 (SDC to confirm the maximum; the FigJam
  board asks for weeks, months or years). No charges while paused; voting rights and benefits on hold. Returns
  the restart date. Sends a reminder email 7 days before the restart (FigJam: "you'll get an email a week
  before").
- **Restart now (new):** `restart_membership(token)`.
- **Cancel (new):** `cancel_membership(token, reason?)`. (The design dropped the copy doc's free-text note; add
  `note?` back if SDC keeps it.) No more charges. Voting rights and benefits end at the end of
  the month. No automatic refund: the confirm step tells them to email admin@sdc.com (SDC to confirm the address). Sends a confirmation email.
- After cancelling, "unsubscribe here" links to the email page (footer link 1) with the same token.

## When the flow ends (FigJam: "End")
- Update the member's panel in the admin portal: membership status, pause dates, subscribed or not, the
  reason and the cancel note.
- **Admin alert (new):** tell SDC staff when someone cancels (and, to confirm with SDC, when someone pauses or
  switches tier).
