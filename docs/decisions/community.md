# Community: decision log

Assumptions made while building the UI from the Community PRD. Each can be revisited.

## 1. General members and Paying members are exclusive; unsubscribed people only appear in search
- **Superseded in part (27 Sep):** unsubscribed people are now shown through the Status filter, not appended to General search results; the tabs still split by tier. See 16 and 17.
- **Decision (owner, 27 Sep, replaces 26 Sep):** **General members** lists and counts subscribed people who aren't paying members. **Paying members** lists and counts subscribed paying members. Nobody is in both. Unsubscribed people are left out of both lists and every count. The General tab's tooltip says: "Subscribed people who aren't paying members." An empty search on either tab offers the other tab when it has matches.
- **Before (26 Sep):** General members included paying members.
- **Search fallback (assumption):** a search on **General members** still returns matching unsubscribed people, after every subscribed match, dimmed and marked with an **Unsubscribed** badge, so admins can answer "why isn't X getting emails?" Search on **Paying members** doesn't include them.
- **Page:** Admin → Community → General members tab.
- **Affects:** List contents, tab counts, search results, export (see 7).
- **When encountered:** Every visit (the count); looking up someone who unsubscribed.

## 2. Add member and Import members; a checkbox decides paying
- **Decision (owner, 27 Sep, replaces the two buttons):** The header has **Export members** and one primary **Add members** button (UserPlus). The dialog opens on a tag input: each typed or pasted address becomes a tag, invalid ones are marked with an icon and a reason. **Import from a file** switches the same dialog to CSV upload (with **Back**); both lead to the same preview. The add view takes addresses only; names come from a file or **Edit details**.
- **Before (26 Sep, decision 7):** The header had **Add member** (primary, one person), **Import members** (paste many addresses or **Upload CSV**) and **Export members**. Both add flows have an unchecked checkbox, **Make them a paying member** / **Make them paying members**. The current tab no longer decides the tier. Re-adding an existing general member with it checked converts them. Paying members are never downgraded.
- **Page:** Admin → Community header; Add member and Import members dialogs.
- **Affects:** Which email each person receives.
- **When encountered:** Every manual add or import.

## 3. Expect mistakes: preview every outcome before anything changes
- **Decision (owner, decision 7):** "Generally expect that admin will make a few mistakes… Help achieve their intent. If genuinely unsure, then verify with the user." After **Continue**, the preview groups every address by what will happen: new people (general or paying), general members who'll become paying, people already paying (no change), people already general (no change, with a hint to check the paying box), addresses entered more than once (merged), invalid entries (listed, skipped), people who unsubscribed themselves, and people an admin unsubscribed. Each group expands to list its addresses. The preview states how many emails will be sent and the button says how many changes (**Confirm N changes**). Nothing changes that isn't shown; with nothing to change, the admin sees "Nothing will change" and a **Close** button.
- **Forgiving input (assumption):** input accepts commas, semicolons, tabs and new lines; `Name <email>`, `"Last, First" <email>` and `Name email` lines (the name is kept for new people); `mailto:`, capitals and trailing punctuation. **Upload CSV** finds the email and name columns by header (or the cell with "@") and puts one line per row into the text box so the admin can check and edit before continuing. Pasting several addresses into Add member's Email field previews all of them.
- **Page:** Admin → Community → Add member / Import members.
- **Affects:** Prevents duplicates, silent downgrades and accidental mass emails.
- **When encountered:** Every add, most visibly with long lists.

## 4. Unsubscribed people in an add or import
- **Decision (owner, decision 6):** People who unsubscribed themselves are never resubscribed; with the paying box checked they still become paying members, without an email. People an admin unsubscribed are the "genuinely unsure" case: the preview asks with an unchecked checkbox, **Resubscribe N people an admin unsubscribed**. Resubscribing sends no welcome; someone resubscribed and converted in the same import gets the Paying membership added email.
- **Page:** Admin → Community → Add member / Import members (preview).
- **Affects:** Consent; the integrated sender.
- **When encountered:** Importing a list that contains people who unsubscribed earlier.

## 5. The initial backfill is a code-side migration
- **Decision:** SDC's existing list is loaded once by a migration script that sends no emails. The admin UI has no "skip welcome emails" option; Add member and Import members always send the matching email.
- **Page:** None in the admin UI (engineering task at launch).
- **Affects:** Launch migration; prevents accidental mass welcomes.
- **When encountered:** Once, before launch.

## 6. Resubscribe only people an admin unsubscribed
- **Decision (owner, 26 Sep, decision 6):** Each unsubscribe records who did it (`unsubscribedBy`: the person or an admin). **Resubscribe** appears in the row and panel **⋯** menus only for people an admin unsubscribed; it needs no confirmation and sends no welcome. For people who unsubscribed themselves there's no action; the panel header says "Unsubscribed themselves on {date}. Only they can resubscribe." (Admin-unsubscribed people show "Unsubscribed by an admin on {date}.") Resubscribing keeps their tier.
- **Page:** Admin → Community → person panel and row menu (unsubscribed records, found by search).
- **Affects:** Resubscribe consent.
- **When encountered:** An unsubscribed person asks to be added back.

## 7. Export follows the tab unless changed
- **Superseded in part (27 Sep):** the export now also chooses Members or Activity and has every field. See 21.
- **Decision (owner, 27 Sep):** **Export members** offers **General members**, **Paying members** or **Both**, and defaults to the current tab. "Include unsubscribed members" applies to any choice (unsubscribing stops emails, not paying access). It shows the record count before download. CSV columns: name, email.
- **Page:** Admin → Community → Export members.
- **Affects:** Contact lists leaving the platform.
- **When encountered:** Pulling a list for an outside tool or report.

## 8. Names are optional
- **Decision:** People can exist with only an email; the list shows "No name" and admins can add a name later in the person panel.
- **Page:** Admin → Community (list and person panel).
- **When encountered:** After pasting bare addresses.

## 9. Unsubscribed status is inline, not a column
- **Superseded (27 Sep):** a Status column is back, with one status per person (see 16). Unsubscribed rows are still dimmed.
- **Decision:** Dropped the dedicated Status column. In search results, an unsubscribed person's name and email are dimmed and the name carries a text **Unsubscribed** badge (replacing the earlier mail-off icon and tooltip), freeing a column for Last email.
- **Page:** Admin → Community → table.
- **Affects:** Table density; the "Give paying access"/"Remove paying access" action is renamed "Convert to paying member"/"Remove paying access" everywhere, including the row's own **⋯** menu.
- **When encountered:** Scanning the table for who's unsubscribed.

## 10. Row actions and email history live at two altitudes
- **Changed (27 Sep):** the row menu no longer has **Copy email** (the email itself copies, see 19).
- **Decision:** Every row has its own **⋯** menu (copy email, convert/remove, unsubscribe or, for people an admin unsubscribed, resubscribe) so common actions don't require opening the panel. Every item in both ⋯ menus has an icon.
- **Page:** Admin → Community → table row menu.
- **When encountered:** Bulk-managing access from the list instead of one profile at a time.

## 11. The person panel is one scrolling view
- **Superseded in part (27 Sep):** the header has no badges and no ⋯ menu; actions are a visible row. See 20.
- **Decision (owner, 26 Sep):** No tabs, no avatar, no primary button. The header shows the name (or the email when there's no name), the email with a copy button, status badges (**General member** or **Paying member**, plus **Unsubscribed**; see 13) and "Added {date}". Every action (**Edit details**, **Copy email**, **Convert to paying member** / **Remove paying access**, **Unsubscribe** / **Resubscribe**, see 6) is in the header's **⋯** menu. Each fact appears once: the email isn't repeated in a details list and the status isn't repeated elsewhere.
- **Emails:** below the header, an **Emails** section lists every email sent to the person, newest first, all expanded (no accordion, no Expand all). Each shows its subject as a heading and a short sent date on the same line, plus **Not delivered** when delivery failed (see 14); the kind label ("Opportunities") is gone. Each body renders in a sandboxed frame of fixed height with its own scrollbar, and is fetched only when it scrolls near view, with a same-size placeholder until then, so the panel opens fast. With no emails: "No emails sent yet."
- **Page:** Admin → Community → person panel.
- **Affects:** The email body is a separate backend call (`getSentEmailHtml`).
- **When encountered:** Checking what someone received, or acting on one person.

## 12. The copy button confirms, then reverts
- **Changed (27 Sep):** the whole email is the copy control; see 19.
- **Decision:** The copy icon next to an email shows a check and a "Copied" tooltip for about 1.5 seconds, then reverts. The tooltip closes as soon as the pointer leaves or focus moves.
- **Page:** Admin → Community → table Email column and person panel header.
- **When encountered:** Copying an email address.

## 13. Convert to paying member has no subscription gate
- **Decision (owner, decision 7):** **Convert to paying member** works for anyone who isn't paying, including unsubscribed people (found by search). Subscribed people get the **Paying membership added** email and the toast ends "Paying member email sent." only when delivery succeeded; if it wasn't delivered the toast says so and asks to check the address. Unsubscribed people get paying access and no email, and the toast says "No email sent because they're unsubscribed." The old eligibility error is gone. **Remove paying access** likewise emails only subscribed people.
- **Status badges:** because an unsubscribed person can now be paying, the panel shows the tier badge (**General member** / **Paying member**) plus an **Unsubscribed** badge when it applies.
- **Open question:** an admin **Unsubscribe** still removes paying access (existing behaviour), while the owner's UX spec (retired) says subscription is independent of paying access. Confirm with the owner.
- **Page:** Admin → Community → row and panel **⋯** menus.
- **When encountered:** Giving someone paying access.

## 14. Email names and delivery
- **Decision (retired UX spec, copy table):** the conversion email is **Paying membership added** (was "Paid-access upgrade") and the removal email is **Paying access removed** (was "Paid access revoked"). A failed delivery shows **Not delivered** (was **Bounced**) in the person's Emails list; **Edit details** in the same panel corrects the address.
- **Page:** Admin → Community → person panel → Emails.

## 15. Forms show errors inline
- **Decision (retired UX spec, shared rules):** Add member, Import members and Edit details show errors beside the field, keep what was typed, and move focus to the first invalid field. No validation toast.

## Unsubscribing doesn't end paying access
- **Decision (27 Sep, follows owner decision 7 and the owner's UX spec (retired) "Email subscription is independent of paying access"):** **Unsubscribe** stops emails only. A paying member who unsubscribes stays a paying member. Paying access ends only through **Remove paying access**.
- **Where:** Community, member ⋯ menu and panel; the unsubscribe confirmation says "They stay a paying member."
- **Revisit when:** SDC says paid benefits depend on receiving emails.

## Sortable columns, and Last email split into Last email and Sent
- **Decision (27 Sep, owner asked for sortable headers):** **Name**, **Email**, **Sent** and **Added** sort on the server; select a header to sort, select it again to reverse. Name and Email start A to Z; Sent and Added start newest first. With no choice made, the list is newest **Added** first, shown as the active column. People with no name or no email sent come last either way, and unsubscribed search matches stay at the end.
- **Last email** now shows only the subject; the new **Sent** column shows the relative time ("1w ago"), with the full date on hover, so the list can be sorted by when someone was last emailed.
- **Where:** Community table headers. The sort lives in the URL (`sort`, `dir`) and survives search, tab and page changes; changing it returns to page 1.

## Import preview: the main button achieves the intent
- **Decision (owner, 27 Sep):** When the preview has changes, the primary button names them ("Add 3 people", "Make 2 people paying", "Resubscribe 1 person", or "Confirm 4 changes" for a mix) and **Back** is secondary. When nothing will change, the primary button is **Edit list** (back to the list) and **Close** is secondary. No divider under the dialog title.
- **Where:** Add members dialog, preview step.

## Wider person panel with one header row
- **Superseded in part (27 Sep):** the ⋯ menu is gone (see 20); the panel keeps its width.
- **Decision (owner, 27 Sep):** The person panel is `min(720px, 100vw)` wide so a 600px email fits without scrolling sideways. Its header has one row (name, then the ⋯ menu and close button, the same size, vertically centred), then the email with its copy button, then the status badge and "Added {date}" on one line.
- **Where:** Community, person panel (kit: `SheetContent size="wide"`, `SheetHeader actions`).

## Loading while sorting, searching or paging
- **Decision (owner, 27 Sep):** While the next rows load, the current rows stay in place, dimmed; the active sort arrow becomes a spinner and a thin line runs under the header. Nothing jumps.
- **Where:** Community table (kit: `Table busy`).

## 16. One status per person, for where they are in their journey
- **Decision (owner, 27 Sep):** every person has exactly one derived status, checked in this order: **Unsubscribed**; **Invited** (onboarding not started); **Onboarding incomplete**; **Active** (clicked a primary action in the last 60 days); **Inactive** (no primary-action click in the last 60 days, including never; owner, 28 Sep: **Never clicked** was folded into **Inactive**). A primary action is an opportunity's main button in an email (signed up or did it). Shares ("Invite a friend") are recorded but don't change status. **Opens never count**: they're unreliable and don't show intent.
- **Page:** Community table (**Status** column, one badge per person, text plus color), member panel header (as text), exports.
- **Affects:** Backend derives it (docs/backend/community.md, "Status"); it's never stored.
- **When encountered:** Every visit.

## 17. Status is filtered in the column header; Unsubscribed is hidden by default
- **Decision (owner, 27 Sep):** the **Status** header has a filter (checkbox list with a count per status). By default every status except **Unsubscribed** is selected, so the lists match who gets emails. The selection is in the URL (`status`), survives search, tab, sort and page changes, and resets to page 1. Tab counts and empty states follow it: with no search, a filter that hides everything says so and offers **Clear filters** (show every status); a search whose only matches are hidden says how many and offers **Show all statuses**.
- **Tabs:** still General members and Paying members by tier, now including unsubscribed people when the filter shows them. The General tab tooltip becomes "People who aren't paying members." (needs approval; owner decision 2 said "subscribed").
- **Page:** Community table header. **When encountered:** looking for a segment, or for someone who unsubscribed.

## 18. Columns: Name, Email, Status, Clicks, Last email, Sent
- **Decision (27 Sep):** **Added** is removed as a column (the date is in the panel and the export); the default order is still newest added first. **Clicks** is the total of primary-action clicks and sorts most first. Name and Email stay frozen while the table scrolls sideways (only Name below 600px). **Last email** and **Sent** hide when no row on the page has an email.
- **Page:** Community table.

## 19. Click an email to copy it
- **Decision (owner, 27 Sep):** clicking anywhere on an email (the address or its copy icon) copies it; the icon becomes a check with a "Copied" tooltip for 1.5 seconds. It doesn't open the panel. Any copy without in-place feedback shows a toast, "Copied {name}'s email" (or "Copied {email}"); today every copy has in-place feedback, so no toast fires.
- **Page:** Community table Email column and the panel header.

## 20. Member panel: who and where, then visible actions
- **Decision (owner, 27 Sep):** the header shows the name, the email right under it (click to copy), and one muted line such as "Active · General member · Added Apr 11, 2026". No badge, no ⋯ menu. Below it, a row of actions like a profile page: **Edit details**, **Unsubscribe** (or **Resubscribe** when an admin unsubscribed them; nothing when they unsubscribed themselves, and the header says why), then icon buttons with tooltips for the rare ones: **Convert to paying member** (or **Remove paying access**) and **Delete member**. Padding matches the page. Each opportunities email in the panel shows what they did, e.g. "Signed up: Film night · Shared: Tenant workshop", or "No clicks". Other emails (welcomes) have nothing to click, so no line.
- **Page:** Community → member panel.

## 21. Converting to paying asks first
- **Decision (owner, 27 Sep):** **Convert to paying member** (panel or row menu) opens a confirmation: "Make {name} a paying member?", saying they'll get the members-only feed and {paid benefit}, and that we'll email them (or "They're unsubscribed, so we won't email them."). Button **Make paying member**. It grants paid benefits and sends an email, so a stray click shouldn't do it.
- **Open:** `{paid benefit}` is a placeholder (`PAID_BENEFIT` in `_copy.ts`) until SDC confirms the benefit.

## 22. Delete is a true delete; unsubscribe is for stopping emails
- **Decision (owner, 27 Sep):** **Delete member** is for data-removal requests. It asks first ("Delete {name} permanently?"), says they'll be removed from Community and every export, that it can't be undone, and to unsubscribe instead to only stop emails. The backend deletes the record and history, deletes them in the email provider, and keeps a hash of the address so imports and **Add members** skip it (the preview shows "deleted earlier, skipped"). A person who signs up again themselves (at a booth) is fresh consent and is added.
- **Page:** Community → member panel. **Not** in the row menu: it's rare and irreversible.

## 23. Export for analysis: Members or Activity, every field
- **Decision (owner, 27 Sep):** **Export members** is the page's primary action. The dialog chooses **Members (one row per person)** or **Activity (one row per click)**, keeps **General members / Paying members / Both** and **Include unsubscribed members**, and shows the row count. Members has every field (status, tier, subscribed, who unsubscribed and when, onboarding, source, source detail, added, last email, emails received, clicks, sign-ups, shares, last click). Activity has email, subject, sent date, opportunity, action (Signed up, Took action, Shared) and clicked date. Values are plain words and `YYYY-MM-DD` dates, so the file works in a spreadsheet without a key.
- **Page:** Community → Export members.

## 24. Source is export only
- **Decision (owner, 27 Sep):** how someone joined (legacy import, booth, website, partner event, referral, added by an admin, file import, plus a detail such as the booth location) is recorded when they're added and appears only in the Members export. It's for analysis, not for day-to-day decisions about a person, so the list and panel stay calm.

## 25. Header: Export primary; Add members and the kiosk secondary
- **Decision (owner, 27 Sep):** **Export members** (Download icon) is the primary button. **Add members** and **Open sign-up kiosk** are secondary. The kiosk button opens a small popover asking "Where are you?" (required; e.g. Kitchener Market), then opens `/kiosk?location=…` in a new tab. The location is saved with each booth sign-up as its source detail. **Superseded in part (27 Sep):** the popover is now a dialog with an optional **Location**; see 31.

## 26. Add members: one person first, a file second
- **Decision (owner, 27 Sep):** the dialog opens on a single-person form: **Name**, **Email** and **Make them a paying member** (unchecked). Footer: **Import from a file** on the left; **Cancel** and **Add member** on the right. A clear new person is added straight away; anything that needs a look (already a member, unsubscribed, deleted, invalid) shows the preview. **Import from a file** takes a CSV with name and email columns (with **Download template**), the same checkbox (**Make them paying members**) and the same preview. The tag input is gone from this dialog (it stays in the kit).

## 27. No bulk actions for now
- **Decision (owner, 27 Sep):** no row selection or bulk convert, unsubscribe or delete. Each of those changes consent, access or data one person at a time, and a mistake across many people is hard to undo (a bulk delete can't be). Bulk adding is covered by **Import from a file** with its preview; bulk analysis by the export. Revisit if admins repeatedly do the same action to a filtered group.

## 28. Fixed column widths; long text truncates
- **Decision (27 Sep):** every Community column has a fixed width (Name 200px, Email 240px, Status 208px, Clicks 96px, Last email 240px, Sent 112px, actions 56px; extra room is shared out on wide screens), so a long value never widens the table. **Name** and **Last email** end in an ellipsis and show the full text in a tooltip, only when cut off. **Email** truncates in the middle and keeps the domain ("ada.lov…@northside.org"), with no tooltip; clicking it still copies the whole address (19). Screen readers always get the full text.
- **Page:** Admin → Community table (kit: `TableColumn.width`, `TruncatedText`, `TruncatedEmail`).

## 29. Search sits in the page header; only sorting spins the sort arrow
- **Decision (27 Sep):** **Search by name or email** moves from the tab row to the header row, next to the title, because it searches across both tabs. While the next rows load after a tab, search, filter, page or sort change, the rows dim (see 18); the active sort arrow becomes a spinner **only** for a sort change, so switching tabs while sorted by Email doesn't spin the Email arrow.
- **Page:** Admin → Community header and table.

## 30. The open person panel is in the URL
- **Decision (27 Sep):** opening a person's panel adds `?member=<id>` to the address (replacing the entry, so Back doesn't step through every panel); closing it removes the param; loading an address with it opens that panel, even when the person isn't on the current tab, page or filter. Admins can share the link. An unknown or deleted id opens nothing. Opening and closing never dim the table.
- **Page:** Admin → Community → person panel.

## 31. Open sign-up kiosk is a dialog with an optional Location
- **Decision (owner, 27 Sep, replaces the popover in 25):** **Open sign-up kiosk** opens a dialog titled "Open sign-up kiosk" with one optional field, **Location** (no example, no question), and **Cancel** and **Open kiosk**. **Open kiosk** opens `/kiosk?location=…` (or `/kiosk` when blank) in a new tab and closes the dialog. The location stays export only (24) and is no longer shown on the kiosk.
- **Page:** Admin → Community header.

## Header actions shrink to icons on phones (28 Sep 2026)
**What:** **Open sign-up kiosk**, **Add members** and **Export members** show icon and label on screens 768px or wider. Below that they're icon buttons, with the label as a tooltip and accessible name (`HeaderAction`).
**Why:** Keeps the header on one line on phones without hiding the labels on desktop.
Add members, file import (owner, 28 Sep): one big Choose a CSV file target (click or drop), with Download template and Paste rows instead under it; the rows box appears only once there's something to check.
Header (owner, 28 Sep): **Open sign-up kiosk** and **Add members** are icon buttons with tooltips at every width; **Export members** keeps its label (icon-only only on small screens).
Add members file flow (owner, 28 Sep): no link-style buttons; the dialog says "Step 1 of 2 · Upload", then "Step 2 of 2 · Review and edit" once rows are loaded.
