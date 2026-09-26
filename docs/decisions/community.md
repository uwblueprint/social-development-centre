# Community: decision log

Assumptions made while building the UI from the Community PRD. Each can be revisited.

## 1. General members means subscribed people; unsubscribed people only appear in search
- **Decision (owner, 26 Sep):** **General members** lists and counts every subscribed person, paying members included. The Paying tab shows only subscribed paying members. Unsubscribed people are left out of both lists and every count; "N unsubscribed" is no longer shown. The General tab's tooltip says: "Includes paying members. Doesn't include people who unsubscribed."
- **Search fallback (assumption):** a search on **General members** still returns matching unsubscribed people, after every subscribed match, dimmed and marked with an **Unsubscribed** badge, so admins can answer "why isn't X getting emails?" Search on **Paying members** doesn't include them.
- **Page:** Admin → Community → General members tab.
- **Affects:** List contents, tab counts, search results, export (see 7).
- **When encountered:** Every visit (the count); looking up someone who unsubscribed.

## 2. The current tab decides where added people go
- **Decision:** "Add members" on General adds general members; on Paying adds paying members (upgrading existing general members). Paying members pasted into General are skipped, never downgraded.
- **Page:** Admin → Community → Add members.
- **Affects:** Which email each person receives.
- **When encountered:** Every manual add or import.

## 3. Check before adding, and show the email count
- **Decision:** Adding is two steps: paste, then **Check addresses** shows new, upgrades, skipped, unsubscribed, invalid and duplicates, plus exactly how many emails will be sent. Nothing is saved until the admin confirms.
- **Page:** Admin → Community → Add members dialog.
- **Affects:** Prevents duplicates, silent downgrades and accidental mass emails.
- **When encountered:** Every add, most visibly with long pasted lists.

## 4. Unsubscribed addresses are never re-added by import
- **Decision:** Pasted unsubscribed addresses are listed as needing attention and left out. They receive no onboarding email.
- **Page:** Admin → Community → Add members (review step).
- **Affects:** Consent; the integrated sender.
- **When encountered:** Importing a list that contains people who unsubscribed earlier.

## 5. The initial backfill is a code-side migration
- **Decision:** SDC's existing list is loaded once by a migration script that sends no emails. The admin UI has no "skip welcome emails" option; Add members always sends the matching email.
- **Page:** None in the admin UI (engineering task at launch).
- **Affects:** Launch migration; prevents accidental mass welcomes.
- **When encountered:** Once, before launch.

## 6. Restoring email eligibility is built but switched off
- **Decision:** Unsubscribed records show **Restore email eligibility**, disabled with the reason "Turned off until SDC confirms its consent rules for resubscribing people." Restoring would make them a general member only.
- **Page:** Admin → Community → person panel (unsubscribed records).
- **Affects:** Resubscribe consent.
- **When encountered:** An unsubscribed person asks to be added back.

## 7. Export follows the tab unless changed
- **Decision:** **Export members** defaults to the current tab, excludes unsubscribed people unless "Include unsubscribed members" is checked, and shows the record count before download. CSV columns: name, email. Since General members now includes paying members (see 1), the "Everyone" option was removed: it was identical to General members with unsubscribed people included.
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
- **Decision:** Every row has its own **⋯** menu (copy email, convert/remove, unsubscribe) so common actions don't require opening the panel. Every item in both ⋯ menus has an icon.
- **Page:** Admin → Community → table row menu.
- **When encountered:** Bulk-managing access from the list instead of one profile at a time.

## 11. The person panel is one scrolling view
- **Decision (owner, 26 Sep):** No tabs, no avatar, no primary button. The header shows the name (or the email when there's no name), the email with a copy button, a status badge (**General member**, **Paying member** or **Unsubscribed**) and "Added {date}". Every action (**Edit details**, **Copy email**, **Convert to paying member** / **Remove paying access**, **Unsubscribe** / disabled **Resubscribe**) is in the header's **⋯** menu. Each fact appears once: the email isn't repeated in a details list and the status isn't repeated elsewhere.
- **Emails:** below the header, an **Emails** section lists every email sent to the person, newest first, all expanded (no accordion, no Expand all). Each shows its subject as a heading and a short sent date on the same line, plus **Bounced** when it bounced; the kind label ("Opportunities") is gone. Each body renders in a sandboxed frame of fixed height with its own scrollbar, and is fetched only when it scrolls near view, with a same-size placeholder until then, so the panel opens fast. With no emails: "No emails sent yet."
- **Page:** Admin → Community → person panel.
- **Affects:** The email body is a separate backend call (`getSentEmailHtml`).
- **When encountered:** Checking what someone received, or acting on one person.

## 12. The copy button confirms, then reverts
- **Decision:** The copy icon next to an email shows a check and a "Copied" tooltip for about 1.5 seconds, then reverts. The tooltip closes as soon as the pointer leaves or focus moves.
- **Page:** Admin → Community → table Email column and person panel header.
- **When encountered:** Copying an email address.
