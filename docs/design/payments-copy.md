# Payments page copy

Every user-facing string on `/design/payments`, as audited. "Keep" means the string was already right. Strings marked (hidden) are for screen readers.

| Area | Where | Before | After | Reason |
|---|---|---|---|---|
| Page | Title, empty state | Payments, No payments yet | Keep | Plain, says what is empty |
| Page | Tabs | Overview, Transactions, Tiers | Keep | |
| Page | Header | Period (picker label), Download spreadsheet | Keep | "Spreadsheet", never "CSV" |
| Page | Overview region (hidden) | Payments insights | Overview | Matches the tab, no jargon |
| Number cards | Labels | $X raised this month (big number), Paying members, Gifts | Raised this month / Raised in October 2026 / Raised in Jan – Mar 2026 / Raised from Nov 2025 to Feb 2026 / Raised in total; Paying members; Monthly income; Gifted subscriptions | Four equal cards; the PM's "raised this month" wording moves into the label so every card reads label, value. "Gifted subscriptions" names what the money pays for (PM) |
| Number cards | Monthly income note | From 238 people | Removed | Paying members already says how many people (PM) |
| Number cards | Group (hidden) | Figures | Keep | |
| Number cards | Change tooltip and aria | $120 more than this time last month; 3 fewer paying members than the 2 months before | Keep | Says what and against what |
| Number cards | Value that can't be worked out | – | Not available | Never prints NaN |
| Chart cards | Titles | Earned | Earned, Raised by signup link | Plain; "raised" for money |
| Chart cards | Takeaway lines | – | $2,651 so far in Nov 2026; $1,500 from 6 links in Nov 2026; since Mar 2023 for all time | The period written out, so a screenshot describes itself |
| Chart cards | Download button | – | Tooltip "Download spreadsheet"; Download Earned as a spreadsheet (hidden) | One action, so a button, not a ⋯ menu (PM) |
| Chart cards | Download toast | – | Downloaded Earned for Nov 2026 | Same pattern as the page's spreadsheet toast |
| Chart cards | Spreadsheet columns | – | Day / Month / Year, Earned (CAD), Complete; Signup link, Raised (CAD) | Named plainly |
| Chart cards | Empty | – | No payments in Nov 2026 | Says what is missing and when |
| Chart cards | Raised by signup link rows | – | Link names, Other links, No link | "No link" also holds payments not matched to anyone |
| Earned | Axis | 1, 8, 15, 22, 29 | Nov 1, Nov 8, Nov 15, Nov 22; Jan 2025, Apr, Jul, Oct, Jan 2026; $0, $100, $1.5k | Each date label reads on its own; money ticks carry "$" |
| Earned | Group aria-label | Earned each day. Use the arrow keys to read each day. | Keep | Screen-reader instruction is needed here |
| Earned | Tooltip, live text | Nov 3: $120 so far | Keep | |
| Earned | Hidden table | Day / Month / Year, Earned | Keep | |
| Earned | Loading | Loading chart | Loading Earned | Names the card |
| Raised by signup link | Hidden table caption | – | Raised by signup link in Nov 2026. Together $2,651, the same as Raised | States the tie-out |
| Transactions | Search | Search by name or email | Keep | |
| Transactions | Filters | Tier, Status, Date; Matched, Unmatched; Apply, Cancel, Clear filter, Close, Clear date | Keep | Verb first |
| Transactions | Date filter note | Showing payments on Nov 3 | Keep | |
| Transactions | Table | Date, Name, Tier, Amount; Deleted person | Keep | |
| Transactions | Empty | No payments in this period; No payments on Nov 3 | Keep | |
| Transactions | Loading | Loading payments | Keep | |
| Payment details | Labels | Paid, PayPal fee, Earned, Tier, Email, PayPal ID | Keep | |
| Match | Title, description | Match $25 payment, From a@b.org on Nov 3, 2026 | Keep | |
| Match | Labels | Who paid?, Someone else, Person, Choose a person | Keep | |
| Match | Error | Choose who made this payment | Choose who paid | Same words as the label |
| Match | Buttons | Cancel, Match payment | Keep | |
| Match | Toast | Matched $25 to Ben Khan | Keep | Names the amount and the person |
| Match | Undo toast | Unmatched $25 from Ben Khan | Keep | Says what came back |
| Download | Field label | Payments from | Period | Matches the header picker; "from" read oddly with a range |
| Download | Toast | Downloaded 42 payments from Nov 2026 (and "from All time") | Downloaded 42 payments for Nov 2026 / for all time | Reads right for every range |
| Download | Title, buttons | Download spreadsheet, Cancel, Download | Keep | |
| Tiers | Dialog title (add) | Add a tier | Add tier | Same as the button and card |
| Tiers | Add description | It goes last in the order. You can drag it to move it. | Removed | Instruction on the page |
| Tiers | Edit note | Only new members pay a new cost. The 3 members already on Friend keep their current cost. | A new cost applies to new members only. The 3 members on Friend keep their current cost | Leads with the rule, no closing full stop |
| Tiers | Errors | Enter a tier name, up to 60 characters. / Enter a whole number of dollars above 0. / A tier with this name already exists. Choose a different name. | Enter a name up to 60 characters / Enter a whole dollar amount above 0 / Another tier already has this name | No full stops, shorter, still say the fix |
| Tiers | Fields, buttons | Name, Cost, Add tier, Save changes, Cancel | Keep | |
| Tiers | Cards | $5 a month, 74 paying, $232 earned, Deleted | Keep | |
| Tiers | Cost that differs by join date | – | $8–$10 a month, tooltip "$8 for members who joined before Mar 2026, $10 since" | Members keep the cost they joined at |
| Tiers | Unmatched money | – | $33 earned from payments not matched to anyone, so not in a tier | The tiers then add up to Raised |
| Tiers | Menu | Edit, Delete, Restore; More options for Friend (hidden) | Keep | Same words in menu, toast and undo |
| Tiers | Add toast | Friend is added. | Added Friend | Past tense, no full stop |
| Tiers | Edit toast | Friend is saved. | Saved changes to Friend | Says what was saved |
| Tiers | Delete toast | Deleted Friend | Keep | |
| Tiers | Restore toast | Restored Friend | Keep | |
| Tiers | Undo of delete / restore | Restored Friend / Deleted Friend | Keep | Says what came back |
| Tiers | Loading | Loading tiers | Keep | |
| Period picker | Trigger, grid labels, All time | Nov 2026, Jan – Mar 2026, All time; Previous year, Next year, Previous years, Next years, 2026, choose year | Keep | Nothing to change |

## Rules applied

1. Toasts name what happened and what it was about, in past tense, with no full stop.
2. An undo toast says what came back ("Restored Friend").
3. One name per action across button, menu, toast and aria-label (Add tier, Delete, Restore, Match payment, Download).
4. No instruction text on the page; tooltips and aria-labels stay when they are the only way to say it.
5. No full stops on titles, labels, errors with one sentence, or toasts.
6. Errors say the fix, or the rule that was broken, in a few words.
7. "Spreadsheet", never "CSV". "Earned" and "raised" for money.

## States

Every state is open from the State lab (`?lab=<id>`). Rules: `docs/design/state-lab.md`. Where each comes from: `docs/backend/payments-insights.md`, "When things go wrong".

| State | Where | Copy |
|---|---|---|
| First load, slow | Each part | Placeholders; after 4s "Still loading. This is taking longer than usual." |
| Page failed | Page body | Couldn't load payments / If it keeps happening, email {BSF email} / Try again |
| Numbers failed | Number card value line | Couldn't load / Try again (icon button) |
| Chart failed | Chart body | Couldn't load Earned; Couldn't load Earned by tier; Couldn't load signup links / Try again |
| Tab failed | Tab body | Couldn't load payments; Couldn't load tiers / Try again |
| Fee not in yet | Number cards, charts, payment details | — (tooltip and screen reader: Not available. PayPal hasn't sent the fee for 3 payments yet); Not in from PayPal yet |
| Refund, chargeback | Transactions, payment details | Refunded; Chargeback; Refunded in PayPal on {date}; The payer's bank took this payment back on {date} |
| PayPal events delayed | Under the header; partial numbers | PayPal is behind. Payments after Nov 18 aren't here yet; Up to Nov 18 |
| PayPal not set up | Under the header | PayPal isn't set up, so payments after Nov 18 aren't here |
| First ever | Page body | No payments yet / Payments show here once someone pays through a signup link |
| Signed out | Under the header; locked actions | You've been signed out. Sign in again in another tab to make changes; …to {download / match payments / change tiers} |
| Dialog save failed | Match, tier, download dialogs | Couldn't {match the payment / save the changes / add the tier}. Your changes are still here; Couldn't make the spreadsheet. Try again in a moment |
| Already matched | Match dialog | Another admin matched this payment to {name} while you were choosing / Use their version, Keep my version |
| No longer a member | Match dialog | {name} isn't a member any more. Choose who else paid |
| Tier deleted while editing | Tier dialog | Someone deleted {tier} while you were editing. Your changes are still here / Restore and save |
| Name taken | Tier dialog, Name field | Another tier already has this name |
| Delete failed | Toast | Couldn't delete {tier}; Couldn't restore {tier} / Try again |
| Undo expired | Toast | Couldn't undo because the change was already saved |
| Missing fields | Transactions | Deleted person; the email when there's no name; No email from PayPal; – or No tier |
