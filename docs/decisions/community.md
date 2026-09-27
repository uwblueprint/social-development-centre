# Community: decision log

Assumptions made while building the UI from the Community PRD. Each can be revisited.

## 1. General members and Paying members are exclusive; unsubscribed people only appear in search
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
- **Decision (owner, 27 Sep):** **Export members** offers **General members**, **Paying members** or **Both**, and defaults to the current tab. "Include unsubscribed members" applies to any choice (unsubscribing stops emails, not paying access). It shows the record count before download. CSV columns: name, email.
- **Page:** Admin → Community → Export members.
- **Affects:** Contact lists leaving the platform.
- **When encountered:** Pulling a list for an outside tool or report.

## 8. Names are optional
- **Decision:** People can exist with only an email; the list shows "No name" and admins can add a name later in the person panel.
- **Page:** Admin → Community (list and person panel).
- **When encountered:** After pasting bare addresses.

## 9. Unsubscribed status is inline, not a column
- **Decision:** Dropped the dedicated Status column. In search results, an unsubscribed person's name and email are dimmed and the name carries a text **Unsubscribed** badge (replacing the earlier mail-off icon and tooltip), freeing a column for Last email.
- **Page:** Admin → Community → table.
- **Affects:** Table density; the "Give paying access"/"Remove paying access" action is renamed "Convert to paying member"/"Remove paying access" everywhere, including the row's own **⋯** menu.
- **When encountered:** Scanning the table for who's unsubscribed.

## 10. Row actions and email history live at two altitudes
- **Decision:** Every row has its own **⋯** menu (copy email, convert/remove, unsubscribe or, for people an admin unsubscribed, resubscribe) so common actions don't require opening the panel. Every item in both ⋯ menus has an icon.
- **Page:** Admin → Community → table row menu.
- **When encountered:** Bulk-managing access from the list instead of one profile at a time.

## 11. The person panel is one scrolling view
- **Decision (owner, 26 Sep):** No tabs, no avatar, no primary button. The header shows the name (or the email when there's no name), the email with a copy button, status badges (**General member** or **Paying member**, plus **Unsubscribed**; see 13) and "Added {date}". Every action (**Edit details**, **Copy email**, **Convert to paying member** / **Remove paying access**, **Unsubscribe** / **Resubscribe**, see 6) is in the header's **⋯** menu. Each fact appears once: the email isn't repeated in a details list and the status isn't repeated elsewhere.
- **Emails:** below the header, an **Emails** section lists every email sent to the person, newest first, all expanded (no accordion, no Expand all). Each shows its subject as a heading and a short sent date on the same line, plus **Not delivered** when delivery failed (see 14); the kind label ("Opportunities") is gone. Each body renders in a sandboxed frame of fixed height with its own scrollbar, and is fetched only when it scrolls near view, with a same-size placeholder until then, so the panel opens fast. With no emails: "No emails sent yet."
- **Page:** Admin → Community → person panel.
- **Affects:** The email body is a separate backend call (`getSentEmailHtml`).
- **When encountered:** Checking what someone received, or acting on one person.

## 12. The copy button confirms, then reverts
- **Decision:** The copy icon next to an email shows a check and a "Copied" tooltip for about 1.5 seconds, then reverts. The tooltip closes as soon as the pointer leaves or focus moves.
- **Page:** Admin → Community → table Email column and person panel header.
- **When encountered:** Copying an email address.

## 13. Convert to paying member has no subscription gate
- **Decision (owner, decision 7):** **Convert to paying member** works for anyone who isn't paying, including unsubscribed people (found by search). Subscribed people get the **Paying membership added** email and the toast ends "Paying member email sent." only when delivery succeeded; if it wasn't delivered the toast says so and asks to check the address. Unsubscribed people get paying access and no email, and the toast says "No email sent because they're unsubscribed." The old eligibility error is gone. **Remove paying access** likewise emails only subscribed people.
- **Status badges:** because an unsubscribed person can now be paying, the panel shows the tier badge (**General member** / **Paying member**) plus an **Unsubscribed** badge when it applies.
- **Open question:** an admin **Unsubscribe** still removes paying access (existing behaviour), while `docs/ux/portal.md` says subscription is independent of paying access. Confirm with the owner.
- **Page:** Admin → Community → row and panel **⋯** menus.
- **When encountered:** Giving someone paying access.

## 14. Email names and delivery
- **Decision (portal.md copy table):** the conversion email is **Paying membership added** (was "Paid-access upgrade") and the removal email is **Paying access removed** (was "Paid access revoked"). A failed delivery shows **Not delivered** (was **Bounced**) in the person's Emails list; **Edit details** in the same panel corrects the address.
- **Page:** Admin → Community → person panel → Emails.

## 15. Forms show errors inline
- **Decision (portal.md shared rules):** Add member, Import members and Edit details show errors beside the field, keep what was typed, and move focus to the first invalid field. No validation toast.

## Unsubscribing doesn't end paying access
- **Decision (27 Sep, follows owner decision 7 and docs/ux/portal.md "Email subscription is independent of paying access"):** **Unsubscribe** stops emails only. A paying member who unsubscribes stays a paying member. Paying access ends only through **Remove paying access**.
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
- **Decision (owner, 27 Sep):** The person panel is `min(720px, 100vw)` wide so a 600px email fits without scrolling sideways. Its header has one row (name, then the ⋯ menu and close button, the same size, vertically centred), then the email with its copy button, then the status badge and "Added {date}" on one line.
- **Where:** Community, person panel (kit: `SheetContent size="wide"`, `SheetHeader actions`).

## Loading while sorting, searching or paging
- **Decision (owner, 27 Sep):** While the next rows load, the current rows stay in place, dimmed; the active sort arrow becomes a spinner and a thin line runs under the header. Nothing jumps.
- **Where:** Community table (kit: `Table busy`).
