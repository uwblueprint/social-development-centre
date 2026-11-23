# Payments page: what the design needs from the backend

The design is at `/design/payments` (`src/app/design/(admin)/payments/`), on demo data. It builds on
Icema's PayPal work (`icema/payments`: `subscriptions`, `payments`, `paypal_events`) and Sophia's tiers
(`sophiatiers`: `tiers`, `memberships.tier_id`).

Every amount on the page is what SDC keeps: payments minus PayPal's fees, net of any refunds and chargebacks (see "When things go wrong").

## What the page is for

An insights page with two jobs:

1. **Hand off to finance.** Month-end and year-end reconciliation: a spreadsheet that ties out, with gross,
   PayPal fee, net and the PayPal ID on every transaction.
2. **Answer questions** from the board, funders or a member: "how much did we keep this year?", "how many
   people pay?", "did Maria pay in March?"

To-dos (failed or paused payments, unmatched money, unfinished PayPal approvals) are handled by
Notifications elsewhere in the product. This page has no "Needs attention" section and no action queue.
People quietly lapsing is rare, so the page shows it (Paying members, the Transactions list) without
building around it.

## What's on the page

1. **Header.** The page title, one month-range menu (this month by default) and Download spreadsheet.
2. **Tabs.** Overview, Transactions and Tiers. All three follow the one range in the header.
   - **Overview:** a dashboard of boxed cards meant to be screenshotted or exported into grant reports and board
     updates. Payments only (who joined or left belongs to the member directory). Nothing on it has its own filter:
     the header range drives every card.
     - **Number cards**, four equal cards in a row (two by two on tablets, one above the other on phones), all
       formatted the same way: a muted label, a large value and, where there is one, a change mark beside it.
       Values share one baseline across the row. No card has a line under its value.
       - **Raised:** what SDC kept after PayPal fees in the range. The label carries the range: "Raised this month",
         "Raised in October 2026", "Raised in Jan – Mar 2026", "Raised from Nov 2025 to Feb 2026", "Raised in total".
       - **Paying members:** people with an active paid subscription at the end of the range (today if the range
         runs to today). It is the payer base behind Monthly income.
       - **Monthly income:** what everyone paying at the end of the range brings in each month: the sum of each
         paying subscription's own amount (never a tier's cost times its people, because people pay what they
         signed up at).
       - **Gifted subscriptions:** money gifted in the range, after PayPal fees like Raised (the value may become a count; open question).
       - Raised and Paying members have a change mark (a filled triangle and the amount, with the full sentence in a
         tooltip, e.g. "$90 less than Oct 1–22" or "8 more paying members than on Oct 22"). Raised compares the
         days so far with the same days of the month before (a past month or several months: the previous equal
         stretch of whole months); Paying members compares with the same date a month earlier. The mark is hidden
         when there is no previous period, no change, or the comparison isn't real: the previous period starts
         before the first payment (Raised), or the date is before the first person joined (Paying members).
     - **Chart cards**, full width, one above the other. Each has a title, a muted line under it that says the
       takeaway and the period written out (so a screenshot describes itself), and a download button (icon,
       tooltip "Download spreadsheet") that saves exactly that chart's data, named like
       `potluck-earned-2026-11.csv`, with the toast "Downloaded Earned for Nov 2026". An empty card keeps its height
       and says so in one line ("No payments in Nov 2026"); while loading it shows a placeholder of the same height.
       - **Earned:** columns of kept money per day (one month), per month (up to two years) or per year. Bars are
         neutral; the period still filling up is SDC green and says "so far" in its tooltip and in the takeaway
         ("$2,651 so far in Nov 2026"). Clicking a column (or Enter on it) opens Transactions for that bucket; hover,
         tap or the arrow keys read a column out. Spreadsheet columns: Day/Month/Year, Earned (CAD), Complete.
       - **Raised by signup link:** horizontal bars of money kept in the range by the signup link each payer joined
         through: the top five links by amount, then "Other links", then "No link" (people who joined without a
         link, and payments not matched to anyone). Every payment in the range counts, not only from people who
         joined in it, so the bars add up to Raised. The amount is printed at each bar's end. Takeaway: "$1,500 from
         6 links in Nov 2026". Spreadsheet columns: Signup link, Raised (CAD).
       - No tier chart (tiers get renamed, repriced and deleted; tier detail is on the Tiers tab) and no "people
         paying over time" chart (the number card covers it).
     - Each chart keeps a visually hidden table of its data for screen readers; values that matter are printed (the
       takeaway line, the amounts beside the bars), never only in a tooltip.
   - **Transactions:** search by name or email plus Tier (several) and Status (Matched / Unmatched) filters beside it, then Date, Name, Tier, Amount, 25 a page. A row opens the
     payment's details (paid, PayPal fee, kept, tier, email, PayPal ID). An unmatched payment shows
     "Unmatched" after the payer's email and opens Match, which is useful for finance.
   - **Tiers:** one list of tiers in the order members see them. Each row shows the tier's name, price a month,
     how many were paying at the end of the range (same count as Paying members, split by tier) and what SDC
     kept in the range, as a table (Tier, Price, Paying members, Earned). Archived tiers stay in it, below the active ones, marked "Archived", with their numbers. A row click or the row's ⋯ menu opens Edit; the menu also has Archive, or Restore on an archived tier. Add tier and drag-to-reorder (or Up/Down on a row's handle) are
     here too: tier management moved from Settings to this tab (see "Tier management" below).
3. **Spreadsheet.** A dialog asks for the range (the page's current range each time it opens, changeable inside) and shows the count. The file has
   one row per PayPal transaction, oldest first, with no totals. Columns: Date, Time, Type, PayPal
   transaction ID, Name, Email, Tier, Gross, PayPal fee, Net, Currency, Subscription ID, Signup link. Amounts
   are plain numbers. It's named `potluck-payments-<from>-to-<to>.csv`.

## What loads when

Keep the first load small. Load everything else only when someone asks for it.

| When | What | Shape |
| --- | --- | --- |
| Page load (server) | The four numbers for the chosen period, Raised and Paying members with the same number for the period before (Overview is the open tab) | One RPC returning a few numbers. No row lists. |
| Overview charts shown or range changed | Kept per day, month or year in the range, and kept by signup link (see below) | One RPC per chart per range (≤ 31 rows and ≤ 7 rows), cached in the browser |
| Transactions tab opened | Page 1 of payments in the period | Paged on the server, 25 rows. Each page is fetched when it's asked for. |
| Tiers tab opened | Per tier: members paying at the range's last day and what SDC kept in the range | One small query, run only when the tab opens (Radix only mounts the open tab) |
| Download spreadsheet clicked | Every payment in the period | Built on the server when the button is clicked, never preloaded |
| Match opened | Likely payers for that payment, then the full people list if "Someone else" is chosen | Suggestions query first, then a searched list |

## Where the money comes from

Every amount comes from actual payments, never from a tier's cost:

- **Raised and Earned** are the sum of `amount − fee` for payments in the range (or bucket).
- **Each subscription has its own amount**, set when the person joins (the tier's cost that day). A cost change
  applies only to people who join after it, so people on one tier can pay different amounts. **Monthly income** is
  the sum of those amounts for everyone paying on the range's last day.
- **Each payment keeps its `tier_id`** (the tier it paid for) and its amount, so renaming, repricing or deleting a
  tier never moves past money. A deleted tier keeps its members paying and its payments counted.
- **By-tier totals tie to Raised.** Payments not matched to anyone have no tier; the Tiers tab shows them as one
  line ("$33 earned from payments not matched to anyone, so not in a tier").
- **Tiers tab cost** shows a range when members of a tier pay different amounts ("$8–$10 a month") with a tooltip
  from the tier's history: "$8 for members who joined before Mar 2026, $10 since".

## What the charts need

Buckets are days, months or years in SDC's time zone.

- **Earned:** per bucket, the sum of `amount − fee` for payments paid in it.
- **Raised by signup link:** for the range, the sum of `amount − fee` grouped by the signup link of each payment's
  person (null person or null link = "No link").
- **Paying members:** on the range's last day, counted from when each person started paying and, if they cancelled,
  when (so every person needs a start date and a cancel date, kept after they leave). People still waiting to
  approve in PayPal don't count.

## Already covered

- Paying members come from `subscriptions`.
- Amounts, payer emails and unmatched payments (`person_id` is null) come from `payments`.
- Matching a payment uses `assign_payment()`.
- Each member's tier comes from `memberships.tier_id`. What they pay comes from their PayPal subscription's plan, not from `tiers.price_cad` (see "A tier's cost" below).

## Needed

- **PayPal fee on every payment.** `payments.fee_cents` exists but is nullable. The webhook should fill it
  from the sale's `transaction_fee`, because every number on the page depends on it.
- **Suggested payers for an unmatched payment** (used by Match). Rank people by a name in the payer's email and the same amount as they pay.
- **Each subscription's own amount.** `subscriptions.price_cad` (or read from the PayPal plan), set at join and never
  changed by a tier edit. Monthly income, expected payments and Match use it.
- **Tier and amount on each payment.** `payments.tier_id` (the tier the subscription was on when it paid) next to
  the amount, so by-tier totals don't move when a tier is renamed, repriced or deleted. Matching a payment sets it
  from the person's tier; undoing the match clears it.
- **Tier history.** A row per cost change (`tier_id`, old cost, the date it stopped applying to new members), and
  renames, so the Tiers tab can say who pays what and old reports keep the names they had.
- **Undo a match.** Matching is undone from the toast or with Ctrl+Z. `assign_payment()` needs a matching
  `unassign_payment()` that admins can call.
- **Signup link per person.** Which link each person joined through (for example `people.signup_link_id`, set when
  they join, kept if the link is later deleted), so Raised by signup link and the signup links page can add up
  what each link raised.
- **Gifted memberships.** Gifting doesn't exist on Icema's branch (payments are subscriptions only, decided 19 Nov).
  Gifting is a choice made at sign-up ("Gift a membership"), stored on the subscription (`gifts_membership`) together
  with the subscription's own contracted amount, stored at join and never changed when a tier's cost changes. Each
  monthly charge from that person is then twice their own amount and the page shows it as two rows with the same
  PayPal transaction id: their membership (with their tier), then "Gifted membership" bought by them (no tier). Split
  by the stored own amount, never by the tier's current cost, so a tier that doubles its price isn't mistaken for a
  gift. If the flag is missing, a charge of exactly 2 x the own amount counts as own + gift. That needs line items:
  `payments.kind` gains `gift`, or a `payment_items` table (charge id, kind, amount, fee share, person). The fee is
  split across the items in proportion to amount, to the cent, so they add up to the charge. A declined charge from a
  gifter is one Declined row for the whole charge. Gift rows have no tier and are never matched or unmatched; Earned by
  tier shows them as "Gifted memberships" so the bars still add up.
- **Declined cards as rows.** Today `BILLING.SUBSCRIPTION.PAYMENT.FAILED` only bumps `subscriptions.failed_attempts`
  and `last_failed_at`; no payment row is written, and the history is lost when a retry succeeds (the count resets to
  0). The page shows each declined attempt as a $0 transaction with the status Declined, linked to the person, so
  staff can contact them. Needs a row per attempt (for example `payments.kind = 'declined'`, `amount_cents = 0`,
  the amount PayPal tried in a separate column, the date, the subscription). Declined rows never count toward
  money, fees or payment counts. Also handle `PAYMENT.SALE.DENIED` the same way (ignored today). Check whether PayPal
  sends one `PAYMENT.FAILED` per retry: `docs/backend/payments.md` flags this as unverified.
- **Refunds and reversals.** The webhook stores them as negative `payments` rows. The page shows them (State lab
  `refunds`, see "When things go wrong") on the day the money went back, and nets them out of every total. A refund
  row needs a link to its sale (`refund_of` foreign key) and the sale's `tier_id`; today only the person and
  subscription are copied.
- **Payer email.** `payments.payer_email` exists but the webhook never writes it, so unmatched payments can't show
  who paid or suggest a match. Fill it from the sale.
- **Currency.** Rows store their currency; everything on the page assumes CAD. Non-CAD rows must be converted or
  flagged, never added to CAD totals.
- **Sandbox and live.** `payments` has no environment column, so sandbox and live rows would mix if they share a
  database. Add one, or use separate databases.
- **Tiers and PayPal plans aren't connected.** Sophia's tiers and Icema's subscriptions never reference each other:
  PayPal plans are one env var, and choosing a tier doesn't start a subscription. A tier needs its PayPal plan (one
  plan per tier per cost), and a subscription its tier.
- **Reads for this page.** Icema's queries (`listMemberPayments`, `listUnmatchedPayments`) list members and unmatched
  payments only. This page needs: payments in a date range with person, tier, kind, fee and signup link; totals by
  day, month or year; totals by tier and by link; paying members on a date. All are new server reads.
- **Time zone.** Days and months are counted in SDC's time zone (America/Toronto).

## When things go wrong

Every state below comes from the payments backend as built (Icema's `subscriptions`, `payments` and `paypal_events`,
the webhook and `assign_payment()`; Sophia's tier RPCs). Each one is designed on demo data and opens from the State
lab (bottom left of `/design/payments`) or a link, `?lab=<id>` (several with commas) with the view params below, e.g.
`/design/payments?tab=transactions&lab=transactions-failed`. The rules behind them are in `docs/design/state-lab.md`.

**Each part fails on its own.** The page loads in parts (the table above), and one part failing never takes the
others down, so each is its own request with its own error.

| Part | Lab state | What the page shows | What the backend must return |
| --- | --- | --- | --- |
| Page shell (header, tabs, the picker's first and last month) | `load-failed` | "Couldn't load payments", Try again, the support email | An error the route can catch |
| The four numbers (one RPC) | `numbers-failed` | Each card keeps its label and height: "Couldn't load", Try again (any card retries all four) | An error, never zeros |
| Each chart (one RPC each) | `charts-failed` | "Couldn't load Earned" (and so on) in the chart's place, Try again on each card | An error per chart |
| Transactions (a page of rows) | `transactions-failed` | "Couldn't load payments" in the table's place; search and filters stay | An error from the paged query |
| Tiers | `tiers-failed` | "Couldn't load tiers" in the list's place | An error from the tiers query |
| Spreadsheet | `download-failed` | The dialog stays open: "Couldn't make the spreadsheet. Try again in a moment" | An error, not an empty file |
| Match (`assign_payment`) | Save failed, Changed by someone else, `match-not-member` | The dialog stays open with the choice kept: "Couldn't match the payment…"; "Another admin matched this payment to Ben Khan" with Use their version / Keep my version; "Ben Khan isn't a member any more. Choose who else paid" | The three errors the RPC already raises, as distinct codes (`already_assigned` with who it went to, `not_member`, anything else) |
| Tier add / edit (`add_tier`, `update_tier`) | Save failed, Validation error, `tier-deleted` | "Couldn't save the changes…"; "Another tier already has this name" on the field; "Someone deleted Friend while you were editing" with Restore and save | `name_taken` and `deleted` as the RPCs already return them. There is no "changed by someone else" check (the last save wins), so the page has no clash state for tiers |
| Tier delete / restore (`archive_tier`) | `delete-failed` | Toast "Couldn't delete Friend" with Try again | An error |
| Any write after the admin session ended | Session expired | A notice under the header; every write is locked with "You've been signed out. Sign in again in another tab to…" | The RPCs' `42501` ("Only admins can…") as a distinct code, so the page says "signed out", not "couldn't save" |

**Refunds and chargebacks** (`refunds`). The backend stores them as rows with `kind` `refund` or `reversal` and a
negative amount, on the same person as the payment they undo. This page used to assume there were none; they happen
even though SDC doesn't refund through the platform (a refund made in PayPal, or the payer's bank taking a payment
back). The page shows them as their own rows ("Refunded", "Chargeback", with a minus amount), every total nets them
out (Raised, Earned, by tier, by signup link), a day can go below zero on Earned (its axis then starts below zero),
and the spreadsheet types them "Refund" or "Chargeback". The backend needs to keep `tier_id` and the signup link on
these rows like on the payment, so by-tier and by-link totals stay right.

**PayPal's fee can arrive late** (`fees-missing`). `payments.fee_cents` is null when PayPal sends a sale without its
fee. Until it arrives, what SDC kept can't be worked out: Raised and Gifted show a dash with "PayPal hasn't sent the
fee for 3 payments yet", the charts of kept money say the same in their place, the payment's details say "Not in
from PayPal yet", and the spreadsheet leaves the fee and net cells empty. The RPCs must return `null` (with the count
of payments without a fee), never a total that quietly treats the fee as 0. Every other number on the page is the
same: `null` for unknown, never `NaN`, never a silent 0. 0 means a real zero.

**PayPal itself.** The numbers RPC also returns:

- `paypal_status`: `ok`, `behind` (webhook events in `paypal_events` with an `error`, or none received for longer
  than expected, while PayPal retries) or `not_set_up` (no PayPal keys, e.g. during handoff).
- `complete_through`: the last day the data is complete for. The page says "PayPal is behind. Payments after Nov 18
  aren't here yet" (`paypal-behind`) or "PayPal isn't set up, so payments after Nov 18 aren't here"
  (`paypal-not-set-up`), and every number and chart for a range that runs past that day says "Up to Nov 18", with
  change marks hidden so a short month never reads as a drop.

**Empty, three ways.** No payments ever (`empty`): "No payments yet", no picker or download. No payments in the chosen
months (`range-empty`): every part loads normally with zeros, charts say "No payments in Oct 2026", the picker stays.
Filtered to nothing (`?tab=transactions&q=…`): the list says what didn't match and offers Clear. Nothing special is
needed from the backend as long as an empty range returns empty rows and zeros, not an error. No tiers (`no-tiers`):
only Add tier shows.

**Partial records** (`partial-data`). `payer_email` is nullable: an unmatched payment with no email shows "No email
from PayPal". A person deleted after paying shows "Deleted person" (today `person_id` is set to null on delete, which
makes the payment look unmatched; keep the id, or return a deleted flag). A person with no name shows their email. A
payment with no tier shows "–" (table) or "No tier" (phone).

## View state in the URL

Every part of the view is a search param, so any view can be bookmarked or shared. Defaults are left out and
invalid values fall back to the default without a message. Written with `router.replace`; opening a payment's
details uses `router.push` so Back closes it.

| Param | Example | Meaning |
| --- | --- | --- |
| `range` | `2026-01..2026-03`, `2026-11`, `all` | The month range (default: this month) |
| `tab` | `transactions`, `tiers` | The open tab (default: overview) |
| `on` | `2026-11-14`, `2026-03`, `2025` | The chart column opened in Transactions |
| `q` | `chen` | Search text (Transactions) |
| `tier` | `friend,supporter` | Tier filter (Transactions) |
| `type` | `declined,refund` | What the row is: `membership`, `gifted`, `declined`, `refund`, `chargeback` (Transactions) |
| `status` | `unmatched` | Whether the row is tied to a person: `matched`, `unmatched` (Transactions). Old links with `status=declined` or `status=gifted` open as that `type` |
| `page` | `3` | Transactions page (1 is left out) |
| `payment` | a payment id | The open payment details |
| `lab` | `refunds,numbers-failed` | Design only: the State lab states that are on (see "When things go wrong") |

Changing the range clears `on`, `page` and `payment`. Changing the search or filters clears `page`. Leaving
Transactions clears `q`, `tier`, `type`, `status`, `page` and `payment`. For the real page the server reads the same
params, so the first load already has the right numbers and page of rows.

## Tier management (moved here from Settings)

Sophia built admin tier management in Settings (`sophiatiers`, commit defe30d: `src/features/tiers/`,
`docs/backend/tiers.md`). The PM wants it on this page, on the Tiers tab. The design is the same feature on demo
data; nothing new is needed from the database except where listed here.

What it uses from Sophia's work, unchanged:

- `tiers` (`id`, `name`, `price_cad` in whole dollars above 0, `position`, `archived_at`/`archived_by`). Names are unique
  (ignoring case and spaces) among tiers that aren't archived. No cap on the number of tiers.
- Writes through `add_tier` (goes last), `update_tier`, `archive_tier` and `reorder_tiers` (every tier still
  offered, in the new order). Server actions `addTier`, `updateTier`, `deleteTier` (archives) and `reorderTiers`.
  Messages: "Enter a tier name, up to 60 characters.", "Enter a whole number of dollars above 0.", "A tier with this
  name already exists. Choose a different name."
- Archiving keeps people on the tier and keeps them paying; new members can't choose it.
- The kit `SortableList` (`docs/components/SortableList.md`) for drag and keyboard reordering.

What changes:

- **Settings no longer has the section.** Remove `TiersSection` from `/admin/settings` and mount the new tab
  instead; the actions and queries stay.
- **Archive has an Undo, no confirmation dialog.** The toast's Undo (and Ctrl+Z) needs an `unarchive_tier(id)`
  that clears `archived_at` and puts the tier back in its old place. Restore (⋯ menu on an archived tier) uses the same
  `unarchive_tier(id)` and has its own Undo toast. Sophia's design has no restore, so this is new. Reordering and archiving keep `position` stable for archived tiers so Undo returns the tier to
  the same place.
- **Per-tier numbers.** Each row also needs paying people and kept money for the range, from the Tiers query
  above. Archived tiers stay in the table (below the active ones, with their paying members and earned), so the tab's totals tie to Overview.
- **A tier's cost (decided 23 Nov, PM).** A new cost applies only to people who join after the change; they see
  it on the join page. Existing memberships keep the cost they signed up at. This reverses the comment in Sophia's
  migration ("Editing a price changes it for everyone on the tier"), which needs updating. It also matches how
  PayPal works: each membership is a PayPal subscription on a plan with a fixed price (Icema's `config.ts` has one
  PayPal plan per price), so changing `tiers.price_cad` can't change what existing members are charged. What's needed:
  - Changing a tier's cost points the tier at a PayPal plan for the new price (create the plan if none exists), so
    new subscriptions use it. Existing subscriptions stay on their plan.
  - Store what each member pays on their subscription (for example `subscriptions.price_cad`, or read it from
    their PayPal plan), and use that, not `tiers.price_cad`, wherever a member's amount is shown or counted
    (suggested payers in Match, expected payments).
  - The join page reads `tiers.price_cad` for new members.
- **Edit note.** "Only new members pay a new cost. The N members already on {tier} keep their current cost." N counts
  people paying that tier now.
- The delete confirmation that listed who is on the tier (`getTierMembers`) isn't used here, because archiving
  can be undone.

## Not on this page

- **To-dos.** Failed or paused payments, unmatched money and unfinished PayPal approvals are Notifications.
- **People and their status.** These live in the People page.
- **Charitable tax receipts.** CRA generally doesn't allow receipts for memberships that come with benefits.
  Gifts might qualify, but only if SDC is a registered charity. Decide this with SDC first.

## Next steps

- **Image export for a chart card** (PNG or SVG for slides and reports). There is no image library in the repo yet;
  each card's download button saves a spreadsheet for now.
- **Event markers on Earned**, derived from signup links (a link's event date), so a spike can be read as "after the
  Fall community fair" without a separate events table.
