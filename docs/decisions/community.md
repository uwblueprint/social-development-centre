# Community: decision log

Assumptions made while building the UI from the Community PRD. Each can be revisited.

## 1. Unsubscribed people live under General members
- **Decision:** Unsubscribing always ends paid access, so every unsubscribed record sits in General members, after all current members, with an Unsubscribed badge. The Paying tab shows only subscribed paying members.
- **Page:** Admin → Community → General members tab.
- **Affects:** List order, counts ("· N unsubscribed" beside the General count), search.
- **When encountered:** Looking someone up who unsubscribed; searching finds them on the General tab without paging.

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

## 5. Backfill without welcome emails
- **Decision:** The review step has "Don't send welcome emails (only for importing SDC's existing list)". Off by default; when on, the email count reads 0.
- **Page:** Admin → Community → Add members (review step).
- **Affects:** The one-time migration of SDC's existing list.
- **When encountered:** Once, during launch. A migration script may replace this.

## 6. Restoring email eligibility is built but switched off
- **Decision:** Unsubscribed records show **Restore email eligibility**, disabled with the reason "Turned off until SDC confirms its consent rules for resubscribing people." Restoring would make them a general member only.
- **Page:** Admin → Community → person panel (unsubscribed records).
- **Affects:** Resubscribe consent.
- **When encountered:** An unsubscribed person asks to be added back.

## 7. Export follows the tab unless changed
- **Decision:** Export defaults to the current tab, excludes unsubscribed people unless "Include unsubscribed members" is checked, can widen to Everyone, and shows the record count before download. CSV columns: name, email.
- **Page:** Admin → Community → Export.
- **Affects:** Contact lists leaving the platform.
- **When encountered:** Pulling a list for an outside tool or report.

## 8. Names are optional
- **Decision:** People can exist with only an email; the list shows "No name" and admins can add a name later in the person panel.
- **Page:** Admin → Community (list and person panel).
- **When encountered:** After pasting bare addresses.
